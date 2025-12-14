import { Colors } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface MessyInputProps extends TextInputProps {
    label: string;
    width?: number | string;
    rotate?: string;
    borderColor?: string;
}

export default function MessyInput({ label, width = '100%', rotate = '-1deg', borderColor = 'black', ...props }: MessyInputProps) {
    return (
        <View style={[styles.container, { width, transform: [{ rotate }] }]}>
            {/* Layer 1: Sloppy Background Stroke */}
            <View style={[styles.layer, {
                backgroundColor: borderColor === 'black' ? Colors.spiderBlue : Colors.spiderRed,
                transform: [{ rotate: '2deg' }],
                top: 4, left: 4
            }]} />

            {/* Layer 2: Another stroke */}
            <View style={[styles.layer, {
                borderWidth: 2,
                borderColor: 'white',
                transform: [{ rotate: '-1.5deg' }],
                top: -2, left: -2,
                backgroundColor: 'transparent'
            }]} />

            {/* Main Input Box */}
            <View style={[styles.inputBox, { borderColor }]}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                    style={styles.input}
                    placeholderTextColor="#666"
                    {...props}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 30,
        position: 'relative',
    },
    layer: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 0,
        opacity: 0.8,
    },
    inputBox: {
        backgroundColor: 'white',
        borderWidth: 4,
        padding: 5,
        zIndex: 10,
    },
    label: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 14,
        color: 'black',
        marginBottom: 2,
        marginLeft: 5,
        backgroundColor: Colors.spiderYellow,
        alignSelf: 'flex-start',
        paddingHorizontal: 4,
        transform: [{ translateY: -15 }, { rotate: '-2deg' }],
        borderWidth: 2,
        borderColor: 'black',
    },
    input: {
        padding: 10,
        fontFamily: 'Inter_700Bold',
        fontSize: 22,
        color: 'black',
        backgroundColor: '#F0F0F0',
        minHeight: 50,
    },
});
