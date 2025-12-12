import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS } from "../../constants/colors";
import { apiService } from "../../services/apiService";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { triggerHaptic } from "../../utils/haptics";
import Card from "../../components/molecules/Card";
import {
  ArrowLeft,
  Plus,
  Calendar as CalendarIcon,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react-native";

interface ScheduledTransaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  typeId: number;
  next_execution_date: string;
  recurrence_pattern: string;
  recurrence_interval: number;
  is_active: boolean;
}

interface CalendarDay {
  date: string;
  balance: number;
  income: number;
  expenses: number;
  scheduledTransactions: ScheduledTransaction[];
}

export default function CashFlowCalendar() {
  const colors = COLORS;
  const navigation = useNavigation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: "",
    category: "",
    typeId: 1, // 1 = expense, 2 = income
    scheduled_date: new Date(),
    recurrence_pattern: "once",
    recurrence_interval: 1,
    recurrence_end_date: null as Date | null,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRecurrenceEndPicker, setShowRecurrenceEndPicker] = useState(false);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const startDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      );
      const endDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
      );

      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];

      const response = await apiService.getCalendarData(startStr, endStr);
      if (response.success && response.data) {
        setCalendarData(response.data);
      } else {
        Alert.alert("Erro", response.error || "Falha ao carregar calendário");
      }
    } catch (error) {
      console.error("Error loading calendar data:", error);
      Alert.alert("Erro", "Falha ao carregar dados do calendário");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadCalendarData();
    }, [currentMonth])
  );

  const { refreshControl } = usePullToRefresh({
    onRefresh: loadCalendarData,
  });

  const handlePreviousMonth = () => {
    triggerHaptic();
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    triggerHaptic();
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleDateSelect = (date: string) => {
    triggerHaptic();
    setSelectedDate(date);
    const day = calendarData.find((d) => d.date === date);
    setSelectedDay(day || null);
  };

  const handleCreateScheduledTransaction = async () => {
    if (
      !newTransaction.description ||
      !newTransaction.amount ||
      !newTransaction.category
    ) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    try {
      const amount = parseFloat(newTransaction.amount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert("Erro", "Valor deve ser maior que zero");
        return;
      }

      const scheduledDate = newTransaction.scheduled_date
        .toISOString()
        .split("T")[0];

      const data: any = {
        description: newTransaction.description,
        amount: amount,
        category: newTransaction.category,
        typeId: newTransaction.typeId,
        scheduled_date: scheduledDate,
        recurrence_pattern: newTransaction.recurrence_pattern,
        recurrence_interval: newTransaction.recurrence_interval,
      };

      if (
        newTransaction.recurrence_pattern !== "once" &&
        newTransaction.recurrence_end_date
      ) {
        data.recurrence_end_date = newTransaction.recurrence_end_date
          .toISOString()
          .split("T")[0];
      }

      const response = await apiService.createScheduledTransaction(data);

      if (response.success) {
        Alert.alert("Sucesso", "Transação agendada criada com sucesso!");
        setShowAddModal(false);
        setNewTransaction({
          description: "",
          amount: "",
          category: "",
          typeId: 1,
          scheduled_date: new Date(),
          recurrence_pattern: "once",
          recurrence_interval: 1,
          recurrence_end_date: null,
        });
        loadCalendarData();
      } else {
        Alert.alert("Erro", response.error || "Falha ao criar transação");
      }
    } catch (error) {
      console.error("Error creating scheduled transaction:", error);
      Alert.alert("Erro", "Erro ao criar transação agendada");
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add days from previous month to fill first week
    const startDay = firstDay.getDay();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }

    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    // Add days from next month to fill last week
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day));
    }

    return days;
  };

  const getDayData = (date: Date): CalendarDay | null => {
    const dateStr = date.toISOString().split("T")[0];
    return calendarData.find((d) => d.date === dateStr) || null;
  };

  const isCurrentMonth = (date: Date) => {
    return (
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const days = getDaysInMonth();
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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
                  Calendário de Fluxo
                </Text>
                <Text className="text-text-primary text-sm">
                  Transações agendadas
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                triggerHaptic();
                setShowAddModal(true);
              }}
              className="w-10 h-10 bg-accent rounded-full items-center justify-center"
            >
              <Plus size={20} color="#191E29" />
            </Pressable>
          </View>

          {/* Month Navigation */}
          <Card className="p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <Pressable onPress={handlePreviousMonth} className="p-2">
                <ChevronLeft size={24} color={colors.textPrimary} />
              </Pressable>
              <Text className="text-text-primary text-lg font-semibold capitalize">
                {getMonthName(currentMonth)}
              </Text>
              <Pressable onPress={handleNextMonth} className="p-2">
                <ChevronRight size={24} color={colors.textPrimary} />
              </Pressable>
            </View>
          </Card>

          {/* Calendar Grid */}
          <Card className="p-4 mb-4">
            {/* Week day headers */}
            <View className="flex-row mb-2">
              {weekDays.map((day, index) => (
                <View key={index} className="flex-1 items-center">
                  <Text className="text-text-secondary text-xs font-semibold">
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar days */}
            <View className="flex-row flex-wrap">
              {days.map((date, index) => {
                const dayData = getDayData(date);
                const isCurrent = isCurrentMonth(date);
                const isSelected = selectedDate === date.toISOString().split("T")[0];
                const isTodayDate = isToday(date);

                return (
                  <Pressable
                    key={index}
                    onPress={() => {
                      if (isCurrent) {
                        handleDateSelect(date.toISOString().split("T")[0]);
                      }
                    }}
                    className={`w-[14.28%] aspect-square items-center justify-center ${
                      !isCurrent ? "opacity-30" : ""
                    } ${isSelected ? "bg-accent/20 rounded-lg" : ""}`}
                  >
                    <Text
                      className={`text-sm ${
                        isTodayDate
                          ? "text-accent font-bold"
                          : isCurrent
                          ? "text-text-primary"
                          : "text-text-secondary"
                      }`}
                    >
                      {date.getDate()}
                    </Text>
                    {dayData && dayData.scheduledTransactions.length > 0 && (
                      <View className="absolute bottom-1">
                        <View className="w-1.5 h-1.5 bg-accent rounded-full" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Selected Day Details */}
          {selectedDay && (
            <Card className="p-4 mb-4">
              <Text className="text-text-primary text-lg font-semibold mb-3">
                {formatDate(selectedDay.date)}
              </Text>
              <View className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-text-secondary">Saldo Projetado</Text>
                  <Text
                    className={`font-semibold ${
                      selectedDay.balance >= 0
                        ? "text-success"
                        : "text-error"
                    }`}
                  >
                    {formatCurrency(selectedDay.balance)}
                  </Text>
                </View>
                {selectedDay.income > 0 && (
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <TrendingUp size={16} color={colors.success} />
                      <Text className="text-text-secondary">Receitas</Text>
                    </View>
                    <Text className="text-success font-semibold">
                      {formatCurrency(selectedDay.income)}
                    </Text>
                  </View>
                )}
                {selectedDay.expenses > 0 && (
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <TrendingDown size={16} color={colors.error} />
                      <Text className="text-text-secondary">Despesas</Text>
                    </View>
                    <Text className="text-error font-semibold">
                      {formatCurrency(selectedDay.expenses)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Scheduled Transactions */}
              {selectedDay.scheduledTransactions.length > 0 && (
                <View className="mt-4 pt-4 border-t border-border-default">
                  <Text className="text-text-primary font-semibold mb-2">
                    Transações Agendadas
                  </Text>
                  <View className="gap-2">
                    {selectedDay.scheduledTransactions.map((txn) => (
                      <View
                        key={txn.id}
                        className="flex-row items-center justify-between p-2 bg-card-bg rounded-lg"
                      >
                        <View className="flex-1">
                          <Text className="text-text-primary text-sm">
                            {txn.description}
                          </Text>
                          <Text className="text-text-secondary text-xs">
                            {txn.category}
                          </Text>
                        </View>
                        <Text
                          className={`font-semibold ${
                            txn.typeId === 2 ? "text-success" : "text-error"
                          }`}
                        >
                          {txn.typeId === 2 ? "+" : "-"}
                          {formatCurrency(Math.abs(txn.amount))}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Add Scheduled Transaction Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-background rounded-t-3xl p-6 max-h-[90%]">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-text-primary text-xl font-bold">
                  Nova Transação Agendada
                </Text>
                <Pressable
                  onPress={() => setShowAddModal(false)}
                  className="p-2"
                >
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
                      value={newTransaction.description}
                      onChangeText={(text) =>
                        setNewTransaction({
                          ...newTransaction,
                          description: text,
                        })
                      }
                      placeholder="Ex: Salário, Aluguel..."
                      placeholderTextColor={colors.textMuted}
                      className="bg-card-bg text-text-primary px-4 py-3 rounded-xl border border-border-default"
                    />
                  </View>

                  <View>
                    <Text className="text-text-primary font-semibold mb-2">
                      Valor
                    </Text>
                    <TextInput
                      value={newTransaction.amount}
                      onChangeText={(text) =>
                        setNewTransaction({ ...newTransaction, amount: text })
                      }
                      placeholder="0,00"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      className="bg-card-bg text-text-primary px-4 py-3 rounded-xl border border-border-default"
                    />
                  </View>

                  <View>
                    <Text className="text-text-primary font-semibold mb-2">
                      Categoria
                    </Text>
                    <TextInput
                      value={newTransaction.category}
                      onChangeText={(text) =>
                        setNewTransaction({ ...newTransaction, category: text })
                      }
                      placeholder="Ex: Alimentação, Receita..."
                      placeholderTextColor={colors.textMuted}
                      className="bg-card-bg text-text-primary px-4 py-3 rounded-xl border border-border-default"
                    />
                  </View>

                  <View>
                    <Text className="text-text-primary font-semibold mb-2">
                      Tipo
                    </Text>
                    <View className="flex-row gap-3">
                      <Pressable
                        onPress={() =>
                          setNewTransaction({ ...newTransaction, typeId: 1 })
                        }
                        className={`flex-1 py-3 rounded-xl items-center ${
                          newTransaction.typeId === 1
                            ? "bg-error/20 border-2 border-error"
                            : "bg-card-bg border border-border-default"
                        }`}
                      >
                        <Text
                          className={`font-semibold ${
                            newTransaction.typeId === 1
                              ? "text-error"
                              : "text-text-primary"
                          }`}
                        >
                          Despesa
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          setNewTransaction({ ...newTransaction, typeId: 2 })
                        }
                        className={`flex-1 py-3 rounded-xl items-center ${
                          newTransaction.typeId === 2
                            ? "bg-success/20 border-2 border-success"
                            : "bg-card-bg border border-border-default"
                        }`}
                      >
                        <Text
                          className={`font-semibold ${
                            newTransaction.typeId === 2
                              ? "text-success"
                              : "text-text-primary"
                          }`}
                        >
                          Receita
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View>
                    <Text className="text-text-primary font-semibold mb-2">
                      Data Agendada
                    </Text>
                    <Pressable
                      onPress={() => setShowDatePicker(true)}
                      className="bg-card-bg px-4 py-3 rounded-xl border border-border-default flex-row items-center justify-between"
                    >
                      <Text className="text-text-primary">
                        {newTransaction.scheduled_date.toLocaleDateString("pt-BR")}
                      </Text>
                      <CalendarIcon size={20} color={colors.textSecondary} />
                    </Pressable>
                    {showDatePicker && (
                      <DateTimePicker
                        value={newTransaction.scheduled_date}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={(event, date) => {
                          setShowDatePicker(Platform.OS === "ios");
                          if (date) {
                            setNewTransaction({
                              ...newTransaction,
                              scheduled_date: date,
                            });
                          }
                        }}
                        minimumDate={new Date()}
                      />
                    )}
                  </View>

                  <View>
                    <Text className="text-text-primary font-semibold mb-2">
                      Recorrência
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {["once", "daily", "weekly", "monthly", "yearly"].map(
                        (pattern) => (
                          <Pressable
                            key={pattern}
                            onPress={() =>
                              setNewTransaction({
                                ...newTransaction,
                                recurrence_pattern: pattern,
                              })
                            }
                            className={`px-4 py-2 rounded-lg ${
                              newTransaction.recurrence_pattern === pattern
                                ? "bg-accent"
                                : "bg-card-bg border border-border-default"
                            }`}
                          >
                            <Text
                              className={`text-sm font-medium ${
                                newTransaction.recurrence_pattern === pattern
                                  ? "text-[#191E29]"
                                  : "text-text-primary"
                              }`}
                            >
                              {pattern === "once"
                                ? "Única"
                                : pattern === "daily"
                                ? "Diária"
                                : pattern === "weekly"
                                ? "Semanal"
                                : pattern === "monthly"
                                ? "Mensal"
                                : "Anual"}
                            </Text>
                          </Pressable>
                        )
                      )}
                    </View>
                  </View>

                  {newTransaction.recurrence_pattern !== "once" && (
                    <View>
                      <Text className="text-text-primary font-semibold mb-2">
                        Data Final (opcional)
                      </Text>
                      <Pressable
                        onPress={() => setShowRecurrenceEndPicker(true)}
                        className="bg-card-bg px-4 py-3 rounded-xl border border-border-default flex-row items-center justify-between"
                      >
                        <Text className="text-text-primary">
                          {newTransaction.recurrence_end_date
                            ? newTransaction.recurrence_end_date.toLocaleDateString(
                                "pt-BR"
                              )
                            : "Sem data final"}
                        </Text>
                        <CalendarIcon size={20} color={colors.textSecondary} />
                      </Pressable>
                      {showRecurrenceEndPicker && (
                        <DateTimePicker
                          value={
                            newTransaction.recurrence_end_date || new Date()
                          }
                          mode="date"
                          display={
                            Platform.OS === "ios" ? "spinner" : "default"
                          }
                          onChange={(event, date) => {
                            setShowRecurrenceEndPicker(Platform.OS === "ios");
                            if (date) {
                              setNewTransaction({
                                ...newTransaction,
                                recurrence_end_date: date,
                              });
                            }
                          }}
                          minimumDate={newTransaction.scheduled_date}
                        />
                      )}
                    </View>
                  )}

                  <Pressable
                    onPress={handleCreateScheduledTransaction}
                    className="bg-accent py-4 rounded-xl items-center mt-4"
                  >
                    <Text className="text-[#191E29] font-semibold text-base">
                      Criar Transação Agendada
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}


