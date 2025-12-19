import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedLine = Animated.createAnimatedComponent(Line);

interface WebShootProps {
    id: string;
    targetX: number;
    targetY: number;
    onComplete: () => void;
}

export default function WebShoot({ id, targetX, targetY, onComplete }: WebShootProps) {
    // Shoot from bottom center of screen
    const startX = SCREEN_WIDTH / 2;
    const startY = SCREEN_HEIGHT + 50;

    // Animation values
    const lineProgress = useSharedValue(0);
    const webOpacity = useSharedValue(0);
    const splatScale = useSharedValue(0);
    const dropY = useSharedValue(0);
    const fadeOut = useSharedValue(1);

    useEffect(() => {
        // Haptic feedback on shoot!
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Phase 1: Shoot the web line (fast!)
        lineProgress.value = withTiming(1, {
            duration: 120,
            easing: Easing.out(Easing.quad)
        });

        // Phase 2: Show web splat at target - haptic on impact
        webOpacity.value = withDelay(100, withTiming(1, { duration: 50 }));
        splatScale.value = withDelay(100, withSequence(
            withTiming(1.4, { duration: 80, easing: Easing.out(Easing.back(2)) }),
            withTiming(1, { duration: 100 })
        ));

        // Light haptic on splat
        setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 100);

        // Phase 3: Web drips/falls slightly
        dropY.value = withDelay(250, withTiming(40, {
            duration: 900,
            easing: Easing.in(Easing.quad)
        }));

        // Phase 4: Fade out
        fadeOut.value = withDelay(900, withTiming(0, {
            duration: 400
        }));

        // Cleanup
        const timer = setTimeout(() => {
            onComplete();
        }, 1400);

        return () => clearTimeout(timer);
    }, []);

    // Animated line from bottom to target
    const animatedLineProps = useAnimatedProps(() => {
        const currentX = startX + (targetX - startX) * lineProgress.value;
        const currentY = startY + (targetY - startY) * lineProgress.value;
        return {
            x2: currentX,
            y2: currentY,
        };
    });

    // Web splat animation
    const splatStyle = useAnimatedStyle(() => ({
        opacity: webOpacity.value * fadeOut.value,
        transform: [
            { scale: splatScale.value },
            { translateY: dropY.value },
        ],
    }));

    // Main container fade
    const containerStyle = useAnimatedStyle(() => ({
        opacity: fadeOut.value,
    }));

    // Generate BIGGER web splat SVG path
    const generateWebSplat = () => {
        const size = 70; // Bigger!
        const center = size / 2;
        const pathParts = [];

        // Radial lines - more of them
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            const length = size / 2 + Math.random() * 15;
            const endX = center + Math.cos(angle) * length;
            const endY = center + Math.sin(angle) * length;
            pathParts.push(`M ${center} ${center} L ${endX} ${endY}`);
        }

        // Concentric rings
        for (let ring = 1; ring <= 4; ring++) {
            const radius = (ring * size) / 10;
            for (let i = 0; i < 10; i++) {
                const angle1 = (Math.PI * 2 * i) / 10;
                const angle2 = (Math.PI * 2 * (i + 1)) / 10;
                const x1 = center + Math.cos(angle1) * radius;
                const y1 = center + Math.sin(angle1) * radius;
                const x2 = center + Math.cos(angle2) * radius;
                const y2 = center + Math.sin(angle2) * radius;
                pathParts.push(`M ${x1} ${y1} L ${x2} ${y2}`);
            }
        }

        return pathParts.join(' ');
    };

    const webPath = React.useMemo(() => generateWebSplat(), []);

    // Drip lines - more and longer
    const drips = React.useMemo(() => {
        return Array.from({ length: 5 }, (_, i) => ({
            x: -25 + i * 12 + Math.random() * 8,
            length: 20 + Math.random() * 35,
            delay: i * 80,
        }));
    }, []);

    return (
        <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
            {/* Web line shooting from bottom */}
            <Svg style={StyleSheet.absoluteFill}>
                {/* Main web strand */}
                <AnimatedLine
                    x1={startX}
                    y1={startY}
                    x2={startX}
                    y2={startY}
                    stroke="white"
                    strokeWidth={3}
                    animatedProps={animatedLineProps}
                />
                {/* Secondary strands */}
                <AnimatedLine
                    x1={startX - 5}
                    y1={startY}
                    x2={startX}
                    y2={startY}
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth={1.5}
                    animatedProps={animatedLineProps}
                />
                <AnimatedLine
                    x1={startX + 5}
                    y1={startY}
                    x2={startX}
                    y2={startY}
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth={1.5}
                    animatedProps={animatedLineProps}
                />
            </Svg>

            {/* Web splat at target - BIGGER */}
            <Animated.View
                style={[
                    styles.splatContainer,
                    { left: targetX - 35, top: targetY - 35 },
                    splatStyle
                ]}
            >
                <Svg width={70} height={70} viewBox="0 0 70 70">
                    <Path
                        d={webPath}
                        stroke="white"
                        strokeWidth={2}
                        fill="none"
                    />
                    <Circle cx={35} cy={35} r={5} fill="white" />
                </Svg>

                {/* Dripping web strands */}
                {drips.map((drip, i) => (
                    <View
                        key={i}
                        style={[styles.drip, { left: 35 + drip.x }]}
                    >
                        <Svg width={6} height={drip.length}>
                            <Line
                                x1={3}
                                y1={0}
                                x2={3}
                                y2={drip.length}
                                stroke="white"
                                strokeWidth={2}
                                strokeLinecap="round"
                            />
                            <Circle cx={3} cy={drip.length - 3} r={3} fill="white" />
                        </Svg>
                    </View>
                ))}
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 100,
    },
    splatContainer: {
        position: 'absolute',
        width: 70,
        height: 70,
    },
    drip: {
        position: 'absolute',
        top: 60,
    },
});
