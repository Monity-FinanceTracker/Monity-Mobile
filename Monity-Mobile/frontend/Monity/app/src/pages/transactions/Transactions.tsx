import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../../components/molecules/Card";
import Button from "../../components/atoms/Button";
import {
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Car,
  Home,
  Coffee,
  Gamepad2,
  Edit,
  Trash2,
  X,
} from "lucide-react-native";
import { apiService, Transaction } from "../../services/apiService";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";

const getTransactionIcon = (categoryName: string) => {
  const categoryMap: { [key: string]: any } = {
    Alimentação: ShoppingCart,
    Transporte: Car,
    Moradia: Home,
    Entretenimento: Gamepad2,
    Saúde: TrendingUp,
    Educação: TrendingUp,
    Trabalho: TrendingUp,
    Receita: TrendingUp,
  };
  return categoryMap[categoryName] || ShoppingCart;
};

const filterOptions = [
  { value: "all", label: "Todas" },
  { value: "income", label: "Receitas" },
  { value: "expense", label: "Despesas" },
];

const periodOptions = [
  { value: "thisMonth", label: "Este Mês" },
  { value: "lastMonth", label: "Mês Passado" },
  { value: "thisYear", label: "Este Ano" },
  { value: "custom", label: "Personalizado" },
];

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("thisMonth");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTransactions({
        type:
          selectedFilter === "all"
            ? undefined
            : (selectedFilter as "income" | "expense"),
        search: searchTerm || undefined,
      });

      if (response.success && response.data) {
        setTransactions(response.data);
      } else {
        Alert.alert("Erro", "Falha ao carregar transações");
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      Alert.alert("Erro", "Falha ao carregar transações");
    } finally {
      setIsLoading(false);
    }
  };

  const { refreshControl } = usePullToRefresh({
    onRefresh: loadTransactions,
  });

  useEffect(() => {
    loadTransactions();
  }, [selectedFilter, searchTerm]);

  const filteredTransactions = transactions.filter((transaction) => {
    const title = transaction.title || transaction.description || "";
    const categoryName =
      transaction.category?.name || transaction.category || "";
    const transactionType =
      transaction.type ||
      (transaction.categoryId === "1" ? "expense" : "income");

    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof categoryName === "string"
        ? categoryName
        : categoryName.name || ""
      )
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesFilter =
      selectedFilter === "all" || transactionType === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
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

  const totalIncome = transactions
    .filter((t) => {
      const transactionType =
        t.type || (t.categoryId === "1" ? "expense" : "income");
      return transactionType === "income";
    })
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

  const totalExpenses = transactions
    .filter((t) => {
      const transactionType =
        t.type || (t.categoryId === "1" ? "expense" : "income");
      return transactionType === "expense";
    })
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowActionModal(true);
  };

  const handleEditTransaction = () => {
    setShowActionModal(false);
    // TODO: Navigate to edit screen or show edit modal
    Alert.alert("Editar", "Funcionalidade de edição será implementada em breve");
  };

  const handleDeleteTransaction = () => {
    if (!selectedTransaction) return;
    
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir esta transação?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await apiService.deleteTransaction(selectedTransaction.id);
              if (response.success) {
                Alert.alert("Sucesso", "Transação excluída com sucesso!");
                setShowActionModal(false);
                loadTransactions();
              } else {
                Alert.alert("Erro", response.error || "Falha ao excluir transação");
              }
            } catch (error) {
              console.error("Error deleting transaction:", error);
              Alert.alert("Erro", "Falha ao excluir transação");
            }
          },
        },
      ]
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    // Handle both old and new data formats
    const title = item.title || item.description || "Transação sem título";
    const categoryName =
      item.category?.name || item.category || "Sem categoria";
    const transactionType =
      item.type || (item.categoryId === "1" ? "expense" : "income");
    const amount = item.amount || 0;

    const Icon = getTransactionIcon(categoryName as string);
    return (
      <Pressable onPress={() => handleTransactionPress(item)}>
        <Card className="mb-3">
          <View className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center gap-3 flex-1">
              <View
                className={`w-12 h-12 rounded-lg items-center justify-center ${
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
              <View className="flex-1">
                <Text className="font-medium text-white text-sm">{title}</Text>
                <View className="flex-row items-center gap-2 mt-1">
                  <View className="bg-card-bg px-2 py-1 rounded-md">
                    <Text className="text-xs text-gray-300">
                      {categoryName as string}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-400">
                    {item.paymentMethod || "N/A"}
                  </Text>
                </View>
              </View>
            </View>
            <View className="items-end">
              <Text
                className={`text-base font-semibold ${
                  transactionType === "income" ? "text-green-400" : "text-red-400"
                }`}
              >
                {transactionType === "income" ? "+" : "-"}R$ {Math.abs(amount).toFixed(2)}
              </Text>
              <View className="flex-row items-center gap-1 mt-1">
                <Calendar size={12} color="white" />
                <Text className="text-xs text-gray-400">
                  {formatDate(item.date)}
                </Text>
                {item.time && (
                  <>
                    <Text className="text-xs text-gray-400">•</Text>
                    <Text className="text-xs text-gray-400">{item.time}</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["top", "left", "right"]}
    >
      <ScrollView 
        className="flex-1" 
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6 pb-6">
          <Text className="text-white text-lg font-bold mb-6">Transações</Text>

          {/* Summary Cards */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1">
              <Card className="p-0">
                <View className="flex-row items-center gap-3 p-4">
                  <View className="w-12 h-12 bg-income-bg rounded-xl items-center justify-center">
                    <TrendingUp size={24} color="#4ADE80" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-text-muted mb-1">Receitas</Text>
                    <Text className="text-base font-bold text-income">
                      R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              </Card>
            </View>

            <View className="flex-1">
              <Card className="p-0">
                <View className="flex-row items-center gap-3 p-4">
                  <View className="w-12 h-12 bg-expense-bg rounded-xl items-center justify-center">
                    <TrendingDown size={24} color="#F87171" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-text-muted mb-1">Despesas</Text>
                    <Text className="text-base font-bold text-expense">
                      R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
          </View>

          {/* Search Bar */}
          <View className="relative mb-4">
            <TextInput
              placeholder="Buscar transações..."
              placeholderTextColor="#9CA3AF"
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="bg-card-bg border border-border-default rounded-xl pl-10 pr-4 py-3 text-white"
            />
          </View>

          {/* Filter Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          >
            <View className="flex-row gap-2">
              {filterOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setSelectedFilter(option.value)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedFilter === option.value
                      ? "bg-accent"
                      : "bg-card-bg border border-border-default"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedFilter === option.value
                        ? "text-[#191E29]"
                        : "text-gray-300"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
              <View className="w-px bg-[#4B5563] mx-2" />
              {periodOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setSelectedPeriod(option.value)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedPeriod === option.value
                      ? "bg-card-bg"
                      : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      selectedPeriod === option.value
                        ? "text-white"
                        : "text-gray-400"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Transactions List Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm font-semibold text-white">
              {filteredTransactions.length} transações encontradas
            </Text>
            <Pressable className="flex-row items-center gap-2">
              <Filter size={16} color="white" />
              <Text className="text-gray-400 text-xs">Filtros</Text>
            </Pressable>
          </View>

          {/* Transactions List */}
          {isLoading ? (
            <View className="items-center py-12">
              <Text className="text-gray-400">Carregando transações...</Text>
            </View>
          ) : filteredTransactions.length > 0 ? (
            <FlatList
              data={filteredTransactions}
              keyExtractor={(item) => item.id}
              renderItem={renderTransaction}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View className="items-center py-12">
              <View className="w-16 h-16 bg-card-bg rounded-full items-center justify-center mb-4">
                <Search size={24} color="white" />
              </View>
              <Text className="text-base font-medium text-white mb-2">
                Nenhuma transação encontrada
              </Text>
              <Text className="text-gray-400 text-center text-sm">
                Tente ajustar os filtros ou termo de busca
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Transaction Action Modal */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowActionModal(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View className="bg-secondary-bg rounded-t-3xl p-6">
              {selectedTransaction && (
                <>
                  {/* Transaction Details */}
                  <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-white text-lg font-bold">
                      Ações da Transação
                    </Text>
                    <Pressable
                      onPress={() => setShowActionModal(false)}
                      className="w-8 h-8 bg-card-bg rounded-full items-center justify-center"
                    >
                      <X size={16} color="white" />
                    </Pressable>
                  </View>

                  {/* Transaction Info */}
                  <Card className="mb-6">
                    <View className="p-4">
                      <Text className="text-white font-semibold text-base mb-2">
                        {selectedTransaction.title || selectedTransaction.description || "Transação"}
                      </Text>
                      <View className="flex-row items-center gap-2 mb-2">
                        <View className="bg-card-bg px-2 py-1 rounded-md">
                          <Text className="text-xs text-gray-300">
                            {selectedTransaction.category?.name || selectedTransaction.category || "Sem categoria"}
                          </Text>
                        </View>
                        <Text className="text-xs text-gray-400">
                          {selectedTransaction.paymentMethod || "N/A"}
                        </Text>
                      </View>
                      <Text
                        className={`text-xl font-bold ${
                          (selectedTransaction.type || (selectedTransaction.categoryId === "1" ? "expense" : "income")) === "income"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {(selectedTransaction.type || (selectedTransaction.categoryId === "1" ? "expense" : "income")) === "income" ? "+" : "-"}
                        R$ {Math.abs(selectedTransaction.amount || 0).toFixed(2)}
                      </Text>
                    </View>
                  </Card>

                  {/* Action Buttons */}
                  <View className="gap-3">
                    <Pressable
                      onPress={handleEditTransaction}
                      className="bg-accent rounded-xl p-4 flex-row items-center justify-center gap-3"
                    >
                      <Edit size={20} color="white" />
                      <Text className="text-[#191E29] font-semibold text-base">
                        Editar Transação
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handleDeleteTransaction}
                      className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex-row items-center justify-center gap-3"
                    >
                      <Trash2 size={20} color="#EF4444" />
                      <Text className="text-red-400 font-semibold text-base">
                        Excluir Transação
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setShowActionModal(false)}
                      className="bg-card-bg rounded-xl p-4 flex-row items-center justify-center"
                    >
                      <Text className="text-gray-300 font-semibold text-base">
                        Cancelar
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
