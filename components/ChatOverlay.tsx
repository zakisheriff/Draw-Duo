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
        right: 10,
        width: 300,
        height: 400,
        backgroundColor: 'white',
        borderWidth: 3,
        borderColor: 'black',
        borderRadius: 12,
        zIndex: 3000,
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 30,
        overflow: 'hidden',
    },
    openButton: {
        position: 'absolute',
        bottom: 150,
        right: 20,
        backgroundColor: Colors.spiderRed,
        padding: 15,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: 'black',
        elevation: 30,
        zIndex: 3000,
    },
    openButtonText: {
        fontFamily: 'Bangers_400Regular',
        color: 'white',
        fontSize: 16,
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'red',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'white',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: Colors.spiderBlue,
        borderBottomWidth: 2,
        borderBottomColor: 'black',
    },
    headerTitle: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 20,
        color: 'white',
    },
    closeBtn: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: 'white',
    },
    list: {
        flex: 1,
        padding: 10,
        backgroundColor: '#FAFAFA',
    },
    bubble: {
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
        maxWidth: '80%',
        borderWidth: 2,
        borderColor: 'black',
    },
    myBubble: {
        alignSelf: 'flex-end',
        backgroundColor: Colors.spiderRed,
    },
    theirBubble: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.spiderYellow,
    },
    sender: {
        fontSize: 10,
        fontFamily: 'Inter_700Bold',
        marginBottom: 2,
        color: 'rgba(0,0,0,0.6)',
    },
    message: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: 'black',
    },
    inputRow: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 2,
        borderTopColor: '#eee',
    },
    input: {
        flex: 1,
        borderWidth: 2,
        borderColor: 'black',
        borderRadius: 20,
        paddingHorizontal: 15,
        height: 40,
        marginRight: 10,
        fontFamily: 'Inter_400Regular',
    },
    sendBtn: {
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    sendText: {
        color: 'white',
        fontFamily: 'Bangers_400Regular',
    }
});
