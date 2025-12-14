import React, { useEffect } from 'react';
import { TextStyle, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

interface GlitchTextProps {
    text: string;
    style?: TextStyle;
    color?: string;
    fontSize?: number;
}

export default function GlitchText({ text, style, color = 'black', fontSize = 40 }: GlitchTextProps) {
    const shakeX = useSharedValue(0);
    const shakeY = useSharedValue(0);

    useEffect(() => {
        // Random glitch effect
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                shakeX.value = withSequence(
                    withTiming(Math.random() * 4 - 2, { duration: 50 }),
                    withTiming(0, { duration: 50 })
                );
                shakeY.value = withSequence(
                    withTiming(Math.random() * 4 - 2, { duration: 50 }),
                    withTiming(0, { duration: 50 })
                );
            }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shakeX.value }, { translateY: shakeY.value }]
    }));

    // Base font style without position: absolute
    const fontStyle: TextStyle = {
        fontFamily: 'Bangers_400Regular',
        fontSize,
        ...style,
    };

    return (
        <View style={{ position: 'relative' }}>
            {/* INVISIBLE LAYOUT TEXT: Determines container size */}
            <Animated.Text style={[fontStyle, { opacity: 0 }]}>
                {text}
            </Animated.Text>

            {/* Cyan Layer */}
            <Animated.Text style={[fontStyle, animatedStyle, { position: 'absolute', top: -2, left: -2, color: Colors.spiderBlue, opacity: 0.8 }]}>
                {text}
            </Animated.Text>

            {/* Red Layer */}
            <Animated.Text style={[fontStyle, animatedStyle, { position: 'absolute', top: 2, left: 2, color: Colors.spiderRed, opacity: 0.8 }]}>
                {text}
            </Animated.Text>

            {/* Main Layer */}
            <Animated.Text style={[fontStyle, animatedStyle, { position: 'absolute', top: 0, left: 0, color: color, zIndex: 10 }]}>
                {text}
            </Animated.Text>
        </View>
    );
}
