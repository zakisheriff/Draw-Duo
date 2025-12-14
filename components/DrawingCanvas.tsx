import { Canvas, Path, Skia, SkPath } from '@shopify/react-native-skia';
import * as ExpoMediaLibrary from 'expo-media-library';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/Colors';
import socketService from '../services/socket';

// Fixed virtual canvas size for cross-device coordinate normalization
const VIRTUAL_WIDTH = 1000;
const VIRTUAL_HEIGHT = 1000;

interface Stroke {
    path: SkPath;
    color: string;
    strokeWidth: number;
    userId?: string;
    isEraser?: boolean;
}

export interface CanvasRef {
    undo: () => void;
    redo: () => void;
    toggleEyedropper: () => void;
    isEyedropperActive: boolean;
    clear: () => void;
    exportCanvas: () => Promise<string | null>;
}

interface CanvasProps {
    roomId: string;
    color: string;
    strokeWidth: number;
    userId: string;
    isEraser?: boolean;
    onColorPicked?: (color: string) => void;
}

const DrawingCanvas = forwardRef<CanvasRef, CanvasProps>(({ roomId, color, strokeWidth, userId, isEraser = false, onColorPicked }, ref) => {
    const [paths, setPaths] = useState<Stroke[]>([]);
    const [redoStack, setRedoStack] = useState<Stroke[]>([]);
    const [currentPathState, setCurrentPathState] = useState<SkPath | null>(null);
    const [isEyedropperActive, setIsEyedropperActive] = useState(false);
    const [remotePaths, setRemotePaths] = useState<Record<string, { path: SkPath, color: string, strokeWidth: number, isEraser?: boolean }>>({});

    // Canvas dimensions
    const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
    const [isCanvasReady, setIsCanvasReady] = useState(false);

    // Refs
    const containerRef = useRef<View>(null);
    const canvasWrapperRef = useRef<View>(null); // Ref for canvas-only capture
    const currentPath = useRef<SkPath | null>(null);
    const colorRef = useRef(color);
    const strokeWidthRef = useRef(strokeWidth);
    const isEyedropperActiveRef = useRef(isEyedropperActive);
    const isEraserRef = useRef(isEraser);
    const pathsRef = useRef(paths);
    const canvasSizeRef = useRef(canvasSize);

    useEffect(() => { colorRef.current = color; }, [color]);
    useEffect(() => { strokeWidthRef.current = strokeWidth; }, [strokeWidth]);
    useEffect(() => { isEyedropperActiveRef.current = isEyedropperActive; }, [isEyedropperActive]);
    useEffect(() => { isEraserRef.current = isEraser; }, [isEraser]);
    useEffect(() => { pathsRef.current = paths; }, [paths]);
    useEffect(() => { canvasSizeRef.current = canvasSize; }, [canvasSize]);

    // Scale SVG path string from normalized to local
    const scalePathToLocal = (svgPath: string): SkPath | null => {
        if (!svgPath) return null;
        const { width, height } = canvasSizeRef.current;
        if (width <= 1 || height <= 1) {
            // Canvas not ready, return unscaled
            return Skia.Path.MakeFromSVGString(svgPath);
        }

        const scaleX = width / VIRTUAL_WIDTH;
        const scaleY = height / VIRTUAL_HEIGHT;

        const scaledPath = svgPath.replace(
            /([ML])\s*([\d.-]+)\s+([\d.-]+)/g,
            (_, cmd, x, y) => {
                const scaledX = parseFloat(x) * scaleX;
                const scaledY = parseFloat(y) * scaleY;
                return `${cmd} ${scaledX} ${scaledY}`;
            }
        );

        return Skia.Path.MakeFromSVGString(scaledPath);
    };

    // Scale SVG path string from local to normalized
    const scalePathToNormalized = (localPath: SkPath): string => {
        const { width, height } = canvasSizeRef.current;
        const scaleX = VIRTUAL_WIDTH / width;
        const scaleY = VIRTUAL_HEIGHT / height;

        const svgPath = localPath.toSVGString();
        return svgPath.replace(
            /([ML])\s*([\d.-]+)\s+([\d.-]+)/g,
            (_, cmd, x, y) => {
                const scaledX = parseFloat(x) * scaleX;
                const scaledY = parseFloat(y) * scaleY;
                return `${cmd} ${scaledX.toFixed(2)} ${scaledY.toFixed(2)}`;
            }
        );
    };

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
                const normalizedPath = scalePathToNormalized(last.path);
                socketService.emit('draw-stroke', {
                    roomId,
                    path: normalizedPath,
                    color: last.color,
                    strokeWidth: last.strokeWidth,
                    isEraser: last.isEraser || false
                });
                return prev.slice(0, -1);
            });
        },
        toggleEyedropper: () => setIsEyedropperActive(p => !p),
        isEyedropperActive,
        clear: () => setPaths([]),
        exportCanvas: async () => {
            try {
                // Capture the view using react-native-view-shot
                if (canvasWrapperRef.current) {
                    const { captureRef } = await import('react-native-view-shot');
                    const uri = await captureRef(canvasWrapperRef, {
                        format: 'png',
                        quality: 1,
                    });

                    // Try to save to MediaLibrary on both platforms
                    try {
                        const { status } = await ExpoMediaLibrary.requestPermissionsAsync();
                        if (status === 'granted') {
                            const asset = await ExpoMediaLibrary.createAssetAsync(uri);
                            console.log('Saved to:', asset.uri);
                            return asset.uri;
                        } else {
                            console.log('Permission denied');
                            const { Alert } = require('react-native');
                            Alert.alert('Permission Denied', 'Please allow photo access to save drawings.');
                            return null;
                        }
                    } catch (mediaError: any) {
                        console.log('MediaLibrary error:', mediaError);
                        // If MediaLibrary fails (Expo Go Android limitation), show message
                        const { Alert, Platform } = require('react-native');
                        if (Platform.OS === 'android') {
                            Alert.alert(
                                'Expo Go Limitation',
                                'To save images on Android, you need a development build. The image was captured but cannot be saved in Expo Go.',
                                [{ text: 'OK' }]
                            );
                        }
                        return null;
                    }
                }
                return null;
            } catch (error) {
                console.error('Export failed:', error);
                return null;
            }
        }
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

                let { locationX, locationY } = evt.nativeEvent;
                const { width, height } = canvasSizeRef.current;

                // Clamp coordinates to canvas bounds
                locationX = Math.max(0, Math.min(locationX, width));
                locationY = Math.max(0, Math.min(locationY, height));

                const newPath = Skia.Path.Make();
                newPath.moveTo(locationX, locationY);
                currentPath.current = newPath;
                setCurrentPathState(newPath.copy());
            },
            onPanResponderMove: (evt: GestureResponderEvent) => {
                if (isEyedropperActiveRef.current) return;

                let { locationX, locationY } = evt.nativeEvent;
                const { width, height } = canvasSizeRef.current;

                // Clamp coordinates to canvas bounds
                locationX = Math.max(0, Math.min(locationX, width));
                locationY = Math.max(0, Math.min(locationY, height));

                if (currentPath.current) {
                    currentPath.current.lineTo(locationX, locationY);
                    setCurrentPathState(currentPath.current.copy());

                    const normalizedPath = scalePathToNormalized(currentPath.current);
                    socketService.emit('drawing-move', {
                        roomId,
                        path: normalizedPath,
                        color: colorRef.current,
                        strokeWidth: strokeWidthRef.current,
                        isEraser: isEraserRef.current
                    });
                }
            },
            onPanResponderRelease: () => {
                if (isEyedropperActiveRef.current) return;

                if (currentPath.current) {
                    const normalizedPath = scalePathToNormalized(currentPath.current);
                    const currentColor = colorRef.current;
                    const currentStrokeWidth = strokeWidthRef.current;
                    const currentIsEraser = isEraserRef.current;

                    const strokeData: Stroke = {
                        path: currentPath.current.copy(),
                        color: currentColor,
                        strokeWidth: currentStrokeWidth,
                        userId,
                        isEraser: currentIsEraser
                    };

                    setPaths(prev => [...prev, strokeData]);
                    setRedoStack([]);

                    socketService.emit('draw-stroke', {
                        roomId,
                        path: normalizedPath,
                        color: currentColor,
                        strokeWidth: currentStrokeWidth,
                        isEraser: currentIsEraser
                    });

                    currentPath.current = null;
                    setCurrentPathState(null);
                }
            },
        })
    ).current;

    useEffect(() => {
        const handleDrawStroke = (data: any) => {
            const { path, color, strokeWidth, userId: senderId, isEraser: strokeIsEraser } = data;

            setRemotePaths(prev => {
                const next = { ...prev };
                delete next[senderId];
                return next;
            });

            const skPath = scalePathToLocal(path);
            if (skPath) {
                setPaths((prev) => [...prev, {
                    path: skPath,
                    color,
                    strokeWidth,
                    userId: senderId,
                    isEraser: strokeIsEraser || false
                }]);
            }
        };

        const handleDrawingMove = (data: any) => {
            const { path, color, strokeWidth, userId: senderId, isEraser: strokeIsEraser } = data;

            if (senderId === userId) return;

            const skPath = scalePathToLocal(path);
            if (skPath) {
                setRemotePaths(prev => ({
                    ...prev,
                    [senderId]: { path: skPath, color, strokeWidth, isEraser: strokeIsEraser }
                }));
            }
        };

        const handleUndo = () => {
            setPaths(prev => prev.slice(0, -1));
        };

        const handleLoadCanvas = (strokes: any[]) => {
            if (!strokes || !Array.isArray(strokes)) return;
            const loadedPaths = strokes.map(s => {
                const skPath = scalePathToLocal(s.path);
                return skPath ? { ...s, path: skPath } : null;
            }).filter(Boolean) as Stroke[];
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

        // Request canvas data when ready
        if (isCanvasReady) {
            socketService.emit('get-canvas', roomId);
        }

        return () => {
            socketService.off('draw-stroke');
            socketService.off('drawing-move');
            socketService.off('undo-stroke');
            socketService.off('load-canvas');
            socketService.off('clear-canvas');
        };
    }, [userId, isCanvasReady]);

    const handleLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setCanvasSize({ width, height });
        setIsCanvasReady(true);
    };

    // Eraser color - use canvas background color
    const eraserColor = Colors.spiderWhite;

    return (
        <View ref={containerRef} style={styles.container} onLayout={handleLayout}>
            {/* Canvas wrapper for screenshot capture */}
            <View ref={canvasWrapperRef} style={styles.canvasWrapper} collapsable={false}>
                <Canvas style={styles.canvas}>
                    {/* Permanent Paths */}
                    {paths.map((p, index) => (
                        <Path
                            key={index}
                            path={p.path}
                            color={p.isEraser ? eraserColor : p.color}
                            style="stroke"
                            strokeWidth={p.isEraser ? p.strokeWidth * 2 : p.strokeWidth}
                            strokeJoin="round"
                            strokeCap="round"
                        />
                    ))}

                    {/* Remote Live Paths */}
                    {Object.entries(remotePaths).map(([uid, p]) => (
                        <Path
                            key={uid}
                            path={p.path}
                            color={p.isEraser ? eraserColor : p.color}
                            style="stroke"
                            strokeWidth={p.isEraser ? p.strokeWidth * 2 : p.strokeWidth}
                            strokeJoin="round"
                            strokeCap="round"
                        />
                    ))}

                    {/* My Current Path */}
                    {currentPathState && (
                        <Path
                            path={currentPathState}
                            color={isEraser ? eraserColor : color}
                            style="stroke"
                            strokeWidth={isEraser ? strokeWidth * 2 : strokeWidth}
                            strokeJoin="round"
                            strokeCap="round"
                        />
                    )}
                </Canvas>
            </View>
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
    canvasWrapper: {
        flex: 1,
        backgroundColor: Colors.spiderWhite,
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
