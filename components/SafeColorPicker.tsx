import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Pipette } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SafeColorPickerProps {
    selectedColor: string;
    onSelectColor: (color: string) => void;
    onClose: () => void;
    onActivateEyedropper?: () => void;
}

// Dimensions
const PICKER_SIZE = Platform.OS === 'android' ? Math.min(SCREEN_WIDTH - 100, 220) : Math.min(SCREEN_WIDTH - 80, 280);
const HUE_SLIDER_HEIGHT = 20;
const CURSOR_SIZE = 22;

// ============ COLOR CONVERSION UTILITIES ============

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    h = h / 360;
    s = s / 100;
    v = v / 100;

    let r = 0, g = 0, b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hueToColor(hue: number): string {
    const [r, g, b] = hsvToRgb(hue, 100, 100);
    return rgbToHex(r, g, b);
}

// ============ MAIN COMPONENT ============

export default function SafeColorPicker({
    selectedColor,
    onSelectColor,
    onClose,
    onActivateEyedropper
}: SafeColorPickerProps) {
    // HSV State
    const [hue, setHue] = useState(0);
    const [saturation, setSaturation] = useState(100);
    const [brightness, setBrightness] = useState(100);

    // Derived values
    const [rgb, setRgb] = useState<[number, number, number]>([255, 0, 0]);
    const [hex, setHex] = useState('#FF0000');
    const [hsl, setHsl] = useState<[number, number, number]>([0, 100, 50]);

    // Refs for touch handling
    const squareRef = useRef<View>(null);
    const hueRef = useRef<View>(null);
    const lastHapticTime = useRef(0);

    // Update all color values from HSV
    const updateColors = (h: number, s: number, v: number) => {
        const newRgb = hsvToRgb(h, s, v);
        const newHex = rgbToHex(...newRgb);
        const newHsl = rgbToHsl(...newRgb);

        setRgb(newRgb);
        setHex(newHex);
        setHsl(newHsl);
        onSelectColor(newHex);
    };

    // Haptic feedback (throttled)
    const triggerHaptic = () => {
        const now = Date.now();
        if (now - lastHapticTime.current > 50) {
            Haptics.selectionAsync();
            lastHapticTime.current = now;
        }
    };

    // Handle square touch (Saturation/Brightness)
    const handleSquareTouch = (x: number, y?: number) => {
        const newSat = Math.max(0, Math.min(100, (x / PICKER_SIZE) * 100));
        const newBright = Math.max(0, Math.min(100, 100 - ((y ?? 0) / PICKER_SIZE) * 100));

        setSaturation(newSat);
        setBrightness(newBright);
        updateColors(hue, newSat, newBright);
    };

    // Handle hue slider touch
    const handleHueTouch = (x: number) => {
        const newHue = Math.max(0, Math.min(360, (x / PICKER_SIZE) * 360));
        setHue(newHue);
        updateColors(newHue, saturation, brightness);
        triggerHaptic();
    };

    // Create touch handlers with smooth tracking
    const createTouchHandler = (handler: (x: number, y?: number) => void, isSquare = false) => ({
        onStartShouldSetResponder: () => true,
        onMoveShouldSetResponder: () => true,
        onResponderGrant: (e: any) => {
            const { locationX, locationY } = e.nativeEvent;
            if (isSquare) {
                handler(locationX, locationY);
            } else {
                handler(locationX);
            }
        },
        onResponderMove: (e: any) => {
            const { locationX, locationY } = e.nativeEvent;
            if (isSquare) {
                handler(locationX, locationY);
            } else {
                handler(locationX);
            }
        },
        onResponderRelease: () => {
            // Final update already done in move
        },
    });

    // Eyedropper handler
    const handleEyedropper = () => {
        onClose();
        if (onActivateEyedropper) {
            onActivateEyedropper();
        }
    };

    // Current pure hue color for square gradient
    const pureHueColor = hueToColor(hue);

    return (
        <View style={styles.container}>
            {/* 2D Color Square - Saturation (X) / Brightness (Y) */}
            <View
                ref={squareRef}
                style={[styles.colorSquare, { width: PICKER_SIZE, height: PICKER_SIZE }]}
                {...createTouchHandler(handleSquareTouch, true)}
            >
                {/* Base Hue Layer */}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: pureHueColor }]} />

                {/* White to Transparent (Saturation - Left to Right) */}
                <LinearGradient
                    colors={['#FFFFFF', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />

                {/* Transparent to Black (Brightness - Top to Bottom) */}
                <LinearGradient
                    colors={['transparent', '#000000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                {/* Cursor */}
                <View
                    style={[
                        styles.squareCursor,
                        {
                            left: (saturation / 100) * PICKER_SIZE - CURSOR_SIZE / 2,
                            top: ((100 - brightness) / 100) * PICKER_SIZE - CURSOR_SIZE / 2,
                        }
                    ]}
                >
                    <View style={[styles.cursorInner, { backgroundColor: hex }]} />
                </View>
            </View>

            {/* Hue Slider */}
            <View
                ref={hueRef}
                style={[styles.hueSlider, { width: PICKER_SIZE }]}
                {...createTouchHandler(handleHueTouch, false)}
            >
                <LinearGradient
                    colors={['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.hueGradient}
                />
                {/* Hue Cursor */}
                <View
                    style={[
                        styles.hueCursor,
                        { left: (hue / 360) * PICKER_SIZE - 6 }
                    ]}
                />
            </View>

            {/* Color Info Row */}
            <View style={styles.infoRow}>
                {/* Color Preview */}
                <View style={[styles.preview, { backgroundColor: hex }]} />

                {/* HEX Input */}
                <TextInput
                    style={styles.hexInput}
                    value={hex}
                    onChangeText={(text) => {
                        // Always update the display text
                        let formatted = text.toUpperCase();
                        if (!formatted.startsWith('#')) {
                            formatted = '#' + formatted;
                        }
                        // Limit to 7 chars (#XXXXXX)
                        formatted = formatted.slice(0, 7);
                        setHex(formatted);

                        // Only apply color if valid hex
                        if (/^#[0-9A-F]{6}$/i.test(formatted)) {
                            const [r, g, b] = hexToRgb(formatted);
                            setRgb([r, g, b]);
                            setHsl(rgbToHsl(r, g, b));
                            onSelectColor(formatted);
                        }
                    }}
                    maxLength={7}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    keyboardType="default"
                />

                {/* Eyedropper */}
                {onActivateEyedropper && (
                    <TouchableOpacity style={styles.eyedropperBtn} onPress={handleEyedropper}>
                        <Pipette color="#00D4FF" size={20} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Color Values Display */}
            <View style={styles.valuesRow}>
                <Text style={styles.valueText}>RGB({rgb[0]}, {rgb[1]}, {rgb[2]})</Text>
                <Text style={styles.valueText}>HSL({hsl[0]}°, {hsl[1]}%, {hsl[2]}%)</Text>
            </View>

            {/* Done Button */}
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                <Text style={styles.btnText}>DONE</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    colorSquare: {
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#00D4FF',
        overflow: 'hidden',
        position: 'relative',
    },
    squareCursor: {
        position: 'absolute',
        width: CURSOR_SIZE,
        height: CURSOR_SIZE,
        borderRadius: CURSOR_SIZE / 2,
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cursorInner: {
        width: CURSOR_SIZE - 8,
        height: CURSOR_SIZE - 8,
        borderRadius: (CURSOR_SIZE - 8) / 2,
    },
    hueSlider: {
        height: HUE_SLIDER_HEIGHT + 10,
        marginTop: 12,
        justifyContent: 'center',
        position: 'relative',
    },
    hueGradient: {
        height: HUE_SLIDER_HEIGHT,
        borderRadius: HUE_SLIDER_HEIGHT / 2,
        borderWidth: 2,
        borderColor: '#00D4FF',
    },
    hueCursor: {
        position: 'absolute',
        top: -2,
        width: 12,
        height: HUE_SLIDER_HEIGHT + 14,
        backgroundColor: '#FFF',
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.4,
        shadowRadius: 2,
        elevation: 3,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        gap: 10,
    },
    preview: {
        width: 44,
        height: 44,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#00D4FF',
    },
    hexInput: {
        backgroundColor: '#1A1A2E',
        borderWidth: 2,
        borderColor: '#00D4FF',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        color: '#00D4FF',
        fontSize: 14,
        fontWeight: 'bold',
        width: 90,
        textAlign: 'center',
    },
    eyedropperBtn: {
        width: 44,
        height: 44,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#00D4FF',
        backgroundColor: '#0A0A12',
        justifyContent: 'center',
        alignItems: 'center',
    },
    valuesRow: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 12,
    },
    valueText: {
        color: '#888',
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    doneBtn: {
        marginTop: 14,
        backgroundColor: '#0A0A12',
        paddingVertical: Platform.OS === 'android' ? 8 : 10,
        paddingHorizontal: 40,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#00D4FF',
    },
    btnText: {
        fontFamily: 'Bangers_400Regular',
        fontSize: Platform.OS === 'android' ? 16 : 20,
        color: '#00D4FF',
    },
});
