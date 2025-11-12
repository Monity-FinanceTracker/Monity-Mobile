import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../../constants/colors";
import { apiService, Transaction } from "../../services/apiService";
import {
  ArrowLeft,
  Repeat,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
} from "lucide-react-native";
import { triggerHaptic } from "../../utils/haptics";

export default function RecurringTransactions() {
  const navigation = useNavigation();
  const colors = COLORS;
  const [recurringTransactions, setRecurringTransactions] = useState<
    (Transaction & { recurrenceDay?: number })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<
    (Transaction & { recurrenceDay?: number }) | null
  >(null);
  const [showActionModal, setShowActionModal] = useState(false);

  const loadRecurringTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getRecurringTransactions();
      if (response.success && response.data) {
        setRecurringTransactions(response.data);
      } else {
        Alert.alert("Erro", "Falha ao carregar transações recorrentes");
      }
    } catch (error) {
      console.error("Error loading recurring transactions:", error);
      Alert.alert("Erro", "Falha ao carregar transações recorrentes");
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
    // TODO: Navigate to edit screen
    Alert.alert("Editar", "Funcionalidade de edição será implementada em breve");
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
                color={isExpense ? colors.error : colors.success}
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
                {transaction.category.name || transaction.category}
              </Text>
            )}
            <View className="flex-row items-center gap-4 mt-2">
              <Text
                style={{
                  color: isExpense ? colors.error : colors.success,
                  fontSize: 18,
                  fontWeight: "bold",
                }}
              >
                {isExpense ? "-" : "+"}
                {formatCurrency(transaction.amount || 0)}
              </Text>
              <View className="flex-row items-center gap-1">
                <Repeat size={14} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  Dia {transaction.recurrenceDay || "N/A"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
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
              style={{ color: colors.textMuted, marginTop: 16, fontSize: 14 }}
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
                Dia {selectedTransaction?.recurrenceDay || "N/A"} de cada mês
              </Text>
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
    </SafeAreaView>
  );
}



