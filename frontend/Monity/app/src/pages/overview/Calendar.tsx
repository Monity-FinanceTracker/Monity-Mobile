import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../constants/colors";
import { apiService, Transaction } from "../../services/apiService";
import { errorService } from "../../services/errorService";
import { ChevronLeft, ChevronRight, X, ArrowLeft, Repeat } from "lucide-react-native";
import { triggerHaptic } from "../../utils/haptics";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Calendar() {
  const colors = COLORS;
  const navigation = useNavigation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<
    (Transaction & { recurrenceDay?: number; startDate?: string })[]
  >([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateTransactions, setSelectedDateTransactions] = useState<
    Transaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get first and last day of current month
  const monthStart = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, 1);
  }, [currentDate]);

  const monthEnd = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month + 1, 0);
  }, [currentDate]);

  // Load transactions for the current month
  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const startDate = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth(),
        1
      )
        .toISOString()
        .split("T")[0];
      const endDate = new Date(
        monthEnd.getFullYear(),
        monthEnd.getMonth(),
        monthEnd.getDate()
      )
        .toISOString()
        .split("T")[0];

      const [transactionsResponse, recurringResponse] = await Promise.all([
        apiService.getTransactions({
          startDate,
          endDate,
        }),
        apiService.getRecurringTransactions(),
      ]);

      if (transactionsResponse.success && transactionsResponse.data) {
        setTransactions(transactionsResponse.data);
      }

      if (recurringResponse.success && recurringResponse.data) {
        setRecurringTransactions(recurringResponse.data);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      errorService.showLoadingError('transações', {
        onRetry: loadTransactions,
      });
    } finally {
      setIsLoading(false);
    }
  }, [monthStart, monthEnd]);

  const { refreshControl } = usePullToRefresh({
    onRefresh: async () => {
      await loadTransactions();
      return Promise.resolve();
    },
  });

  useEffect(() => {
    loadTransactions();
  }, [currentDate, loadTransactions]);

  // Generate virtual transactions from recurring transactions for the current month
  const generateRecurringTransactionsForMonth = useMemo(() => {
    const virtualTransactions: Transaction[] = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    recurringTransactions.forEach((recurring) => {
      if (!recurring.recurrenceDay) return;

      const day = recurring.recurrenceDay;
      const recurringStartDate = recurring.startDate 
        ? new Date(recurring.startDate + "T00:00:00")
        : null;

      // Check if the day exists in this month (e.g., Feb 30 doesn't exist)
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      if (day > daysInMonth) return;

      // Create date for this month (normalize to start of day)
      const transactionDate = new Date(year, month, day);
      transactionDate.setHours(0, 0, 0, 0);
      
      // Check if transaction should be shown (after startDate if it exists)
      if (recurringStartDate) {
        recurringStartDate.setHours(0, 0, 0, 0);
        if (transactionDate < recurringStartDate) {
          return;
        }
      }

      // Create virtual transaction
      const virtualTransaction: Transaction = {
        ...recurring,
        id: `${recurring.id}-${year}-${month}-${day}`, // Unique ID for virtual transaction
        date: transactionDate.toISOString().split("T")[0],
        isRecurring: true,
      };

      virtualTransactions.push(virtualTransaction);
    });

    return virtualTransactions;
  }, [recurringTransactions, currentDate]);

  // Group transactions by date (including virtual recurring transactions)
  const transactionsByDate = useMemo(() => {
    const grouped: { [key: string]: Transaction[] } = {};
    
    // Add regular transactions
    transactions.forEach((transaction) => {
      const date = transaction.date.split("T")[0]; // Get YYYY-MM-DD
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });

    // Add virtual recurring transactions
    generateRecurringTransactionsForMonth.forEach((transaction) => {
      const date = transaction.date.split("T")[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });

    return grouped;
  }, [transactions, generateRecurringTransactionsForMonth]);

  // Get calendar days
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    const startDay = monthStart.getDay(); // 0 = Sunday, 6 = Saturday

    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= monthEnd.getDate(); day++) {
      days.push(
        new Date(
          monthStart.getFullYear(),
          monthStart.getMonth(),
          day
        )
      );
    }

    return days;
  }, [monthStart, monthEnd]);

  const goToPreviousMonth = () => {
    triggerHaptic();
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    triggerHaptic();
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleDayPress = (date: Date) => {
    triggerHaptic();
    const dateStr = date.toISOString().split("T")[0];
    const dayTransactions = transactionsByDate[dateStr] || [];
    // Sort transactions: recurring first, then by amount
    const sortedTransactions = [...dayTransactions].sort((a, b) => {
      if (a.isRecurring && !b.isRecurring) return -1;
      if (!a.isRecurring && b.isRecurring) return 1;
      return Math.abs(b.amount) - Math.abs(a.amount);
    });
    setSelectedDate(date);
    setSelectedDateTransactions(sortedTransactions);
  };

  const closeModal = () => {
    triggerHaptic();
    setSelectedDate(null);
    setSelectedDateTransactions([]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
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
        <View className="px-6 pt-6">
          {/* Header */}
          <View className="mb-6">
            <View className="flex-row items-center gap-4 mb-4">
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
                <Text className="text-white text-2xl font-bold">
                  Calendário
                </Text>
                <Text className="text-text-primary text-sm">
                  Visualize suas transações por dia
                </Text>
              </View>
            </View>
          </View>

          {/* Month Navigation */}
          <View className="flex-row items-center justify-between mb-6">
            <Pressable
              onPress={goToPreviousMonth}
              className="p-2 rounded-full"
              style={{ backgroundColor: colors.border }}
            >
              <ChevronLeft size={24} color={colors.textPrimary} />
            </Pressable>

            <Text className="text-white text-xl font-semibold">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>

            <Pressable
              onPress={goToNextMonth}
              className="p-2 rounded-full"
              style={{ backgroundColor: colors.border }}
            >
              <ChevronRight size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Calendar */}
          <View
            style={{
              backgroundColor: colors.border,
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
            }}
          >
            {/* Weekday Headers */}
            <View className="flex-row mb-2">
              {WEEKDAYS.map((day) => (
                <View key={day} className="flex-1 items-center py-2">
                  <Text className="text-text-primary text-xs font-medium">
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Days */}
            <View className="flex-row flex-wrap">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return (
                    <View key={`empty-${index}`} className="w-[14.28%] aspect-square" />
                  );
                }

                const dateStr = date.toISOString().split("T")[0];
                const hasTransactions = !!transactionsByDate[dateStr];
                const dayTransactions = transactionsByDate[dateStr] || [];
                const isCurrentDay = isToday(date);
                const isSelectedDay = isSelected(date);

                return (
                  <Pressable
                    key={dateStr}
                    onPress={() => handleDayPress(date)}
                    className="w-[14.28%] aspect-square items-center justify-center"
                  >
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        backgroundColor: isSelectedDay
                          ? colors.accent
                          : isCurrentDay
                          ? colors.accentLight
                          : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          color: isSelectedDay
                            ? colors.background
                            : isCurrentDay
                            ? colors.accent
                            : colors.textPrimary,
                          fontSize: 16,
                          fontWeight: isCurrentDay || isSelectedDay
                            ? "600"
                            : "400",
                        }}
                      >
                        {date.getDate()}
                      </Text>
                      {hasTransactions && (
                        <View className="flex-row items-center gap-1 mt-1">
                          {dayTransactions.some((t) => t.isRecurring) && (
                            <Repeat 
                              size={8} 
                              color={isSelectedDay ? colors.background : colors.accent}
                            />
                          )}
                          <View
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: isSelectedDay
                                ? colors.background
                                : colors.accent,
                            }}
                          />
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Summary */}
          <View
            style={{
              backgroundColor: colors.border,
              borderRadius: 16,
              padding: 16,
            }}
          >
            <Text className="text-white text-lg font-semibold mb-4">
              Resumo do Mês
            </Text>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-text-primary text-sm mb-1">Receitas</Text>
                <Text
                  style={{ color: colors.income }}
                  className="text-lg font-semibold"
                >
                  {formatCurrency(
                    [...transactions, ...generateRecurringTransactionsForMonth]
                      .filter((t) => t.type === "income")
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </Text>
              </View>
              <View>
                <Text className="text-text-primary text-sm mb-1">Despesas</Text>
                <Text
                  style={{ color: colors.expense }}
                  className="text-lg font-semibold"
                >
                  {formatCurrency(
                    [...transactions, ...generateRecurringTransactionsForMonth]
                      .filter((t) => t.type === "expense")
                      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                  )}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal for Selected Date Transactions */}
      <Modal
        visible={selectedDate !== null}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={closeModal}
          />
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 20,
              paddingBottom: 40,
              maxHeight: "80%",
            }}
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-6 mb-4">
              <View className="flex-1">
                <Text className="text-white text-xl font-bold">
                  {selectedDate ? formatDate(selectedDate) : ""}
                </Text>
                <Text className="text-text-primary text-sm mt-1">
                  {selectedDateTransactions.length}{" "}
                  {selectedDateTransactions.length === 1
                    ? "transação"
                    : "transações"}
                  {selectedDateTransactions.some((t) => t.isRecurring) && (
                    <Text className="text-text-secondary"> • Recorrentes</Text>
                  )}
                </Text>
              </View>
              <Pressable
                onPress={closeModal}
                className="p-2 rounded-full"
                style={{ backgroundColor: colors.border }}
              >
                <X size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            {/* Transactions List */}
            {selectedDateTransactions.length === 0 ? (
              <View className="px-6 py-8 items-center">
                <Text className="text-text-primary text-base">
                  Nenhuma transação neste dia
                </Text>
              </View>
            ) : (
              <FlatList
                data={selectedDateTransactions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 24 }}
                renderItem={({ item }) => (
                  <View
                    style={{
                      backgroundColor: colors.border,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-white text-base font-semibold">
                            {item.title || item.description}
                          </Text>
                          {item.isRecurring && (
                            <Repeat size={14} color={colors.accent} />
                          )}
                        </View>
                        {item.description && item.title && (
                          <Text className="text-text-primary text-sm mb-2">
                            {item.description}
                          </Text>
                        )}
                        {item.category && (
                          <View className="flex-row items-center">
                            <View
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: 6,
                                backgroundColor: item.category.color,
                                marginRight: 6,
                              }}
                            />
                            <Text className="text-text-primary text-sm">
                              {item.category.name}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={{
                          color:
                            item.type === "income"
                              ? colors.income
                              : colors.expense,
                          fontSize: 18,
                          fontWeight: "600",
                        }}
                      >
                        {item.type === "income" ? "+" : "-"}
                        {formatCurrency(Math.abs(item.amount))}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

