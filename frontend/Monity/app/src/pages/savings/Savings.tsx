import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Card from "../../components/molecules/Card";
import { COLORS } from "../../constants/colors";
import { apiService, Balance } from "../../services/apiService";
import { useAuth } from "../../context/AuthContext";
import {
  Plus,
  ArrowLeft,
  X,
  TrendingUp,
  TrendingDown,
  Wallet,
  Trash2,
  Calendar,
  Crown,
  Target,
} from "lucide-react-native";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { triggerHaptic } from "../../utils/haptics";

interface SavingsGoal {
  id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  created_at: string;
}

export default function Savings() {
  const colors = COLORS;
  const navigation = useNavigation();
  const { user } = useAuth();
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState<SavingsGoal | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState<SavingsGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({
    goal_name: "",
    target_amount: "",
    target_date: null as Date | null,
  });
  const [amount, setAmount] = useState("");
  const [useBalance, setUseBalance] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const subscriptionTier = user?.subscriptionTier || "free";
  const isPremium = subscriptionTier === "premium";
  const FREE_TIER_GOAL_LIMIT = 3;
  const isLimited = !isPremium && savingsGoals.length >= FREE_TIER_GOAL_LIMIT;

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "R$ 0,00";
    }
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [goalsResponse, balanceResponse] = await Promise.all([
        apiService.getSavingsGoals(),
        apiService.getBalance(),
      ]);

      if (goalsResponse.success && goalsResponse.data) {
        setSavingsGoals(goalsResponse.data);
      }

      if (balanceResponse.success && balanceResponse.data) {
        setBalance(balanceResponse.data);
      }
    } catch (error) {
      console.error("Error loading savings data:", error);
      Alert.alert("Erro", "Falha ao carregar dados");
    } finally {
      setIsLoading(false);
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

  const handleCreateGoal = async () => {
    if (isLimited) {
      Alert.alert(
        "Limite Atingido",
        `Usuários gratuitos podem criar até ${FREE_TIER_GOAL_LIMIT} metas de economia. Assine o Premium para criar metas ilimitadas!`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Assinar Premium",
            onPress: () => navigation.navigate("SubscriptionPlans" as never),
          },
        ]
      );
      return;
    }

    if (!newGoal.goal_name || !newGoal.target_amount || !newGoal.target_date) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    try {
      const numericAmount = parseFloat(
        newGoal.target_amount.replace(/\./g, "").replace(",", ".")
      );

      if (isNaN(numericAmount) || numericAmount <= 0) {
        Alert.alert("Erro", "Valor alvo deve ser maior que zero");
        return;
      }

      if (!newGoal.target_date) {
        Alert.alert("Erro", "Por favor, selecione uma data alvo");
        return;
      }

      const dateString = `${newGoal.target_date.getFullYear()}-${String(newGoal.target_date.getMonth() + 1).padStart(2, "0")}-${String(newGoal.target_date.getDate()).padStart(2, "0")}`;

      const response = await apiService.createSavingsGoal({
        goal_name: newGoal.goal_name,
        target_amount: numericAmount,
        target_date: dateString,
        current_amount: 0,
      });

      if (response.success) {
        Alert.alert("Sucesso", "Poupança criada com sucesso!");
        setShowCreateModal(false);
        setNewGoal({ goal_name: "", target_amount: "", target_date: null });
        setShowDatePicker(false);
        loadData();
      } else {
        Alert.alert("Erro", response.error || "Falha ao criar poupança");
      }
    } catch (error) {
      console.error("Error creating goal:", error);
      Alert.alert("Erro", "Erro ao criar poupança");
    }
  };

  const handleAddMoney = async () => {
    if (!showAddModal || !amount) {
      return;
    }

    try {
      const numericAmount = parseFloat(
        amount.replace(/\./g, "").replace(",", ".")
      );

      if (isNaN(numericAmount) || numericAmount <= 0) {
        Alert.alert("Erro", "Valor deve ser maior que zero");
        return;
      }

      if (useBalance && balance && numericAmount > balance.total) {
        Alert.alert("Erro", "Saldo insuficiente");
        return;
      }

      // If adding new money (not from balance), create an income transaction
      if (!useBalance) {
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        
        const incomeResponse = await apiService.addIncome({
          description: `Depósito na poupança: ${showAddModal.goal_name}`,
          amount: numericAmount,
          category: "Poupança",
          date: dateString,
        });

        if (!incomeResponse.success) {
          Alert.alert("Erro", "Falha ao criar transação");
          return;
        }
      } else {
        // If using balance, create an expense transaction to move money
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        
        const expenseResponse = await apiService.addExpense({
          description: `Transferência para poupança: ${showAddModal.goal_name}`,
          amount: -numericAmount,
          category: "Poupança",
          date: dateString,
        });

        if (!expenseResponse.success) {
          Alert.alert("Erro", "Falha ao criar transação");
          return;
        }
      }

      const response = await apiService.allocateToSavingsGoal(
        showAddModal.id,
        numericAmount
      );

      if (response.success) {
        Alert.alert("Sucesso", "Dinheiro adicionado com sucesso!");
        setShowAddModal(null);
        setAmount("");
        setUseBalance(false);
        loadData();
        // Always reload balance
        const balanceResponse = await apiService.getBalance();
        if (balanceResponse.success && balanceResponse.data) {
          setBalance(balanceResponse.data);
        }
      } else {
        Alert.alert("Erro", response.error || "Falha ao adicionar dinheiro");
      }
    } catch (error) {
      console.error("Error adding money:", error);
      Alert.alert("Erro", "Erro ao adicionar dinheiro");
    }
  };

  const handleWithdrawMoney = async () => {
    if (!showWithdrawModal || !amount) {
      return;
    }

    try {
      const numericAmount = parseFloat(
        amount.replace(/\./g, "").replace(",", ".")
      );

      if (isNaN(numericAmount) || numericAmount <= 0) {
        Alert.alert("Erro", "Valor deve ser maior que zero");
        return;
      }

      if (numericAmount > showWithdrawModal.current_amount) {
        Alert.alert("Erro", "Valor maior que o disponível na poupança");
        return;
      }

      const response = await apiService.withdrawFromSavingsGoal(
        showWithdrawModal.id,
        numericAmount
      );

      if (response.success) {
        // If adding to balance, create an income transaction
        if (useBalance) {
          const today = new Date();
          const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          
          const incomeResponse = await apiService.addIncome({
            description: `Retirada da poupança: ${showWithdrawModal.goal_name}`,
            amount: numericAmount,
            category: "Poupança",
            date: dateString,
          });

          if (!incomeResponse.success) {
            console.error("Failed to create income transaction");
          }
        }

        Alert.alert("Sucesso", "Dinheiro retirado com sucesso!");
        setShowWithdrawModal(null);
        setAmount("");
        setUseBalance(false);
        loadData();
        // Always reload balance
        const balanceResponse = await apiService.getBalance();
        if (balanceResponse.success && balanceResponse.data) {
          setBalance(balanceResponse.data);
        }
      } else {
        Alert.alert("Erro", response.error || "Falha ao retirar dinheiro");
      }
    } catch (error) {
      console.error("Error withdrawing money:", error);
      Alert.alert("Erro", "Erro ao retirar dinheiro");
    }
  };

  const handleDeleteGoal = async (goalId: string, goalName: string) => {
    Alert.alert(
      "Confirmar exclusão",
      `Tem certeza que deseja excluir a poupança "${goalName}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await apiService.deleteSavingsGoal(goalId);
              if (response.success) {
                Alert.alert("Sucesso", "Poupança excluída com sucesso!");
                loadData();
              } else {
                Alert.alert("Erro", response.error || "Falha ao excluir poupança");
              }
            } catch (error) {
              console.error("Error deleting goal:", error);
              Alert.alert("Erro", "Erro ao excluir poupança");
            }
          },
        },
      ]
    );
  };

  const getProgressPercentage = (goal: SavingsGoal) => {
    if (goal.target_amount === 0) return 0;
    const percentage = (goal.current_amount / goal.target_amount) * 100;
    return Math.min(percentage, 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

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
                <Text className="text-text-primary text-2xl font-bold">Poupança</Text>
                <Text className="text-text-primary text-sm">
                  Gerencie suas economias
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                triggerHaptic();
                if (isLimited) {
                  Alert.alert(
                    "Limite Atingido",
                    `Usuários gratuitos podem criar até ${FREE_TIER_GOAL_LIMIT} metas. Assine o Premium para criar metas ilimitadas!`,
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Assinar Premium",
                        onPress: () => navigation.navigate("SubscriptionPlans" as never),
                      },
                    ]
                  );
                } else {
                  setShowCreateModal(true);
                }
              }}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isLimited ? "bg-card-bg" : "bg-accent"
              }`}
            >
              <Plus size={20} color={isLimited ? colors.textSecondary : "#191E29"} />
            </Pressable>
          </View>

          {/* Savings Goals List */}
          {isLoading ? (
            <View className="items-center py-8">
              <Text className="text-text-primary">Carregando...</Text>
            </View>
          ) : savingsGoals.length === 0 ? (
            <View className="items-center py-12">
              <View className="w-16 h-16 bg-accent/20 rounded-full items-center justify-center mb-4">
                <Wallet size={32} color="#F5F0E6" />
              </View>
              <Text className="text-text-primary text-base font-semibold mb-2">
                Nenhuma poupança ainda
              </Text>
              <Text className="text-text-primary text-center mb-4 text-sm">
                Comece criando sua primeira poupança!
              </Text>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  if (isLimited) {
                    Alert.alert(
                      "Limite Atingido",
                      `Usuários gratuitos podem criar até ${FREE_TIER_GOAL_LIMIT} metas. Assine o Premium para criar metas ilimitadas!`,
                      [
                        { text: "Cancelar", style: "cancel" },
                        {
                          text: "Assinar Premium",
                          onPress: () => navigation.navigate("SubscriptionPlans" as never),
                        },
                      ]
                    );
                  } else {
                    setShowCreateModal(true);
                  }
                }}
                className={`px-6 py-3 rounded-xl ${
                  isLimited ? "bg-card-bg border border-accent" : "bg-accent"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    isLimited ? "text-accent" : "text-[#191E29]"
                  }`}
                >
                  {isLimited ? "Assinar Premium" : "Criar Poupança"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-4">
              {savingsGoals.map((goal) => {
                const progress = getProgressPercentage(goal);
                return (
                  <Card key={goal.id} className="mb-4">
                    <View className="p-4">
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1">
                          <Text className="text-text-primary text-lg font-semibold mb-1">
                            {goal.goal_name}
                          </Text>
                          <Text className="text-text-primary text-xs">
                            Meta: {formatDate(goal.target_date)}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => {
                            triggerHaptic();
                            handleDeleteGoal(goal.id, goal.goal_name);
                          }}
                          className="w-8 h-8 items-center justify-center"
                        >
                          <Trash2 size={18} color="#EF4444" />
                        </Pressable>
                      </View>

                      {/* Progress Bar */}
                      <View className="mb-4">
                        <View className="h-3 bg-white/10 rounded-full overflow-hidden">
                          <View
                            className="h-full bg-accent rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </View>
                        <View className="flex-row justify-between mt-2">
                          <Text className="text-text-primary text-xs">
                            {formatCurrency(goal.current_amount)} de{" "}
                            {formatCurrency(goal.target_amount)}
                          </Text>
                          <Text className="text-text-primary text-xs">
                            {progress.toFixed(0)}%
                          </Text>
                        </View>
                        {/* Target Date Info */}
                        {goal.target_date && (
                          <View className="flex-row items-center gap-1 mt-2">
                            <Target size={12} color={colors.textSecondary} />
                            <Text className="text-text-secondary text-xs">
                              Meta: {formatDate(goal.target_date)}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Action Buttons */}
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => {
                            triggerHaptic();
                            setShowAddModal(goal);
                            setAmount("");
                            setUseBalance(false);
                          }}
                          className="flex-1 bg-white/10 px-4 py-2 rounded-lg flex-row items-center justify-center gap-2"
                        >
                          <TrendingUp size={16} color={colors.income} />
                          <Text style={{ color: colors.income, fontSize: 14, fontWeight: '500' }}>
                            Adicionar
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            triggerHaptic();
                            setShowWithdrawModal(goal);
                            setAmount("");
                            setUseBalance(false);
                          }}
                          className="flex-1 bg-white/10 px-4 py-2 rounded-lg flex-row items-center justify-center gap-2"
                          disabled={goal.current_amount === 0}
                        >
                          <TrendingDown 
                            size={16} 
                            color={goal.current_amount === 0 ? "#6B7280" : "#EF4444"} 
                          />
                          <Text
                            className={`text-sm font-medium ${
                              goal.current_amount === 0
                                ? "text-text-primary"
                                : "text-text-primary"
                            }`}
                          >
                            Retirar
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Premium Limit Banner */}
      {isLimited && savingsGoals.length > 0 && (
        <View className="px-6 pb-4">
          <Card className="p-4 bg-accent/10 border border-accent">
            <View className="flex-row items-center gap-3">
              <Crown size={24} color={colors.accent} />
              <View className="flex-1">
                <Text className="text-text-primary font-semibold">
                  Limite de Metas Atingido
                </Text>
                <Text className="text-text-secondary text-xs mt-1">
                  Assine o Premium para criar metas ilimitadas
                </Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate("SubscriptionPlans" as never)}
                className="bg-accent px-4 py-2 rounded-lg"
              >
                <Text className="text-[#191E29] font-semibold text-xs">
                  Assinar
                </Text>
              </Pressable>
            </View>
          </Card>
        </View>
      )}

      {/* Create Goal Modal */}
      <Modal
        visible={showCreateModal && !isLimited}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-background rounded-t-3xl max-h-[90%]">
              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 24 }}
              >
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-text-primary text-xl font-bold">
                    Nova Poupança
                  </Text>
                  <Pressable
                    onPress={() => {
                      setShowCreateModal(false);
                      setNewGoal({ goal_name: "", target_amount: "", target_date: null });
                      setShowDatePicker(false);
                    }}
                    className="w-8 h-8 bg-card-bg rounded-full items-center justify-center"
                  >
                    <X size={16} color="#F5F0E6" />
                  </Pressable>
                </View>

                <View className="gap-4">
              <View>
                <Text className="text-text-primary text-sm mb-2">Nome da Poupança</Text>
                <TextInput
                  value={newGoal.goal_name}
                  onChangeText={(text) =>
                    setNewGoal({ ...newGoal, goal_name: text })
                  }
                  placeholder="Ex: Reserva de Emergência"
                  placeholderTextColor="#6B7280"
                  className="bg-card-bg text-text-primary px-4 py-3 rounded-xl"
                />
              </View>

              <View>
                <Text className="text-text-primary text-sm mb-2">Valor Alvo</Text>
                <TextInput
                  value={newGoal.target_amount}
                  onChangeText={(text) =>
                    setNewGoal({ ...newGoal, target_amount: text })
                  }
                  placeholder="0,00"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  className="bg-card-bg text-text-primary px-4 py-3 rounded-xl"
                />
              </View>

              <View>
                <Text className="text-text-primary text-sm mb-2">Data Alvo</Text>
                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    setShowDatePicker(true);
                  }}
                  className="bg-card-bg border border-border-default rounded-xl px-4 py-3 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-2">
                    <Calendar size={20} color={colors.textMuted} />
                    <Text style={{ color: newGoal.target_date ? colors.textPrimary : colors.textMuted, fontSize: 14 }}>
                      {newGoal.target_date
                        ? newGoal.target_date.toLocaleDateString("pt-BR")
                        : "Selecionar data"}
                    </Text>
                  </View>
                  {newGoal.target_date && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setNewGoal({ ...newGoal, target_date: null });
                      }}
                    >
                      <X size={16} color={colors.textMuted} />
                    </Pressable>
                  )}
                </Pressable>
                {showCreateModal && showDatePicker && (
                  <>
                    <DateTimePicker
                      value={newGoal.target_date || new Date()}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(event, selectedDate) => {
                        if (Platform.OS === "android") {
                          setShowDatePicker(false);
                          if (event.type === "set" && selectedDate) {
                            setNewGoal({ ...newGoal, target_date: selectedDate });
                          }
                        } else {
                          // iOS
                          if (selectedDate) {
                            setNewGoal({ ...newGoal, target_date: selectedDate });
                          }
                        }
                      }}
                      locale="pt-BR"
                    />
                    {Platform.OS === "ios" && (
                      <Pressable
                        onPress={() => setShowDatePicker(false)}
                        className="bg-accent rounded-xl p-3 mt-3"
                      >
                        <Text style={{ color: "#191E29", fontWeight: "600", fontSize: 16, textAlign: "center" }}>
                          Concluído
                        </Text>
                      </Pressable>
                    )}
                  </>
                )}
              </View>

              <Pressable
                onPress={() => {
                  triggerHaptic();
                  handleCreateGoal();
                }}
                className="bg-accent py-4 rounded-xl items-center"
              >
                <Text className="text-[#191E29] font-semibold text-base">
                  Criar Poupança
                </Text>
              </Pressable>
                </View>
              </ScrollView>
            </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Money Modal */}
      <Modal
        visible={showAddModal !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAddModal(null);
          setAmount("");
          setUseBalance(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-background rounded-t-3xl max-h-[90%]">
              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 24 }}
              >
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-text-primary text-xl font-bold">
                    Adicionar Dinheiro
                  </Text>
                  <Pressable
                    onPress={() => {
                      setShowAddModal(null);
                      setAmount("");
                      setUseBalance(false);
                    }}
                    className="w-8 h-8 bg-card-bg rounded-full items-center justify-center"
                  >
                    <X size={16} color="#F5F0E6" />
                  </Pressable>
                </View>

                {showAddModal && (
                  <View className="gap-4">
                <View>
                  <Text className="text-text-primary text-sm mb-2">
                    Poupança: {showAddModal.goal_name}
                  </Text>
                </View>

                <View>
                  <Text className="text-text-primary text-sm mb-2">Valor</Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0,00"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    className="bg-card-bg text-text-primary px-4 py-3 rounded-xl"
                  />
                </View>

                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    setUseBalance(!useBalance);
                  }}
                  className="flex-row items-center gap-3 p-4 bg-card-bg rounded-xl"
                >
                  <View
                    className={`w-5 h-5 rounded border-2 items-center justify-center ${
                      useBalance ? "bg-accent border-accent" : "border-gray-500"
                    }`}
                  >
                    {useBalance && (
                      <View className="w-3 h-3 bg-[#191E29] rounded" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-text-primary font-medium">
                      Usar do saldo
                    </Text>
                    <Text className="text-text-primary text-xs">
                      Saldo disponível: {formatCurrency(balance?.total || 0)}
                    </Text>
                  </View>
                </Pressable>
                {!useBalance && (
                  <Text className="text-text-primary text-xs text-center">
                    Se não marcar, será adicionado dinheiro novo (saldo aumenta)
                  </Text>
                )}

                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    handleAddMoney();
                  }}
                  className="bg-accent py-4 rounded-xl items-center"
                >
                  <Text className="text-[#191E29] font-semibold text-base">
                    Adicionar
                  </Text>
                </Pressable>
                  </View>
                )}
              </ScrollView>
            </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Withdraw Money Modal */}
      <Modal
        visible={showWithdrawModal !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowWithdrawModal(null);
          setAmount("");
          setUseBalance(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-background rounded-t-3xl max-h-[90%]">
              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 24 }}
              >
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-text-primary text-xl font-bold">
                    Retirar Dinheiro
                  </Text>
                  <Pressable
                    onPress={() => {
                      setShowWithdrawModal(null);
                      setAmount("");
                      setUseBalance(false);
                    }}
                    className="w-8 h-8 bg-card-bg rounded-full items-center justify-center"
                  >
                    <X size={16} color="#F5F0E6" />
                  </Pressable>
                </View>

                {showWithdrawModal && (
                  <View className="gap-4">
                <View>
                  <Text className="text-text-primary text-sm mb-2">
                    Poupança: {showWithdrawModal.goal_name}
                  </Text>
                  <Text className="text-text-primary text-xs">
                    Disponível: {formatCurrency(showWithdrawModal.current_amount)}
                  </Text>
                </View>

                <View>
                  <Text className="text-text-primary text-sm mb-2">Valor</Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0,00"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    className="bg-card-bg text-text-primary px-4 py-3 rounded-xl"
                  />
                </View>

                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    setUseBalance(!useBalance);
                  }}
                  className="flex-row items-center gap-3 p-4 bg-card-bg rounded-xl"
                >
                  <View
                    className={`w-5 h-5 rounded border-2 items-center justify-center ${
                      useBalance ? "bg-accent border-accent" : "border-gray-500"
                    }`}
                  >
                    {useBalance && (
                      <View className="w-3 h-3 bg-[#191E29] rounded" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-text-primary font-medium">
                      Adicionar ao saldo
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    handleWithdrawMoney();
                  }}
                  className="bg-red-500 py-4 rounded-xl items-center"
                >
                  <Text className="text-text-primary font-semibold text-base">
                    Retirar
                  </Text>
                </Pressable>
                  </View>
                )}
              </ScrollView>
            </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

