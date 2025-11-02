import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { X, Camera as CameraIcon, Mic } from "lucide-react-native";
import { COLORS } from "../constants/colors";

interface CameraAudioModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CameraAudioModal({
  visible,
  onClose,
}: CameraAudioModalProps) {
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Solicitar permissões ao montar o componente
    (async () => {
      if (visible) {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: audioStatus } = await Audio.requestPermissionsAsync();
        
        setCameraPermission(cameraStatus === "granted");
        setAudioPermission(audioStatus === "granted");
      }
    })();
  }, [visible]);

  const handleCameraPress = async () => {
    if (!cameraPermission) {
      Alert.alert(
        "Permissão Necessária",
        "Por favor, conceda permissão para usar a câmera nas configurações do aplicativo."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        console.log("Foto tirada:", photo.uri);
        Alert.alert("Sucesso", "Foto capturada com sucesso!");
        onClose();
      }
    } catch (error) {
      console.error("Erro ao tirar foto:", error);
      Alert.alert("Erro", "Não foi possível tirar a foto.");
    }
  };

  const handleAudioPress = async () => {
    if (!audioPermission) {
      Alert.alert(
        "Permissão Necessária",
        "Por favor, conceda permissão para usar o microfone nas configurações do aplicativo."
      );
      return;
    }

    try {
      if (isRecording) {
        // Parar gravação
        if (recording) {
          await recording.stopAndUnloadAsync();
          const uri = recording.getURI();
          console.log("Áudio gravado:", uri);
          setIsRecording(false);
          setRecording(null);
          Alert.alert("Sucesso", "Áudio gravado com sucesso!");
          onClose();
        }
      } else {
        // Iniciar gravação
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        setRecording(newRecording);
        setIsRecording(true);
      }
    } catch (error) {
      console.error("Erro ao gravar áudio:", error);
      Alert.alert("Erro", "Não foi possível gravar o áudio.");
      setIsRecording(false);
      setRecording(null);
    }
  };

  // Limpar ao fechar o modal
  useEffect(() => {
    if (!visible && recording) {
      recording.stopAndUnloadAsync();
      setRecording(null);
      setIsRecording(false);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View
          style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: 24,
            padding: 24,
            width: "85%",
            maxWidth: 400,
            borderWidth: 1,
            borderColor: COLORS.border,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                color: COLORS.textPrimary,
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              Nova Transação
            </Text>
            <Pressable onPress={onClose}>
              <X size={24} color={COLORS.textMuted} />
            </Pressable>
          </View>

          {/* Opções */}
          <View style={{ gap: 16 }}>
            {/* Câmera */}
            <Pressable
              onPress={handleCameraPress}
              disabled={!cameraPermission}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderRadius: 16,
                backgroundColor: COLORS.accentLight,
                borderWidth: 1,
                borderColor: COLORS.accent,
                opacity: cameraPermission ? 1 : 0.5,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: COLORS.accent,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 16,
                }}
              >
                <CameraIcon size={24} color={COLORS.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: COLORS.textPrimary,
                    fontSize: 16,
                    fontWeight: "600",
                    marginBottom: 4,
                  }}
                >
                  Tirar Foto
                </Text>
                <Text
                  style={{
                    color: COLORS.textMuted,
                    fontSize: 14,
                  }}
                >
                  Capturar comprovante ou nota fiscal
                </Text>
              </View>
            </Pressable>

            {/* Áudio */}
            <Pressable
              onPress={handleAudioPress}
              disabled={!audioPermission}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderRadius: 16,
                backgroundColor: COLORS.accentLight,
                borderWidth: 1,
                borderColor: COLORS.accent,
                opacity: audioPermission ? 1 : 0.5,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isRecording ? COLORS.error : COLORS.accent,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 16,
                }}
              >
                <Mic size={24} color={COLORS.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: COLORS.textPrimary,
                    fontSize: 16,
                    fontWeight: "600",
                    marginBottom: 4,
                  }}
                >
                  {isRecording ? "Parar Gravação" : "Gravar Áudio"}
                </Text>
                <Text
                  style={{
                    color: COLORS.textMuted,
                    fontSize: 14,
                  }}
                >
                  {isRecording
                    ? "Toque novamente para parar"
                    : "Registrar transação por voz"}
                </Text>
              </View>
              {isRecording && (
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: COLORS.error,
                    marginLeft: 8,
                  }}
                />
              )}
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
}

