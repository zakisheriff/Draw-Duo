import { CheckCircle, XCircle } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { Colors } from '../constants/Colors';

interface ToastProps {
    message: string;
    type: 'error' | 'success';
    visible: boolean;
    onHide: () => void;
}

export default function CustomToast({ message, type, visible, onHide }: ToastProps) {
    const translateY = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            // Slide Down
            Animated.timing(translateY, {
                toValue: 60,
                duration: 300,
                useNativeDriver: true,
                easing: Easing.out(Easing.back(1.5))
            }).start();

            const timer = setTimeout(() => {
                // Slide Up and Hide
                Animated.timing(translateY, {
                    toValue: -100,
                    duration: 300,
                    useNativeDriver: true,
                    easing: Easing.in(Easing.cubic)
                }).start(() => onHide());
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                type === 'error' ? styles.error : styles.success,
                { transform: [{ translateY }] }
            ]}
        >
            {type === 'error' ? <XCircle color="white" size={24} /> : <CheckCircle color="white" size={24} />}
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0, // Position controlled by translateY
        left: 20,
        right: 20,
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        zIndex: 9999,
        borderWidth: 2,
        borderColor: 'black',
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 0,
        elevation: 10,
    },
    error: {
        backgroundColor: Colors.spiderRed,
        transform: [{ rotate: '-1deg' }],
    },
    success: {
        backgroundColor: Colors.spiderGreen,
        transform: [{ rotate: '1deg' }],
    },
    text: {
        fontFamily: 'Bangers_400Regular',
        color: 'white',
        fontSize: 18,
        flex: 1,
    }
});
