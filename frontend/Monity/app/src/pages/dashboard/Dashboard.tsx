import React, { useEffect, useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Card from "../../components/molecules/Card";
import Button from "../../components/atoms/Button";
import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";
import { apiService, Transaction, Balance } from "../../services/apiService";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Eye,
  EyeOff,
  Calendar,
  CreditCard,
  Smartphone,
  Banknote,
  User,
  Mail,
  ArrowDown,
  ArrowUp,
} from "lucide-react-native";

interface MonthOption {
  month: number;
  year: number;
  label: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const colors = COLORS;
  const navigation = useNavigation();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [monthlyIncomeExpenses, setMonthlyIncomeExpenses] = useState<{
    income: number;
    expenses: number;
  }>({
    income: 0,
    expenses: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [showBalance, setShowBalance] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para mês selecionado (apenas para receitas/despesas)
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return "Bom dia!";
    } else if (hour >= 12 && hour < 18) {
      return "Boa tarde!";
    } else {
      return "Boa noite!";
    }
  };

  // Gerar lista de 3 meses (2 anteriores + atual)
  const monthOptions: MonthOption[] = useMemo(() => {
    const options: MonthOption[] = [];
    const currentDate = new Date();
    
    for (let i = 2; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const monthNames = [
        "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
        "Jul", "Ago", "Set", "Out", "Nov", "Dez"
      ];
      
      options.push({
        month,
        year,
        label: `${monthNames[month - 1]}/${year}`,
      });
    }
    
    return options;
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load total balance (sem filtro de mês)
      const balanceResponse = await apiService.getBalance();
      if (balanceResponse.success && balanceResponse.data) {
        setBalance(balanceResponse.data);
      }

      // Load recent transactions (last 5)
      const transactionsResponse = await apiService.getRecentTransactions(5);
      if (transactionsResponse.success && transactionsResponse.data) {
        setRecentTransactions(transactionsResponse.data);
      }

      // Load monthly income/expenses
      await loadMonthlyIncomeExpenses(selectedMonth, selectedYear);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      Alert.alert("Erro", "Falha ao carregar dados do dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMonthlyIncomeExpenses = async (month: number, year: number) => {
    try {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      
      const [monthlyBalanceResponse, transactionsResponse] = await Promise.all([
        apiService.getMonthlyBalance(month, year),
        apiService.getTransactions({ startDate, endDate }),
      ]);

      // Process monthly income and expenses
      let income = 0;
      let expenses = 0;

      if (monthlyBalanceResponse.success && monthlyBalanceResponse.data) {
        const responseData = monthlyBalanceResponse.data as any;
        
        // Verificar se é o formato antigo {balance: X} ou novo {total, income, expenses, ...}
        if (responseData.balance !== undefined && responseData.total === undefined) {
          // Formato antigo: calcular income e expenses das transações
          if (transactionsResponse.success && transactionsResponse.data) {
            transactionsResponse.data.forEach((transaction: Transaction) => {
              const amount = Math.abs(transaction.amount || 0);
              if (transaction.type === "income") {
                income += amount;
              } else if (transaction.type === "expense") {
                expenses += amount;
              }
            });
          }
        } else {
          // Formato novo
          income = responseData.income || 0;
          expenses = responseData.expenses || 0;
        }
      } else if (transactionsResponse.success && transactionsResponse.data) {
        // Fallback: calcular das transações se não houver resposta do balance
        transactionsResponse.data.forEach((transaction: Transaction) => {
          const amount = Math.abs(transaction.amount || 0);
          if (transaction.type === "income") {
            income += amount;
          } else if (transaction.type === "expense") {
            expenses += amount;
          }
        });
      }

      setMonthlyIncomeExpenses({ income, expenses });
    } catch (error) {
      console.error("Error loading monthly income/expenses:", error);
      setMonthlyIncomeExpenses({ income: 0, expenses: 0 });
    }
  };

  const handleMonthChange = async (month: number, year: number) => {
    // Atualizar mês imediatamente
    setSelectedMonth(month);
    setSelectedYear(year);
    
    // Carregar dados
    await loadMonthlyIncomeExpenses(month, year);
  };

  const { refreshControl } = usePullToRefresh({
    onRefresh: loadDashboardData,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);


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

    // Use arrows instead of category icons
    const ArrowIcon = transactionType === "income" ? ArrowDown : ArrowUp;
    const arrowColor = transactionType === "income" ? "#4ADE80" : "#FFFFFF"; // Green-400 for income, white for expense
    
    return (
      <View key={transaction.id} style={{ marginBottom: 12 }}>
        <Card>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View
                className={`w-8 h-8 rounded-lg items-center justify-center ${
                  transactionType === "income"
                    ? "bg-green-500/10"
                    : "bg-white/10"
                }`}
              >
                <ArrowIcon
                  size={16}
                  color={arrowColor}
                />
              </View>
              <View>
                <Text className="font-medium text-white text-xs">{title}</Text>
                <Text className="text-[10px] text-gray-400">
                  {categoryName as string}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text
                className={`font-semibold text-xs ${
                  transactionType === "income" ? "text-green-400" : "text-white"
                }`}
              >
                {transactionType === "income" ? "+" : "-"}
                {formatCurrency(Math.abs(amount))}
              </Text>
              <Text className="text-[10px] text-gray-400">
                {formatTransactionDate(transaction.date)}
              </Text>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
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
              <Text 
                className="text-white text-2xl font-bold"
              >
                {getGreeting()} {user?.name || "Usuário"}
              </Text>
              <Text 
                className="text-gray-400 text-lg"
              >
                Bem-vindo de volta a Monity
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate("Profile" as never)}
              className="w-10 h-10 bg-accent rounded-full items-center justify-center"
            >
              <Text className="text-[#191E29] font-semibold text-lg">
                {getInitials(user?.name || "")}
              </Text>
            </Pressable>
          </View>

          {/* Balance Card */}
          <Card className="bg-gradient-to-r from-[#01C38D] to-[#01C38D]/80 border-0 mb-3">
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white text-lg">Saldo Total</Text>
                <Pressable onPress={() => setShowBalance(!showBalance)}>
                  {showBalance ? (
                    <Eye size={20} color="white" />
                  ) : (
                    <EyeOff size={20} color="white" />
                  )}
                </Pressable>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-3xl font-bold text-white">
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
                        className={`text-3xs ${
                          (balance.changePercentage || 0) >= 0
                            ? "text-green-400"
                            : "text-white"
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

          {/* Month Selector */}
          <View className="mt-3 flex-row mb-2" style={{ gap: 8, paddingHorizontal: 8 }}>
            {monthOptions.map((option, index) => {
              const isSelected = option.month === selectedMonth && option.year === selectedYear;
              
              return (
                <Pressable
                  key={`${option.month}-${option.year}`}
                  onPress={() => handleMonthChange(option.month, option.year)}
                  className="flex-1 px-3 py-3"
                  style={{
                    backgroundColor: isSelected ? '#171717' : colors.background,
                    borderRadius: isSelected ? 12 : 0,
                    borderTopLeftRadius: isSelected ? 12 : 0,
                    borderTopRightRadius: isSelected ? 12 : 0,
                    borderBottomLeftRadius: isSelected ? 0 : 0,
                    borderBottomRightRadius: isSelected ? 0 : 0,
                    borderWidth: isSelected ? 1 : 0,
                    borderColor: isSelected ? '#262626' : 'transparent',
                    borderBottomWidth: isSelected ? 0 : 0,
                    marginBottom: isSelected ? -2 : 0,
                    zIndex: isSelected ? 1 : 0,
                  }}
                >
                  <View className="items-center justify-center">
                    <Text
                      className={`text-xs font-medium ${
                        isSelected ? 'text-white' : 'text-gray-400'
                      }`}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Income & Expenses Card */}
          <View 
            style={{
              backgroundColor: '#171717',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#262626',
              padding: 16,
            }}
          >
            <View className="flex-row gap-4">
              {/* Receitas */}
              <View className="flex-1">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-green-500/10 rounded-lg items-center justify-center">
                    <TrendingUp size={20} color="#4ADE80" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-400">Receitas</Text>
                    <Text className="text-sm font-semibold text-green-400">
                      {showBalance
                        ? formatCurrency(monthlyIncomeExpenses.income)
                        : "••••••"}
                    </Text>
                    {showBalance && monthlyIncomeExpenses.income === 0 && (
                      <Text className="text-xs text-gray-500 mt-1">
                        Nenhuma receita
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Despesas */}
              <View className="flex-1">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-white/10 rounded-lg items-center justify-center">
                    <TrendingDown size={20} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-400">Despesas</Text>
                    <Text className="text-sm font-semibold text-white">
                      {showBalance
                        ? formatCurrency(monthlyIncomeExpenses.expenses)
                        : "••••••"}
                    </Text>
                    {showBalance && monthlyIncomeExpenses.expenses === 0 && (
                      <Text className="text-xs text-gray-500 mt-1">
                        Nenhuma despesa
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Recent Transactions */}
          <View className="mt-3">
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
                  <View className="w-16 h-16 bg-accent/20 rounded-full items-center justify-center mb-4">
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
                    className="bg-accent px-6 py-3 rounded-xl border-2"
                    style={{
                      borderColor: COLORS.accent,
                    }}
                  >
                    <Text className="text-white font-semibold">
                      Adicionar Transação
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
