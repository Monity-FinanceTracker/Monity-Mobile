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
  Wallet,
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
        const currentBalance = balanceResponse.data;
        
        // Calcular saldo do mês anterior para calcular percentual de crescimento
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        // Calcular mês anterior
        let previousMonth = currentMonth - 1;
        let previousYear = currentYear;
        if (previousMonth === 0) {
          previousMonth = 12;
          previousYear = currentYear - 1;
        }
        
        // Buscar saldo do mês anterior
        try {
          const previousMonthBalanceResponse = await apiService.getMonthlyBalance(
            previousMonth,
            previousYear
          );
          
          // Calcular saldo total até o final do mês anterior
          // Para isso, precisamos buscar todas as transações até o final do mês anterior
          const lastDayOfPreviousMonth = new Date(previousYear, previousMonth, 0).getDate();
          const endDatePreviousMonth = `${previousYear}-${String(previousMonth).padStart(2, "0")}-${String(lastDayOfPreviousMonth).padStart(2, "0")}`;
          
          // Buscar todas as transações até o final do mês anterior
          const transactionsUntilPreviousMonth = await apiService.getTransactions({
            endDate: endDatePreviousMonth,
          });
          
          let previousMonthTotalBalance = 0;
          if (transactionsUntilPreviousMonth.success && transactionsUntilPreviousMonth.data) {
            transactionsUntilPreviousMonth.data.forEach((transaction: Transaction) => {
              const amount = transaction.amount || 0;
              const transactionAny = transaction as any; // Para acessar typeId se existir
              if (transactionAny.typeId === 2 || transaction.type === "income") {
                previousMonthTotalBalance += Math.abs(amount);
              } else if (transactionAny.typeId === 1 || transaction.type === "expense") {
                previousMonthTotalBalance -= Math.abs(amount);
              }
            });
          }
          
          // Calcular percentual de crescimento
          let changePercentage: number | undefined = undefined;
          if (previousMonthTotalBalance !== 0) {
            changePercentage = ((currentBalance.total - previousMonthTotalBalance) / Math.abs(previousMonthTotalBalance)) * 100;
          } else if (currentBalance.total !== 0 && transactionsUntilPreviousMonth.success && transactionsUntilPreviousMonth.data && transactionsUntilPreviousMonth.data.length > 0) {
            // Se o saldo anterior era 0 mas havia transações, considerar como crescimento de 100%
            changePercentage = currentBalance.total > 0 ? 100 : -100;
          }
          
          // Atualizar balance com o changePercentage calculado
          setBalance({
            ...currentBalance,
            changePercentage: changePercentage !== undefined ? changePercentage : currentBalance.changePercentage,
            change: currentBalance.total - previousMonthTotalBalance,
          });
        } catch (error) {
          console.error("Error calculating change percentage:", error);
          // Se houver erro, usar o balance sem changePercentage
          setBalance(currentBalance);
        }
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
              const transactionAny = transaction as any; // Para acessar typeId se existir
              if (transactionAny.typeId === 2 || transaction.type === "income") {
                income += amount;
              } else if (transactionAny.typeId === 1 || transaction.type === "expense") {
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
          const transactionAny = transaction as any; // Para acessar typeId se existir
          if (transactionAny.typeId === 2 || transaction.type === "income") {
            income += amount;
          } else if (transactionAny.typeId === 1 || transaction.type === "expense") {
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
    const arrowColor = transactionType === "income" ? colors.income : colors.textPrimary; // Teal for income, white for expense
    
    return (
      <View key={transaction.id} style={{ marginBottom: 12 }}>
        <Card>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: transactionType === "income" ? colors.incomeBg : 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <ArrowIcon
                  size={16}
                  color={arrowColor}
                />
              </View>
              <View>
                <Text className="font-medium text-white text-xs">{title}</Text>
                <Text className="text-[10px] text-text-primary">
                  {categoryName as string}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: transactionType === "income" ? colors.income : colors.textPrimary,
                }}
              >
                {transactionType === "income" ? "+" : "-"}
                {formatCurrency(Math.abs(amount))}
              </Text>
              <Text className="text-[10px] text-text-primary">
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
                Olá, {user?.name || "Usuário"}!
              </Text>
              <Text 
                className="text-text-primary text-lg"
              >
                Bem-vindo de volta a Monity
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate("Profile" as never)}
              className="w-10 h-10 bg-accent rounded-full items-center justify-center"
            >
              <Text className="text-text-primary font-semibold text-lg">
                {getInitials(user?.name || "")}
              </Text>
            </Pressable>
          </View>

          {/* Balance Card */}
          <Card className="bg-gradient-to-r from-accent to-accent/80 border-0 mb-3">
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
                      ? formatCurrency(balance?.availableBalance || balance?.total)
                      : "R$ 0,00"
                    : "••••••"}
                </Text>
                {balance && balance.changePercentage !== undefined && (
                  <View className="flex-row items-center gap-1">
                    {(balance.changePercentage || 0) >= 0 ? (
                      <TrendingUp size={16} color={colors.income} />
                    ) : (
                      <TrendingDown size={16} color={colors.error} />
                    )}
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: (balance.changePercentage || 0) >= 0
                          ? colors.income
                          : colors.error,
                      }}
                    >
                      {(balance.changePercentage || 0) >= 0 ? "+" : ""}
                      {(balance.changePercentage || 0).toFixed(1)}%
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Card>

          {/* Savings Amount Card */}
          <Card className="bg-gradient-to-r from-accent to-accent/80 border-0 mb-3">
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white text-base font-medium">
                  Total em Economias
                </Text>
                <Pressable onPress={() => navigation.navigate("Savings" as never)}>
                  <Wallet size={20} color="white" />
                </Pressable>
              </View>
              <Text className="text-2xl font-bold text-white">
                {showBalance
                  ? formatCurrency(balance?.allocatedSavings || 0)
                  : "••••••"}
              </Text>
              {balance && balance.allocatedSavings > 0 ? (
                <Text className="text-xs text-white/80 mt-1">
                  Guardado em suas metas de poupança
                </Text>
              ) : (
                <Pressable
                  onPress={() => navigation.navigate("Savings" as never)}
                  className="mt-2"
                >
                  <Text className="text-xs text-white/90 underline">
                    Criar primeira meta de poupança
                  </Text>
                </Pressable>
              )}
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
                    backgroundColor: isSelected ? COLORS.cardBg : colors.background,
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
                        isSelected ? 'text-white' : 'text-text-primary'
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
          <Card className="bg-gradient-to-r from-accent to-accent/80 border-0">
            <View className="p-2">
            <View className="flex-row gap-4">
              {/* Receitas */}
              <View className="flex-1">
                <View className="flex-row items-center gap-3">
                  <View style={{ width: 40, height: 40, backgroundColor: colors.incomeBg, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={20} color={colors.income} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-text-primary mb-1">Receitas</Text>
                    <Text 
                      style={{ 
                        fontSize: 16, 
                        fontWeight: '700', 
                        color: colors.income,
                        marginBottom: 2,
                      }}
                    >
                      {showBalance
                        ? formatCurrency(monthlyIncomeExpenses.income)
                        : "••••••"}
                    </Text>
                    {showBalance && monthlyIncomeExpenses.income === 0 && (
                      <Text className="text-xs text-text-primary mt-1">
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
                    <Text className="text-xs text-text-primary">Despesas</Text>
                    <Text    style={{ 
                        fontSize: 16, 
                        fontWeight: '700', 
                        color: colors.textPrimary,
                        marginBottom: 2,
                      }}>
                      {showBalance
                        ? formatCurrency(monthlyIncomeExpenses.expenses)
                        : "••••••"}
                    </Text>
                    {showBalance && monthlyIncomeExpenses.expenses === 0 && (
                      <Text className="text-xs text-text-primary mt-1">
                        Nenhuma despesa
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
          </Card>

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
                <Text className="text-text-primary text-xs">Ver todas</Text>
              </Pressable>
            </View>

            <View>
              {isLoading ? (
                <View className="items-center py-8">
                  <Text className="text-text-primary">
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
                  <Text className="text-text-primary text-center mb-4 text-sm">
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
