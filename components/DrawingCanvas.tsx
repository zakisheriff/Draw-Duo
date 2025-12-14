import { Canvas, Path, Skia, SkPath } from '@shopify/react-native-skia';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { GestureResponderEvent, PanResponder, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/Colors';
import socketService from '../services/socket';

interface Stroke {
    path: SkPath;
    color: string;
    strokeWidth: number;
    userId?: string;
    id?: string; // Add ID for identifying strokes
}

export interface CanvasRef {
    undo: () => void;
    redo: () => void;
    toggleEyedropper: () => void;
    isEyedropperActive: boolean;
    clear: () => void;
}

interface CanvasProps {
    roomId: string;
    color: string;
    strokeWidth: number;
    userId: string;
    onColorPicked?: (color: string) => void;
}

const DrawingCanvas = forwardRef<CanvasRef, CanvasProps>(({ roomId, color, strokeWidth, userId, onColorPicked }, ref) => {
    const [paths, setPaths] = useState<Stroke[]>([]);
    const [redoStack, setRedoStack] = useState<Stroke[]>([]);
    const [currentPathState, setCurrentPathState] = useState<SkPath | null>(null);
    const [isEyedropperActive, setIsEyedropperActive] = useState(false);

    // Live remote paths (others drawing)
    // Map userId -> Path
    const [remotePaths, setRemotePaths] = useState<Record<string, { path: SkPath, color: string, strokeWidth: number }>>({});

    // Refs for tracking closure values
    const currentPath = useRef<SkPath | null>(null);
    const colorRef = useRef(color);
    const strokeWidthRef = useRef(strokeWidth);
    const isEyedropperActiveRef = useRef(isEyedropperActive);
    const pathsRef = useRef(paths); // Track paths for eyedropper

    useEffect(() => { colorRef.current = color; }, [color]);
    useEffect(() => { strokeWidthRef.current = strokeWidth; }, [strokeWidth]);
    useEffect(() => { isEyedropperActiveRef.current = isEyedropperActive; }, [isEyedropperActive]);
    useEffect(() => { pathsRef.current = paths; }, [paths]);

    useImperativeHandle(ref, () => ({
        undo: () => {
            setPaths(prev => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];
                setRedoStack(s => [...s, last]);
                socketService.emit('undo-stroke', { roomId });
                return prev.slice(0, -1);
            });
        },
        redo: () => {
            setRedoStack(prev => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];
                setPaths(p => [...p, last]);
                const pathString = last.path.toSVGString();
                socketService.emit('draw-stroke', {
                    roomId,
                    path: pathString,
                    color: last.color,
                    strokeWidth: last.strokeWidth
                });
                return prev.slice(0, -1);
            });
        },
        toggleEyedropper: () => setIsEyedropperActive(p => !p),
        isEyedropperActive,
        clear: () => setPaths([])
    }));

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt: GestureResponderEvent) => {
                if (isEyedropperActiveRef.current) {
                    const { locationX, locationY } = evt.nativeEvent;
                    const allPaths = pathsRef.current;
                    for (let i = allPaths.length - 1; i >= 0; i--) {
                        const p = allPaths[i];
                        if (p.path.contains(locationX, locationY)) {
                            onColorPicked?.(p.color);
                            setIsEyedropperActive(false);
                            return;
                        }
                    }
                    return;
                }

                const { locationX, locationY } = evt.nativeEvent;
                const newPath = Skia.Path.Make();
                newPath.moveTo(locationX, locationY);
                currentPath.current = newPath;
                setCurrentPathState(newPath.copy());
            },
            onPanResponderMove: (evt: GestureResponderEvent) => {
                if (isEyedropperActiveRef.current) return;

                const { locationX, locationY } = evt.nativeEvent;
                if (currentPath.current) {
                    currentPath.current.lineTo(locationX, locationY);

                    // Throttle state updates if needed, but for now strict sync
                    setCurrentPathState(currentPath.current.copy());

                    // Emit live drawing part (as SVG string for simplicity)
                    // We send the FULL path so far, not just the segment, for simpler rendering on peer
                    const pathString = currentPath.current.toSVGString();
                    socketService.emit('drawing-move', {
                        roomId,
                        path: pathString,
                        color: colorRef.current,
                        strokeWidth: strokeWidthRef.current
                    });
                }
            },
            onPanResponderRelease: () => {
                if (isEyedropperActiveRef.current) return;

                if (currentPath.current) {
                    const pathString = currentPath.current.toSVGString();
                    const currentColor = colorRef.current;
                    const currentStrokeWidth = strokeWidthRef.current;

                    const strokeData = {
                        path: currentPath.current.copy(),
                        color: currentColor,
                        strokeWidth: currentStrokeWidth,
                        userId
                    };

                    setPaths(prev => [...prev, strokeData]);
                    setRedoStack([]);

                    // Finalize stroke
                    socketService.emit('draw-stroke', {
                        roomId,
                        path: pathString,
                        color: currentColor,
                        strokeWidth: currentStrokeWidth
                    });

                    // Send empty move to clear ghost on peers? 
                    // Or let the final draw-stroke replace it. 
                    // To be safe, maybe we don't strictly need to clear, 
                    // but we should clear local temp state.
                    currentPath.current = null;
                    setCurrentPathState(null);
                }
            },
        })
    ).current;

    useEffect(() => {
        const handleDrawStroke = (data: any) => {
            const { path, color, strokeWidth, userId: senderId } = data;

            // Remove from remote paths since it's now permanent
            setRemotePaths(prev => {
                const next = { ...prev };
                delete next[senderId];
                return next;
            });

            const skPath = Skia.Path.MakeFromSVGString(path);
            if (skPath) {
                setPaths((prev) => [...prev, { path: skPath, color, strokeWidth, userId: senderId }]);
            }
        };

        const handleDrawingMove = (data: any) => {
            const { path, color, strokeWidth, userId: senderId } = data;

            if (senderId === userId) return;

            const skPath = Skia.Path.MakeFromSVGString(path);
            if (skPath) {
                setRemotePaths(prev => ({
                    ...prev,
                    [senderId]: { path: skPath, color, strokeWidth }
                }));
            }
        };

        const handleUndo = () => {
            setPaths(prev => prev.slice(0, -1));
        };

        const handleLoadCanvas = (strokes: any[]) => {
            console.log('Received load-canvas event with', strokes?.length, 'strokes');
            if (!strokes || !Array.isArray(strokes)) return;
            const loadedPaths = strokes.map(s => {
                const skPath = Skia.Path.MakeFromSVGString(s.path);
                return skPath ? { ...s, path: skPath } : null;
            }).filter(Boolean) as Stroke[];
            console.log('Parsed', loadedPaths.length, 'paths');
            setPaths(loadedPaths);
        };

        socketService.on('draw-stroke', handleDrawStroke);
        socketService.on('drawing-move', handleDrawingMove);
        socketService.on('undo-stroke', handleUndo);
        socketService.on('load-canvas', handleLoadCanvas);

        socketService.on('clear-canvas', () => {
            setPaths([]);
            setRemotePaths({});
        });

        return () => {
            socketService.off('draw-stroke');
            socketService.off('drawing-move');
            socketService.off('undo-stroke');
            socketService.off('load-canvas');
            socketService.off('clear-canvas');
        };
    }, [userId]);

    return (
        <View style={styles.container}>
            <Canvas style={styles.canvas}>
                {/* Permanent Paths */}
                {paths.map((p, index) => (
                    <Path
                        key={index}
                        path={p.path}
                        color={p.color}
                        style="stroke"
                        strokeWidth={p.strokeWidth}
                        strokeJoin="round"
                        strokeCap="round"
                    />
                ))}

                {/* Remote Live Paths */}
                {Object.entries(remotePaths).map(([uid, p]) => (
                    <Path
                        key={uid}
                        path={p.path}
                        color={p.color}
                        style="stroke"
                        strokeWidth={p.strokeWidth}
                        strokeJoin="round"
                        strokeCap="round"
                    />
                ))}

                {/* My Current Path */}
                {currentPathState && (
                    <Path
                        path={currentPathState}
                        color={color}
                        style="stroke"
                        strokeWidth={strokeWidth}
                        strokeJoin="round"
                        strokeCap="round"
                    />
                )}
            </Canvas>
            <View style={styles.gestureOverlay} {...panResponder.panHandlers} />
        </View>
    );
});

export default DrawingCanvas;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.spiderWhite,
        position: 'relative',
    },
    canvas: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    gestureOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        zIndex: 10,
    }
});
