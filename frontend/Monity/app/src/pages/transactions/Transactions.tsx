import React, { useEffect, useState } from "react";
import {
  View,
  Text,
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
import { COLORS } from "../../constants/colors";
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
  Star,
  ArrowDown,
  ArrowUp,
} from "lucide-react-native";
import { apiService, Transaction } from "../../services/apiService";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { triggerHaptic } from "../../utils/haptics";

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
  { value: "favorites", label: "Favoritas" },
];

const periodOptions = [
  { value: "thisMonth", label: "Este Mês" },
  { value: "lastMonth", label: "Mês Passado" },
  { value: "thisYear", label: "Este Ano" },
  { value: "custom", label: "Personalizado" },
];

export default function Transactions() {
  const colors = COLORS;
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
    
    let matchesFilter = false;
    if (selectedFilter === "all") {
      matchesFilter = true;
    } else if (selectedFilter === "favorites") {
      matchesFilter = transaction.isFavorite === true;
    } else {
      matchesFilter = transactionType === selectedFilter;
    }
    
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

  const getDateKey = (dateString: string): string => {
    // Get a consistent date key for grouping (format: YYYY-MM-DD for proper sorting)
    let date: Date;
    if (dateString.includes("-") && !dateString.includes("T")) {
      const [year, month, day] = dateString.split("-").map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateString);
    }
    // Return in YYYY-MM-DD format for proper string sorting
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const groupTransactionsByDate = (transactions: Transaction[]) => {
    // Sort transactions by date descending (most recent first) before grouping
    const sortedTransactions = [...transactions].sort((a, b) => {
      let dateA: Date;
      let dateB: Date;
      
      if (a.date.includes("-") && !a.date.includes("T")) {
        const [year, month, day] = a.date.split("-").map(Number);
        dateA = new Date(year, month - 1, day);
      } else {
        dateA = new Date(a.date);
      }
      
      if (b.date.includes("-") && !b.date.includes("T")) {
        const [year, month, day] = b.date.split("-").map(Number);
        dateB = new Date(year, month - 1, day);
      } else {
        dateB = new Date(b.date);
      }
      
      // Sort descending (most recent first)
      return dateB.getTime() - dateA.getTime();
    });

    const grouped: { [key: string]: Transaction[] } = {};
    sortedTransactions.forEach((transaction) => {
      const dateKey = getDateKey(transaction.date);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });
    return grouped;
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
    triggerHaptic();
    setShowActionModal(false);
    // TODO: Navigate to edit screen or show edit modal
    Alert.alert("Editar", "Funcionalidade de edição será implementada em breve");
  };

  const handleDeleteTransaction = () => {
    if (!selectedTransaction) return;
    triggerHaptic();
    
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

  const handleToggleFavorite = async () => {
    if (!selectedTransaction) return;
    triggerHaptic();
    
    try {
      const newFavoriteStatus = !selectedTransaction.isFavorite;
      const response = await apiService.updateTransaction(selectedTransaction.id, {
        isFavorite: newFavoriteStatus,
      });
      
      if (response.success) {
        // Update the transaction in the list
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === selectedTransaction.id
              ? { ...t, isFavorite: newFavoriteStatus }
              : t
          )
        );
        // Update selected transaction
        setSelectedTransaction({
          ...selectedTransaction,
          isFavorite: newFavoriteStatus,
        });
        // Reload transactions to ensure we have the latest data
        await loadTransactions();
      } else {
        Alert.alert("Erro", response.error || "Falha ao atualizar favorito");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Erro", "Falha ao atualizar favorito");
    }
  };

  const renderTransaction = (item: Transaction, isFirstInGroup: boolean = false) => {
    // Handle both old and new data formats
    const title = item.title || item.description || "Transação sem título";
    const categoryName =
      item.category?.name || item.category || "Sem categoria";
    const transactionType =
      item.type || (item.categoryId === "1" ? "expense" : "income");
    const amount = item.amount || 0;
    const isFavorite = item.isFavorite === true;

    // Use arrows instead of category icons
    const ArrowIcon = transactionType === "income" ? ArrowDown : ArrowUp;
    const arrowColor = transactionType === "income" ? "#4ADE80" : "#FFFFFF"; // Green-400 for income, white for expense
    
    return (
      <Pressable 
        onPress={() => handleTransactionPress(item)}
        className="py-3"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1">
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
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="font-medium text-white text-xs">{title}</Text>
                {isFavorite && (
                  <Star size={12} color={colors.accent} fill={colors.accent} />
                )}
              </View>
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
              R$ {Math.abs(amount).toFixed(2)}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderTransactionGroup = (dateKey: string, transactions: Transaction[], index: number, allKeys: string[]) => {
    const firstTransaction = transactions[0];
    const formattedDate = formatDate(firstTransaction.date);
    const isFirstGroup = index === 0;

    return (
      <View key={dateKey}>
        {!isFirstGroup && (
          <View className="h-px bg-border-default my-3" />
        )}
        <View className="mb-2">
          <Text className="text-[14px] text-gray-400 mb-2">
            {formattedDate}
          </Text>
          {transactions.map((transaction, idx) => (
            <View key={transaction.id}>
              {renderTransaction(transaction, idx === 0)}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <ScrollView 
        style={{ flex: 1 }} 
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6 pb-6">
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>Transações</Text>

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
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: selectedFilter === option.value
                        ? "#191E29"
                        : colors.textGray
                    }}
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
                    style={{
                      fontSize: 14,
                      color: selectedPeriod === option.value
                        ? colors.textPrimary
                        : colors.textMuted
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Transactions List Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>
              {filteredTransactions.length} transações encontradas
            </Text>
            <Pressable className="flex-row items-center gap-2">
              <Filter size={16} color={colors.textPrimary} />
              <Text style={{ fontSize: 12, color: colors.textMuted }}>Filtros</Text>
            </Pressable>
          </View>

          {/* Transactions List */}
          {isLoading ? (
            <View className="items-center py-12">
              <Text style={{ color: colors.textMuted }}>Carregando transações...</Text>
            </View>
          ) : filteredTransactions.length > 0 ? (
            <View>
              {(() => {
                const grouped = groupTransactionsByDate(filteredTransactions);
                const sortedKeys = Object.keys(grouped).sort((a, b) => {
                  // Sort by date descending (most recent first)
                  // Since dateKey is in YYYY-MM-DD format, string comparison works correctly
                  return b.localeCompare(a);
                });
                return sortedKeys.map((dateKey, index) =>
                  renderTransactionGroup(dateKey, grouped[dateKey], index, sortedKeys)
                );
              })()}
            </View>
          ) : (
            <View className="items-center py-12">
              <View className="w-16 h-16 bg-card-bg rounded-full items-center justify-center mb-4">
                <Search size={24} color={colors.textPrimary} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '500', color: colors.textPrimary, marginBottom: 8 }}>
                Nenhuma transação encontrada
              </Text>
              <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 14 }}>
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
            <View className="bg-background rounded-t-3xl p-6">
              {selectedTransaction && (
                <>
                  {/* Transaction Details */}
                  <View className="flex-row items-center justify-between mb-6">
                    <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
                      Ações da Transação
                    </Text>
                    <Pressable
                      onPress={() => setShowActionModal(false)}
                      className="w-8 h-8 bg-card-bg rounded-full items-center justify-center"
                    >
                      <X size={16} color={colors.textPrimary} />
                    </Pressable>
                  </View>

                  {/* Transaction Info */}
                  <Card className="mb-6">
                    <View className="p-4">
                      <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 16, marginBottom: 8 }}>
                        {selectedTransaction.title || selectedTransaction.description || "Transação"}
                      </Text>
                      <View className="flex-row items-center gap-2 mb-2">
                        <View className="bg-card-bg py-1 rounded-md">
                          <Text style={{ fontSize: 12, color: colors.textGray }}>
                            {(selectedTransaction.category?.name || selectedTransaction.category || "Sem categoria") as string}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: 'bold',
                          color: (selectedTransaction.type || (selectedTransaction.categoryId === "1" ? "expense" : "income")) === "income"
                            ? colors.income
                            : colors.expense
                        }}
                      >
                        {(selectedTransaction.type || (selectedTransaction.categoryId === "1" ? "expense" : "income")) === "income" ? "+" : "-"}
                        R$ {Math.abs(selectedTransaction.amount || 0).toFixed(2)}
                      </Text>
                    </View>
                  </Card>

                  {/* Action Buttons */}
                  <View className="gap-3">
                    <Pressable
                      onPress={handleToggleFavorite}
                      className={`${
                        selectedTransaction.isFavorite
                          ? "bg-accent/20 border border-accent"
                          : "bg-card-bg border border-border-default"
                      } rounded-xl p-4 flex-row items-center justify-center gap-3`}
                    >
                      <Star
                        size={20}
                        color={selectedTransaction.isFavorite ? colors.accent : colors.textGray}
                        fill={selectedTransaction.isFavorite ? colors.accent : "transparent"}
                      />
                      <Text
                        style={{
                          color: selectedTransaction.isFavorite ? colors.accent : colors.textGray,
                          fontWeight: "600",
                          fontSize: 16,
                        }}
                      >
                        {selectedTransaction.isFavorite
                          ? "Remover dos Favoritos"
                          : "Adicionar aos Favoritos"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handleEditTransaction}
                      className="bg-accent rounded-xl p-4 flex-row items-center justify-center gap-3"
                    >
                      <Edit size={20} color="#191E29" />
                      <Text style={{ color: "#191E29", fontWeight: "600", fontSize: 16 }}>
                        Editar Transação
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handleDeleteTransaction}
                      className="bg-white/10 border border-white/20 rounded-xl p-4 flex-row items-center justify-center gap-3"
                    >
                      <Trash2 size={20} color={colors.error} />
                      <Text style={{ color: colors.error, fontWeight: "600", fontSize: 16 }}>
                        Excluir Transação
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setShowActionModal(false)}
                      className="bg-card-bg rounded-xl p-4 flex-row items-center justify-center"
                    >
                      <Text style={{ color: colors.textGray, fontWeight: '600', fontSize: 16 }}>
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
