import CustomToast from '@/components/CustomToast';
import GlitchText from '@/components/GlitchText';
import { Colors } from '@/constants/Colors';
import socketService from '@/services/socket';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ImageBackground, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function HomeScreen() {
    const router = useRouter();
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    // Toast state
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'error' | 'success' });

    useEffect(() => {
        // Connect on mount to be ready
        socketService.connect();
    }, []);

    const showToast = (message: string, type: 'error' | 'success') => {
        setToast({ visible: true, message, type });
    };

    const createSession = () => {
        // Generate random 5 digit number (10000 - 99999)
        const newRoomId = Math.floor(10000 + Math.random() * 90000).toString();

        if (!username) {
            showToast('ENTER A NAME, HERO!', 'error');
            return;
        }
        // No need to check, we are creating it
        router.push({ pathname: '/room/[id]', params: { id: newRoomId, username } });
    };

    const joinSession = () => {
        if (!roomId || !username) {
            showToast('ENTER ROOM ID & NAME!', 'error');
            return;
        }

        // Connect if not already connected
        if (!socketService.socket?.connected) {
            socketService.connect();
        }

        let answered = false;

        // Timeout if server doesn't respond in 2 seconds
        const timeout = setTimeout(() => {
            if (!answered) {
                showToast('SERVER UNREACHABLE (CHECK WI-FI)', 'error');
            }
        }, 2000);

        socketService.emit('check-room', roomId, (exists: boolean) => {
            answered = true;
            clearTimeout(timeout);
            if (exists) {
                router.push({ pathname: '/room/[id]', params: { id: roomId, username } });
            } else {
                showToast('ROOM NOT FOUND IN THIS DIMENSION!', 'error');
            }
        });
    };

    return (
        <View style={styles.container}>
            <ImageBackground
                source={{ uri: 'https://i.pinimg.com/736x/28/77/31/28773177305936746215160869389178.jpg' }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                blurRadius={3}
            />
            <View style={styles.overlay} />

            <CustomToast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'android' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <Animated.View entering={FadeInDown.duration(800).springify()} style={styles.content}>
                    <View style={styles.titleWrapper}>
                        <GlitchText text="SWING" color={Colors.spiderRed} fontSize={60} />
                        <GlitchText text="MATES" color={Colors.spiderBlue} fontSize={60} />
                    </View>
                    <Text style={styles.subtitle}>ACROSS THE SERVER-VERSE</Text>

                    <View style={[styles.inputContainer, styles.skewLeft]}>
                        <TextInput
                            style={styles.input}
                            placeholder="ENTER USERNAME"
                            placeholderTextColor="#666"
                            value={username}
                            onChangeText={setUsername}
                        />
                    </View>

                    <View style={[styles.inputContainer, styles.skewRight]}>
                        <TextInput
                            style={styles.input}
                            placeholder="ROOM ID (5 DIGITS)"
                            placeholderTextColor="#666"
                            value={roomId}
                            onChangeText={(text) => setRoomId(text.replace(/[^0-9]/g, ''))}
                            keyboardType="numeric"
                            maxLength={5}
                            autoCapitalize="none"
                        />
                    </View>

                    <TouchableOpacity style={[styles.button, styles.joinBtn]} onPress={joinSession}>
                        <GlitchText text="JOIN SQUAD" fontSize={28} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.orText}>- OR -</Text>

                    <TouchableOpacity style={[styles.button, styles.createBtn]} onPress={createSession}>
                        <GlitchText text="CREATE SESSION" fontSize={28} color="white" />
                    </TouchableOpacity>
                </Animated.View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)', // Darken background image
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
        width: '100%',
    },
    content: {
        padding: 20,
        alignItems: 'center',
        zIndex: 10,
    },
    titleWrapper: {
        marginBottom: 10,
        alignItems: 'center',
    },
    subtitle: {
        fontFamily: 'Bangers_400Regular',
        color: 'white',
        fontSize: 18,
        letterSpacing: 2,
        marginBottom: 40,
        textShadowColor: Colors.spiderBlue,
        textShadowRadius: 10,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
        backgroundColor: 'white',
        borderWidth: 3,
        borderColor: 'black',
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 5,
    },
    skewLeft: {
        transform: [{ rotate: '-2deg' }],
    },
    skewRight: {
        transform: [{ rotate: '2deg' }],
    },
    input: {
        padding: 15,
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
    },
    button: {
        width: '100%',
        height: 65,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'black',
        marginBottom: 10,
        shadowColor: 'black',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    joinBtn: {
        backgroundColor: Colors.spiderBlue,
        transform: [{ rotate: '-1deg' }],
    },
    createBtn: {
        backgroundColor: Colors.spiderRed,
        transform: [{ rotate: '1deg' }],
    },
    buttonText: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 28,
        color: 'white',
        textShadowColor: 'black',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 0,
    },
    orText: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 20,
        marginVertical: 15,
        color: '#000',
    }
});
