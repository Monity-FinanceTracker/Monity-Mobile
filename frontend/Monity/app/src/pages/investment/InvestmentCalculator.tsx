import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LineChart } from "react-native-gifted-charts";
import { COLORS } from "../../constants/colors";
import { apiService } from "../../services/apiService";
import { useAuth } from "../../context/AuthContext";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { triggerHaptic } from "../../utils/haptics";
import Card from "../../components/molecules/Card";
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Calendar as CalendarIcon,
  Crown,
  AlertCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react-native";

interface CalculationResult {
  finalValue: number;
  totalContributions: number;
  totalInterest: number;
  roiPercentage: number;
  years: number;
}

interface GrowthDataPoint {
  time: string;
  principal: number;
  contributions: number;
  interest: number;
  total: number;
}

export default function InvestmentCalculator() {
  const colors = COLORS;
  const navigation = useNavigation();
  const { user } = useAuth();
  const [initialInvestment, setInitialInvestment] = useState("1000");
  const [contributionAmount, setContributionAmount] = useState("100");
  const [contributionFrequency, setContributionFrequency] = useState("monthly");
  const [annualInterestRate, setAnnualInterestRate] = useState("8");
  const [goalDate, setGoalDate] = useState<Date>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 5);
    return date;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewType, setViewType] = useState("monthly");
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [growthData, setGrowthData] = useState<GrowthDataPoint[]>([]);
  const [usage, setUsage] = useState<{
    simulationsUsed: number;
    simulationsLimit: number | null;
    isPremium: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  const subscriptionTier = user?.subscriptionTier || "free";
  const isPremium = subscriptionTier === "premium";

  const loadUsage = async () => {
    try {
      const response = await apiService.getInvestmentUsage();
      if (response.success && response.data) {
        setUsage(response.data);
        if (
          !response.data.isPremium &&
          response.data.simulationsUsed >= response.data.simulationsLimit
        ) {
          setLimitReached(true);
        }
      }
    } catch (error) {
      console.error("Error loading usage:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadUsage();
    }, [])
  );

  const { refreshControl } = usePullToRefresh({
    onRefresh: loadUsage,
  });

  const handleCalculate = async () => {
    if (limitReached && !isPremium) {
      Alert.alert(
        "Limite Atingido",
        `Você atingiu o limite de ${usage?.simulationsLimit} simulações por mês. Assine o Premium para simulações ilimitadas!`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Assinar Premium",
            onPress: () => navigation.navigate("SubscriptionPlans" as never),
          },
        ]
      );
      return;
    }

    try {
      setLoading(true);
      triggerHaptic();

      const response = await apiService.calculateInvestment({
        initialInvestment: parseFloat(initialInvestment) || 0,
        contributionAmount: parseFloat(contributionAmount) || 0,
        contributionFrequency,
        annualInterestRate: parseFloat(annualInterestRate) || 0,
        goalDate: goalDate.toISOString().split("T")[0],
        viewType,
      });

      if (response.success && response.data) {
        setResults(response.data.summary);
        setGrowthData(response.data.growthData);
        setUsage(response.data.usage);
        setLimitReached(false);
      } else {
        if (response.errorCode === 429 || response.error?.includes("limit")) {
          setLimitReached(true);
          Alert.alert(
            "Limite Atingido",
            response.error || "Limite de simulações atingido",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Assinar Premium",
                onPress: () => navigation.navigate("SubscriptionPlans" as never),
              },
            ]
          );
        } else {
          Alert.alert("Erro", response.error || "Falha ao calcular investimento");
        }
      }
    } catch (error: any) {
      console.error("Error calculating investment:", error);
      Alert.alert("Erro", "Erro ao calcular investimento");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const adjustValue = (
    currentValue: string,
    increment: number,
    min: number = 0,
    max: number = Infinity
  ) => {
    const numValue = parseFloat(currentValue) || 0;
    const newValue = Math.max(min, Math.min(max, numValue + increment));
    return newValue.toFixed(2);
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
                  Calculadora de Investimento
                </Text>
                <Text className="text-text-primary text-sm">
                  Projeção de juros compostos
                </Text>
              </View>
            </View>
          </View>

          {/* Usage Limit Banner */}
          {limitReached && !isPremium && (
            <Card className="mb-4 bg-accent/10 border border-accent">
              <View className="p-4">
                <View className="flex-row items-center gap-3 mb-2">
                  <AlertCircle size={24} color={colors.accent} />
                  <Text className="text-text-primary font-semibold">
                    Limite Atingido
                  </Text>
                </View>
                <Text className="text-text-secondary text-sm mb-3">
                  Você atingiu o limite de {usage?.simulationsLimit} simulações
                  por mês. Assine o Premium para simulações ilimitadas!
                </Text>
                <Pressable
                  onPress={() => navigation.navigate("SubscriptionPlans" as never)}
                  className="bg-accent px-4 py-2 rounded-lg self-start"
                >
                  <View className="flex-row items-center gap-2">
                    <Crown size={16} color="#191E29" />
                    <Text className="text-[#191E29] font-semibold text-sm">
                      Assinar Premium
                    </Text>
                  </View>
                </Pressable>
              </View>
            </Card>
          )}

          {/* Usage Info */}
          {usage && !isPremium && (
            <Card className="mb-4">
              <View className="p-3">
                <Text className="text-text-secondary text-xs mb-1">
                  Simulações este mês
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-text-primary font-semibold">
                    {usage.simulationsUsed} / {usage.simulationsLimit}
                  </Text>
                  <View className="flex-1 mx-3 h-2 bg-card-bg rounded-full overflow-hidden">
                    <View
                      className="h-full bg-accent rounded-full"
                      style={{
                        width: `${(usage.simulationsUsed / usage.simulationsLimit) * 100}%`,
                      }}
                    />
                  </View>
                </View>
              </View>
            </Card>
          )}

          {/* Input Form */}
          <Card className="mb-4">
            <View className="p-4">
              <Text className="text-text-primary text-lg font-semibold mb-4">
                Parâmetros de Investimento
              </Text>

              <View className="gap-4">
                {/* Initial Investment */}
                <View>
                  <Text className="text-text-primary font-semibold mb-2">
                    Investimento Inicial
                  </Text>
                  <View className="relative">
                    <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                      <DollarSign size={20} color={colors.textSecondary} />
                    </View>
                    <TextInput
                      value={initialInvestment}
                      onChangeText={setInitialInvestment}
                      placeholder="0,00"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      className="bg-card-bg text-text-primary px-4 pl-12 pr-12 py-3 rounded-xl border border-border-default"
                    />
                    <View className="absolute right-2 top-1/2 -translate-y-1/2 flex-col gap-1">
                      <Pressable
                        onPress={() =>
                          setInitialInvestment(
                            adjustValue(initialInvestment, 100)
                          )
                        }
                        className="p-1"
                      >
                        <ChevronUp size={16} color={colors.textSecondary} />
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          setInitialInvestment(
                            adjustValue(initialInvestment, -100, 0)
                          )
                        }
                        className="p-1"
                      >
                        <ChevronDown size={16} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Contribution Amount */}
                <View>
                  <Text className="text-text-primary font-semibold mb-2">
                    Contribuição Regular
                  </Text>
                  <View className="relative">
                    <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                      <DollarSign size={20} color={colors.textSecondary} />
                    </View>
                    <TextInput
                      value={contributionAmount}
                      onChangeText={setContributionAmount}
                      placeholder="0,00"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      className="bg-card-bg text-text-primary px-4 pl-12 pr-12 py-3 rounded-xl border border-border-default"
                    />
                    <View className="absolute right-2 top-1/2 -translate-y-1/2 flex-col gap-1">
                      <Pressable
                        onPress={() =>
                          setContributionAmount(
                            adjustValue(contributionAmount, 10)
                          )
                        }
                        className="p-1"
                      >
                        <ChevronUp size={16} color={colors.textSecondary} />
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          setContributionAmount(
                            adjustValue(contributionAmount, -10, 0)
                          )
                        }
                        className="p-1"
                      >
                        <ChevronDown size={16} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Contribution Frequency */}
                <View>
                  <Text className="text-text-primary font-semibold mb-2">
                    Frequência de Contribuição
                  </Text>
                  <View className="flex-row gap-2">
                    {[
                      { value: "monthly", label: "Mensal" },
                      { value: "semi-annually", label: "Semestral" },
                      { value: "annually", label: "Anual" },
                    ].map((freq) => (
                      <Pressable
                        key={freq.value}
                        onPress={() => {
                          setContributionFrequency(freq.value);
                          triggerHaptic();
                        }}
                        className={`flex-1 py-3 rounded-xl items-center ${
                          contributionFrequency === freq.value
                            ? "bg-accent"
                            : "bg-card-bg border border-border-default"
                        }`}
                      >
                        <Text
                          className={`font-semibold ${
                            contributionFrequency === freq.value
                              ? "text-[#191E29]"
                              : "text-text-primary"
                          }`}
                        >
                          {freq.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Annual Interest Rate */}
                <View>
                  <Text className="text-text-primary font-semibold mb-2">
                    Taxa de Juros Anual (%)
                  </Text>
                  <View className="relative">
                    <TextInput
                      value={annualInterestRate}
                      onChangeText={setAnnualInterestRate}
                      placeholder="0,0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      className="bg-card-bg text-text-primary px-4 pr-12 py-3 rounded-xl border border-border-default"
                    />
                    <View className="absolute right-2 top-1/2 -translate-y-1/2 flex-col gap-1">
                      <Pressable
                        onPress={() =>
                          setAnnualInterestRate(
                            adjustValue(annualInterestRate, 0.1, 0, 100)
                          )
                        }
                        className="p-1"
                      >
                        <ChevronUp size={16} color={colors.textSecondary} />
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          setAnnualInterestRate(
                            adjustValue(annualInterestRate, -0.1, 0, 100)
                          )
                        }
                        className="p-1"
                      >
                        <ChevronDown size={16} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Goal Date */}
                <View>
                  <Text className="text-text-primary font-semibold mb-2">
                    Data Meta
                  </Text>
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      setShowDatePicker(true);
                    }}
                    className="bg-card-bg border border-border-default px-4 py-3 rounded-xl flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-2">
                      <CalendarIcon size={20} color={colors.textPrimary} />
                      <Text className="text-text-primary">
                        {goalDate.toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                  </Pressable>
                  {showDatePicker && (
                    <DateTimePicker
                      value={goalDate}
                      mode="date"
                      display="default"
                      onChange={(event, date) => {
                        setShowDatePicker(false);
                        if (date) {
                          setGoalDate(date);
                        }
                      }}
                      minimumDate={new Date()}
                    />
                  )}
                </View>

                {/* View Type */}
                <View>
                  <Text className="text-text-primary font-semibold mb-2">
                    Visualização do Gráfico
                  </Text>
                  <View className="flex-row gap-2">
                    {[
                      { value: "monthly", label: "Mensal" },
                      { value: "annually", label: "Anual" },
                    ].map((view) => (
                      <Pressable
                        key={view.value}
                        onPress={() => {
                          setViewType(view.value);
                          triggerHaptic();
                        }}
                        className={`flex-1 py-3 rounded-xl items-center ${
                          viewType === view.value
                            ? "bg-accent"
                            : "bg-card-bg border border-border-default"
                        }`}
                      >
                        <Text
                          className={`font-semibold ${
                            viewType === view.value
                              ? "text-[#191E29]"
                              : "text-text-primary"
                          }`}
                        >
                          {view.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Calculate Button */}
                <Pressable
                  onPress={handleCalculate}
                  disabled={loading || limitReached}
                  className={`bg-accent py-4 rounded-xl items-center mt-2 ${
                    loading || limitReached ? "opacity-50" : ""
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#191E29" />
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <TrendingUp size={20} color="#191E29" />
                      <Text className="text-[#191E29] font-semibold text-base">
                        Calcular
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>
          </Card>

          {/* Results */}
          {results && (
            <Card className="mb-4">
              <View className="p-4">
                <Text className="text-text-primary text-lg font-semibold mb-4">
                  Resultados
                </Text>

                <View className="gap-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-text-secondary">Valor Final</Text>
                    <Text className="text-success text-xl font-bold">
                      {formatCurrency(results.finalValue)}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-text-secondary">
                      Total de Contribuições
                    </Text>
                    <Text className="text-text-primary font-semibold">
                      {formatCurrency(results.totalContributions)}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-text-secondary">Juros Ganhos</Text>
                    <Text className="text-accent font-semibold">
                      {formatCurrency(results.totalInterest)}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-text-secondary">ROI</Text>
                    <Text className="text-accent font-semibold">
                      {formatPercent(results.roiPercentage)}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-text-secondary">Período</Text>
                    <Text className="text-text-primary font-semibold">
                      {results.years.toFixed(1)} anos
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          )}

          {/* Growth Chart */}
          {growthData.length > 0 && (
            <Card className="mb-4">
              <View className="p-4">
                <Text className="text-text-primary text-lg font-semibold mb-4">
                  Projeção de Crescimento
                </Text>
                <View className="bg-card-bg rounded-xl p-4" style={{ overflow: 'hidden' }}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 20 }}
                  >
                    <LineChart
                      data={growthData.map((point, index) => {
                        const isFirst = index === 0;
                        const isLast = index === growthData.length - 1;
                        const showLabel = isFirst || isLast || index % Math.ceil(growthData.length / 6) === 0;
                        
                        return {
                          value: point.total,
                          label: showLabel 
                            ? new Date(point.time).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
                            : '',
                          labelTextStyle: { color: colors.textSecondary, fontSize: 10 },
                        };
                      })}
                      width={Math.max(
                        Dimensions.get('window').width - 96,
                        growthData.length * 20
                      )}
                      height={220}
                      color={colors.accent}
                      thickness={2}
                      hideRules={false}
                      rulesColor={colors.borderDefault}
                      rulesType="solid"
                      yAxisColor={colors.borderDefault}
                      xAxisColor={colors.borderDefault}
                      yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                      curved
                      areaChart
                      startFillColor={colors.accent}
                      endFillColor={colors.accent}
                      startOpacity={0.3}
                      endOpacity={0.1}
                      spacing={20}
                      initialSpacing={20}
                      endSpacing={20}
                      noOfSections={4}
                      maxValue={Math.max(...growthData.map(p => p.total)) * 1.1}
                      yAxisLabelPrefix="R$ "
                      yAxisLabelSuffix=""
                      formatYLabel={(value) => {
                        const num = parseFloat(value);
                        if (num >= 1000) {
                          return `${(num / 1000).toFixed(1)}k`;
                        }
                        return num.toFixed(0);
                      }}
                      dataPointsColor={colors.accent}
                      dataPointsRadius={3}
                      textShiftY={-10}
                      textShiftX={-5}
                      textFontSize={10}
                      textColor={colors.textSecondary}
                      hideDataPoints={growthData.length > 50}
                    />
                  </ScrollView>
                  <View className="flex-row items-center justify-center mt-4 gap-4">
                    <View className="flex-row items-center gap-2">
                      <View className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.accent }} />
                      <Text className="text-text-secondary text-xs">Valor Total</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}



