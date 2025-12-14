import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function SpiderWeb({ size = 100, color = 'rgba(255,255,255,0.2)', style }: any) {
    return (
        <View style={[{ width: size, height: size }, style]} pointerEvents="none">
            <Svg height="100%" width="100%" viewBox="0 0 100 100">
                {/* Radial Lines */}
                <Path d="M0,0 L100,100" stroke={color} strokeWidth="1" />
                <Path d="M0,0 L50,100" stroke={color} strokeWidth="1" />
                <Path d="M0,0 L100,50" stroke={color} strokeWidth="1" />
                <Path d="M0,0 L100,20" stroke={color} strokeWidth="1" />
                <Path d="M0,0 L20,100" stroke={color} strokeWidth="1" />

                {/* Concentric Arcs (Webbing) */}
                <Path d="M10,20 Q15,15 20,10" stroke={color} strokeWidth="1" fill="none" />
                <Path d="M20,40 Q30,30 40,20" stroke={color} strokeWidth="1" fill="none" />
                <Path d="M30,60 Q45,45 60,30" stroke={color} strokeWidth="1" fill="none" />
                <Path d="M40,80 Q60,60 80,40" stroke={color} strokeWidth="1" fill="none" />
                <Path d="M50,100 Q75,75 100,50" stroke={color} strokeWidth="1" fill="none" />
            </Svg>
        </View>
    );
}
