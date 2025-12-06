import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { COLORS } from "../../constants/colors";
import { apiService } from "../../services/apiService";
import { triggerHaptic } from "../../utils/haptics";
import { X, DollarSign, Users } from "lucide-react-native";

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  members: any[];
  onSuccess: () => void;
}

export default function AddExpenseModal({
  visible,
  onClose,
  groupId,
  members,
  onSuccess,
}: AddExpenseModalProps) {
  const colors = COLORS;
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [shares, setShares] = useState<Array<{ userId: string; amount: number }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && members.length > 0) {
      // Initialize shares with equal distribution
      const equalAmount = 0;
      setShares(
        members.map((member) => ({
          userId: member.userId || member.id,
          amount: equalAmount,
        }))
      );
    }
  }, [visible, members]);

  const handleAmountChange = (text: string) => {
    setAmount(text);
    // Auto-calculate equal shares
    const numericAmount = parseFloat(text.replace(/\./g, "").replace(",", "."));
    if (!isNaN(numericAmount) && numericAmount > 0 && members.length > 0) {
      const shareAmount = numericAmount / members.length;
      setShares(
        members.map((member) => ({
          userId: member.userId || member.id,
          amount: shareAmount,
        }))
      );
    }
  };

  const handleShareChange = (userId: string, shareAmount: string) => {
    const numericAmount = parseFloat(shareAmount.replace(/\./g, "").replace(",", "."));
    setShares((prev) =>
      prev.map((share) =>
        share.userId === userId
          ? { ...share, amount: isNaN(numericAmount) ? 0 : numericAmount }
          : share
      )
    );
  };

  const handleSubmit = async () => {
    if (!description || !amount) {
      Alert.alert("Erro", "Por favor, preencha descrição e valor");
      return;
    }

    const totalAmount = parseFloat(amount.replace(/\./g, "").replace(",", "."));
    if (isNaN(totalAmount) || totalAmount <= 0) {
      Alert.alert("Erro", "Valor deve ser maior que zero");
      return;
    }

    const totalShares = shares.reduce((sum, share) => sum + share.amount, 0);
    if (Math.abs(totalShares - totalAmount) > 0.01) {
      Alert.alert(
        "Erro",
        `A soma das partes (${totalShares.toFixed(2)}) deve ser igual ao valor total (${totalAmount.toFixed(2)})`
      );
      return;
    }

    try {
      setLoading(true);
      triggerHaptic();

      const response = await apiService.addGroupExpense(groupId, {
        description,
        amount: totalAmount,
        shares: shares.filter((s) => s.amount > 0),
      });

      if (response.success) {
        Alert.alert("Sucesso", "Despesa adicionada com sucesso!");
        setDescription("");
        setAmount("");
        setShares([]);
        onSuccess();
        onClose();
      } else {
        Alert.alert("Erro", response.error || "Falha ao adicionar despesa");
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      Alert.alert("Erro", "Erro ao adicionar despesa");
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 max-h-[90%]">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-text-primary text-xl font-bold">
                Adicionar Despesa
              </Text>
              <Pressable onPress={onClose} className="p-2">
                <X size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-4">
                <View>
                  <Text className="text-text-primary font-semibold mb-2">
                    Descrição
                  </Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Ex: Almoço, Uber..."
                    placeholderTextColor={colors.textMuted}
                    className="bg-card-bg text-text-primary px-4 py-3 rounded-xl border border-border-default"
                  />
                </View>

                <View>
                  <Text className="text-text-primary font-semibold mb-2">
                    Valor Total
                  </Text>
                  <TextInput
                    value={amount}
                    onChangeText={handleAmountChange}
                    placeholder="0,00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    className="bg-card-bg text-text-primary px-4 py-3 rounded-xl border border-border-default"
                  />
                </View>

                {amount && parseFloat(amount.replace(/\./g, "").replace(",", ".")) > 0 && (
                  <View>
                    <Text className="text-text-primary font-semibold mb-2">
                      Dividir entre Membros
                    </Text>
                    <View className="gap-2">
                      {members.map((member, index) => {
                        const share = shares.find(
                          (s) => s.userId === (member.userId || member.id)
                        );
                        const shareAmount = share?.amount || 0;
                        const equalShare =
                          parseFloat(amount.replace(/\./g, "").replace(",", ".")) /
                          members.length;

                        return (
                          <View
                            key={member.userId || member.id}
                            className="bg-card-bg p-3 rounded-xl border border-border-default"
                          >
                            <View className="flex-row items-center justify-between mb-2">
                              <View className="flex-row items-center gap-2">
                                <Users size={16} color={colors.textSecondary} />
                                <Text className="text-text-primary font-medium">
                                  {member.name || member.profiles?.name || `Membro ${index + 1}`}
                                </Text>
                              </View>
                              <Text className="text-text-secondary text-sm">
                                {formatCurrency(shareAmount)}
                              </Text>
                            </View>
                            <TextInput
                              value={shareAmount > 0 ? shareAmount.toFixed(2) : ""}
                              onChangeText={(text) =>
                                handleShareChange(
                                  member.userId || member.id,
                                  text
                                )
                              }
                              placeholder={formatCurrency(equalShare)}
                              placeholderTextColor={colors.textMuted}
                              keyboardType="numeric"
                              className="bg-background text-text-primary px-3 py-2 rounded-lg border border-border-default"
                            />
                          </View>
                        );
                      })}
                    </View>
                    <Text className="text-text-secondary text-xs mt-2">
                      Total: {formatCurrency(shares.reduce((sum, s) => sum + s.amount, 0))}
                    </Text>
                  </View>
                )}

                <Pressable
                  onPress={handleSubmit}
                  disabled={loading}
                  className={`bg-accent py-4 rounded-xl items-center mt-4 ${
                    loading ? "opacity-50" : ""
                  }`}
                >
                  <Text className="text-[#191E29] font-semibold text-base">
                    {loading ? "Adicionando..." : "Adicionar Despesa"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

