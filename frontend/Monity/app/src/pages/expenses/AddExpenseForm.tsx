import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { RootStackParamList } from "../../navigation";
import { COLORS } from "../../constants/colors";
import { apiService, Category } from "../../services/apiService";
import {
  TrendingDown,
  ArrowLeft,
  Calendar,
  Star,
  Repeat,
} from "lucide-react-native";
import { triggerHaptic } from "../../utils/haptics";

type AddExpenseFormRouteProp = RouteProp<RootStackParamList, "AddExpenseForm">;

export default function AddExpenseForm() {
  const navigation = useNavigation();
  const route = useRoute<AddExpenseFormRouteProp>();
  const colors = COLORS;

  const favoriteData = route.params?.favoriteData;

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [date, setDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDay, setRecurrenceDay] = useState<number>(() => new Date().getDate());
  const [frequency, setFrequency] = useState<'monthly' | 'weekly'>('monthly');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);

  // AI Categorization state
  const [categorySuggestions, setCategorySuggestions] = useState<Array<{
    category: string;
    confidence: number;
    source: string;
  }>>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [userManuallySelectedCategory, setUserManuallySelectedCategory] = useState(false);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        Alert.alert("Erro", "Falha ao carregar categorias");
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      Alert.alert("Erro", "Falha ao carregar categorias");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Filter only expense categories (typeId === 1)
  const filteredCategories = categories.filter(
    (category) => category.typeId === 1
  );

  // Debounced AI category suggestion
  // Only fetch suggestions if user hasn't manually selected a category
  useEffect(() => {
    // Clear suggestions if user manually selected a category
    if (userManuallySelectedCategory && selectedCategory) {
      setCategorySuggestions([]);
      setSelectedSuggestion(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      // Only fetch suggestions if:
      // 1. Name has at least 3 characters
      // 2. User hasn't manually selected a category
      // 3. No category is currently selected (or it was auto-selected)
      if (name && name.trim().length >= 3 && !userManuallySelectedCategory && !selectedCategory) {
        try {
          setIsLoadingSuggestions(true);
          const numericAmount = amount ? parseFloat(amount.replace(/\./g, "").replace(",", ".")) : 0;
          const response = await apiService.suggestCategory(
            name.trim(),
            numericAmount,
            1 // typeId: 1 = expense
          );
          
          if (response.success && response.data) {
            const suggestions = response.data.suggestions || response.data;
            // Only set suggestions if user still hasn't manually selected
            if (!userManuallySelectedCategory && !selectedCategory) {
              setCategorySuggestions(suggestions);
              
              // Auto-select highest confidence suggestion if >80% and no category selected
              if (suggestions.length > 0 && filteredCategories.length > 0) {
                const topSuggestion = suggestions[0];
                if (topSuggestion.confidence > 0.8) {
                  const matchingCategory = filteredCategories.find(
                    (cat) => cat.name === topSuggestion.category
                  );
                  if (matchingCategory) {
                    setSelectedCategory(matchingCategory.id);
                    setSelectedSuggestion(topSuggestion.category);
                    // Don't mark as manually selected since it was auto-selected
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error("Error getting category suggestions:", error);
        } finally {
          setIsLoadingSuggestions(false);
        }
      } else {
        // Clear suggestions if conditions aren't met
        if (!name || name.trim().length < 3 || userManuallySelectedCategory) {
          setCategorySuggestions([]);
          setSelectedSuggestion(null);
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [name, amount, categories, filteredCategories, selectedCategory, userManuallySelectedCategory]);

  // Populate form fields when favoriteData is available
  useEffect(() => {
    if (favoriteData && categories.length > 0) {
      // Set name
      if (favoriteData.name) {
        setName(favoriteData.name);
      }
      
      // Set amount (format as Brazilian currency)
      if (favoriteData.amount) {
        const formattedValue = (Number(favoriteData.amount) / 1).toLocaleString(
          "pt-BR",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        );
        setAmount(formattedValue);
      }
      
      // Set description
      if (favoriteData.description) {
        setDescription(favoriteData.description);
      }
      
      // Set date
      if (favoriteData.date) {
        // Format date to YYYY-MM-DD if needed
        const dateStr = favoriteData.date.split('T')[0];
        setDate(dateStr);
        // Also set selectedDate for the picker
        const [year, month, day] = dateStr.split('-').map(Number);
        setSelectedDate(new Date(year, month - 1, day));
      }
      
      // Set isFavorite
      if (favoriteData.isFavorite !== undefined) {
        setIsFavorite(favoriteData.isFavorite);
      }
      
      // Find and set category by name
      if (favoriteData.categoryName) {
        const expenseCategories = categories.filter(
          (category) => category.typeId === 1
        );
        const matchingCategory = expenseCategories.find(
          (cat) => cat.name === favoriteData.categoryName
        );
        if (matchingCategory) {
          setSelectedCategory(matchingCategory.id);
          setUserManuallySelectedCategory(true); // Mark as manually selected when from favorite
        }
      }
    }
  }, [favoriteData, categories]);

  const handleAmountChange = (value: string) => {
    // Format as Brazilian currency
    const numericValue = value.replace(/\D/g, "");
    const formattedValue = (Number(numericValue) / 100).toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
    setAmount(formattedValue);
  };

  const handleSubmit = async () => {
    if (!name || !amount || !selectedCategory) {
      Alert.alert("Erro", "Por favor, preencha Nome, Valor e Categoria");
      return;
    }
    triggerHaptic();

    try {
      // Convert amount to proper format
      const numericAmount = Number.parseFloat(
        amount.replace(/\./g, "").replace(",", ".")
      );

      // Find the selected category to get its name
      const selectedCategoryData = categories.find(
        (cat) => cat.id === selectedCategory
      );
      if (!selectedCategoryData) {
        Alert.alert("Erro", "Categoria selecionada não encontrada");
        return;
      }

      // If it's a recurring transaction, create it as recurring
      if (isRecurring) {
        // Validate recurrenceDay
        if (!recurrenceDay || recurrenceDay < 1 || recurrenceDay > 31) {
          Alert.alert("Erro", "Por favor, selecione um dia de recorrência válido (1-31)");
          return;
        }

        const recurringTransactionData = {
          description: name,
          amount: numericAmount, // Will be converted to negative in backend for expenses
          category: selectedCategoryData.name,
          categoryId: selectedCategoryData.id,
          typeId: 1, // 1 = expense
          recurrenceDay: Number(recurrenceDay), // Ensure it's a number
          isFavorite: isFavorite === true,
          frequency: frequency,
          startDate: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        };

        console.log("Saving recurring expense:", recurringTransactionData);

        try {
          const response = await apiService.createRecurringTransaction(recurringTransactionData);

          if (response.success) {
            console.log("Recurring expense saved successfully:", response.data);
            Alert.alert(
              "Sucesso",
              "Despesa recorrente salva com sucesso!",
              [
                {
                  text: "OK",
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          } else {
            console.error("Failed to save recurring expense:", {
              error: response.error,
              fullResponse: response,
            });
            const errorMessage = response.error || "Erro desconhecido ao salvar despesa recorrente";
            Alert.alert("Erro", `Falha ao salvar despesa recorrente: ${errorMessage}`);
          }
        } catch (error: any) {
          console.error("Exception saving recurring expense:", error);
          Alert.alert(
            "Erro",
            `Erro ao salvar despesa recorrente: ${error?.message || "Erro desconhecido"}`
          );
        }
        return;
      }

      // Regular transaction
      const transactionData = {
        description: name, // Using name as description
        amount: -numericAmount, // Store expenses as negative values
        category: selectedCategoryData.name,
        date,
        isFavorite: isFavorite === true, // Explicitly convert to boolean
      };

      console.log("Saving expense:", transactionData);

      const response = await apiService.addExpense(transactionData);

      if (response.success) {
        console.log("Expense saved successfully:", response.data);
        Alert.alert(
          "Sucesso",
          "Despesa salva com sucesso!",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        console.error("Failed to save expense:", response.error);
        Alert.alert("Erro", `Falha ao salvar despesa: ${response.error}`);
      }
    } catch (error) {
      console.error("Error saving expense:", error);
      Alert.alert(
        "Erro",
        "Erro inesperado ao salvar despesa. Tente novamente."
      );
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom", "left", "right"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6 pb-6">
          {/* Header */}
          <View className="flex-row items-center gap-4 mb-6">
            <Pressable onPress={() => navigation.goBack()} className="p-2">
              <ArrowLeft size={20} color={colors.textPrimary} />
            </Pressable>
            <Text
              style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "bold" }}
            >
              Adicionar Despesa
            </Text>
          </View>

          {/* Nome */}
          <View className="mb-4">
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              Nome *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex: Supermercado Extra"
              placeholderTextColor={colors.textSecondary}
              className="bg-card-bg border border-border-default rounded-xl text-text-primary px-4 py-3"
              style={{ color: colors.textPrimary, backgroundColor: '#30302E' }}
            />
          </View>

          {/* Valor */}
          <View className="mb-4">
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              Valor *
            </Text>
            <View
              className="flex-row bg-card-bg border border-border-default rounded-xl px-4"
              style={{ height: 48, alignItems: "center", backgroundColor: '#30302E' }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: colors.textPrimary,
                  marginRight: 8,
                  lineHeight: 22,
                }}
              >
                R$
              </Text>
              <TextInput
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0,00"
                placeholderTextColor={colors.textSecondary}
                className="flex-1 text-lg font-bold text-text-primary"
                keyboardType="numeric"
                style={{
                  paddingVertical: 0,
                  paddingTop: 0,
                  paddingBottom: 0,
                  marginVertical: 0,
                  lineHeight: 22,
                }}
              />
            </View>
          </View>

          {/* Descrição (Opcional) */}
          <View className="mb-4">
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              Descrição
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Descrição adicional (opcional)"
              placeholderTextColor={colors.textSecondary}
              className="bg-card-bg border border-border-default rounded-xl text-text-primary px-4 py-3 h-20 text-left"
              style={{ backgroundColor: '#30302E' }}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Data */}
          <View className="mb-4">
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              Data
            </Text>
            <Pressable
              onPress={() => {
                triggerHaptic();
                setShowDatePicker(true);
              }}
              className="bg-card-bg border border-border-default rounded-xl px-4 py-3 flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2">
                <Calendar size={20} color={colors.textPrimary} />
                <Text style={{ color: colors.textPrimary, fontSize: 14 }}>
                  {selectedDate.toLocaleDateString("pt-BR")}
                </Text>
              </View>
            </Pressable>
            {showDatePicker && (
              <>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDateValue) => {
                    if (Platform.OS === "android") {
                      setShowDatePicker(false);
                      if (event.type === "set" && selectedDateValue) {
                        setSelectedDate(selectedDateValue);
                        const year = selectedDateValue.getFullYear();
                        const month = String(selectedDateValue.getMonth() + 1).padStart(2, "0");
                        const day = String(selectedDateValue.getDate()).padStart(2, "0");
                        setDate(`${year}-${month}-${day}`);
                      }
                    } else {
                      // iOS
                      if (selectedDateValue) {
                        setSelectedDate(selectedDateValue);
                        const year = selectedDateValue.getFullYear();
                        const month = String(selectedDateValue.getMonth() + 1).padStart(2, "0");
                        const day = String(selectedDateValue.getDate()).padStart(2, "0");
                        setDate(`${year}-${month}-${day}`);
                      }
                    }
                  }}
                  locale="pt-BR"
                />
                {Platform.OS === "ios" && (
                  <Pressable
                    onPress={() => setShowDatePicker(false)}
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

          {/* Categorias */}
          <View className="mb-4">
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 12,
              }}
            >
              Categoria *
            </Text>
            
            {/* AI Suggestions - Only show if user hasn't manually selected a category */}
            {categorySuggestions.length > 0 && !isLoadingSuggestions && !userManuallySelectedCategory && (
              <View className="mb-3">
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    marginBottom: 8,
                  }}
                >
                  Sugestões de IA:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {categorySuggestions.map((suggestion, index) => {
                    const matchingCategory = filteredCategories.find(
                      (cat) => cat.name === suggestion.category
                    );
                    if (!matchingCategory) return null;
                    
                    const isSelected = selectedCategory === matchingCategory.id;
                    const confidencePercent = Math.round(suggestion.confidence * 100);
                    
                    return (
                      <Pressable
                        key={index}
                        onPress={() => {
                          setSelectedCategory(matchingCategory.id);
                          setSelectedSuggestion(suggestion.category);
                          setUserManuallySelectedCategory(true); // Mark as manually selected
                          setCategorySuggestions([]); // Clear suggestions
                          triggerHaptic();
                        }}
                        className={`px-3 py-2 rounded-lg flex-row items-center gap-2 ${
                          isSelected
                            ? "bg-accent"
                            : "bg-accent/20 border border-accent/50"
                        }`}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: isSelected ? "#191E29" : colors.accent,
                            fontWeight: isSelected ? "600" : "500",
                          }}
                        >
                          {suggestion.category}
                        </Text>
                        <View
                          className={`px-2 py-0.5 rounded ${
                            isSelected ? "bg-[#191E29]/20" : "bg-accent/30"
                          }`}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              color: isSelected ? "#191E29" : colors.accent,
                              fontWeight: "600",
                            }}
                          >
                            {confidencePercent}%
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
            
            {isLoadingSuggestions && (
              <View className="mb-3">
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    fontStyle: "italic",
                  }}
                >
                  Analisando descrição...
                </Text>
              </View>
            )}
            
            {isLoading ? (
              <View className="items-center py-8">
                <Text style={{ color: colors.textPrimary }}>
                  Carregando categorias...
                </Text>
              </View>
            ) : filteredCategories.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {filteredCategories.map((category) => {
                  const isSelected = selectedCategory === category.id;
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => {
                        setSelectedCategory(category.id);
                        setSelectedSuggestion(null);
                        setUserManuallySelectedCategory(true); // Mark as manually selected
                        setCategorySuggestions([]); // Clear AI suggestions when manually selecting
                        triggerHaptic();
                      }}
                      className={`px-4 py-3 rounded-xl items-center justify-center ${
                        isSelected
                          ? "bg-accent"
                          : "bg-card-bg border border-border-default"
                      }`}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          textAlign: "center",
                          color: isSelected ? "#191E29" : colors.textGray,
                          fontWeight: isSelected ? "600" : "normal",
                        }}
                        numberOfLines={2}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <View className="items-center py-8">
                <Text
                  style={{
                    color: colors.textMuted,
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  Nenhuma categoria encontrada
                </Text>
                <Text
                  style={{
                    color: colors.textGray,
                    fontSize: 14,
                    textAlign: "center",
                  }}
                >
                  Crie categorias na seção de Categorias primeiro
                </Text>
              </View>
            )}
          </View>

          {/* Favoritar */}
          <View className="mb-4">
            <Pressable
              onPress={() => setIsFavorite(!isFavorite)}
              className="flex-row items-center gap-3"
            >
              <View
                className={`w-6 h-6 rounded border-2 items-center justify-center ${
                  isFavorite
                    ? "bg-accent border-accent"
                    : ""
                }`}
                style={{
                  borderColor: isFavorite ? colors.accent : colors.textPrimary,
                }}
              >
                {isFavorite && (
                  <Star size={14} color={colors.textPrimary} fill={colors.textPrimary} />
                )}
              </View>
              <Text style={{ color: colors.textGray }}>
                Favoritar esta despesa
              </Text>
            </Pressable>
          </View>

          {/* Salvar como Recorrente */}
          <View className="mb-4">
            <Pressable
              onPress={() => {
                triggerHaptic();
                setIsRecurring(!isRecurring);
              }}
              className="flex-row items-center gap-3"
            >
              <View
                className={`w-6 h-6 rounded border-2 items-center justify-center ${
                  isRecurring
                    ? "bg-accent border-accent"
                    : ""
                }`}
                style={{
                  borderColor: isRecurring ? colors.accent : colors.textPrimary,
                }}
              >
                {isRecurring && (
                  <Repeat size={14} color={colors.textPrimary} />
                )}
              </View>
              <Text style={{ color: colors.textGray }}>
                Salvar como recorrente
              </Text>
            </Pressable>
          </View>

          {/* Frequência - Mostrar apenas se isRecurring for true */}
          {isRecurring && (
            <View className="mb-4">
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                Frequência *
              </Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    setFrequency('monthly');
                    if (recurrenceDay > 31) {
                      setRecurrenceDay(1);
                    }
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl items-center justify-center ${
                    frequency === 'monthly'
                      ? "bg-accent"
                      : "bg-card-bg border border-border-default"
                  }`}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: frequency === 'monthly' ? "#191E29" : colors.textGray,
                      fontWeight: frequency === 'monthly' ? "600" : "normal",
                    }}
                  >
                    Mensal
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    setFrequency('weekly');
                    if (recurrenceDay > 6) {
                      setRecurrenceDay(0);
                    }
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl items-center justify-center ${
                    frequency === 'weekly'
                      ? "bg-accent"
                      : "bg-card-bg border border-border-default"
                  }`}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: frequency === 'weekly' ? "#191E29" : colors.textGray,
                      fontWeight: frequency === 'weekly' ? "600" : "normal",
                    }}
                  >
                    Semanal
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Data de Início - Mostrar apenas se isRecurring for true */}
          {isRecurring && (
            <View className="mb-4">
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                Data de Início
              </Text>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  setShowStartDatePicker(true);
                }}
                className="bg-card-bg border border-border-default rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-2">
                  <Calendar size={20} color={colors.textPrimary} />
                  <Text style={{ color: colors.textPrimary, fontSize: 14 }}>
                    {startDate.toLocaleDateString("pt-BR")}
                  </Text>
                </View>
              </Pressable>
              {showStartDatePicker && (
                <>
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    minimumDate={new Date()}
                    onChange={(event, selectedDateValue) => {
                      if (Platform.OS === "android") {
                        setShowStartDatePicker(false);
                        if (event.type === "set" && selectedDateValue) {
                          setStartDate(selectedDateValue);
                        }
                      } else {
                        // iOS
                        if (selectedDateValue) {
                          setStartDate(selectedDateValue);
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
          )}

          {/* Dia de Recorrência/Semana - Mostrar apenas se isRecurring for true */}
          {isRecurring && (
            <View className="mb-6">
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                {frequency === 'monthly' ? 'Dia de Recorrência *' : 'Dia da Semana *'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingRight: 8 }}
              >
                {frequency === 'monthly' ? (
                  Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <Pressable
                      key={day}
                      onPress={() => {
                        triggerHaptic();
                        setRecurrenceDay(day);
                      }}
                      className={`px-4 py-2 rounded-lg items-center justify-center min-w-[48px] ${
                        recurrenceDay === day
                          ? "bg-accent"
                          : "bg-card-bg border border-border-default"
                      }`}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: recurrenceDay === day ? "#191E29" : colors.textGray,
                          fontWeight: recurrenceDay === day ? "600" : "normal",
                        }}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  ))
                ) : (
                  ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dayName, index) => (
                    <Pressable
                      key={index}
                      onPress={() => {
                        triggerHaptic();
                        setRecurrenceDay(index);
                      }}
                      className={`px-4 py-2 rounded-lg items-center justify-center min-w-[48px] ${
                        recurrenceDay === index
                          ? "bg-accent"
                          : "bg-card-bg border border-border-default"
                      }`}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: recurrenceDay === index ? "#191E29" : colors.textGray,
                          fontWeight: recurrenceDay === index ? "600" : "normal",
                        }}
                      >
                        {dayName}
                      </Text>
                    </Pressable>
                  ))
                )}
              </ScrollView>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 12,
                  marginTop: 8,
                }}
              >
                {frequency === 'monthly'
                  ? `A transação será criada automaticamente todo dia ${recurrenceDay} de cada mês a partir de ${startDate.toLocaleDateString("pt-BR")}`
                  : `A transação será criada automaticamente toda ${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][recurrenceDay]} a partir de ${startDate.toLocaleDateString("pt-BR")}`
                }
              </Text>
            </View>
          )}

          {/* Submit Buttons */}
          <View className="mt-3 flex-row gap-3">
            <Pressable
              onPress={() => {
                triggerHaptic();
                navigation.goBack();
              }}
              className="flex-1 h-12 rounded-lg items-center justify-center bg-card-bg border border-border-default"
            >
              <Text style={{ color: colors.textGray, fontWeight: "500" }}>
                Cancelar
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={!name || !amount || !selectedCategory}
              className={`flex-1 h-12 rounded-lg items-center justify-center ${
                !name || !amount || !selectedCategory
                  ? "bg-[#4B5563]"
                  : "bg-accent"
              }`}
            >
              <Text
                className={`font-medium ${
                  !name || !amount || !selectedCategory
                    ? "text-text-primary"
                    : "text-[#191E29]"
                }`}
              >
                Salvar
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

