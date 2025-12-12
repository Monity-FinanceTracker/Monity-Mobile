import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Share,
} from "react-native";
import { COLORS } from "../../constants/colors";
import { apiService } from "../../services/apiService";
import { triggerHaptic } from "../../utils/haptics";
import { X, Share2, Mail, Copy } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  onSuccess: () => void;
}

export default function InviteModal({
  visible,
  onClose,
  groupId,
  groupName,
  onSuccess,
}: InviteModalProps) {
  const colors = COLORS;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);

  // Generate invite link from backend
  const generateInviteLink = async () => {
    try {
      setGeneratingLink(true);
      const response = await apiService.sendGroupInvitation(groupId, "");
      
      if (response.success && response.data?.invitationLink) {
        setInviteLink(response.data.invitationLink);
      } else {
        Alert.alert("Erro", response.error || "Falha ao gerar link de convite");
      }
    } catch (error) {
      console.error("Error generating invite link:", error);
      Alert.alert("Erro", "Erro ao gerar link de convite");
    } finally {
      setGeneratingLink(false);
    }
  };

  React.useEffect(() => {
    if (visible && !inviteLink) {
      generateInviteLink();
    }
  }, [visible, groupId]);

  const handleEmailInvite = async () => {
    if (!email || !email.includes("@")) {
      Alert.alert("Erro", "Por favor, informe um email válido");
      return;
    }

    try {
      setLoading(true);
      triggerHaptic();

      const response = await apiService.sendGroupInvitation(groupId, email);

      if (response.success) {
        Alert.alert("Sucesso", "Convite enviado com sucesso!");
        setEmail("");
        onSuccess();
        onClose();
      } else {
        Alert.alert("Erro", response.error || "Falha ao enviar convite");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      Alert.alert("Erro", "Erro ao enviar convite");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      triggerHaptic();
      await Clipboard.setStringAsync(inviteLink);
      Alert.alert("Sucesso", "Link copiado para a área de transferência!");
    } catch (error) {
      Alert.alert("Erro", "Falha ao copiar link");
    }
  };

  const handleShare = async () => {
    try {
      triggerHaptic();
      await Share.share({
        message: `Junte-se ao grupo "${groupName}" no Monity: ${inviteLink}`,
        title: `Convite para ${groupName}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-text-primary text-xl font-bold">
                Convidar para Grupo
              </Text>
              <Pressable onPress={onClose} className="p-2">
                <X size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <View className="gap-4">
              {/* Email Invite */}
              <View>
                <Text className="text-text-primary font-semibold mb-2">
                  Enviar por Email
                </Text>
                <View className="flex-row gap-2">
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="email@exemplo.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="flex-1 bg-card-bg text-text-primary px-4 py-3 rounded-xl border border-border-default"
                  />
                  <Pressable
                    onPress={handleEmailInvite}
                    disabled={loading}
                    className={`bg-accent px-6 py-3 rounded-xl items-center justify-center ${
                      loading ? "opacity-50" : ""
                    }`}
                  >
                    <Mail size={20} color="#191E29" />
                  </Pressable>
                </View>
              </View>

              {/* Share Link */}
              <View>
                <Text className="text-text-primary font-semibold mb-2">
                  Compartilhar Link
                </Text>
                <View className="bg-card-bg p-4 rounded-xl border border-border-default mb-3">
                  <Text className="text-text-secondary text-xs mb-1">
                    Link de Convite
                  </Text>
                  {generatingLink ? (
                    <Text className="text-text-secondary text-sm">
                      Gerando link...
                    </Text>
                  ) : inviteLink ? (
                    <Text className="text-text-primary text-sm" numberOfLines={1}>
                      {inviteLink}
                    </Text>
                  ) : (
                    <Text className="text-text-secondary text-sm">
                      Clique para gerar link
                    </Text>
                  )}
                </View>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={handleCopyLink}
                    className="flex-1 bg-card-bg border border-border-default py-3 rounded-xl flex-row items-center justify-center gap-2"
                  >
                    <Copy size={18} color={colors.textPrimary} />
                    <Text className="text-text-primary font-semibold">
                      Copiar
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleShare}
                    className="flex-1 bg-accent py-3 rounded-xl flex-row items-center justify-center gap-2"
                  >
                    <Share2 size={18} color="#191E29" />
                    <Text className="text-[#191E29] font-semibold">
                      Compartilhar
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

