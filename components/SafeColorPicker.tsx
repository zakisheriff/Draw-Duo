import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SafeColorPickerProps {
    selectedColor: string;
    onSelectColor: (color: string) => void;
    onClose: () => void;
}

export default function SafeColorPicker({ selectedColor, onSelectColor, onClose }: SafeColorPickerProps) {
    // 0-360 hue map
    const onHueSelect = (x: number, width: number) => {
        const hue = Math.max(0, Math.min(360, (x / width) * 360));
        const color = `hsl(${Math.round(hue)}, 100%, 50%)`;
        onSelectColor(color);
    };

    // Standard React Native PanResponder - No Gesture Handler, No Reanimated
    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt, gestureState) => {
                onHueSelect(evt.nativeEvent.locationX, 300);
            },
            onPanResponderMove: (evt, gestureState) => {
                // Approximate location based on move
                onHueSelect(evt.nativeEvent.locationX, 300);
            },
        })
    ).current;

    // Preset nice colors to ensure quality
    const presets = [
        '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3',
        '#FF004D', '#00D2FF', '#111111', '#FFFFFF', '#FFEB3B', '#9C27B0', '#00E676',
        '#FF4081', '#7C4DFF', '#536DFE', '#00BCD4', '#009688', '#CDDC39'
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>PICK A COLOR</Text>

            {/* Hue Slider Simulation - Wrapped in a View that handles touches */}
            <View style={styles.hueContainer}>
                <View
                    style={styles.touchArea}
                    {...panResponder.panHandlers}
                >
                    <LinearGradient
                        colors={['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'red']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.hueGradient}
                    />
                </View>
                <Text style={styles.hint}>Slide finger across to pick custom hue</Text>
            </View>

            {/* Current Preview */}
            <View style={[styles.preview, { backgroundColor: selectedColor }]}>
                <Text style={styles.previewText}>{selectedColor}</Text>
            </View>

            {/* Presets Grid */}
            <View style={styles.grid}>
                {presets.map(c => (
                    <TouchableOpacity
                        key={c}
                        style={[styles.swatch, { backgroundColor: c, borderWidth: selectedColor === c ? 3 : 1 }]}
                        onPress={() => onSelectColor(c)}
                    />
                ))}
            </View>

            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                <Text style={styles.btnText}>DONE</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    title: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 24,
        color: 'white',
        marginBottom: 15,
    },
    hueContainer: {
        width: 300,
        height: 50,
        marginBottom: 20,
    },
    touchArea: {
        width: 300,
        height: 40,
    },
    hueGradient: {
        width: '100%',
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'white',
    },
    hint: {
        color: '#aaa',
        fontSize: 10,
        textAlign: 'center',
        marginTop: 5,
        fontFamily: 'Inter_400Regular',
    },
    preview: {
        width: 80,
        height: 40,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    previewText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'black',
        backgroundColor: 'rgba(255,255,255,0.5)',
        padding: 2,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 20,
    },
    swatch: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderColor: 'white',
    },
    doneBtn: {
        backgroundColor: '#FF004D', // SpiderRed
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'white',
    },
    btnText: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 20,
        color: 'white',
    }
});
