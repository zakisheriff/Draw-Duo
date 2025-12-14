import ComicBoom, { BoomShape } from '@/components/ComicBoom';
import ComicForeground from '@/components/ComicForeground';
import CustomToast from '@/components/CustomToast';
import GlitchText from '@/components/GlitchText';
import GraffitiBackground from '@/components/GraffitiBackground';
import MessyInput from '@/components/MessyInput';
import { Colors } from '@/constants/Colors';
import socketService from '@/services/socket';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

export default function HomeScreen() {
    const router = useRouter();
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    // Temporary Booms on Tap
    const [taps, setTaps] = useState<{ id: number, x: number, y: number, word: string, shape: BoomShape, color: string }[]>([]);

    // Toast state
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'error' | 'success' });

    useEffect(() => {
        // Connect on mount to be ready
        socketService.connect();
    }, []);

    const showToast = (message: string, type: 'error' | 'success') => {
        setToast({ visible: true, message, type });
    };

    const handleBackgroundTap = (evt: any) => {
        Keyboard.dismiss();

        // Spawn a comic effect at touch location
        const { locationX, locationY } = evt.nativeEvent;
        const id = Date.now();
        const WORDS = ['POW!', 'BAM!', 'ZAP!', 'OOF!', 'THWACK!'];
        const SHAPES: BoomShape[] = ['explosion', 'burst', 'jagged', 'star'];
        const COLORS = [Colors.spiderRed, Colors.spiderYellow, Colors.spiderBlue, Colors.spiderMagenta];

        const newTap = {
            id,
            x: locationX - 55, // Center offset (approx half of boom size)
            y: locationY - 55,
            word: WORDS[Math.floor(Math.random() * WORDS.length)],
            shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
        };

        setTaps(prev => [...prev, newTap]);

        // Remove after animation (2s to be safe)
        setTimeout(() => {
            setTaps(prev => prev.filter(t => t.id !== id));
        }, 2000);
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
        <TouchableWithoutFeedback onPress={handleBackgroundTap}>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

                {/* Background Texture & Graffiti */}
                <GraffitiBackground />

                <View style={styles.overlay} />

                <CustomToast
                    visible={toast.visible}
                    message={toast.message}
                    type={toast.type}
                    onHide={() => setToast(prev => ({ ...prev, visible: false }))}
                />

                {/* Tap Effects Layer (Behind inputs but above background) */}
                {taps.map(tap => (
                    <ComicBoom
                        key={tap.id}
                        word={tap.word}
                        x={tap.x}
                        y={tap.y}
                        shape={tap.shape}
                        color={tap.color}
                        delay={0}
                        size={35}
                    />
                ))}

                <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'android' ? 'height' : 'padding'} // 'height' is better for Android windowed mode
                        style={styles.keyboardView}
                    >
                        {/* SCROLL VIEW TO PREVENT CLIPPING ON SMALL SCREENS */}
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            bounces={false}
                        >
                            <Animated.View entering={FadeInDown.duration(800).springify()} style={styles.content}>
                                <View style={styles.titleWrapper}>
                                    {/* "SWING" - Black with High Contrast Glitch */}
                                    <View style={{ transform: [{ rotate: '-3deg' }] }}>
                                        <GlitchText text="SWING" color="black" highlightColor={Colors.spiderRed} fontSize={64} />
                                    </View>
                                    {/* "MATES" - Black with High Contrast Glitch */}
                                    <View style={{ marginTop: -15, transform: [{ rotate: '2deg' }] }}>
                                        <GlitchText text="MATES" color="black" highlightColor={Colors.spiderBlue} fontSize={64} style={{ textShadowColor: Colors.spiderBlue, textShadowOffset: { width: -3, height: 3 }, textShadowRadius: 0 }} />
                                    </View>
                                </View>

                                <View style={styles.subtitleBadge}>
                                    {/* Neon Yellow on Black */}
                                    <GlitchText text="ACROSS THE SERVER-VERSE" color={Colors.spiderYellow} fontSize={16} />
                                </View>

                                {/* Messy Inputs */}
                                <View style={{ width: '100%', paddingHorizontal: 20 }}>
                                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                                        <View>
                                            <MessyInput
                                                label="WHO ARE YOU?"
                                                placeholder="ENTER ALIAS..."
                                                value={username}
                                                onChangeText={setUsername}
                                                rotate="-1deg"
                                                borderColor="black"
                                            />

                                            <MessyInput
                                                label="COORDINATES?"
                                                placeholder="####"
                                                value={roomId}
                                                onChangeText={(text) => setRoomId(text.replace(/[^0-9]/g, ''))}
                                                rotate="1.5deg"
                                                borderColor="black"
                                                keyboardType="numeric"
                                                maxLength={5}
                                            />
                                        </View>
                                    </TouchableWithoutFeedback>
                                </View>

                                {/* Action Buttons - NEON DARK MODE */}
                                <TouchableOpacity
                                    style={[styles.button, styles.joinBtn]}
                                    onPress={joinSession}
                                    activeOpacity={0.8}
                                >
                                    <GlitchText text="JUMP IN!" fontSize={24} color={Colors.spiderBlue} />
                                </TouchableOpacity>

                                <Text style={styles.orText}>MEANWHILE...</Text>

                                <TouchableOpacity
                                    style={[styles.button, styles.createBtn]}
                                    onPress={createSession}
                                    activeOpacity={0.8}
                                >
                                    <GlitchText text="NEW DIMENSION" fontSize={24} color={Colors.spiderRed} />
                                </TouchableOpacity>
                            </Animated.View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>

                {/* Foreground Elements (Top of Screen) */}
                <ComicForeground />
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000', // PURE BLACK
    },
    safeArea: {
        flex: 1,
        // ANDROID: Add explicit frame margin to satisfy "Must not be full screen"
        ...(Platform.OS === 'android' && {
            margin: 10,
            borderWidth: 2,
            borderColor: 'transparent', // Invisible border to enforce layout bounds
        }),
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)', // Slightly darkened
    },
    keyboardView: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center', // Stick to center
        paddingVertical: 20,
    },
    content: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    titleWrapper: {
        marginBottom: 15,
        alignItems: 'center',
        transform: [{ rotate: '-2deg' }]
    },
    subtitleBadge: {
        backgroundColor: 'black',
        paddingHorizontal: 15,
        paddingVertical: 5,
        transform: [{ rotate: '1deg' }],
        borderWidth: 2,
        borderColor: Colors.spiderYellow, // Neon Pop
        marginBottom: 30, // Reduced margin
        shadowColor: Colors.spiderYellow,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 0,
    },
    button: {
        width: '100%',
        height: 55, // Even more compact
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'black', // Base border
        marginBottom: 10,
        marginTop: 10,
        backgroundColor: 'black', // Dark Buttons
    },
    joinBtn: {
        transform: [{ rotate: '-1deg' }],
        borderColor: Colors.spiderBlue, // Neon Border
        shadowColor: Colors.spiderBlue,
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    createBtn: {
        transform: [{ rotate: '1deg' }],
        borderColor: Colors.spiderRed, // Neon Border
        shadowColor: Colors.spiderRed,
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    orText: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 16,
        marginVertical: 8,
        color: 'white',
        backgroundColor: 'black',
        borderWidth: 2,
        borderColor: 'white',
        paddingHorizontal: 10,
        transform: [{ rotate: '3deg' }]
    }
});
