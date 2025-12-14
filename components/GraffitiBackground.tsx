import { Colors } from '@/constants/Colors';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

import SpiderWeb from './SpiderWeb';

export default function GraffitiBackground() {
    // Generate static Ben-Day dots
    const dots = [];
    const spacing = 30;
    for (let i = 0; i < width; i += spacing) {
        for (let j = 0; j < height; j += spacing) {
            if ((i + j) % (spacing * 2) === 0) { // Staggered
                dots.push(<Circle key={`${i}-${j}`} cx={i} cy={j} r={2} fill={Colors.spiderBlue} opacity={0.15} />);
            }
        }
    }

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Ben-Day Dots Pattern */}
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                {dots}
            </Svg>

            {/* Spider Webs - DENSE NEST */}
            {/* Corners */}
            <SpiderWeb size={250} style={{ position: 'absolute', top: -60, left: -60, opacity: 0.6 }} />
            <SpiderWeb size={220} style={{ position: 'absolute', bottom: -50, right: -50, transform: [{ rotate: '180deg' }], opacity: 0.5 }} />
            <SpiderWeb size={180} style={{ position: 'absolute', top: -40, right: -40, transform: [{ rotate: '90deg' }], opacity: 0.5 }} />
            <SpiderWeb size={200} style={{ position: 'absolute', bottom: -40, left: -40, transform: [{ rotate: '-90deg' }], opacity: 0.6 }} />

            {/* Edges - Top/Bottom/Sides */}
            <SpiderWeb size={120} style={{ position: 'absolute', top: 0, left: width * 0.4, opacity: 0.4, transform: [{ rotate: '15deg' }] }} />
            <SpiderWeb size={120} style={{ position: 'absolute', bottom: 0, right: width * 0.4, opacity: 0.4, transform: [{ rotate: '195deg' }] }} />
            <SpiderWeb size={100} style={{ position: 'absolute', top: height * 0.3, left: -30, opacity: 0.3, transform: [{ rotate: '-15deg' }] }} />
            <SpiderWeb size={100} style={{ position: 'absolute', top: height * 0.7, right: -30, opacity: 0.3, transform: [{ rotate: '165deg' }] }} />

            {/* Random hanging webs */}
            <SpiderWeb size={80} style={{ position: 'absolute', top: 150, right: 40, opacity: 0.2, transform: [{ rotate: '45deg' }] }} />
            <SpiderWeb size={90} style={{ position: 'absolute', bottom: 200, left: 20, opacity: 0.2, transform: [{ rotate: '-45deg' }] }} />

            {/* Random Glitch Rectangles - Background Ambience */}
            <View style={[styles.glitchRect, { top: 100, left: -20, backgroundColor: Colors.spiderBlue }]} />
            <View style={[styles.glitchRect, { bottom: 200, right: -30, backgroundColor: Colors.spiderMagenta, width: 200 }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    glitchRect: {
        position: 'absolute',
        height: 40,
        width: 150,
        transform: [{ rotate: '15deg' }],
        opacity: 0.2,
    }
});
