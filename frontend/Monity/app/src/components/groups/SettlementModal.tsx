import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { COLORS } from "../../constants/colors";
import { apiService } from "../../services/apiService";
import { triggerHaptic } from "../../utils/haptics";
import { X, DollarSign, CheckCircle, Users } from "lucide-react-native";

interface SettlementModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  expenses: any[];
  members: any[];
  onSuccess: () => void;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
  fromName: string;
  toName: string;
}

export default function SettlementModal({
  visible,
  onClose,
  groupId,
  expenses,
  members,
  onSuccess,
}: SettlementModalProps) {
  const colors = COLORS;
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && expenses.length > 0 && members.length > 0) {
      calculateSettlements();
    }
  }, [visible, expenses, members]);

  const calculateSettlements = () => {
    // Calculate who owes what to whom
    const balances: { [userId: string]: number } = {};
    
    // Initialize balances
    members.forEach((member) => {
      const userId = member.userId || member.id;
      balances[userId] = 0;
    });

    // Calculate balances from expenses
    expenses.forEach((expense) => {
      const totalAmount = parseFloat(expense.amount || 0);
      const expenseShares = expense.expense_shares || [];

      // Add to payer's balance (they paid)
      if (expense.paid_by) {
        balances[expense.paid_by] = (balances[expense.paid_by] || 0) + totalAmount;
      }

      // Subtract from each share holder's balance (they owe)
      expenseShares.forEach((share: any) => {
        const shareAmount = parseFloat(share.amount || 0);
        const userId = share.userId || share.user_id;
        balances[userId] = (balances[userId] || 0) - shareAmount;
      });
    });

    // Calculate settlements (simplified algorithm)
    const settlements: Settlement[] = [];
    const debtors: Array<{ userId: string; amount: number; name: string }> = [];
    const creditors: Array<{ userId: string; amount: number; name: string }> = [];

    members.forEach((member) => {
      const userId = member.userId || member.id;
      const balance = balances[userId] || 0;
      const name = member.name || member.profiles?.name || "Membro";

      if (balance < 0) {
        debtors.push({ userId, amount: Math.abs(balance), name });
      } else if (balance > 0) {
        creditors.push({ userId, amount: balance, name });
      }
    });

    // Match debtors with creditors
    debtors.forEach((debtor) => {
      let remainingDebt = debtor.amount;

      creditors.forEach((creditor) => {
        if (remainingDebt <= 0 || creditor.amount <= 0) return;

        const settlementAmount = Math.min(remainingDebt, creditor.amount);
        settlements.push({
          from: debtor.userId,
          to: creditor.userId,
          amount: settlementAmount,
          fromName: debtor.name,
          toName: creditor.name,
        });

        remainingDebt -= settlementAmount;
        creditor.amount -= settlementAmount;
      });
    });

    setSettlements(settlements);
  };

  const handleSettle = async (settlement: Settlement) => {
    try {
      setLoading(true);
      triggerHaptic();

      // Find the share ID for this settlement
      // In a real implementation, you'd need to find the correct share ID
      const expense = expenses.find((exp) => {
        const shares = exp.expense_shares || [];
        return shares.some(
          (share: any) =>
            (share.userId || share.user_id) === settlement.from &&
            parseFloat(share.amount || 0) > 0
        );
      });

      if (expense) {
        const share = expense.expense_shares?.find(
          (s: any) => (s.userId || s.user_id) === settlement.from
        );

        if (share && share.id) {
          const response = await apiService.settleExpenseShare(share.id);

          if (response.success) {
            Alert.alert("Sucesso", "Pagamento registrado com sucesso!");
            onSuccess();
            calculateSettlements();
          } else {
            Alert.alert("Erro", response.error || "Falha ao registrar pagamento");
          }
        }
      }
    } catch (error) {
      console.error("Error settling:", error);
      Alert.alert("Erro", "Erro ao registrar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-background rounded-t-3xl p-6 max-h-[90%]">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-text-primary text-xl font-bold">
              Acertos de Contas
            </Text>
            <Pressable onPress={onClose} className="p-2">
              <X size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {settlements.length === 0 ? (
              <View className="items-center py-8">
                <CheckCircle size={48} color={colors.success} />
                <Text className="text-text-primary text-lg font-semibold mt-4">
                  Tudo Quitado!
                </Text>
                <Text className="text-text-secondary text-center mt-2">
                  Não há pendências de pagamento no grupo
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {settlements.map((settlement, index) => (
                  <View
                    key={index}
                    className="bg-card-bg p-4 rounded-xl border border-border-default"
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Users size={16} color={colors.textSecondary} />
                          <Text className="text-text-primary font-semibold">
                            {settlement.fromName}
                          </Text>
                        </View>
                        <Text className="text-text-secondary text-xs ml-6">
                          deve para
                        </Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          <Users size={16} color={colors.accent} />
                          <Text className="text-text-primary font-semibold">
                            {settlement.toName}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-accent text-lg font-bold">
                          {formatCurrency(settlement.amount)}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => handleSettle(settlement)}
                      disabled={loading}
                      className={`bg-accent py-3 rounded-xl items-center ${
                        loading ? "opacity-50" : ""
                      }`}
                    >
                      <Text className="text-[#191E29] font-semibold">
                        {loading ? "Processando..." : "Marcar como Pago"}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}



