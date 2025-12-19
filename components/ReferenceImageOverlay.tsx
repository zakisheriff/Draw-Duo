import Slider from '@react-native-community/slider';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Check, Image as ImageIcon, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

interface ReferenceImageOverlayProps {
    visible: boolean;
    onClose: () => void;
    // Image that's currently applied (synced across devices) - base64 data
    appliedImageData: string | null;
    appliedOpacity: number;
    // Called when user presses APPLY to share image with all users (sends base64)
    onApplyImage: (base64Data: string, opacity: number) => void;
    onClearImage: () => void;
    // Called when opacity changes (for live updates)
    onOpacityChange: (opacity: number) => void;
}

export default function ReferenceImageOverlay({
    visible,
    onClose,
    appliedImageData,
    appliedOpacity,
    onApplyImage,
    onClearImage,
    onOpacityChange
}: ReferenceImageOverlayProps) {
    // Local state for preview before applying
    const [previewUri, setPreviewUri] = useState<string | null>(null);
    const [previewOpacity, setPreviewOpacity] = useState(appliedOpacity || 0.3);
    const [isLoading, setIsLoading] = useState(false);

    // Sync local state when applied image changes
    useEffect(() => {
        if (appliedImageData) {
            // appliedImageData is base64, convert to data URI for display
            if (!appliedImageData.startsWith('data:')) {
                setPreviewUri(`data:image/jpeg;base64,${appliedImageData}`);
            } else {
                setPreviewUri(appliedImageData);
            }
            setPreviewOpacity(appliedOpacity);
        }
    }, [appliedImageData, appliedOpacity]);

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert('Sorry, we need camera roll permissions to upload a reference image!');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.5, // Lower quality for faster transfer
            });

            if (!result.canceled && result.assets[0]) {
                setPreviewUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
        }
    };

    const handleApply = async () => {
        if (!previewUri) return;

        setIsLoading(true);
        try {
            let base64Data: string;

            // If already base64, use it directly
            if (previewUri.startsWith('data:')) {
                base64Data = previewUri.replace(/^data:image\/\w+;base64,/, '');
            } else {
                // Convert file URI to base64
                base64Data = await FileSystem.readAsStringAsync(previewUri, {
                    encoding: 'base64',
                });
            }

            onApplyImage(base64Data, previewOpacity);
            onClose();
        } catch (error) {
            console.error('Error converting image to base64:', error);
            alert('Failed to process image. Please try a smaller image.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setPreviewUri(null);
        onClearImage();
        onClose();
    };

    // Handle live opacity changes
    const handleOpacityChange = (value: number) => {
        setPreviewOpacity(value);
        // Only emit if there's an applied image (for live sync)
        if (appliedImageData) {
            onOpacityChange(value);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <Animated.View entering={FadeIn.duration(200)} style={styles.controlPanel}>
                    <View style={styles.header}>
                        <Text style={styles.title}>📷 REFERENCE IMAGE</Text>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <X color="white" size={18} />
                        </TouchableOpacity>
                    </View>

                    {!previewUri ? (
                        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                            <ImageIcon color="white" size={28} />
                            <Text style={styles.uploadText}>UPLOAD IMAGE</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.controlsContainer}>
                            <View style={styles.previewRow}>
                                <Image source={{ uri: previewUri }} style={styles.previewImage} />
                                <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
                                    <Text style={styles.changeBtnText}>CHANGE</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.sliderContainer}>
                                <Text style={styles.sliderLabel}>OPACITY: {Math.round(previewOpacity * 100)}%</Text>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0.1}
                                    maximumValue={0.6}
                                    value={previewOpacity}
                                    onValueChange={handleOpacityChange}
                                    minimumTrackTintColor={Colors.spiderBlue}
                                    maximumTrackTintColor="#666"
                                    thumbTintColor={Colors.spiderYellow}
                                />
                                <View style={styles.sliderHints}>
                                    <Text style={styles.hintText}>Faint</Text>
                                    <Text style={styles.hintText}>Visible</Text>
                                </View>
                            </View>

                            <View style={styles.actionButtons}>
                                <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                                    <X color="white" size={18} />
                                    <Text style={styles.clearBtnText}>REMOVE</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.applyBtn, isLoading && styles.applyBtnDisabled]}
                                    onPress={handleApply}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <>
                                            <Check color="white" size={18} />
                                            <Text style={styles.applyBtnText}>APPLY FOR ALL</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.note}>
                                ⚡ Applied images are visible to all users in the room!
                            </Text>
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    controlPanel: {
        width: '90%',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderRadius: 8,
        borderWidth: 3,
        borderColor: Colors.spiderBlue,
        padding: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 18,
        color: 'white',
    },
    closeBtn: {
        backgroundColor: Colors.spiderRed,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.spiderBlue,
        padding: 20,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'white',
        gap: 12,
    },
    uploadText: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 20,
        color: 'white',
    },
    controlsContainer: {
        gap: 15,
    },
    previewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    previewImage: {
        width: 80,
        height: 80,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'white',
    },
    changeBtn: {
        flex: 1,
        backgroundColor: Colors.spiderViolet,
        padding: 15,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'white',
        alignItems: 'center',
    },
    changeBtnText: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 16,
        color: 'white',
    },
    sliderContainer: {
        marginTop: 5,
    },
    sliderLabel: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 14,
        color: Colors.spiderYellow,
        marginBottom: 5,
    },
    slider: {
        width: '100%',
        height: 35,
    },
    sliderHints: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -5,
    },
    hintText: {
        color: '#888',
        fontSize: 11,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    clearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        flex: 1,
        backgroundColor: Colors.spiderRed,
        padding: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'white',
    },
    clearBtnText: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 14,
        color: 'white',
    },
    applyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        flex: 2,
        backgroundColor: Colors.spiderGreen,
        padding: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'white',
    },
    applyBtnDisabled: {
        opacity: 0.6,
    },
    applyBtnText: {
        fontFamily: 'Bangers_400Regular',
        fontSize: 14,
        color: 'white',
    },
    note: {
        textAlign: 'center',
        color: '#888',
        fontSize: 11,
        marginTop: 5,
    },
});
