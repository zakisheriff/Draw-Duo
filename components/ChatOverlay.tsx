import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import socketService from '../services/socket';

interface Message {
    id: string;
    userId: string;
    message: string;
    timestamp: number;
}

interface ChatProps {
    roomId: string;
    userId: string;
}

export default function ChatOverlay({ roomId, userId }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const isOpenRef = useRef(isOpen);

    useEffect(() => {
        isOpenRef.current = isOpen;
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleMessage = (data: any) => {
            setMessages((prev) => [...prev, { ...data, id: Math.random().toString() }]);

            if (!isOpenRef.current) {
                setUnreadCount(prev => prev + 1);
            }

            setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
        };

        socketService.on('receive-message', handleMessage);

        return () => {
            socketService.off('receive-message');
        };
    }, []);

    const sendMessage = () => {
        if (!text.trim()) return;

        const msgData = {
            roomId,
            message: text,
            userId,
            timestamp: Date.now(),
        };

        socketService.emit('send-message', msgData);
        setMessages((prev) => [...prev, { ...msgData, id: Math.random().toString() }]);
        setText('');
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    };

    if (!isOpen) {
        return (
            <TouchableOpacity style={styles.openButton} onPress={() => setIsOpen(true)}>
                <Text style={styles.openButtonText}>💬 CHAT</Text>
                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "padding"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 20}
            style={styles.container}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>SQUAD CHAT</Text>
                <TouchableOpacity onPress={() => setIsOpen(false)}>
                    <Text style={styles.closeBtn}>X</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={[
                        styles.bubble,
                        item.userId === userId ? styles.myBubble : styles.theirBubble
                    ]}>
                        <Text style={styles.sender}>{item.userId.split('-')[0]}</Text>
                        <Text style={styles.message}>{item.message}</Text>
                    </View>
                )}
                style={styles.list}
            />

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={setText}
                    placeholder="Say something..."
                    placeholderTextColor="#666"
                />
                <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                    <Text style={styles.sendText}>POW!</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'android' ? 140 : 120,
        right: 15,
        width: 320,
        height: 450,
        backgroundColor: 'white',
        borderWidth: 4,
        borderColor: 'black',
        // No rounded corners - raw comic panel
        borderRadius: 2,
        zIndex: 3000,
        shadowColor: Colors.spiderViolet,
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 30,
        overflow: 'hidden',
        transform: [{ rotate: '1deg' }], // Slight chaos
    },
    openButton: {
        position: 'absolute',
        bottom: 150,
        right: 20,
        backgroundColor: Colors.spiderRed,
        padding: 15,
        paddingHorizontal: 25,
        borderWidth: 3,
        borderColor: 'black',
        elevation: 30,
        zIndex: 3000,
        transform: [{ rotate: '-3deg' }],
        shadowColor: 'black',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    openButtonText: {
        fontFamily: 'Bangers_400Regular',
        color: 'white',
        fontSize: 18,
        letterSpacing: 1,
    },
    badge: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: Colors.spiderYellow,
        width: 25,
        height: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'black',
        transform: [{ rotate: '15deg' }],
    },
    badgeText: {
        color: 'black',
        fontSize: 12,
        fontFamily: 'Inter_700Bold', // Better readability for numbers
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: Colors.spiderBlue,
        borderBottomWidth: 4,
        borderBottomColor: 'black',
    },
    headerTitle: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 24,
        color: 'black', // Contrast
        textShadowColor: 'white',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 0,
    },
    closeBtn: {
        fontFamily: 'Inter_700Bold',
        fontSize: 22,
        color: 'black',
    },
    list: {
        flex: 1,
        padding: 15,
        backgroundColor: '#FAFAFA',
        // Add halftone texture pattern via ImageBackground if possible, 
        // for now solid
    },
    bubble: {
        padding: 12,
        marginBottom: 12,
        maxWidth: '85%',
        borderWidth: 3,
        borderColor: 'black',
        shadowColor: 'black',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    myBubble: {
        alignSelf: 'flex-end',
        backgroundColor: Colors.spiderRed,
        borderBottomRightRadius: 0,
        transform: [{ rotate: '-1deg' }],
    },
    theirBubble: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.spiderYellow,
        borderBottomLeftRadius: 0,
        transform: [{ rotate: '1deg' }],
    },
    sender: {
        fontSize: 10,
        fontFamily: 'Inter_700Bold',
        marginBottom: 4,
        color: 'black',
        backgroundColor: 'white',
        paddingHorizontal: 4,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'black',
    },
    message: {
        fontSize: 16,
        fontFamily: 'Inter_700Bold', // Comic boldness
        color: 'black',
    },
    inputRow: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 4,
        borderTopColor: 'black',
        backgroundColor: Colors.spiderBlack,
    },
    input: {
        flex: 1,
        borderWidth: 3,
        borderColor: 'black',
        backgroundColor: 'white',
        paddingHorizontal: 15,
        height: 50,
        marginRight: 10,
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: 'black',
    },
    sendBtn: {
        backgroundColor: Colors.spiderGreen,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        borderWidth: 3,
        borderColor: 'black',
        transform: [{ rotate: '-2deg' }],
    },
    sendText: {
        color: 'black',
        fontFamily: 'Bangers_400Regular',
        fontSize: 18,
    }
});
