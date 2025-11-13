import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  ChevronDown,
} from "lucide-react-native";
import { apiService, Transaction, Category } from "../../services/apiService";
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

export default function Transactions() {
  const colors = COLORS;
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  
  // Active filters applied to API
  const [filterCategoryId, setFilterCategoryId] = useState<string | undefined>(undefined);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>(undefined);
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>(undefined);
  
  // Filter modal states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tempFilterCategoryId, setTempFilterCategoryId] = useState<string | undefined>(undefined);
  const [tempFilterType, setTempFilterType] = useState<"all" | "income" | "expense">("all");
  const [tempFilterStartDate, setTempFilterStartDate] = useState<Date | undefined>(undefined);
  const [tempFilterEndDate, setTempFilterEndDate] = useState<Date | undefined>(undefined);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const loadCategories = async () => {
    try {
      console.log("🔄 Loading categories...");
      const response = await apiService.getCategories();
      console.log("📦 Categories response:", response);
      if (response.success && response.data) {
        console.log("✅ Categories loaded:", response.data.length, response.data);
        setCategories(response.data);
      } else {
        console.error("❌ Failed to load categories:", response.error);
        Alert.alert("Erro", "Falha ao carregar categorias");
      }
    } catch (error) {
      console.error("❌ Error loading categories:", error);
      Alert.alert("Erro", "Falha ao carregar categorias");
    }
  };

  // Format dates for API (YYYY-MM-DD)
  const formatDateForAPI = useCallback((date: Date | undefined): string | undefined => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Convert dates to strings for dependency comparison
  const filterStartDateStr = useMemo(() => formatDateForAPI(filterStartDate), [filterStartDate, formatDateForAPI]);
  const filterEndDateStr = useMemo(() => formatDateForAPI(filterEndDate), [filterEndDate, formatDateForAPI]);

  const loadTransactions = useCallback(async (overrideFilters?: {
    type?: "all" | "income" | "expense";
    categoryId?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
  }) => {
    try {
      setIsLoading(true);

      // Use override filters if provided, otherwise use state filters
      const effectiveType = overrideFilters?.type !== undefined ? overrideFilters.type : filterType;
      const effectiveCategoryId = overrideFilters?.categoryId !== undefined ? overrideFilters.categoryId : filterCategoryId;
      const effectiveStartDate = overrideFilters?.startDate !== undefined ? overrideFilters.startDate : filterStartDate;
      const effectiveEndDate = overrideFilters?.endDate !== undefined ? overrideFilters.endDate : filterEndDate;

      // Format dates for API
      const effectiveStartDateStr = effectiveStartDate ? formatDateForAPI(effectiveStartDate) : undefined;
      const effectiveEndDateStr = effectiveEndDate ? formatDateForAPI(effectiveEndDate) : undefined;

      const filters = {
        type: effectiveType === "all" ? undefined : effectiveType,
        categoryId: effectiveCategoryId,
        startDate: effectiveStartDateStr,
        endDate: effectiveEndDateStr,
        search: searchTerm || undefined,
      };

      console.log("🔄 Loading transactions with filters:", filters);
      console.log("🔄 Override filters:", overrideFilters);
      console.log("🔄 Current filter state:", {
        filterType,
        filterCategoryId,
        filterStartDate,
        filterEndDate,
        filterStartDateStr,
        filterEndDateStr,
        searchTerm,
      });

      const response = await apiService.getTransactions(filters);

      if (response.success && response.data) {
        console.log("✅ Transactions loaded:", response.data.length, "transactions");
        console.log("✅ First few transactions:", response.data.slice(0, 3).map(t => ({
          id: t.id,
          description: t.description || t.title,
          date: t.date,
          type: t.type,
          category: t.category,
        })));
        setTransactions(response.data);
      } else {
        console.error("❌ Failed to load transactions:", response.error);
        Alert.alert("Erro", "Falha ao carregar transações");
      }
    } catch (error) {
      console.error("❌ Error loading transactions:", error);
      Alert.alert("Erro", "Falha ao carregar transações");
    } finally {
      setIsLoading(false);
    }
  }, [filterType, filterCategoryId, filterStartDateStr, filterEndDateStr, searchTerm, formatDateForAPI]);

  const { refreshControl } = usePullToRefresh({
    onRefresh: loadTransactions,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  // Also load categories when modal opens
  useEffect(() => {
    if (showFilterModal) {
      loadCategories();
    }
  }, [showFilterModal]);

  // Clear category filter if no categories are available or selected category doesn't exist
  useEffect(() => {
    if (filterCategoryId) {
      if (categories.length === 0) {
        console.log("🧹 Clearing category filter - no categories available");
        setFilterCategoryId(undefined);
      } else {
        // Check if the selected category still exists
        const categoryExists = categories.some(c => c.id === filterCategoryId);
        if (!categoryExists) {
          console.log("🧹 Clearing category filter - selected category no longer exists");
          setFilterCategoryId(undefined);
        }
      }
    }
  }, [categories, filterCategoryId]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Close all pickers when filter modal closes
  useEffect(() => {
    if (!showFilterModal) {
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
      setShowCategoryDropdown(false);
    }
  }, [showFilterModal]);

  // No client-side filtering needed - all filtering is done by API
  const filteredTransactions = transactions;

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
    const arrowColor = transactionType === "income" ? COLORS.accent : COLORS.textPrimary; // Green for income, white for expense
    
    return (
      <Pressable 
        onPress={() => handleTransactionPress(item)}
        className="py-3"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1">
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
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="font-medium text-white text-xs">{title}</Text>
                {isFavorite && (
                  <Star size={12} color={colors.accent} fill={colors.accent} />
                )}
              </View>
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
          <Text className="text-[14px] text-text-primary mb-2">
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

          {/* Search and Filter Bar */}
          <View className="flex-row items-center gap-3 mb-6">
            <View className="flex-1 relative">
              <TextInput
                placeholder="Buscar transações..."
                placeholderTextColor="#8F8D85"
                value={searchTerm}
                onChangeText={setSearchTerm}
                className="bg-card-bg border border-border-default rounded-xl pl-4 pr-4 py-3 text-text-primary"
                style={{ color: COLORS.textPrimary }}
              />
            </View>
            <Pressable 
              className="flex-row items-center gap-2 bg-card-bg border border-border-default rounded-xl px-4 py-3"
              onPress={() => {
                triggerHaptic();
                // Load categories when opening modal
                loadCategories();
                // Initialize temp filters with current filters
                setTempFilterType(filterType);
                setTempFilterCategoryId(filterCategoryId);
                setTempFilterStartDate(filterStartDate);
                setTempFilterEndDate(filterEndDate);
                setShowFilterModal(true);
              }}
            >
              <Filter size={18} color={colors.textPrimary} />
              {/* Show indicator if filters are active */}
              {/* Only show category filter indicator if categories are available */}
              {(
                filterType !== "all" || 
                (filterCategoryId && categories.length > 0) || 
                filterStartDate || 
                filterEndDate
              ) && (
                <View className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full" />
              )}
            </Pressable>
          </View>

          {/* Transactions List Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>
              {filteredTransactions.length} transações encontradas
            </Text>
          </View>

          {/* Transactions List */}
          {isLoading ? (
            <View className="items-center py-12">
              <Text style={{ color: colors.textPrimary }}>Carregando transações...</Text>
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
                      <Edit size={20} color={COLORS.textPrimary} />
                      <Text style={{ color: COLORS.textPrimary, fontWeight: "600", fontSize: 16 }}>
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

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          // Close all pickers
          setShowStartDatePicker(false);
          setShowEndDatePicker(false);
          setShowCategoryDropdown(false);
          // Reset temp filters when closing without applying
          setTempFilterType(filterType);
          setTempFilterCategoryId(filterCategoryId);
          setTempFilterStartDate(filterStartDate);
          setTempFilterEndDate(filterEndDate);
          setShowFilterModal(false);
        }}
      >
        <View 
          className="flex-1 bg-black/50 justify-end"
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={() => {
              // Close all pickers
              setShowStartDatePicker(false);
              setShowEndDatePicker(false);
              setShowCategoryDropdown(false);
              // Reset temp filters when closing without applying
              setTempFilterType(filterType);
              setTempFilterCategoryId(filterCategoryId);
              setTempFilterStartDate(filterStartDate);
              setTempFilterEndDate(filterEndDate);
              setShowFilterModal(false);
            }}
            style={{ flex: 1 }}
          />
          <View className="bg-background rounded-t-3xl p-6 max-h-[90%]" onStartShouldSetResponder={() => true}>
              {/* Header */}
              <View className="flex-row items-center justify-between mb-6">
                <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>
                  Filtros
                </Text>
                <Pressable
                  onPress={() => {
                    // Close all pickers
                    setShowStartDatePicker(false);
                    setShowEndDatePicker(false);
                    setShowCategoryDropdown(false);
                    // Reset temp filters when closing without applying
                    setTempFilterType(filterType);
                    setTempFilterCategoryId(filterCategoryId);
                    setTempFilterStartDate(filterStartDate);
                    setTempFilterEndDate(filterEndDate);
                    setShowFilterModal(false);
                  }}
                  className="w-8 h-8 bg-card-bg rounded-full items-center justify-center"
                >
                  <X size={16} color={colors.textPrimary} />
                </Pressable>
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Tipo de Transação */}
                <View className="mb-6">
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                    Tipo
                  </Text>
                  <View className="flex-row gap-2">
                    {[
                      { value: "all", label: "Todos" },
                      { value: "income", label: "Receitas" },
                      { value: "expense", label: "Despesas" },
                    ].map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          triggerHaptic();
                          setTempFilterType(option.value as "all" | "income" | "expense");
                          // Close dropdown if open
                          setShowCategoryDropdown(false);
                        }}
                        className={`flex-1 px-4 py-3 rounded-xl ${
                          tempFilterType === option.value
                            ? "bg-accent"
                            : "bg-card-bg border border-border-default"
                        }`}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '500',
                            color: tempFilterType === option.value
                              ? "#191E29"
                              : colors.textGray,
                            textAlign: 'center',
                          }}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Categoria */}
                <View className="mb-6">
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                    Categoria
                  </Text>
                  <View className="relative z-10">
                    <Pressable
                      onPress={() => {
                        triggerHaptic();
                        setShowCategoryDropdown(!showCategoryDropdown);
                        // Close date pickers if open
                        setShowStartDatePicker(false);
                        setShowEndDatePicker(false);
                      }}
                      className="bg-card-bg border border-border-default rounded-xl px-4 py-3 flex-row items-center justify-between"
                    >
                      <Text style={{ color: tempFilterCategoryId ? colors.textPrimary : colors.textMuted, fontSize: 14 }}>
                        {tempFilterCategoryId 
                          ? categories.find(c => c.id === tempFilterCategoryId)?.name || "Selecionar categoria"
                          : "Todas as categorias"}
                      </Text>
                      <ChevronDown 
                        size={20} 
                        color={colors.textMuted}
                        style={{ transform: [{ rotate: showCategoryDropdown ? '180deg' : '0deg' }] }}
                      />
                    </Pressable>
                    
                    {/* Dropdown */}
                    {showCategoryDropdown && (
                      <View 
                        className="absolute top-full left-0 right-0 mt-2 bg-background border border-border-default rounded-xl shadow-lg overflow-hidden" 
                        style={{ zIndex: 10000, elevation: 10 }}
                      >
                          <ScrollView 
                            showsVerticalScrollIndicator={true}
                            nestedScrollEnabled={true}
                            style={{ maxHeight: 240 }}
                            keyboardShouldPersistTaps="always"
                          >
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => {
                                triggerHaptic();
                                setTempFilterCategoryId(undefined);
                                setShowCategoryDropdown(false);
                              }}
                              className={`py-3 px-4 ${
                                !tempFilterCategoryId
                                  ? "bg-accent/20"
                                  : "bg-transparent"
                              }`}
                            >
                              <Text
                                style={{
                                  color: !tempFilterCategoryId ? colors.accent : colors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: !tempFilterCategoryId ? '600' : '400',
                                }}
                              >
                                Todas as categorias
                              </Text>
                            </TouchableOpacity>
                            
                            {categories.length === 0 ? (
                              <View className="py-4 px-4 items-center">
                                <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                                  Nenhuma categoria disponível
                                </Text>
                              </View>
                            ) : (
                              categories.map((category) => (
                                <TouchableOpacity
                                  key={category.id}
                                  activeOpacity={0.7}
                                  onPress={() => {
                                    triggerHaptic();
                                    console.log("📌 Selected category:", category.id, category.name);
                                    setTempFilterCategoryId(category.id);
                                    setShowCategoryDropdown(false);
                                  }}
                                  className={`py-3 px-4 ${
                                    tempFilterCategoryId === category.id
                                      ? "bg-accent/20"
                                      : "bg-transparent"
                                  }`}
                                >
                                  <Text
                                    style={{
                                      color: tempFilterCategoryId === category.id ? colors.accent : colors.textPrimary,
                                      fontSize: 14,
                                      fontWeight: tempFilterCategoryId === category.id ? '600' : '400',
                                    }}
                                  >
                                    {category.name}
                                  </Text>
                                </TouchableOpacity>
                              ))
                            )}
                          </ScrollView>
                        </View>
                    )}
                  </View>
                </View>

                {/* Data Inicial */}
                <View className="mb-6">
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                    Data Inicial
                  </Text>
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      setShowStartDatePicker(true);
                      // Close dropdown if open
                      setShowCategoryDropdown(false);
                      setShowEndDatePicker(false);
                    }}
                    className="bg-card-bg border border-border-default rounded-xl px-4 py-3 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-2">
                      <Calendar size={20} color={colors.textMuted} />
                      <Text style={{ color: tempFilterStartDate ? colors.textPrimary : colors.textMuted, fontSize: 14 }}>
                        {tempFilterStartDate
                          ? tempFilterStartDate.toLocaleDateString("pt-BR")
                          : "Selecionar data"}
                      </Text>
                    </View>
                    {tempFilterStartDate && (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setTempFilterStartDate(undefined);
                        }}
                      >
                        <X size={16} color={colors.textMuted} />
                      </Pressable>
                    )}
                  </Pressable>
                  {showFilterModal && showStartDatePicker && (
                    <>
                      <DateTimePicker
                        value={tempFilterStartDate || new Date()}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={(event, selectedDate) => {
                          if (Platform.OS === "android") {
                            setShowStartDatePicker(false);
                            if (event.type === "set" && selectedDate) {
                              setTempFilterStartDate(selectedDate);
                            }
                          } else {
                            // iOS
                            if (selectedDate) {
                              setTempFilterStartDate(selectedDate);
                            }
                          }
                        }}
                        locale="pt-BR"
                      />
                      {Platform.OS === "ios" && (
                        <Pressable
                          onPress={() => setShowStartDatePicker(false)}
                          className="bg-accent rounded-xl p-3 mt-3"
                        >
                          <Text style={{ color: "#191E29", fontWeight: "600", fontSize: 16, textAlign: "center" }}>
                            Concluído
                          </Text>
                        </Pressable>
                      )}
                    </>
                  )}
                </View>

                {/* Data Final */}
                <View className="mb-6">
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                    Data Final
                  </Text>
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      setShowEndDatePicker(true);
                      // Close dropdown if open
                      setShowCategoryDropdown(false);
                      setShowStartDatePicker(false);
                    }}
                    className="bg-card-bg border border-border-default rounded-xl px-4 py-3 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-2">
                      <Calendar size={20} color={colors.textMuted} />
                      <Text style={{ color: tempFilterEndDate ? colors.textPrimary : colors.textMuted, fontSize: 14 }}>
                        {tempFilterEndDate
                          ? tempFilterEndDate.toLocaleDateString("pt-BR")
                          : "Selecionar data"}
                      </Text>
                    </View>
                    {tempFilterEndDate && (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setTempFilterEndDate(undefined);
                        }}
                      >
                        <X size={16} color={colors.textMuted} />
                      </Pressable>
                    )}
                  </Pressable>
                  {showFilterModal && showEndDatePicker && (
                    <>
                      <DateTimePicker
                        value={tempFilterEndDate || new Date()}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={(event, selectedDate) => {
                          if (Platform.OS === "android") {
                            setShowEndDatePicker(false);
                            if (event.type === "set" && selectedDate) {
                              setTempFilterEndDate(selectedDate);
                            }
                          } else {
                            // iOS
                            if (selectedDate) {
                              setTempFilterEndDate(selectedDate);
                            }
                          }
                        }}
                        locale="pt-BR"
                      />
                      {Platform.OS === "ios" && (
                        <Pressable
                          onPress={() => setShowEndDatePicker(false)}
                          className="bg-accent rounded-xl p-3 mt-3"
                        >
                          <Text style={{ color: "#191E29", fontWeight: "600", fontSize: 16, textAlign: "center" }}>
                            Concluído
                          </Text>
                        </Pressable>
                      )}
                    </>
                  )}
                </View>

                {/* Action Buttons */}
                <View className="gap-3 mb-4">
                  <Pressable
                    onPress={async () => {
                      triggerHaptic();
                      setTempFilterType("all");
                      setTempFilterCategoryId(undefined);
                      setTempFilterStartDate(undefined);
                      setTempFilterEndDate(undefined);
                      // Also clear the actual filters immediately
                      setFilterType("all");
                      setFilterCategoryId(undefined);
                      setFilterStartDate(undefined);
                      setFilterEndDate(undefined);
                      // Reload transactions after clearing filters
                      console.log("🔄 Reloading transactions after clearing filters");
                      await loadTransactions({
                        type: "all",
                        categoryId: undefined,
                        startDate: undefined,
                        endDate: undefined,
                      });
                    }}
                    className="bg-card-bg border border-border-default rounded-xl p-4 flex-row items-center justify-center"
                  >
                    <Text style={{ color: colors.textGray, fontWeight: '600', fontSize: 16 }}>
                      Limpar Filtros
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={async () => {
                      triggerHaptic();
                      // Close all pickers first
                      setShowStartDatePicker(false);
                      setShowEndDatePicker(false);
                      setShowCategoryDropdown(false);
                      
                      console.log("🔧 Applying filters:", {
                        type: tempFilterType,
                        categoryId: tempFilterCategoryId,
                        startDate: tempFilterStartDate,
                        endDate: tempFilterEndDate,
                      });
                      
                      // Close modal first
                      setShowFilterModal(false);
                      
                      // Apply temp filters to actual filters
                      setFilterType(tempFilterType);
                      setFilterCategoryId(tempFilterCategoryId);
                      setFilterStartDate(tempFilterStartDate);
                      setFilterEndDate(tempFilterEndDate);
                      
                      // Immediately reload transactions with the new filter values
                      // Pass the new filter values directly to avoid closure issues
                      console.log("🔄 Reloading transactions with new filters immediately");
                      await loadTransactions({
                        type: tempFilterType,
                        categoryId: tempFilterCategoryId,
                        startDate: tempFilterStartDate,
                        endDate: tempFilterEndDate,
                      });
                    }}
                    className="bg-accent rounded-xl p-4 flex-row items-center justify-center"
                  >
                    <Text style={{ color: "#191E29", fontWeight: "600", fontSize: 16 }}>
                      Aplicar Filtros
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
