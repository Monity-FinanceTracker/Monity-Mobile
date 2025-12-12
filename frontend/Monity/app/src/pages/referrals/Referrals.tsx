import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Share,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../../constants/colors";
import { apiService } from "../../services/apiService";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { triggerHaptic } from "../../utils/haptics";
import Card from "../../components/molecules/Card";
import {
  ArrowLeft,
  Copy,
  Share2,
  MessageCircle,
  Gift,
  TrendingUp,
  Users,
  Award,
  QrCode,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";

interface ReferralData {
  referralCode: string;
  shortLink: string;
  fullLink: string;
  shortUrl: string;
  qrCodeUrl: string;
  stats: {
    totalReferrals: number;
    successfulReferrals: number;
    pendingReferrals: number;
    totalDaysEarned: number;
    lifetimeCapRemaining: number;
  };
}

export default function Referrals() {
  const colors = COLORS;
  const navigation = useNavigation();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyReferralCode();
      if (response.success && response.data) {
        setReferralData(response.data);
      } else {
        Alert.alert("Erro", response.error || "Falha ao carregar dados");
      }
    } catch (error) {
      console.error("Error loading referral data:", error);
      Alert.alert("Erro", "Falha ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const { refreshControl } = usePullToRefresh({
    onRefresh: loadData,
  });

  const handleCopyCode = async () => {
    if (!referralData) return;

    try {
      triggerHaptic();
      await Clipboard.setStringAsync(referralData.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      Alert.alert("Sucesso", "Código copiado!");
    } catch (error) {
      console.error("Failed to copy:", error);
      Alert.alert("Erro", "Falha ao copiar código");
    }
  };

  const handleCopyLink = async () => {
    if (!referralData) return;

    try {
      triggerHaptic();
      await Clipboard.setStringAsync(referralData.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      Alert.alert("Sucesso", "Link copiado!");
    } catch (error) {
      console.error("Failed to copy link:", error);
      Alert.alert("Erro", "Falha ao copiar link");
    }
  };

  const handleShareWhatsApp = async () => {
    if (!referralData) return;

    try {
      triggerHaptic();
      const message = `Olá! 👋\n\nEstou usando o Monity para organizar minhas finanças e está sendo incrível! 💰\n\nUse meu código ${referralData.referralCode} no cadastro e ganhe 7 dias GRÁTIS de Premium!\n\n👉 Link direto: ${referralData.shortUrl}\n\nVocê vai conseguir:\n✅ Orçamentos ilimitados\n✅ Metas de economia ilimitadas\n✅ Assistente AI sem limites\n\nBora organizar as finanças juntos? 🚀`;

      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web WhatsApp
        const webUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error("Failed to share via WhatsApp:", error);
      Alert.alert("Erro", "Falha ao compartilhar via WhatsApp");
    }
  };

  const handleShareSMS = async () => {
    if (!referralData) return;

    try {
      triggerHaptic();
      const message = `Ei! Use meu código ${referralData.referralCode} no Monity e ganhe 7 dias GRÁTIS de Premium! 🎁\n👉 ${referralData.shortUrl}`;

      const smsUrl = `sms:?&body=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(smsUrl);
      
      if (canOpen) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert("Erro", "Não foi possível abrir o aplicativo de mensagens");
      }
    } catch (error) {
      console.error("Failed to share via SMS:", error);
      Alert.alert("Erro", "Falha ao compartilhar via SMS");
    }
  };

  const handleShare = async () => {
    if (!referralData) return;

    try {
      triggerHaptic();
      const result = await Share.share({
        message: `Use meu código ${referralData.referralCode} no Monity e ganhe 7 dias GRÁTIS de Premium! 🎁\n👉 ${referralData.shortUrl}`,
        url: referralData.shortUrl,
      });
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  const getTierInfo = (stats: ReferralData["stats"]) => {
    const successfulRefs = stats.successfulReferrals || 0;

    if (successfulRefs === 0) {
      return {
        currentTier: "Tier 1",
        currentReward: "14 dias",
        nextTier: "Tier 2",
        nextReward: "7 dias por amigo",
        refsNeeded: 1,
        progress: 0,
      };
    } else if (successfulRefs <= 3) {
      return {
        currentTier: "Tier 2",
        currentReward: "7 dias por amigo",
        nextTier: "Tier 3",
        nextReward: "5 dias por amigo",
        refsNeeded: 4 - successfulRefs,
        progress: (successfulRefs / 4) * 100,
      };
    } else if (successfulRefs <= 8) {
      return {
        currentTier: "Tier 3",
        currentReward: "5 dias por amigo",
        nextTier: "Tier 4",
        nextReward: "3 dias por amigo",
        refsNeeded: 9 - successfulRefs,
        progress: ((successfulRefs - 4) / 5) * 100,
      };
    } else {
      return {
        currentTier: "Tier 4 (Máximo)",
        currentReward: "3 dias por amigo",
        nextTier: null,
        nextReward: null,
        refsNeeded: 0,
        progress: 100,
      };
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top", "bottom", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center">
          <Text className="text-text-primary">Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!referralData) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top", "bottom", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-text-primary text-center">
            Erro ao carregar dados de indicação
          </Text>
          <Pressable
            onPress={loadData}
            className="mt-4 bg-accent px-6 py-3 rounded-xl"
          >
            <Text className="text-[#191E29] font-semibold">Tentar novamente</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const tierInfo = getTierInfo(referralData.stats);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom", "left", "right"]}
    >
      <ScrollView
        className="flex-1"
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6 pb-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-4">
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  navigation.goBack();
                }}
                className="p-2"
              >
                <ArrowLeft size={20} color={colors.textPrimary} />
              </Pressable>
              <View>
                <Text className="text-text-primary text-2xl font-bold">
                  Indique e Ganhe
                </Text>
                <Text className="text-text-primary text-sm">
                  Ganhe dias de Premium
                </Text>
              </View>
            </View>
          </View>

          {/* Referral Code Card */}
          <Card className="mb-4">
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-text-secondary text-sm mb-1">
                    Seu código de indicação
                  </Text>
                  <Text className="text-text-primary text-3xl font-bold">
                    {referralData.referralCode}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    setShowQR(!showQR);
                  }}
                  className="w-12 h-12 bg-accent/20 rounded-full items-center justify-center"
                >
                  <QrCode size={24} color={colors.accent} />
                </Pressable>
              </View>

              {showQR && (
                <View className="items-center py-4 border-t border-border-default mt-4">
                  <View className="w-[200] h-[200] bg-white items-center justify-center rounded-xl">
                    <Text className="text-text-primary text-xs text-center px-4">
                      QR Code: {referralData.shortUrl}
                    </Text>
                    <Text className="text-text-secondary text-xs mt-2 text-center">
                      (Instale react-native-qrcode-svg para QR visual)
                    </Text>
                  </View>
                </View>
              )}

              <View className="flex-row gap-2 mt-4">
                <Pressable
                  onPress={handleCopyCode}
                  className="flex-1 bg-accent/20 px-4 py-3 rounded-xl flex-row items-center justify-center gap-2"
                >
                  <Copy size={18} color={colors.accent} />
                  <Text
                    style={{ color: colors.accent, fontSize: 14, fontWeight: "600" }}
                  >
                    {copied ? "Copiado!" : "Copiar Código"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleCopyLink}
                  className="flex-1 bg-accent/20 px-4 py-3 rounded-xl flex-row items-center justify-center gap-2"
                >
                  <Copy size={18} color={colors.accent} />
                  <Text
                    style={{ color: colors.accent, fontSize: 14, fontWeight: "600" }}
                  >
                    Copiar Link
                  </Text>
                </Pressable>
              </View>
            </View>
          </Card>

          {/* Share Options */}
          <Card className="mb-4">
            <View className="p-4">
              <Text className="text-text-primary text-lg font-semibold mb-4">
                Compartilhar
              </Text>
              <View className="gap-3">
                <Pressable
                  onPress={handleShareWhatsApp}
                  className="flex-row items-center gap-3 bg-accent/10 px-4 py-3 rounded-xl"
                >
                  <MessageCircle size={24} color={colors.accent} />
                  <Text className="text-text-primary flex-1 font-medium">
                    WhatsApp
                  </Text>
                  <Share2 size={20} color={colors.textSecondary} />
                </Pressable>
                <Pressable
                  onPress={handleShareSMS}
                  className="flex-row items-center gap-3 bg-accent/10 px-4 py-3 rounded-xl"
                >
                  <MessageCircle size={24} color={colors.accent} />
                  <Text className="text-text-primary flex-1 font-medium">
                    SMS
                  </Text>
                  <Share2 size={20} color={colors.textSecondary} />
                </Pressable>
                <Pressable
                  onPress={handleShare}
                  className="flex-row items-center gap-3 bg-accent/10 px-4 py-3 rounded-xl"
                >
                  <Share2 size={24} color={colors.accent} />
                  <Text className="text-text-primary flex-1 font-medium">
                    Outros
                  </Text>
                  <Share2 size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>
          </Card>

          {/* Stats */}
          <Card className="mb-4">
            <View className="p-4">
              <Text className="text-text-primary text-lg font-semibold mb-4">
                Suas Estatísticas
              </Text>
              <View className="gap-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Users size={20} color={colors.textSecondary} />
                    <Text className="text-text-secondary">Total de indicações</Text>
                  </View>
                  <Text className="text-text-primary font-semibold">
                    {referralData.stats.totalReferrals}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <TrendingUp size={20} color={colors.success} />
                    <Text className="text-text-secondary">Indicações bem-sucedidas</Text>
                  </View>
                  <Text className="text-text-primary font-semibold">
                    {referralData.stats.successfulReferrals}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Gift size={20} color={colors.accent} />
                    <Text className="text-text-secondary">Dias ganhos</Text>
                  </View>
                  <Text className="text-text-primary font-semibold">
                    {referralData.stats.totalDaysEarned} dias
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Award size={20} color={colors.warning} />
                    <Text className="text-text-secondary">Tier atual</Text>
                  </View>
                  <Text className="text-text-primary font-semibold">
                    {tierInfo.currentTier}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Tier Info */}
          <Card className="mb-4">
            <View className="p-4">
              <Text className="text-text-primary text-lg font-semibold mb-4">
                Sistema de Recompensas
              </Text>
              <View className="gap-3">
                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-text-primary font-medium">
                      {tierInfo.currentTier}
                    </Text>
                    <Text className="text-accent font-semibold">
                      {tierInfo.currentReward}
                    </Text>
                  </View>
                  {tierInfo.nextTier && (
                    <View className="mt-2">
                      <Text className="text-text-secondary text-xs mb-1">
                        Próximo tier: {tierInfo.nextTier} ({tierInfo.nextReward})
                      </Text>
                      <Text className="text-text-secondary text-xs">
                        Faltam {tierInfo.refsNeeded} indicações
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

