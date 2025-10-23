import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Card from "../../components/molecules/Card";
import PaymentForm from "../../components/PaymentForm";
import { apiService, SubscriptionPlan } from "../../services/apiService";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  Check,
  X,
  Crown,
  Star,
  Zap,
  CreditCard,
} from "lucide-react-native";

export default function SubscriptionPlans() {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getSubscriptionPlans();
      if (response.success) {
        setPlans(response.data);
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar planos de assinatura");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") {
      Alert.alert("Informação", "Você já está no plano gratuito");
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    Alert.alert(
      "Assinar Premium",
      `Deseja assinar o plano ${plan.name} por ${formatPrice(plan.price)}/mês?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          onPress: () => {
            setSelectedPlan(plan);
            setShowPaymentForm(true);
          },
        },
      ]
    );
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedPlan(null);
    refreshUser();
    navigation.goBack();
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setSelectedPlan(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const isCurrentPlan = (planId: string) => {
    return user?.subscriptionTier === planId;
  };

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-[#191E29]"
        edges={["top", "bottom", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#01C38D" />
          <Text className="text-white mt-4">Carregando planos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Mostrar formulário de pagamento
  if (showPaymentForm && selectedPlan) {
    return (
      <PaymentForm
        planId={selectedPlan.id}
        planName={selectedPlan.name}
        planPrice={selectedPlan.price}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-[#191E29]"
      edges={["top", "bottom", "left", "right"]}
    >
      <ScrollView className="flex-1">
        <View className="px-6 pt-6 pb-6">
          {/* Header */}
          <View className="flex-row items-center gap-4 mb-6">
            <Pressable onPress={() => navigation.goBack()} className="p-2">
              <ArrowLeft size={20} color="#9CA3AF" />
            </Pressable>
            <Text className="text-white text-xl font-bold">Planos de Assinatura</Text>
          </View>

          {/* Current Status */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="flex-row items-center gap-3 mb-2">
                <Crown size={24} color={user?.subscriptionTier === "premium" ? "#FFD700" : "#9CA3AF"} />
                <Text className="text-white text-lg font-semibold">
                  Plano Atual: {user?.subscriptionTier === "premium" ? "Premium" : "Gratuito"}
                </Text>
              </View>
              {user?.subscriptionTier === "premium" && user?.subscriptionExpiresAt && (
                <Text className="text-gray-400 text-sm">
                  Válido até: {new Date(user.subscriptionExpiresAt).toLocaleDateString("pt-BR")}
                </Text>
              )}
            </View>
          </Card>

          {/* Plans */}
          <View className="gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`${
                  plan.popular ? "border-2 border-[#01C38D]" : ""
                } ${
                  isCurrentPlan(plan.id) ? "bg-[#01C38D]/10" : ""
                }`}
              >
                <View className="p-6">
                  {/* Plan Header */}
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center gap-3">
                      {plan.id === "premium" ? (
                        <Crown size={24} color="#FFD700" />
                      ) : (
                        <Star size={24} color="#9CA3AF" />
                      )}
                      <View>
                        <Text className="text-white text-xl font-bold">
                          {plan.name}
                        </Text>
                        <Text className="text-gray-400 text-sm">
                          {plan.id === "free" ? "Para sempre" : "Por mês"}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-white text-2xl font-bold">
                        {formatPrice(plan.price)}
                      </Text>
                      {plan.popular && (
                        <View className="bg-[#01C38D] px-2 py-1 rounded-full mt-1">
                          <Text className="text-[#191E29] text-xs font-bold">
                            MAIS POPULAR
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Features */}
                  <View className="mb-6">
                    <Text className="text-white font-semibold mb-3">Recursos incluídos:</Text>
                    <View className="gap-2">
                      {plan.features.map((feature, index) => (
                        <View key={index} className="flex-row items-center gap-3">
                          <Check size={16} color="#01C38D" />
                          <Text className="text-gray-300 text-sm flex-1">
                            {feature}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Limitations (only for free plan) */}
                  {plan.limitations && plan.limitations.length > 0 && (
                    <View className="mb-6">
                      <Text className="text-gray-400 font-semibold mb-3">Limitações:</Text>
                      <View className="gap-2">
                        {plan.limitations.map((limitation, index) => (
                          <View key={index} className="flex-row items-center gap-3">
                            <X size={16} color="#EF4444" />
                            <Text className="text-gray-500 text-sm flex-1">
                              {limitation}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Action Button */}
                  <Pressable
                    onPress={() => handleSubscribe(plan.id)}
                    disabled={isSubscribing || isCurrentPlan(plan.id)}
                    className={`w-full py-4 rounded-xl flex-row items-center justify-center gap-2 ${
                      isCurrentPlan(plan.id)
                        ? "bg-gray-600"
                        : plan.id === "premium"
                        ? "bg-[#01C38D]"
                        : "bg-[#31344d] border border-[#4B5563]"
                    }`}
                  >
                    {isSubscribing ? (
                      <ActivityIndicator size="small" color="#191E29" />
                    ) : (
                      <>
                        {plan.id === "premium" && !isCurrentPlan(plan.id) ? (
                          <CreditCard size={20} color="#191E29" />
                        ) : plan.id === "premium" ? (
                          <Zap size={20} color="#191E29" />
                        ) : null}
                        <Text
                          className={`font-bold ${
                            plan.id === "premium" && !isCurrentPlan(plan.id)
                              ? "text-[#191E29]"
                              : "text-white"
                          }`}
                        >
                          {isCurrentPlan(plan.id)
                            ? "Plano Atual"
                            : plan.id === "free"
                            ? "Plano Gratuito"
                            : "Assinar Premium"}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>

          {/* Benefits Section */}
          <Card className="mt-6">
            <View className="p-4">
              <Text className="text-white text-lg font-semibold mb-4">
                Por que escolher o Premium?
              </Text>
              <View className="gap-3">
                <View className="flex-row items-center gap-3">
                  <Zap size={20} color="#01C38D" />
                  <Text className="text-gray-300 flex-1">
                    IA avançada para categorização automática de transações
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Zap size={20} color="#01C38D" />
                  <Text className="text-gray-300 flex-1">
                    Projeções financeiras inteligentes para planejamento
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Zap size={20} color="#01C38D" />
                  <Text className="text-gray-300 flex-1">
                    Relatórios detalhados e análises avançadas
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Zap size={20} color="#01C38D" />
                  <Text className="text-gray-300 flex-1">
                    Backup automático na nuvem para segurança total
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
