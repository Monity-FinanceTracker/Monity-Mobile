import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Card from "../../components/molecules/Card";
import Button from "../../components/atoms/Button";
import { useAuth } from "../../context/AuthContext";
import { apiService, Transaction, Balance } from "../../services/apiService";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Eye,
  EyeOff,
  ShoppingCart,
  Car,
  Home,
  Coffee,
  Gamepad2,
  Heart,
  GraduationCap,
  Briefcase,
  Calendar,
  CreditCard,
  Smartphone,
  Banknote,
  User,
  Mail,
} from "lucide-react-native";

export default function Dashboard() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [showBalance, setShowBalance] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "R$ 0,00";
    }
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getInitials = (email: string) => {
    return email ? email.charAt(0).toUpperCase() : "U";
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load balance data
      const balanceResponse = await apiService.getBalance();
      if (balanceResponse.success && balanceResponse.data) {
        setBalance(balanceResponse.data);
      }

      // Load recent transactions (last 5)
      const transactionsResponse = await apiService.getRecentTransactions(5);
      if (transactionsResponse.success && transactionsResponse.data) {
        setRecentTransactions(transactionsResponse.data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      Alert.alert("Erro", "Falha ao carregar dados do dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const { refreshControl } = usePullToRefresh({
    onRefresh: loadDashboardData,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getTransactionIcon = (categoryName: string) => {
    const categoryMap: { [key: string]: any } = {
      Alimentação: ShoppingCart,
      Transporte: Car,
      Moradia: Home,
      Entretenimento: Gamepad2,
      Saúde: Heart,
      Educação: GraduationCap,
      Trabalho: Briefcase,
      Receita: TrendingUp,
    };
    return categoryMap[categoryName] || ShoppingCart;
  };

  const formatTransactionDate = (dateString: string) => {
    // Handle YYYY-MM-DD format dates correctly
    let date: Date;
    if (dateString.includes("-") && !dateString.includes("T")) {
      // Date is in YYYY-MM-DD format, parse as local date
      const [year, month, day] = dateString.split("-").map(Number);
      date = new Date(year, month - 1, day);
    } else {
      // Fallback for other date formats
      date = new Date(dateString);
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time parts to compare only dates
    const compareDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const compareToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const compareYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );

    if (compareDate.getTime() === compareToday.getTime()) {
      return "Hoje";
    } else if (compareDate.getTime() === compareYesterday.getTime()) {
      return "Ontem";
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
    }
  };

  const renderTransaction = (transaction: Transaction) => {
    // Handle both old and new data formats
    const title =
      transaction.title || transaction.description || "Transação sem título";
    const categoryName =
      transaction.category?.name || transaction.category || "Sem categoria";
    const transactionType =
      transaction.type ||
      ((transaction.categoryId as string) === "1" ? "expense" : "income");
    const amount = transaction.amount || 0;

    const Icon = getTransactionIcon(categoryName as string);
    return (
      <Card key={transaction.id} className="mb-3">
        <View className="flex-row items-center justify-between p-4">
          <View className="flex-row items-center gap-3">
            <View
              className={`w-10 h-10 rounded-lg items-center justify-center ${
                transactionType === "income"
                  ? "bg-green-500/10"
                  : "bg-red-500/10"
              }`}
            >
              <Icon
                size={20}
                color="white"
              />
            </View>
            <View>
              <Text className="font-medium text-white text-sm">{title}</Text>
              <Text className="text-xs text-gray-400">
                {categoryName as string}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text
              className={`font-semibold text-sm ${
                transactionType === "income" ? "text-green-400" : "text-red-400"
              }`}
            >
              {transactionType === "income" ? "+" : "-"}
              {formatCurrency(Math.abs(amount))}
            </Text>
            <Text className="text-xs text-gray-400">
              {formatTransactionDate(transaction.date)}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#191E29' }}
      edges={["top", "left", "right"]}
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
            <View>
              <Text className="text-white text-lg font-bold">
                Olá, {user?.email?.split("@")[0] || "Usuário"}!
              </Text>
              <Text className="text-gray-400 text-xs">
                Bem-vindo de volta ao Monity
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate("Profile" as never)}
              className="w-10 h-10 bg-[#01C38D] rounded-full items-center justify-center"
            >
              <Text className="text-[#191E29] font-semibold text-sm">
                {getInitials(user?.email || "")}
              </Text>
            </Pressable>
          </View>

          {/* Balance Card */}
          <Card className="bg-gradient-to-r from-[#01C38D] to-[#01C38D]/80 border-0 mb-6">
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white text-xs">Saldo Total</Text>
                <Pressable onPress={() => setShowBalance(!showBalance)}>
                  {showBalance ? (
                    <Eye size={20} color="white" />
                  ) : (
                    <EyeOff size={20} color="white" />
                  )}
                </Pressable>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-xl font-bold text-white">
                  {showBalance
                    ? balance
                      ? formatCurrency(balance?.total)
                      : "R$ 0,00"
                    : "••••••"}
                </Text>
                {balance && (
                  <View className="flex-row items-center gap-1">
                    {(balance.changePercentage || 0) >= 0 ? (
                      <TrendingUp size={16} color="white" />
                    ) : (
                      <TrendingDown size={16} color="white" />
                    )}
                    <Text
                      className={`text-xs ${
                        (balance.changePercentage || 0) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {(balance.changePercentage || 0) >= 0 ? "+" : ""}
                      {(balance.changePercentage || 0).toFixed(1)}%
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Card>

          {/* Quick Stats */}
          <View className="gap-4 mb-6">
            <View className="flex-1">
              <Card>
                <View className="p-4">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-green-500/10 rounded-lg items-center justify-center">
                      <TrendingUp size={20} color="white" />
                    </View>
                    <View>
                      <Text className="text-xs text-gray-400">Receitas</Text>
                      <Text className="text-sm font-semibold text-green-400">
                        {balance ? formatCurrency(balance?.income) : "R$ 0,00"}
                      </Text>
                      {(!balance || (balance?.income || 0) === 0) && (
                        <Text className="text-xs text-gray-500 mt-1">
                          Você não tem receitas
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </Card>
            </View>

            <View className="flex-1">
              <Card>
                <View className="p-4">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-red-500/10 rounded-lg items-center justify-center">
                      <TrendingDown size={20} color="white" />
                    </View>
                    <View>
                      <Text className="text-xs text-gray-400">Despesas</Text>
                      <Text className="text-sm font-semibold text-red-400">
                        {balance
                          ? formatCurrency(balance?.expenses)
                          : "R$ 0,00"}
                      </Text>
                      {(!balance || (balance?.expenses || 0) === 0) && (
                        <Text className="text-xs text-gray-500 mt-1">
                          Você não tem despesas
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </Card>
            </View>
          </View>

          {/* Recent Transactions */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-sm font-semibold text-white">
                Transações Recentes
              </Text>
              <Pressable
                onPress={() => navigation.navigate("Transactions" as never)}
                className="flex-row items-center gap-1"
              >
                <Text className="text-gray-400 text-xs">Ver todas</Text>
              </Pressable>
            </View>

            <View>
              {isLoading ? (
                <View className="items-center py-8">
                  <Text className="text-gray-400">
                    Carregando transações...
                  </Text>
                </View>
              ) : recentTransactions.length > 0 ? (
                recentTransactions.map(renderTransaction)
              ) : (
                <View className="items-center py-8">
                  <View className="w-16 h-16 bg-[#01C38D]/20 rounded-full items-center justify-center mb-4">
                    <Banknote size={32} color="white" />
                  </View>
                  <Text className="text-white text-base font-semibold mb-2">
                    Nenhuma transação ainda
                  </Text>
                  <Text className="text-gray-400 text-center mb-4 text-sm">
                    Você ainda não tem transações registradas.{"\n"}
                    Comece adicionando sua primeira receita ou despesa!
                  </Text>
                  <Pressable
                    onPress={() => navigation.navigate("AddExpense" as never)}
                    className="bg-[#01C38D] px-6 py-3 rounded-xl"
                  >
                    <Text className="text-white font-semibold">
                      Adicionar Transação
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-white mb-4">
              Ações Rápidas
            </Text>
            <View className="flex-row gap-4">
              <Pressable
                onPress={() => navigation.navigate("AddExpense" as never)}
                className="flex-1 h-12 bg-[#01C38D] rounded-lg items-center justify-center flex-row gap-2"
              >
                <Plus size={20} color="white" />
                <Text className="text-[#191E29] font-medium text-xs">
                  Adicionar Despesa
                </Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate("AddExpense" as never)}
                className="flex-1 h-12 bg-[#31344d] border border-[#4B5563] rounded-lg items-center justify-center flex-row gap-2"
              >
                <Plus size={20} color="white" />
                <Text className="text-gray-300 font-medium text-xs">
                  Adicionar Receita
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
