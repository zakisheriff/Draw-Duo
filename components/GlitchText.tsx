import React, { useEffect } from 'react';
import { TextStyle, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

interface GlitchTextProps {
    text: string;
    style?: TextStyle;
    color?: string;
    fontSize?: number;
    highlightColor?: string;
}

export default function GlitchText({ text, style, color = Colors.spiderRed, fontSize = 40, highlightColor = 'white' }: GlitchTextProps) {
    // Independent jitter for layers
    const jitterX = useSharedValue(0);
    const jitterY = useSharedValue(0);
    const scaleX = useSharedValue(1); // For horizontal stretching
    const scaleY = useSharedValue(1); // For vertical squashing

    useEffect(() => {
        // Continuous subtle vibration (Alive feel)
        jitterX.value = withRepeat(
            withSequence(
                withTiming(-2, { duration: 50 }),
                withTiming(2, { duration: 50 }),
                withTiming(0, { duration: 50 }),
                withDelay(2000, withSequence( // Occasional violent glitch
                    withTiming(-10, { duration: 20 }),
                    withTiming(10, { duration: 20 }),
                    withTiming(0, { duration: 20 })
                ))
            ),
            -1,
            true
        );

        jitterY.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 80 }),
                withTiming(-1, { duration: 80 }),
                withTiming(0, { duration: 80 })
            ),
            -1,
            true
        );

        // Random scale distortion (Squash and Stretch)
        scaleX.value = withRepeat(
            withSequence(
                withDelay(1000, withTiming(1.05, { duration: 50 })), // Stretch
                withTiming(1, { duration: 50 }),
                withDelay(3000, withTiming(0.9, { duration: 30 })), // Squash
                withTiming(1.1, { duration: 20 }), // Snap back overshoot
                withTiming(1, { duration: 50 })
            ),
            -1,
            true
        );

    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: jitterX.value },
            { translateY: jitterY.value },
            { scaleX: scaleX.value },
            { scaleY: scaleY.value } // Could also animate Y inverse to X
        ]
    }));

    // Cyan moves LEFT and Up violently
    const cyanShadowStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: jitterX.value - 6 },
            { translateY: jitterY.value + 3 },
            { scaleX: scaleX.value * 1.02 }
        ],
        opacity: 0.9
    }));

    // Magenta moves RIGHT and Down violently
    const magentaShadowStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: jitterX.value + 6 },
            { translateY: jitterY.value - 3 },
            { scaleX: scaleX.value * 0.98 }
        ],
        opacity: 0.9
    }));

    // Base font style without position: absolute
    const fontStyle: TextStyle = {
        fontFamily: 'Bangers_400Regular',
        fontSize,
        ...style,
    };

    return (
        <View style={{ position: 'relative', alignItems: 'center', maxWidth: '100%' }}>
            {/* INVISIBLE LAYOUT TEXT: Determines container size. Force single line & Autosize */}
            <Animated.Text
                style={[fontStyle, { opacity: 0, textAlign: 'center' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.4}
            >
                {text}
            </Animated.Text>

            {/* Electric Cyan Shadow (Offset Down-Right) */}
            <Animated.Text
                style={[fontStyle, cyanShadowStyle, { position: 'absolute', color: Colors.spiderBlue, width: '100%', textAlign: 'center' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.4}
            >
                {text}
            </Animated.Text>

            {/* Hot Magenta Shadow (Offset Up-Left) */}
            <Animated.Text
                style={[fontStyle, magentaShadowStyle, { position: 'absolute', color: Colors.spiderMagenta, width: '100%', textAlign: 'center' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.4}
            >
                {text}
            </Animated.Text>

            {/* EXTREME Black Extrusion (For that heavy ink feel) */}
            <Animated.Text
                style={[fontStyle, animatedStyle, { position: 'absolute', textShadowColor: 'black', textShadowRadius: 1, textShadowOffset: { width: 5, height: 5 }, color: 'black', top: 3, left: 3, opacity: 1, width: '100%', textAlign: 'center' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.4}
            >
                {text}
            </Animated.Text>

            {/* White Outline Halo (Visibility Layer for Black Text) */}
            {color === 'black' && (
                <>
                    <Animated.Text style={[fontStyle, animatedStyle, { position: 'absolute', top: 0, left: 0, color: 'white', textShadowColor: 'white', textShadowOffset: { width: 2, height: 0 }, textShadowRadius: 0, zIndex: 1, width: '100%', textAlign: 'center' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.4}>{text}</Animated.Text>
                    <Animated.Text style={[fontStyle, animatedStyle, { position: 'absolute', top: 0, left: 0, color: 'white', textShadowColor: 'white', textShadowOffset: { width: -2, height: 0 }, textShadowRadius: 0, zIndex: 1, width: '100%', textAlign: 'center' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.4}>{text}</Animated.Text>
                    <Animated.Text style={[fontStyle, animatedStyle, { position: 'absolute', top: 0, left: 0, color: 'white', textShadowColor: 'white', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0, zIndex: 1, width: '100%', textAlign: 'center' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.4}>{text}</Animated.Text>
                    <Animated.Text style={[fontStyle, animatedStyle, { position: 'absolute', top: 0, left: 0, color: 'white', textShadowColor: 'white', textShadowOffset: { width: 0, height: -2 }, textShadowRadius: 0, zIndex: 1, width: '100%', textAlign: 'center' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.4}>{text}</Animated.Text>
                </>
            )}

            <Animated.Text
                style={[fontStyle, animatedStyle, { position: 'absolute', textShadowColor: 'black', textShadowRadius: 1, textShadowOffset: { width: 4, height: 4 }, color: 'black', top: 2, left: 2, opacity: 1, width: '100%', textAlign: 'center' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.4}
            >
                {text}
            </Animated.Text>

            {/* Main Primary Layer (Crimson) */}
            <Animated.Text
                style={[fontStyle, animatedStyle, { position: 'absolute', top: 0, left: 0, color: color, zIndex: 10, width: '100%', textAlign: 'center' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.4}
            >
                {text}
            </Animated.Text>

            {/* White Ink Highlight (Top Left - Pop) */}
            <Animated.Text
                style={[fontStyle, animatedStyle, { position: 'absolute', top: -2, left: -2, color: highlightColor, zIndex: 11, opacity: 0.8, width: '100%', textAlign: 'center' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.4}
            >
                {text}
            </Animated.Text>
        </View>
    );
}
