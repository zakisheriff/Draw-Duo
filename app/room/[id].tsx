import ChatOverlay from '@/components/ChatOverlay';
import DrawingCanvas, { CanvasRef } from '@/components/DrawingCanvas';
import ToolBar from '@/components/ToolBar';
import { Colors } from '@/constants/Colors';
import socketService from '@/services/socket';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function RoomScreen() {
    const { id, username } = useLocalSearchParams<{ id: string, username: string }>();
    const [color, setColor] = useState(Colors.spiderRed);
    const [strokeWidth, setStrokeWidth] = useState(5);

    // Stable User ID across renders
    const userId = React.useMemo(() =>
        username + '-' + Math.random().toString(36).substring(7),
        []);

    const canvasRef = useRef<CanvasRef>(null);
    const [isEyedropper, setIsEyedropper] = useState(false);

    useEffect(() => {
        socketService.connect();
        socketService.emit('join-room', id);

        // Don't disconnect here, keeps socket alive for navigation back/forth if needed
        // or just let app lifecycle handle it
    }, [id]);

    const handleClear = () => {
        // Clear locally immediately
        canvasRef.current?.clear();
        // Emit to others
        socketService.emit('clear-canvas', id);
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <View style={styles.headerTextWrapper}>
                    <Text style={styles.headerLabel}>ROOM CODE:</Text>
                    <Text style={styles.roomCode}>{id}</Text>
                </View>
                <View style={[styles.headerTextWrapper, { backgroundColor: Colors.spiderBlue, transform: [{ rotate: '2deg' }] }]}>
                    <Text style={styles.headerLabel}>USER:</Text>
                    <Text style={styles.user}>{username}</Text>
                </View>
            </View>
            <View style={styles.canvasContainer}>
                <DrawingCanvas
                    ref={canvasRef}
                    roomId={id}
                    color={color}
                    strokeWidth={strokeWidth}
                    userId={userId}
                    onColorPicked={(c) => {
                        setColor(c);
                        setIsEyedropper(false);
                    }}
                />
            </View>
            <ChatOverlay roomId={id} userId={userId} />
            <ToolBar
                selectedColor={color}
                onSelectColor={setColor}
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
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 20,
        backgroundColor: Colors.spiderYellow,
        borderBottomWidth: 5,
        borderBottomColor: 'black',
        // jagged border illusion?
        zIndex: 10,
    },
    headerTextWrapper: {
        backgroundColor: Colors.spiderRed,
        padding: 5,
        paddingHorizontal: 10,
        borderWidth: 2,
        borderColor: 'black',
        transform: [{ rotate: '-2deg' }],
        shadowColor: 'black',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    headerLabel: {
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: 'white',
    },
    roomCode: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 24,
        color: 'white',
    },
    user: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 18,
        color: 'white',
    },
    canvasContainer: {
        flex: 1,
        backgroundColor: 'white',
        margin: 15,
        borderWidth: 4,
        borderColor: 'black',
        // comic shadow
        shadowColor: Colors.spiderBlue,
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 0,
        borderRadius: 4,
    }
});
