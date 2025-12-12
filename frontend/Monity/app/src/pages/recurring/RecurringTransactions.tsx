import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS } from "../../constants/colors";
import { apiService, Transaction } from "../../services/apiService";
import {
  ArrowLeft,
  Repeat,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react-native";
import { triggerHaptic } from "../../utils/haptics";

export default function RecurringTransactions() {
  const navigation = useNavigation();
  const colors = COLORS;
  const [recurringTransactions, setRecurringTransactions] = useState<
    (Transaction & {
      recurrenceDay?: number;
      frequency?: string;
      startDate?: string;
    })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<
    (Transaction & {
      recurrenceDay?: number;
      frequency?: string;
      startDate?: string;
    }) | null
  >(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editRecurrenceDay, setEditRecurrenceDay] = useState<number>(1);
  const [editFrequency, setEditFrequency] = useState<'monthly' | 'weekly'>('monthly');
  const [editStartDate, setEditStartDate] = useState<Date>(new Date());
  const [showEditStartDatePicker, setShowEditStartDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadRecurringTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getRecurringTransactions();
      
      // Se a resposta foi bem-sucedida, usa os dados (mesmo que seja array vazio)
      // Se não foi bem-sucedida ou não tem dados, define array vazio
      if (response.success) {
        // response.data pode ser um array vazio [], o que é válido
        const transactions = Array.isArray(response.data) ? response.data : [];
        setRecurringTransactions(transactions);
        // Log apenas para debug (pode remover depois)
        if (transactions.length === 0) {
          console.log("Nenhuma transação recorrente encontrada (isso é normal)");
        }
      } else {
        // Se não houver transações ou houver erro, apenas define array vazio (sem pop-up de erro)
        // Não exibir erro - apenas mostrar mensagem na tela
        console.log("Resposta sem sucesso ao carregar transações recorrentes:", response.error);
        setRecurringTransactions([]);
      }
    } catch (error) {
      // Em caso de erro, apenas define array vazio (sem pop-up de erro)
      console.error("Erro ao carregar transações recorrentes (silencioso):", error);
      setRecurringTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadRecurringTransactions();
    }, [])
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Math.abs(amount));
  };

  const handleTransactionPress = (
    transaction: Transaction & { recurrenceDay?: number }
  ) => {
    setSelectedTransaction(transaction);
    setShowActionModal(true);
  };

  const handleEditTransaction = () => {
    if (!selectedTransaction) return;
    triggerHaptic();
    setShowActionModal(false);

    // Populate edit fields with current transaction data
    setEditName(selectedTransaction.description || selectedTransaction.title || "");
    const amount = Math.abs(selectedTransaction.amount || 0);
    setEditAmount(amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }));
    setEditRecurrenceDay(selectedTransaction.recurrenceDay || new Date().getDate());
    setEditFrequency((selectedTransaction.frequency as 'monthly' | 'weekly') || 'monthly');
    if (selectedTransaction.startDate) {
      const dateStr = selectedTransaction.startDate.split('T')[0];
      const [year, month, day] = dateStr.split('-').map(Number);
      setEditStartDate(new Date(year, month - 1, day));
    } else {
      setEditStartDate(new Date());
    }
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTransaction || !editName || !editAmount) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    try {
      setIsSaving(true);
      const numericAmount = Number.parseFloat(
        editAmount.replace(/\./g, "").replace(",", ".")
      );

      const updateData = {
        description: editName,
        amount: selectedTransaction.type === "expense" ? -numericAmount : numericAmount,
        recurrenceDay: editRecurrenceDay,
        frequency: editFrequency,
        startDate: editStartDate.toISOString().split('T')[0],
      };

      const response = await apiService.updateRecurringTransaction(
        selectedTransaction.id,
        updateData
      );

      if (response.success) {
        Alert.alert("Sucesso", "Transação recorrente atualizada com sucesso!");
        setShowEditModal(false);
        loadRecurringTransactions();
      } else {
        Alert.alert("Erro", response.error || "Falha ao atualizar transação recorrente");
      }
    } catch (error) {
      console.error("Error updating recurring transaction:", error);
      Alert.alert("Erro", "Falha ao atualizar transação recorrente");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    const formattedValue = (Number(numericValue) / 100).toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
    setEditAmount(formattedValue);
  };

  const handleDeleteTransaction = () => {
    if (!selectedTransaction) return;
    triggerHaptic();

    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir esta transação recorrente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await apiService.deleteRecurringTransaction(
                selectedTransaction.id
              );
              if (response.success) {
                Alert.alert("Sucesso", "Transação recorrente excluída com sucesso!");
                setShowActionModal(false);
                loadRecurringTransactions();
              } else {
                Alert.alert(
                  "Erro",
                  response.error || "Falha ao excluir transação recorrente"
                );
              }
            } catch (error) {
              console.error("Error deleting recurring transaction:", error);
              Alert.alert("Erro", "Falha ao excluir transação recorrente");
            }
          },
        },
      ]
    );
  };

  const renderTransaction = (
    transaction: Transaction & { recurrenceDay?: number }
  ) => {
    const isExpense = transaction.type === "expense";
    const Icon = isExpense ? TrendingDown : TrendingUp;

    return (
      <Pressable
        key={transaction.id}
        onPress={() => handleTransactionPress(transaction)}
        className="bg-card-bg border border-border-default rounded-xl p-4 mb-3"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-2">
              <Icon
                size={20}
                color={isExpense ? colors.expense : colors.success}
              />
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontWeight: "600",
                }}
                numberOfLines={1}
              >
                {transaction.description || transaction.title}
              </Text>
            </View>
            {transaction.category && (
              <Text
                style={{ color: colors.textGray, fontSize: 14, marginBottom: 4 }}
              >
                {transaction.category.name || transaction.category.name}
              </Text>
            )}
            <View className="flex-row items-center gap-4 mt-2">
              <Text
                style={{
                  color: isExpense ? colors.expense : colors.success,
                  fontSize: 18,
                  fontWeight: "bold",
                }}
              >
                {isExpense ? "-" : "+"}
                {formatCurrency(transaction.amount || 0)}
              </Text>
              <View className="flex-row items-center gap-1">
                <Repeat size={14} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {transaction.frequency === 'weekly'
                    ? `${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][transaction.recurrenceDay || 0]}`
                    : `Dia ${transaction.recurrenceDay || "N/A"}`
                  } • {transaction.frequency === 'weekly' ? 'Semanal' : 'Mensal'}
                </Text>
              </View>
            </View>
            {transaction.startDate && (
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                Desde: {new Date(transaction.startDate).toLocaleDateString("pt-BR")}
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom", "left", "right"]}
    >
      <View className="flex-1 px-6 pt-6">
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-6">
          <Pressable
            onPress={() => {
              triggerHaptic();
              navigation.goBack();
            }}
            className="p-2"
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
          <Text
            style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "bold" }}
          >
            Transações Recorrentes
          </Text>
        </View>

        {/* Content */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.accent} />
            <Text
              style={{ color: colors.textPrimary, marginTop: 16, fontSize: 14 }}
            >
              Carregando transações recorrentes...
            </Text>
          </View>
        ) : recurringTransactions.length > 0 ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {recurringTransactions.map(renderTransaction)}
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Repeat size={64} color={colors.textMuted} />
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 18,
                fontWeight: "600",
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              Nenhuma transação recorrente
            </Text>
            <Text
              style={{
                color: colors.textGray,
                fontSize: 14,
                textAlign: "center",
                paddingHorizontal: 32,
              }}
            >
              Crie transações recorrentes ao adicionar despesas ou receitas
            </Text>
          </View>
        )}
      </View>

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowActionModal(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-card-bg rounded-t-3xl p-6"
            style={{ borderTopWidth: 1, borderTopColor: colors.border }}
          >
            <View className="mb-4">
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 18,
                  fontWeight: "bold",
                  marginBottom: 4,
                }}
              >
                {selectedTransaction?.description || selectedTransaction?.title}
              </Text>
              <Text style={{ color: colors.textGray, fontSize: 14 }}>
                {selectedTransaction?.frequency === 'weekly'
                  ? `Toda ${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][selectedTransaction?.recurrenceDay || 0]}`
                  : `Dia ${selectedTransaction?.recurrenceDay || "N/A"} de cada mês`
                }
              </Text>
              {selectedTransaction?.startDate && (
                <Text style={{ color: colors.textGray, fontSize: 12 }}>
                  Desde: {new Date(selectedTransaction.startDate).toLocaleDateString("pt-BR")}
                </Text>
              )}
            </View>

            <Pressable
              onPress={handleEditTransaction}
              className="flex-row items-center gap-3 py-4 border-b border-border-default"
            >
              <Edit size={20} color={colors.accent} />
              <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
                Editar
              </Text>
            </Pressable>

            <Pressable
              onPress={handleDeleteTransaction}
              className="flex-row items-center gap-3 py-4"
            >
              <Trash2 size={20} color={colors.error} />
              <Text style={{ color: colors.error, fontSize: 16 }}>
                Excluir
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerHaptic();
                setShowActionModal(false);
              }}
              className="mt-4 py-3 rounded-lg bg-card-bg border border-border-default items-center"
            >
              <Text style={{ color: colors.textGray, fontSize: 16 }}>
                Cancelar
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowEditModal(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-card-bg rounded-t-3xl p-6 max-h-[90%]"
            style={{ borderTopWidth: 1, borderTopColor: colors.border }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 20,
                  fontWeight: "bold",
                  marginBottom: 24,
                }}
              >
                Editar Transação Recorrente
              </Text>

              {/* Nome */}
              <View className="mb-4">
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  Nome *
                </Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Nome da transação"
                  placeholderTextColor={colors.textSecondary}
                  className="bg-card-bg border border-border-default rounded-xl text-text-primary px-4 py-3"
                  style={{ color: colors.textPrimary }}
                />
              </View>

              {/* Valor */}
              <View className="mb-4">
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  Valor *
                </Text>
                <View
                  className="flex-row bg-card-bg border border-border-default rounded-xl px-4"
                  style={{ height: 48, alignItems: "center" }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: colors.textPrimary,
                      marginRight: 8,
                      lineHeight: 22,
                    }}
                  >
                    R$
                  </Text>
                  <TextInput
                    value={editAmount}
                    onChangeText={handleAmountChange}
                    placeholder="0,00"
                    placeholderTextColor={colors.textSecondary}
                    className="flex-1 text-lg font-bold text-text-primary"
                    keyboardType="numeric"
                    style={{
                      paddingVertical: 0,
                      paddingTop: 0,
                      paddingBottom: 0,
                      marginVertical: 0,
                      lineHeight: 22,
                    }}
                  />
                </View>
              </View>

              {/* Frequência */}
              <View className="mb-4">
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  Frequência *
                </Text>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      setEditFrequency('monthly');
                      if (editRecurrenceDay > 31) {
                        setEditRecurrenceDay(1);
                      }
                    }}
                    className={`flex-1 px-4 py-3 rounded-xl items-center justify-center ${
                      editFrequency === 'monthly'
                        ? "bg-accent"
                        : "bg-card-bg border border-border-default"
                    }`}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: editFrequency === 'monthly' ? "#191E29" : colors.textGray,
                        fontWeight: editFrequency === 'monthly' ? "600" : "normal",
                      }}
                    >
                      Mensal
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      setEditFrequency('weekly');
                      if (editRecurrenceDay > 6) {
                        setEditRecurrenceDay(0);
                      }
                    }}
                    className={`flex-1 px-4 py-3 rounded-xl items-center justify-center ${
                      editFrequency === 'weekly'
                        ? "bg-accent"
                        : "bg-card-bg border border-border-default"
                    }`}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: editFrequency === 'weekly' ? "#191E29" : colors.textGray,
                        fontWeight: editFrequency === 'weekly' ? "600" : "normal",
                      }}
                    >
                      Semanal
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Data de Início */}
              <View className="mb-4">
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  Data de Início
                </Text>
                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    setShowEditStartDatePicker(true);
                  }}
                  className="bg-card-bg border border-border-default rounded-xl px-4 py-3 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-2">
                    <Calendar size={20} color={colors.textPrimary} />
                    <Text style={{ color: colors.textPrimary, fontSize: 14 }}>
                      {editStartDate.toLocaleDateString("pt-BR")}
                    </Text>
                  </View>
                </Pressable>
                {showEditStartDatePicker && (
                  <>
                    <DateTimePicker
                      value={editStartDate}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(event, selectedDateValue) => {
                        if (Platform.OS === "android") {
                          setShowEditStartDatePicker(false);
                          if (event.type === "set" && selectedDateValue) {
                            setEditStartDate(selectedDateValue);
                          }
                        } else {
                          // iOS
                          if (selectedDateValue) {
                            setEditStartDate(selectedDateValue);
                          }
                        }
                      }}
                      locale="pt-BR"
                    />
                    {Platform.OS === "ios" && (
                      <Pressable
                        onPress={() => setShowEditStartDatePicker(false)}
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

              {/* Dia de Recorrência/Semana */}
              <View className="mb-6">
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  {editFrequency === 'monthly' ? 'Dia de Recorrência *' : 'Dia da Semana *'}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingRight: 8 }}
                >
                  {editFrequency === 'monthly' ? (
                    Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <Pressable
                        key={day}
                        onPress={() => {
                          triggerHaptic();
                          setEditRecurrenceDay(day);
                        }}
                        className={`px-4 py-2 rounded-lg items-center justify-center min-w-[48px] ${
                          editRecurrenceDay === day
                            ? "bg-accent"
                            : "bg-card-bg border border-border-default"
                        }`}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: editRecurrenceDay === day ? "#191E29" : colors.textGray,
                            fontWeight: editRecurrenceDay === day ? "600" : "normal",
                          }}
                        >
                          {day}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dayName, index) => (
                      <Pressable
                        key={index}
                        onPress={() => {
                          triggerHaptic();
                          setEditRecurrenceDay(index);
                        }}
                        className={`px-4 py-2 rounded-lg items-center justify-center min-w-[48px] ${
                          editRecurrenceDay === index
                            ? "bg-accent"
                            : "bg-card-bg border border-border-default"
                        }`}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: editRecurrenceDay === index ? "#191E29" : colors.textGray,
                            fontWeight: editRecurrenceDay === index ? "600" : "normal",
                          }}
                        >
                          {dayName}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </ScrollView>
              </View>

              {/* Buttons */}
              <View className="flex-row gap-3 mb-4">
                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    setShowEditModal(false);
                  }}
                  className="flex-1 h-12 rounded-lg items-center justify-center bg-card-bg border border-border-default"
                >
                  <Text style={{ color: colors.textGray, fontWeight: "500" }}>
                    Cancelar
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveEdit}
                  disabled={!editName || !editAmount || isSaving}
                  className={`flex-1 h-12 rounded-lg items-center justify-center ${
                    !editName || !editAmount || isSaving
                      ? "bg-[#4B5563]"
                      : "bg-accent"
                  }`}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#191E29" />
                  ) : (
                    <Text
                      className={`font-medium ${
                        !editName || !editAmount || isSaving
                          ? "text-text-primary"
                          : "text-[#191E29]"
                      }`}
                    >
                      Salvar
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}




