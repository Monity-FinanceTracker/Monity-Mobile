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
  TrendingUp,
  ArrowLeft,
  Calendar,
  Star,
  Repeat,
} from "lucide-react-native";
import { triggerHaptic } from "../../utils/haptics";

type AddIncomeFormRouteProp = RouteProp<RootStackParamList, "AddIncomeForm">;

export default function AddIncomeForm() {
  const navigation = useNavigation();
  const route = useRoute<AddIncomeFormRouteProp>();
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

  // Filter only income categories (typeId === 2)
  const filteredCategories = categories.filter(
    (category) => category.typeId === 2
  );

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
        const incomeCategories = categories.filter(
          (category) => category.typeId === 2
        );
        const matchingCategory = incomeCategories.find(
          (cat) => cat.name === favoriteData.categoryName
        );
        if (matchingCategory) {
          setSelectedCategory(matchingCategory.id);
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
          amount: numericAmount, // Will be kept as positive in backend for income
          category: selectedCategoryData.name,
          categoryId: selectedCategoryData.id,
          typeId: 2, // 2 = income
          recurrenceDay: Number(recurrenceDay), // Ensure it's a number
          isFavorite: isFavorite === true,
        };

        console.log("Saving recurring income:", recurringTransactionData);

        try {
          const response = await apiService.createRecurringTransaction(recurringTransactionData);

          if (response.success) {
            console.log("Recurring income saved successfully:", response.data);
            Alert.alert(
              "Sucesso",
              "Receita recorrente salva com sucesso!",
              [
                {
                  text: "OK",
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          } else {
            console.error("Failed to save recurring income:", {
              error: response.error,
              fullResponse: response,
            });
            const errorMessage = response.error || "Erro desconhecido ao salvar receita recorrente";
            Alert.alert("Erro", `Falha ao salvar receita recorrente: ${errorMessage}`);
          }
        } catch (error: any) {
          console.error("Exception saving recurring income:", error);
          Alert.alert(
            "Erro",
            `Erro ao salvar receita recorrente: ${error?.message || "Erro desconhecido"}`
          );
        }
        return;
      }

      // Regular transaction
      const transactionData = {
        description: name, // Using name as description
        amount: numericAmount, // Store income as positive values
        category: selectedCategoryData.name,
        date,
        isFavorite: isFavorite === true, // Explicitly convert to boolean
      };

      console.log("Saving income:", transactionData);

      const response = await apiService.addIncome(transactionData);

      if (response.success) {
        console.log("Income saved successfully:", response.data);
        Alert.alert(
          "Sucesso",
          "Receita salva com sucesso!",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        console.error("Failed to save income:", response.error);
        Alert.alert("Erro", `Falha ao salvar receita: ${response.error}`);
      }
    } catch (error) {
      console.error("Error saving income:", error);
      Alert.alert(
        "Erro",
        "Erro inesperado ao salvar receita. Tente novamente."
      );
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6 pb-6">
          {/* Header */}
          <View className="flex-row items-center gap-4 mb-6">
            <Pressable onPress={() => {
              triggerHaptic();
              navigation.goBack();
            }} className="p-2">
              <ArrowLeft size={20} color={colors.textPrimary} />
            </Pressable>
            <Text
              style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "bold" }}
            >
              Adicionar Receita
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
              placeholder="Ex: Salário Janeiro"
              placeholderTextColor={colors.textSecondary}
              className="bg-card-bg border border-border-default rounded-xl text-white px-4 py-3"
              style={{ color: colors.textPrimary }}
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
              style={{ height: 48, alignItems: "center" }}
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
                className="flex-1 text-lg font-bold text-white"
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
              className="bg-card-bg border border-border-default rounded-xl text-white px-4 py-3 h-20 text-left"
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
                      onPress={() => setSelectedCategory(category.id)}
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
                Favoritar esta receita
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

          {/* Dia de Recorrência - Mostrar apenas se isRecurring for true */}
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
                Dia de Recorrência *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingRight: 8 }}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
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
                ))}
              </ScrollView>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 12,
                  marginTop: 8,
                }}
              >
                A transação será criada automaticamente todo dia {recurrenceDay} de cada mês
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

