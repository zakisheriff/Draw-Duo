import { Colors } from '@/constants/Colors';
import React, { useEffect } from 'react';
import { DimensionValue, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

interface MessyInputProps extends TextInputProps {
    label: string;
    width?: DimensionValue;
    rotate?: string;
    borderColor?: string;
}

export default function MessyInput({
    label,
    width = '100%',
    rotate = '-1deg',
    borderColor = 'black',
    ...props
}: MessyInputProps) {
    const glitchX = useSharedValue(0);
    const focusGlow = useSharedValue(0);
    const [isFocused, setIsFocused] = React.useState(false);

    useEffect(() => {
        // Subtle idle jitter
        glitchX.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 3000 }),
                withTiming(2, { duration: 30, easing: Easing.linear }),
                withTiming(-1, { duration: 20, easing: Easing.linear }),
                withTiming(0, { duration: 50 }),
                withTiming(0, { duration: 2000 + Math.random() * 2000 })
            ),
            -1,
            false
        );
    }, []);

    useEffect(() => {
        if (isFocused) {
            focusGlow.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 500 }),
                    withTiming(0.5, { duration: 500 })
                ),
                -1,
                true
            );
        } else {
            focusGlow.value = withTiming(0, { duration: 200 });
        }
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: glitchX.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: focusGlow.value,
    }));

    return (
        <Animated.View style={[styles.container, { width, transform: [{ rotate }] }, animatedStyle]}>
            {/* Layer 1: Cyan glitch layer */}
            <View style={[styles.layer, {
                backgroundColor: Colors.glitchCyan,
                transform: [{ rotate: '2deg' }, { translateX: 4 }, { translateY: 4 }],
            }]} />

            {/* Layer 2: Magenta glitch layer */}
            <View style={[styles.layer, {
                backgroundColor: Colors.glitchMagenta,
                transform: [{ rotate: '-1deg' }, { translateX: -3 }, { translateY: 3 }],
            }]} />

            {/* Layer 3: Black shadow extrusion */}
            <View style={[styles.layer, {
                backgroundColor: 'black',
                transform: [{ translateX: 6 }, { translateY: 6 }],
            }]} />

            {/* Focus glow effect */}
            <Animated.View style={[styles.focusGlow, glowStyle]} />

            {/* Main Input Box */}
            <View style={[styles.inputBox, { borderColor }]}>
                {/* Floating label badge */}
                <View style={styles.labelContainer}>
                    <View style={styles.labelShadow} />
                    <View style={styles.labelBadge}>
                        <Text style={styles.label}>{label}</Text>
                    </View>
                </View>

                <TextInput
                    style={styles.input}
                    placeholderTextColor="#888"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
        marginTop: 8,
        position: 'relative',
    },
    layer: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 0,
        opacity: 0.6,
    },
    focusGlow: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.spiderBlue,
        transform: [{ scale: 1.02 }],
        opacity: 0,
    },
    inputBox: {
        backgroundColor: 'white',
        borderWidth: 3,
        padding: 4,
        zIndex: 10,
        position: 'relative',
    },
    labelContainer: {
        position: 'absolute',
        top: -14,
        left: 8,
        zIndex: 20,
    },
    labelShadow: {
        position: 'absolute',
        top: 2,
        left: 2,
        right: -2,
        bottom: -2,
        backgroundColor: 'black',
    },
    labelBadge: {
        backgroundColor: Colors.spiderYellow,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderWidth: 2,
        borderColor: 'black',
        transform: [{ rotate: '-2deg' }],
    },
    label: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 11,
        color: 'black',
        letterSpacing: 0.5,
    },
    input: {
        padding: 8,
        paddingTop: 10,
        fontFamily: 'Bangers_400Regular',
        fontSize: 18,
        color: 'black',
        backgroundColor: '#F5F5F5',
        minHeight: 42,
        letterSpacing: 1,
    },
});
