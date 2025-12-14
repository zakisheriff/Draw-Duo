import React, { useEffect } from 'react';
import { TextStyle, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

interface GlitchTextProps {
    text: string;
    style?: TextStyle;
    color?: string;
    fontSize?: number;
    highlightColor?: string;
    outlineColor?: string;
    chaosLevel?: 'low' | 'medium' | 'high';
}

export default function GlitchText({
    text,
    style,
    color = Colors.spiderRed,
    fontSize = 40,
    highlightColor = 'white',
    outlineColor,
    chaosLevel = 'medium',
}: GlitchTextProps) {
    // Animation values
    const jitterX = useSharedValue(0);
    const jitterY = useSharedValue(0);
    const scaleX = useSharedValue(1);
    const scaleY = useSharedValue(1);
    const sliceOffset = useSharedValue(0);
    const scanLineY = useSharedValue(-20);
    const frameSkip = useSharedValue(1);
    const cyanOffset = useSharedValue(0);
    const magentaOffset = useSharedValue(0);

    // Chaos multipliers
    const chaosMult = chaosLevel === 'high' ? 3 : chaosLevel === 'low' ? 0.5 : 1;
    const glitchFreq = chaosLevel === 'high' ? 1000 : chaosLevel === 'low' ? 4000 : 2000;

    useEffect(() => {
        // Base vibration
        jitterX.value = withRepeat(
            withSequence(
                withTiming(-1.5 * chaosMult, { duration: 40 }),
                withTiming(1.5 * chaosMult, { duration: 40 }),
                withTiming(0, { duration: 40 }),
                withDelay(glitchFreq, withSequence(
                    withTiming(-8 * chaosMult, { duration: 15 }),
                    withTiming(8 * chaosMult, { duration: 15 }),
                    withTiming(-4 * chaosMult, { duration: 10 }),
                    withTiming(0, { duration: 20 })
                ))
            ),
            -1,
            true
        );

        jitterY.value = withRepeat(
            withSequence(
                withTiming(0.8 * chaosMult, { duration: 60 }),
                withTiming(-0.8 * chaosMult, { duration: 60 }),
                withTiming(0, { duration: 60 })
            ),
            -1,
            true
        );

        // Scale distortion (squash & stretch)
        scaleX.value = withRepeat(
            withSequence(
                withDelay(800, withTiming(1 + 0.04 * chaosMult, { duration: 40 })),
                withTiming(1, { duration: 40 }),
                withDelay(glitchFreq * 1.5, withSequence(
                    withTiming(1 - 0.08 * chaosMult, { duration: 25 }),
                    withTiming(1 + 0.06 * chaosMult, { duration: 15 }),
                    withTiming(1, { duration: 40 })
                ))
            ),
            -1,
            true
        );

        // Chromatic aberration - more aggressive
        cyanOffset.value = withRepeat(
            withSequence(
                withTiming(0, { duration: glitchFreq }),
                withTiming(-3 * chaosMult, { duration: 20, easing: Easing.linear }),
                withTiming(-1 * chaosMult, { duration: 80 }),
                withTiming(0, { duration: 100 }),
                withDelay(glitchFreq * 0.5, withTiming(0, { duration: 0 }))
            ),
            -1,
            false
        );

        magentaOffset.value = withRepeat(
            withSequence(
                withTiming(0, { duration: glitchFreq }),
                withTiming(3 * chaosMult, { duration: 20, easing: Easing.linear }),
                withTiming(1 * chaosMult, { duration: 80 }),
                withTiming(0, { duration: 100 }),
                withDelay(glitchFreq * 0.5, withTiming(0, { duration: 0 }))
            ),
            -1,
            false
        );

        // Slice displacement
        sliceOffset.value = withRepeat(
            withSequence(
                withTiming(0, { duration: glitchFreq * 2 }),
                withTiming(6 * chaosMult, { duration: 30 }),
                withTiming(-4 * chaosMult, { duration: 20 }),
                withTiming(0, { duration: 50 }),
                withDelay(glitchFreq, withTiming(0, { duration: 0 }))
            ),
            -1,
            false
        );

        // Frame skip (opacity flicker)
        frameSkip.value = withRepeat(
            withSequence(
                withTiming(1, { duration: glitchFreq * 3 }),
                withTiming(0, { duration: 30 }),
                withTiming(1, { duration: 30 }),
                withTiming(0.7, { duration: 20 }),
                withTiming(1, { duration: 50 }),
                withDelay(glitchFreq * 2, withTiming(1, { duration: 0 }))
            ),
            -1,
            false
        );

        // Scan line
        scanLineY.value = withRepeat(
            withSequence(
                withDelay(glitchFreq * 4, withTiming(-20, { duration: 0 })),
                withTiming(fontSize + 20, { duration: 300, easing: Easing.linear }),
                withDelay(glitchFreq * 3, withTiming(-20, { duration: 0 }))
            ),
            -1,
            false
        );
    }, [chaosLevel]);

    const mainAnimStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: jitterX.value },
            { translateY: jitterY.value },
            { scaleX: scaleX.value },
            { scaleY: scaleY.value },
        ],
        opacity: frameSkip.value,
    }));

    const cyanStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: jitterX.value + cyanOffset.value },
            { translateY: jitterY.value - 1 },
            { scaleX: scaleX.value * 1.01 },
        ],
        opacity: 0.4,
    }));

    const magentaStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: jitterX.value + magentaOffset.value },
            { translateY: jitterY.value + 1 },
            { scaleX: scaleX.value * 0.99 },
        ],
        opacity: 0.4,
    }));

    const sliceStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: sliceOffset.value }],
    }));

    const scanLineStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: scanLineY.value }],
    }));

    const fontStyle: TextStyle = {
        fontFamily: 'Bangers_400Regular',
        fontSize,
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
        ...style,
    };

    return (
        <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', maxWidth: '100%' }}>
            {/* Black extrusion background */}
            <Animated.Text
                style={[fontStyle, mainAnimStyle, { position: 'absolute', color: 'black', top: 4, left: 4, zIndex: 0 }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.4}
            >
                {text}
            </Animated.Text>

            {/* Cyan chromatic layer */}
            <Animated.Text
                style={[fontStyle, cyanStyle, { position: 'absolute', color: Colors.glitchCyan, zIndex: 1 }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.4}
            >
                {text}
            </Animated.Text>

            {/* Magenta chromatic layer */}
            <Animated.Text
                style={[fontStyle, magentaStyle, { position: 'absolute', color: Colors.glitchMagenta, zIndex: 1 }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.4}
            >
                {text}
            </Animated.Text>

            {/* Outline for visibility if color is black */}
            {(color === 'black' || outlineColor) && (
                <>
                    <Animated.Text
                        style={[fontStyle, mainAnimStyle, {
                            position: 'absolute',
                            color: outlineColor || 'white',
                            textShadowColor: outlineColor || 'white',
                            textShadowOffset: { width: 2, height: 0 },
                            textShadowRadius: 0,
                            zIndex: 2,
                        }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.4}
                    >
                        {text}
                    </Animated.Text>
                    <Animated.Text
                        style={[fontStyle, mainAnimStyle, {
                            position: 'absolute',
                            color: outlineColor || 'white',
                            textShadowColor: outlineColor || 'white',
                            textShadowOffset: { width: -2, height: 0 },
                            textShadowRadius: 0,
                            zIndex: 2,
                        }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.4}
                    >
                        {text}
                    </Animated.Text>
                    <Animated.Text
                        style={[fontStyle, mainAnimStyle, {
                            position: 'absolute',
                            color: outlineColor || 'white',
                            textShadowColor: outlineColor || 'white',
                            textShadowOffset: { width: 0, height: 2 },
                            textShadowRadius: 0,
                            zIndex: 2,
                        }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.4}
                    >
                        {text}
                    </Animated.Text>
                    <Animated.Text
                        style={[fontStyle, mainAnimStyle, {
                            position: 'absolute',
                            color: outlineColor || 'white',
                            textShadowColor: outlineColor || 'white',
                            textShadowOffset: { width: 0, height: -2 },
                            textShadowRadius: 0,
                            zIndex: 2,
                        }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.4}
                    >
                        {text}
                    </Animated.Text>
                </>
            )}

            {/* Main text */}
            <Animated.Text
                style={[fontStyle, mainAnimStyle, { color, zIndex: 10 }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.4}
            >
                {text}
            </Animated.Text>

            {/* Highlight layer */}
            <Animated.Text
                style={[fontStyle, mainAnimStyle, {
                    position: 'absolute',
                    top: -1,
                    left: -1,
                    color: highlightColor,
                    zIndex: 11,
                    opacity: 0.5,
                }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.4}
            >
                {text}
            </Animated.Text>

            {/* Horizontal slice that moves independently */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        height: fontSize * 0.2,
                        width: '120%',
                        overflow: 'hidden',
                        top: fontSize * 0.4,
                        zIndex: 12,
                    },
                    sliceStyle,
                ]}
            >
                <Animated.Text
                    style={[fontStyle, { color, marginTop: -fontSize * 0.4 }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.4}
                >
                    {text}
                </Animated.Text>
            </Animated.View>

            {/* Scan line passing through */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        left: -10,
                        right: -10,
                        height: 2,
                        backgroundColor: 'rgba(255,255,255,0.4)',
                        zIndex: 15,
                    },
                    scanLineStyle,
                ]}
            />
        </View>
    );
}
