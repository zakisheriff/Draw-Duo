import { Eraser, Eye, Plus, Redo2, Trash2, Undo2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import SafeColorPicker from './SafeColorPicker';

interface ToolBarProps {
    selectedColor: string;
    onSelectColor: (color: string) => void;
    strokeWidth: number;
    onSelectStrokeWidth: (width: number) => void;
    onClear: () => void;
    onUndo: () => void;
    onRedo: () => void;
    isEyedropperActive: boolean;
    onToggleEyedropper: () => void;
}

export default function ToolBar({
    selectedColor,
    onSelectColor,
    strokeWidth,
    onSelectStrokeWidth,
    onClear,
    onUndo,
    onRedo,
    isEyedropperActive,
    onToggleEyedropper
}: ToolBarProps) {
    const [showColorPicker, setShowColorPicker] = useState(false);

    const palette = [
        Colors.spiderRed,
        Colors.spiderBlue,
        Colors.spiderBlack,
        Colors.spiderYellow,
        Colors.spiderPurple,
        Colors.spiderGreen,
        '#FFFFFF',
    ];

    return (
        <View style={styles.container}>
            {/* Tools Row */}
            <View style={styles.toolsRow}>
                <TouchableOpacity style={styles.iconBtn} onPress={onUndo}>
                    <Undo2 color="white" size={24} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconBtn} onPress={onRedo}>
                    <Redo2 color="white" size={24} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.iconBtn, isEyedropperActive && styles.activeBtn]}
                    onPress={onToggleEyedropper}
                >
                    <Eye color={isEyedropperActive ? Colors.spiderRed : "white"} size={24} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconBtn} onPress={onClear}>
                    <Trash2 color="white" size={24} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.iconBtn, strokeWidth === 15 && styles.activeBtn]}
                    onPress={() => onSelectStrokeWidth(strokeWidth === 5 ? 15 : 5)}
                >
                    <View style={{ width: strokeWidth === 5 ? 6 : 14, height: strokeWidth === 5 ? 6 : 14, borderRadius: 10, backgroundColor: 'white' }} />
                </TouchableOpacity>
            </View>

            {/* Colors Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
                {palette.map((c) => (
                    <TouchableOpacity
                        key={c}
                        style={[styles.colorBtn, { backgroundColor: c, borderWidth: selectedColor === c ? 3 : 1, borderColor: selectedColor === c ? 'white' : 'black' }]}
                        onPress={() => onSelectColor(c)}
                    >
                        {c === '#FFFFFF' && <Eraser color="black" size={20} />}
                    </TouchableOpacity>
                ))}
                <TouchableOpacity
                    style={[styles.colorBtn, { backgroundColor: selectedColor, borderWidth: 3, borderColor: 'white' }]}
                    onPress={() => setShowColorPicker(true)}
                >
                    <Plus color={selectedColor === '#ffffff' || selectedColor === '#FFFFFF' ? 'black' : 'white'} size={24} />
                </TouchableOpacity>
            </ScrollView>

            {showColorPicker && (
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerContent}>
                        <SafeColorPicker
                            selectedColor={selectedColor}
                            onSelectColor={onSelectColor}
                            onClose={() => setShowColorPicker(false)}
                        />
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
        backgroundColor: Colors.spiderBlack,
        borderTopWidth: 4,
        borderTopColor: Colors.spiderBlue,
        paddingBottom: 30, // Safe area
        width: '100%',
        zIndex: 2000, // Ensure it's above ChatOverlay
        elevation: 20,
    },
    toolsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
    },
    iconBtn: {
        padding: 10,
        backgroundColor: '#222',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#444',
    },
    activeBtn: {
        borderColor: Colors.spiderBlue,
        backgroundColor: '#333',
    },
    colorRow: {
        flexDirection: 'row',
    },
    colorBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 10,
        borderColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        top: -1000, // Cover entire screen upwards
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 5000,
    },
    pickerContent: {
        width: '85%',
        backgroundColor: '#222',
        padding: 20,
        borderRadius: 12,
        borderWidth: 4,
        borderColor: Colors.spiderRed,
    },
    modalTitle: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 28,
        color: 'white',
        textAlign: 'center',
        marginBottom: 20,
    },
    closeBtn: {
        marginTop: 20,
        backgroundColor: Colors.spiderBlue,
        padding: 15,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'black',
        transform: [{ rotate: '-1deg' }],
    },
    btnText: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 20,
        color: 'white',
    }
});
