import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';

type Styles = Record<string, any>;

interface Props {
    visible: boolean;
    password: string;
    styles: Styles;
    onChangePassword: (val: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function DeleteAccountModal({
                                               visible,
                                               password,
                                               styles,
                                               onChangePassword,
                                               onCancel,
                                               onConfirm,
                                           }: Props) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Confirmation requise</Text>
                    <Text style={styles.modalDescription}>
                        Pour supprimer votre compte, veuillez entrer votre mot de passe :
                    </Text>

                    <TextInput
                        style={styles.passwordInput}
                        placeholder="Mot de passe"
                        secureTextEntry
                        value={password}
                        onChangeText={onChangePassword}
                        autoFocus
                    />

                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={styles.cancelModalButton} onPress={onCancel}>
                            <Text style={styles.cancelModalButtonText}>Annuler</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.deleteModalButton} onPress={onConfirm}>
                            <Text style={styles.deleteModalButtonText}>Supprimer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
