import ChatOverlay from '@/components/ChatOverlay';
import CustomToast from '@/components/CustomToast';
import DrawingCanvas, { CanvasRef } from '@/components/DrawingCanvas';
import SpiderAlert from '@/components/SpiderAlert';
import ToolBar from '@/components/ToolBar';
import { Colors } from '@/constants/Colors';
import socketService from '@/services/socket';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoomScreen() {
    const { id, username } = useLocalSearchParams<{ id: string, username: string }>();
    const [color, setColor] = useState(Colors.spiderRed);
    const [strokeWidth, setStrokeWidth] = useState(5);
    const [isEraser, setIsEraser] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'error' | 'success' });
    const [showClearAlert, setShowClearAlert] = useState(false);

    // Stable User ID across renders
    const userId = React.useMemo(() =>
        username + '-' + Math.random().toString(36).substring(7),
        []);

    const canvasRef = useRef<CanvasRef>(null);
    const [isEyedropper, setIsEyedropper] = useState(false);

    const showToast = (message: string, type: 'error' | 'success' = 'success') => {
        setToast({ visible: true, message, type });
    };

    useEffect(() => {
        socketService.connect();
        socketService.emit('join-room', id, userId);

        // Listen for user joins - extract username part only
        const handleUserJoined = (data: { userId: string }) => {
            const userName = data.userId.split('-')[0];
            // Don't show toast for self
            if (!data.userId.startsWith(username + '-')) {
                showToast(`${userName.toUpperCase()} JOINED!`, 'success');
            }
            setConnectedUsers(prev => {
                // Use a Set to prevent duplicates based on username
                const usernames = new Set(prev.map(u => u.split('-')[0]));
                if (!usernames.has(userName)) {
                    return [...prev, data.userId];
                }
                // Update existing entry with new userId
                return prev.map(u => u.split('-')[0] === userName ? data.userId : u);
            });
        };

        // Listen for user leaves
        const handleUserLeft = (data: { userId: string }) => {
            const userName = data.userId.split('-')[0];
            if (!data.userId.startsWith(username + '-')) {
                showToast(`${userName.toUpperCase()} LEFT`, 'error');
            }
            // Remove by username match
            setConnectedUsers(prev => prev.filter(u => u.split('-')[0] !== userName));
        };

        // Get room users - deduplicate by username
        const handleRoomUsers = (users: string[]) => {
            const uniqueByUsername = new Map<string, string>();
            users.forEach(u => {
                const name = u.split('-')[0];
                uniqueByUsername.set(name, u);
            });
            setConnectedUsers(Array.from(uniqueByUsername.values()));
        };

        socketService.on('user-joined', handleUserJoined);
        socketService.on('user-left', handleUserLeft);
        socketService.on('room-users', handleRoomUsers);

        return () => {
            socketService.off('user-joined');
            socketService.off('user-left');
            socketService.off('room-users');
        };
    }, [id, username]);

    const handleClear = () => {
        setShowClearAlert(true);
    };

    const confirmClear = () => {
        canvasRef.current?.clear();
        socketService.emit('clear-canvas', id);
        setShowClearAlert(false);
        showToast('Canvas cleared!', 'success');
    };

    const handleExport = async () => {
        const uri = await canvasRef.current?.exportCanvas();
        if (uri) {
            showToast('Saved to Photos!', 'success');
        } else {
            showToast('Export failed', 'error');
        }
    };

    const handleColorSelect = (c: string) => {
        if (c === '#FFFFFF' || c.toLowerCase() === '#ffffff') {
            // Eraser mode
            setIsEraser(true);
            setColor(c);
        } else {
            setIsEraser(false);
            setColor(c);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <CustomToast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            {/* Header - Comic Panel Style */}
            <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
                {/* Room Code Badge */}
                <View style={[styles.headerBadge, { transform: [{ rotate: '-3deg' }], backgroundColor: Colors.spiderRed }]}>
                    <Text style={styles.badgeLabel}>ROOM CODE</Text>
                    <Text style={styles.badgeValue}>{id}</Text>
                </View>

                {/* Connected Users */}
                <View style={styles.usersContainer}>
                    {connectedUsers.length > 0 ? (
                        connectedUsers.slice(0, 3).map((user, i) => (
                            <Animated.View
                                key={user}
                                entering={SlideInRight.delay(i * 100)}
                                exiting={SlideOutRight}
                                style={[styles.userBadge, { marginLeft: i > 0 ? -10 : 0 }]}
                            >
                                <Text style={styles.userInitial}>{user.charAt(0).toUpperCase()}</Text>
                            </Animated.View>
                        ))
                    ) : null}
                    {connectedUsers.length > 3 && (
                        <View style={[styles.userBadge, { marginLeft: -10, backgroundColor: Colors.spiderBlack }]}>
                            <Text style={styles.userInitial}>+{connectedUsers.length - 3}</Text>
                        </View>
                    )}
                </View>

                {/* User Badge */}
                <View style={[styles.headerBadge, { transform: [{ rotate: '2deg' }], backgroundColor: Colors.spiderBlue }]}>
                    <Text style={styles.badgeLabel}>YOU</Text>
                    <Text style={styles.badgeValue}>{username?.toUpperCase()}</Text>
                </View>
            </Animated.View>

            {/* Canvas - Simple Comic Frame WITHOUT blocking wrapper */}
            <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.canvasWrapper}>
                <View style={styles.canvasShadow} />
                <View style={styles.canvasFrame}>
                    <DrawingCanvas
                        ref={canvasRef}
                        roomId={id}
                        color={color}
                        strokeWidth={strokeWidth}
                        userId={userId}
                        isEraser={isEraser}
                        onColorPicked={(c) => {
                            setColor(c);
                            setIsEyedropper(false);
                            setIsEraser(false);
                        }}
                    />
                </View>
            </Animated.View>

            {/* Chat Overlay */}
            <ChatOverlay roomId={id} userId={userId} />

            {/* Toolbar */}
            <ToolBar
                selectedColor={color}
                onSelectColor={handleColorSelect}
                strokeWidth={strokeWidth}
                onSelectStrokeWidth={setStrokeWidth}
                onClear={handleClear}
                onUndo={() => canvasRef.current?.undo()}
                onRedo={() => canvasRef.current?.redo()}
                isEyedropperActive={isEyedropper}
                onToggleEyedropper={() => {
                    canvasRef.current?.toggleEyedropper();
                    setIsEyedropper(p => !p);
                }}
                onExport={handleExport}
            />

            {/* Spider-Verse Clear Confirmation */}
            <SpiderAlert
                visible={showClearAlert}
                title="🕸️ CLEAR CANVAS?"
                message="This will erase EVERYTHING! Are you sure, web-head?"
                onCancel={() => setShowClearAlert(false)}
                onConfirm={confirmClear}
                cancelText="NAH"
                confirmText="CLEAR IT"
                type="danger"
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.spiderBlack,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingTop: 5,
        paddingBottom: 10,
        backgroundColor: Colors.spiderYellow,
        borderBottomWidth: 4,
        borderBottomColor: 'black',
        zIndex: 10,
    },
    headerBadge: {
        padding: 6,
        paddingHorizontal: 10,
        borderWidth: 2,
        borderColor: 'black',
        shadowColor: 'black',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 5,
        alignItems: 'center',
        minWidth: 80,
    },
    badgeLabel: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 8,
        color: 'black',
        backgroundColor: 'white',
        paddingHorizontal: 3,
        marginBottom: 1,
    },
    badgeValue: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 16,
        color: 'white',
        textShadowColor: 'black',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 0,
    },
    usersContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.spiderViolet,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'black',
    },
    userInitial: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 14,
        color: 'white',
    },
    canvasWrapper: {
        flex: 1,
        margin: Platform.OS === 'android' ? 6 : 12,
        position: 'relative',
    },
    canvasShadow: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 4 : 8,
        left: Platform.OS === 'android' ? 4 : 8,
        right: Platform.OS === 'android' ? -4 : -8,
        bottom: Platform.OS === 'android' ? -4 : -8,
        backgroundColor: Colors.spiderBlue,
        opacity: 0.8,
    },
    canvasFrame: {
        flex: 1,
        backgroundColor: 'white',
        borderWidth: Platform.OS === 'android' ? 2 : 4,
        borderColor: 'black',
        overflow: 'hidden',
    },
});
