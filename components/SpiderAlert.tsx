import * as Haptics from 'expo-haptics';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

interface SpiderAlertProps {
    visible: boolean;
    title: string;
    message: string;
    onCancel: () => void;
    onConfirm: () => void;
    cancelText?: string;
    confirmText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export default function SpiderAlert({
    visible,
    title,
    message,
    onCancel,
    onConfirm,
    cancelText = "NAH",
    confirmText = "DO IT!",
    type = 'danger'
}: SpiderAlertProps) {
    const handleConfirm = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onConfirm();
    };

    const handleCancel = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onCancel();
    };

    const typeColors = {
        danger: Colors.spiderRed,
        warning: Colors.spiderYellow,
        info: Colors.spiderBlue
    };

    const accentColor = typeColors[type];

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none">
            <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                style={styles.overlay}
            >
                <Animated.View
                    entering={SlideInUp.springify().damping(15)}
                    exiting={SlideOutDown.duration(200)}
                    style={styles.container}
                >
                    {/* Comic panel shadow */}
                    <View style={[styles.panelShadow, { backgroundColor: accentColor }]} />

                    {/* Main panel */}
                    <View style={styles.panel}>
                        {/* Decorative corner */}
                        <View style={[styles.cornerDecor, { backgroundColor: accentColor }]} />
                        <View style={[styles.cornerDecorRight, { backgroundColor: Colors.spiderBlue }]} />

                        {/* Title */}
                        <View style={[styles.titleContainer, { backgroundColor: accentColor }]}>
                            <Text style={styles.title}>{title}</Text>
                        </View>

                        {/* Message */}
                        <View style={styles.messageContainer}>
                            <Text style={styles.message}>{message}</Text>
                        </View>

                        {/* Action line decoration */}
                        <View style={styles.actionLines}>
                            <View style={[styles.actionLine, { backgroundColor: accentColor }]} />
                            <View style={[styles.actionLine, { backgroundColor: Colors.spiderBlue }]} />
                            <View style={[styles.actionLine, { backgroundColor: Colors.spiderYellow }]} />
                        </View>

                        {/* Buttons */}
                        <View style={styles.buttonsRow}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={handleCancel}
                            >
                                <View style={styles.buttonShadow} />
                                <View style={styles.buttonInner}>
                                    <Text style={styles.buttonText}>{cancelText}</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.confirmButton]}
                                onPress={handleConfirm}
                            >
                                <View style={[styles.buttonShadow, { backgroundColor: accentColor }]} />
                                <View style={[styles.confirmButtonInner, { backgroundColor: accentColor }]}>
                                    <Text style={[styles.buttonText, { color: 'white' }]}>{confirmText}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        position: 'relative',
    },
    panelShadow: {
        position: 'absolute',
        top: 8,
        left: 8,
        right: -8,
        bottom: -8,
        borderRadius: 4,
    },
    panel: {
        backgroundColor: '#FFFEF5',
        borderWidth: 5,
        borderColor: 'black',
        borderRadius: 4,
        overflow: 'hidden',
    },
    cornerDecor: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 30,
        height: 30,
        transform: [{ rotate: '45deg' }, { translateX: -15 }, { translateY: -15 }],
    },
    cornerDecorRight: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 20,
        height: 20,
        transform: [{ rotate: '45deg' }, { translateX: 10 }, { translateY: -10 }],
    },
    titleContainer: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 4,
        borderBottomColor: 'black',
    },
    title: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 28,
        color: 'white',
        textAlign: 'center',
        textShadowColor: 'black',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 0,
    },
    messageContainer: {
        padding: 20,
        paddingTop: 25,
    },
    message: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 18,
        color: 'black',
        textAlign: 'center',
        lineHeight: 26,
    },
    actionLines: {
        flexDirection: 'row',
        height: 6,
    },
    actionLine: {
        flex: 1,
    },
    buttonsRow: {
        flexDirection: 'row',
        padding: 15,
        gap: 12,
        backgroundColor: '#111',
    },
    button: {
        flex: 1,
        height: 50,
        position: 'relative',
    },
    buttonShadow: {
        position: 'absolute',
        top: 3,
        left: 3,
        right: -3,
        bottom: -3,
        backgroundColor: '#333',
        borderRadius: 4,
    },
    buttonInner: {
        flex: 1,
        backgroundColor: '#444',
        borderRadius: 4,
        borderWidth: 3,
        borderColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {},
    confirmButton: {},
    confirmButtonInner: {
        flex: 1,
        borderRadius: 4,
        borderWidth: 3,
        borderColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 18,
        color: 'white',
        letterSpacing: 1,
    },
});
