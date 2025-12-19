import { Pipette } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface SafeColorPickerProps {
    selectedColor: string;
    onSelectColor: (color: string) => void;
    onClose: () => void;
    onActivateEyedropper?: () => void;
}

// MASSIVE color palette - 200+ colors organized by hue
const COLORS = {
    reds: [
        '#FF0000', '#FF1A1A', '#FF3333', '#FF4D4D', '#FF6666', '#FF8080', '#FF9999', '#FFB3B3',
        '#E60000', '#CC0000', '#B30000', '#990000', '#800000', '#660000', '#4D0000', '#330000',
    ],
    oranges: [
        '#FF7F00', '#FF8C00', '#FF9900', '#FFA500', '#FFB347', '#FFCC66', '#FFD580', '#FFE0B3',
        '#E67300', '#CC6600', '#B35900', '#994D00', '#804000', '#663300', '#4D2600', '#331A00',
    ],
    yellows: [
        '#FFFF00', '#FFFF33', '#FFFF66', '#FFFF99', '#FFFFCC', '#FFEB3B', '#FDD835', '#FBC02D',
        '#F9A825', '#F57F17', '#FFD700', '#FFC107', '#FFB300', '#FFA000', '#FF8F00', '#FF6F00',
    ],
    greens: [
        '#00FF00', '#33FF33', '#66FF66', '#99FF99', '#CCFFCC', '#00CC00', '#009900', '#006600',
        '#00FF7F', '#00FA9A', '#2ECC71', '#27AE60', '#1ABC9C', '#16A085', '#00E676', '#00C853',
        '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20', '#81C784', '#A5D6A7', '#C8E6C9',
    ],
    cyans: [
        '#00FFFF', '#33FFFF', '#66FFFF', '#99FFFF', '#CCFFFF', '#00CED1', '#00BCD4', '#00ACC1',
        '#0097A7', '#00838F', '#006064', '#20C997', '#17A2B8', '#00D4FF', '#00E5FF', '#18FFFF',
    ],
    blues: [
        '#0000FF', '#1A1AFF', '#3333FF', '#4D4DFF', '#6666FF', '#8080FF', '#9999FF', '#B3B3FF',
        '#0066FF', '#0099FF', '#00BFFF', '#3498DB', '#2980B9', '#1E88E5', '#1976D2', '#1565C0',
        '#0D47A1', '#0A47A1', '#001F3F', '#003366', '#004080', '#0059B3', '#0073E6', '#1A8CFF',
    ],
    purples: [
        '#8B00FF', '#9B30FF', '#A020F0', '#9932CC', '#9400D3', '#8A2BE2', '#7B68EE', '#6A5ACD',
        '#9B59B6', '#8E44AD', '#7D3C98', '#6C3483', '#5B2C6F', '#4A235A', '#9C27B0', '#8E24AA',
        '#7B1FA2', '#6A1B9A', '#4A148C', '#AA00FF', '#D500F9', '#E040FB', '#EA80FC', '#CE93D8',
    ],
    pinks: [
        '#FF00FF', '#FF33FF', '#FF66FF', '#FF99FF', '#FFCCFF', '#FF1493', '#FF69B4', '#FFB6C1',
        '#FF2D95', '#E91E63', '#EC407A', '#F06292', '#F48FB1', '#F8BBD9', '#C2185B', '#AD1457',
        '#880E4F', '#FCE4EC', '#F8BBD0', '#F48FB1', '#F06292', '#EC407A', '#E91E63', '#D81B60',
    ],
    browns: [
        '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#DEB887', '#F4A460', '#BC8F8F', '#C19A6B',
        '#795548', '#6D4C41', '#5D4037', '#4E342E', '#3E2723', '#A1887F', '#8D6E63', '#BCAAA4',
    ],
    grays: [
        '#FFFFFF', '#F8F9FA', '#F5F5F5', '#EEEEEE', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575',
        '#616161', '#424242', '#212121', '#1A1A2E', '#0A0A12', '#111111', '#0D0D0D', '#000000',
    ],
};

