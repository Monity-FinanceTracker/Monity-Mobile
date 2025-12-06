import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect, RouteProp } from "@react-navigation/native";
import { COLORS } from "../../constants/colors";
import { apiService } from "../../services/apiService";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { triggerHaptic } from "../../utils/haptics";
import Card from "../../components/molecules/Card";
import {
  ArrowLeft,
  Plus,
  Users,
  DollarSign,
  Share2,
  Trash2,
  CheckCircle,
} from "lucide-react-native";
import AddExpenseModal from "../../components/groups/AddExpenseModal";
import InviteModal from "../../components/groups/InviteModal";
import SettlementModal from "../../components/groups/SettlementModal";

export default function GroupDetail() {
  const colors = COLORS;
  const navigation = useNavigation();
  const route = useRoute();
  const groupId = (route.params as any)?.groupId;
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getGroupById(groupId);
      if (response.success && response.data) {
        setGroup(response.data);
      } else {
        Alert.alert("Erro", response.error || "Falha ao carregar grupo");
      }
    } catch (error) {
      console.error("Error loading group:", error);
      Alert.alert("Erro", "Falha ao carregar grupo");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [groupId])
  );

  const { refreshControl } = usePullToRefresh({
    onRefresh: loadData,
  });

  const handleAddExpense = () => {
    triggerHaptic();
    setShowAddExpenseModal(true);
  };

  const handleInvite = () => {
    triggerHaptic();
    setShowInviteModal(true);
  };

  const handleSettlement = () => {
    triggerHaptic();
    setShowSettlementModal(true);
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

  if (!group) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top", "bottom", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-text-primary text-center">
            Grupo não encontrado
          </Text>
          <Pressable
            onPress={() => navigation.goBack()}
            className="mt-4 bg-accent px-6 py-3 rounded-xl"
          >
            <Text className="text-[#191E29] font-semibold">Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const members = group.group_members || [];
  const expenses = group.group_expenses || group.expenses || [];
  const totalAmount = expenses.reduce(
    (sum: number, exp: any) => sum + (parseFloat(exp.amount) || 0),
    0
  );

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
                  {group.name}
                </Text>
                <Text className="text-text-primary text-sm">
                  {members.length} membro{members.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3 mb-6">
            <Pressable
              onPress={handleAddExpense}
              className="flex-1 bg-accent px-4 py-3 rounded-xl flex-row items-center justify-center gap-2"
            >
              <Plus size={18} color="#191E29" />
              <Text className="text-[#191E29] font-semibold">
                Adicionar Despesa
              </Text>
            </Pressable>
            <Pressable
              onPress={handleInvite}
              className="bg-accent/20 px-4 py-3 rounded-xl items-center justify-center"
            >
              <Share2 size={18} color={colors.accent} />
            </Pressable>
          </View>

          {/* Settlement Button */}
          {expenses.length > 0 && (
            <Pressable
              onPress={handleSettlement}
              className="bg-card-bg border border-accent px-4 py-3 rounded-xl flex-row items-center justify-center gap-2 mb-4"
            >
              <CheckCircle size={18} color={colors.accent} />
              <Text className="text-accent font-semibold">
                Acertos de Contas
              </Text>
            </Pressable>
          )}

          {/* Summary */}
          <Card className="mb-4">
            <View className="p-4">
              <Text className="text-text-secondary text-sm mb-2">
                Total de Despesas
              </Text>
              <Text className="text-text-primary text-2xl font-bold">
                R$ {totalAmount.toFixed(2)}
              </Text>
              <Text className="text-text-secondary text-xs mt-1">
                {expenses.length} despesa{expenses.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </Card>

          {/* Members */}
          <View className="mb-4">
            <Text className="text-text-primary text-lg font-semibold mb-3">
              Membros
            </Text>
            <View className="gap-2">
              {members.map((member: any, index: number) => (
                <Card key={index} className="p-3">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-accent/20 rounded-full items-center justify-center">
                      <Users size={20} color={colors.accent} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-text-primary font-medium">
                        {member.name || member.profiles?.name || "Membro"}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </View>

          {/* Expenses */}
          <View>
            <Text className="text-text-primary text-lg font-semibold mb-3">
              Despesas
            </Text>
            {expenses.length === 0 ? (
              <Card className="p-6 items-center">
                <DollarSign size={32} color={colors.textSecondary} />
                <Text className="text-text-secondary text-center mt-2">
                  Nenhuma despesa ainda
                </Text>
              </Card>
            ) : (
              <View className="gap-2">
                {expenses.map((expense: any) => (
                  <Card key={expense.id} className="p-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-text-primary font-semibold">
                          {expense.description}
                        </Text>
                        <Text className="text-text-secondary text-sm mt-1">
                          R$ {parseFloat(expense.amount || 0).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <AddExpenseModal
        visible={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        groupId={groupId}
        members={members}
        onSuccess={loadData}
      />

      <InviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        groupId={groupId}
        groupName={group?.name || ""}
        onSuccess={loadData}
      />

      <SettlementModal
        visible={showSettlementModal}
        onClose={() => setShowSettlementModal(false)}
        groupId={groupId}
        expenses={expenses}
        members={members}
        onSuccess={loadData}
      />
    </SafeAreaView>
  );
}