// Flatten for grid display
const ALL_COLORS = [
    ...COLORS.reds, ...COLORS.oranges, ...COLORS.yellows, ...COLORS.greens,
    ...COLORS.cyans, ...COLORS.blues, ...COLORS.purples, ...COLORS.pinks,
    ...COLORS.browns, ...COLORS.grays,
];

export default function SafeColorPicker({ selectedColor, onSelectColor, onClose, onActivateEyedropper }: SafeColorPickerProps) {
    const [hexInput, setHexInput] = useState(selectedColor || '#FF0000');
    const [currentColor, setCurrentColor] = useState(selectedColor || '#FF0000');

    // Handle hex input
    const handleHexChange = (text: string) => {
        let hex = text.toUpperCase();
        if (!hex.startsWith('#')) {
            hex = '#' + hex;
        }
        setHexInput(hex);

        // Validate and apply if valid hex
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            setCurrentColor(hex);
            onSelectColor(hex);
        }
    };

    // Handle swatch tap
    const handleSwatchTap = (color: string) => {
        setCurrentColor(color);
        setHexInput(color);
        onSelectColor(color);
    };

    // Handle eyedropper activation
    const handleEyedropper = () => {
        onClose(); // Close the picker first
        if (onActivateEyedropper) {
            onActivateEyedropper(); // Then activate eyedropper mode
        }
    };

    const isSmall = Platform.OS === 'android';

    return (
        <View style={styles.container}>
            {/* Header: Preview + HEX Input + Eyedropper */}
            <View style={styles.headerRow}>
                <View style={[styles.preview, { backgroundColor: currentColor }]} />
                <TextInput
                    style={styles.hexInput}
                    value={hexInput}
                    onChangeText={handleHexChange}
                    placeholder="#FFFFFF"
                    placeholderTextColor="#666"
                    maxLength={7}
                    autoCapitalize="characters"
                    autoCorrect={false}
                />
                {onActivateEyedropper && (
                    <TouchableOpacity style={styles.eyedropperBtn} onPress={handleEyedropper}>
                        <Pipette color="#00D4FF" size={22} />
                    </TouchableOpacity>
                )}
            </View>

            {onActivateEyedropper && (
                <Text style={styles.eyedropperHint}>Tap 💧 to pick color from canvas</Text>
            )}

            {/* Color Grid */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.grid}>
                    {ALL_COLORS.map((color, index) => (
                        <TouchableOpacity
                            key={`${color}-${index}`}
                            style={[
                                styles.swatch,
                                { backgroundColor: color },
                                currentColor.toUpperCase() === color.toUpperCase() && styles.selectedSwatch,
                            ]}
                            onPress={() => handleSwatchTap(color)}
                            activeOpacity={0.7}
                        />
                    ))}
                </View>
            </ScrollView>

            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                <Text style={styles.btnText}>DONE</Text>
            </TouchableOpacity>
        </View>
    );
}

const isSmall = Platform.OS === 'android';
const SWATCH_SIZE = isSmall ? 28 : 34;

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 10,
    },
    preview: {
        width: 45,
        height: 45,
        borderRadius: 10,
        borderWidth: 3,
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
        width: 95,
        textAlign: 'center',
        fontFamily: 'Inter_400Regular',
    },
    eyedropperBtn: {
        width: 45,
        height: 45,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#00D4FF',
        backgroundColor: '#0A0A12',
        justifyContent: 'center',
        alignItems: 'center',
    },
    eyedropperHint: {
        color: '#888',
        fontSize: 10,
        marginBottom: 8,
        fontStyle: 'italic',
    },
    scrollView: {
        width: '100%',
        maxHeight: Platform.OS === 'android' ? 180 : 220,
    },
    scrollContent: {
        alignItems: 'center',
        paddingBottom: 8,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 4,
        width: '100%',
        paddingHorizontal: 4,
    },
    swatch: {
        width: SWATCH_SIZE,
        height: SWATCH_SIZE,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    selectedSwatch: {
        borderColor: '#00D4FF',
        borderWidth: 3,
        transform: [{ scale: 1.15 }],
    },
    doneBtn: {
        marginTop: 10,
        backgroundColor: '#0A0A12',
        paddingVertical: Platform.OS === 'android' ? 8 : 10,
        paddingHorizontal: Platform.OS === 'android' ? 35 : 45,
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
