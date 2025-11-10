import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Svg, { Circle, Path, Rect, Text as SvgText, G } from "react-native-svg";
import Card from "../../components/molecules/Card";
import { COLORS } from "../../constants/colors";
import {
  apiService,
  Transaction,
  Balance,
  Category,
} from "../../services/apiService";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  LineChart,
  DollarSign,
  Calendar,
  Target,
  Activity,
  AlertCircle,
} from "lucide-react-native";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { triggerHaptic } from "../../utils/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 48;
const CHART_HEIGHT = 200;

interface BalanceHistory {
  month: string;
  balance: number;
}

interface CategoryStats {
  category: string;
  total: number;
  count: number;
  percentage: number;
  color?: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export default function Analytics() {
  const colors = COLORS;
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistory[]>([]);
  const [financialHealth, setFinancialHealth] = useState<any>(null);
  const [projections, setProjections] = useState<any>(null);
  const [aiStats, setAiStats] = useState<any>(null);
  const [savingsOverview, setSavingsOverview] = useState<any>(null);

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "R$ 0,00";
    }
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [
        balanceRes,
        transactionsRes,
        categoriesRes,
        historyRes,
        healthRes,
        projectionsRes,
        aiStatsRes,
        savingsRes,
      ] = await Promise.allSettled([
        apiService.getBalance(),
        apiService.getTransactions(),
        apiService.getCategories(),
        apiService.getBalanceHistory(),
        apiService.getFinancialHealth(),
        apiService.getFinancialProjections(),
        apiService.getAIStats(),
        apiService.getSavingsOverview(),
      ]);

      if (balanceRes.status === "fulfilled" && balanceRes.value.success) {
        setBalance(balanceRes.value.data);
      }
      if (transactionsRes.status === "fulfilled" && transactionsRes.value.success) {
        setTransactions(transactionsRes.value.data || []);
      }
      if (categoriesRes.status === "fulfilled" && categoriesRes.value.success) {
        setCategories(categoriesRes.value.data || []);
      }
      if (historyRes.status === "fulfilled" && historyRes.value.success) {
        // Calculate cumulative balance month by month
        const history = historyRes.value.data || [];
        let cumulativeBalance = 0;
        const cumulativeHistory = history.map((item: BalanceHistory) => {
          cumulativeBalance += item.balance;
          return {
            ...item,
            balance: cumulativeBalance,
          };
        });
        setBalanceHistory(cumulativeHistory);
      }
      if (savingsRes.status === "fulfilled" && savingsRes.value.success) {
        setSavingsOverview(savingsRes.value.data);
      }
      if (healthRes.status === "fulfilled" && healthRes.value.success) {
        setFinancialHealth(healthRes.value.data);
      }
      if (projectionsRes.status === "fulfilled" && projectionsRes.value.success) {
        setProjections(projectionsRes.value.data);
      }
      // Silently ignore projection errors as they're optional
      if (aiStatsRes.status === "fulfilled" && aiStatsRes.value.success) {
        setAiStats(aiStatsRes.value.data);
      }
    } catch (error) {
      console.error("Error loading analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const { refreshControl } = usePullToRefresh({
    onRefresh: loadData,
  });

  // Helper function to get color from category color string
  const getColorFromCategory = (color: string) => {
    const colorMap: { [key: string]: string } = {
      "bg-red-500": "#EF4444",
      "bg-orange-500": "#F97316",
      "bg-yellow-500": "#EAB308",
      "bg-green-500": "#22C55E",
      "bg-blue-500": "#3B82F6",
      "bg-indigo-500": "#6366F1",
      "bg-purple-500": "#A855F7",
      "bg-pink-500": "#EC4899",
      "bg-gray-500": "#6B7280",
      "bg-emerald-500": "#10B981",
      "bg-cyan-500": "#06B6D4",
      "bg-violet-500": "#8B5CF6",
      "bg-green-600": "#16A34A",
      "bg-blue-600": "#2563EB",
    };
    return colorMap[color] || "#6B7280";
  };

  // Calculate category statistics from categories with totalSpent
  const categoryStats = useMemo(() => {
    // Use categories data which already has totalSpent calculated
    const expenseCategories = categories.filter(
      (cat) => cat.typeId === 1 && (cat.totalSpent || 0) > 0
    );

    const totalExpenses = expenseCategories.reduce(
      (sum, cat) => sum + (cat.totalSpent || 0),
      0
    );

    const stats: CategoryStats[] = expenseCategories
      .map((cat) => ({
        category: cat.name,
        total: cat.totalSpent || 0,
        count: cat.transactionCount || 0,
        percentage: totalExpenses > 0 ? ((cat.totalSpent || 0) / totalExpenses) * 100 : 0,
        color: getColorFromCategory(cat.color),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return stats;
  }, [categories]);

  // Calculate monthly income/expenses
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { income: number; expenses: number }>();

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const existing = monthMap.get(monthKey) || { income: 0, expenses: 0 };

      if (t.type === "income") {
        existing.income += t.amount;
      } else {
        existing.expenses += Math.abs(t.amount);
      }

      monthMap.set(monthKey, existing);
    });

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  }, [transactions]);

  // Line Chart Component for Balance History
  const LineChartComponent = ({ data }: { data: BalanceHistory[] }) => {
    if (data.length === 0) {
      return (
        <View className="h-[200px] items-center justify-center">
          <Text className="text-gray-400">Sem dados disponíveis</Text>
        </View>
      );
    }

    const padding = 40;
    const chartWidth = CHART_WIDTH - padding * 2;
    const chartHeight = CHART_HEIGHT - padding * 2;

    const values = data.map((d) => d.balance);
    const minValue = Math.min(...values, 0);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    const points = data.map((d, index) => {
      const divisor = data.length > 1 ? data.length - 1 : 1;
      const x = padding + (index / divisor) * chartWidth;
      const y =
        padding +
        chartHeight -
        ((d.balance - minValue) / range) * chartHeight;
      return { x, y, value: d.balance, label: d.month };
    });

    const pathData =
      points.length > 1
        ? points
            .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
            .join(" ")
        : `M ${points[0]?.x || padding} ${points[0]?.y || padding + chartHeight} L ${points[0]?.x || padding} ${points[0]?.y || padding + chartHeight}`;

    return (
      <View>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding + chartHeight - ratio * chartHeight;
            return (
              <Path
                key={ratio}
                d={`M ${padding} ${y} L ${CHART_WIDTH - padding} ${y}`}
                stroke="#333"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            );
          })}

          {/* Line */}
          <Path
            d={pathData}
            fill="none"
            stroke={colors.accent}
            strokeWidth="3"
          />

          {/* Points */}
          {points.map((point, index) => (
            <G key={index}>
              <Circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill={colors.accent}
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r="10"
                fill={colors.accent}
                opacity="0.2"
              />
            </G>
          ))}

          {/* Labels */}
          {points.map((point, index) => {
            if (index % Math.ceil(data.length / 4) !== 0 && index !== data.length - 1)
              return null;
            // Ensure labels stay within bounds
            const labelX = Math.max(padding, Math.min(CHART_WIDTH - padding, point.x));
            return (
              <SvgText
                key={index}
                x={labelX}
                y={CHART_HEIGHT - 10}
                fontSize="9"
                fill="#9CA3AF"
                textAnchor="middle"
              >
                {(() => {
                  const [year, month] = point.label.split("/");
                  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                  return `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`;
                })()}
              </SvgText>
            );
          })}
        </Svg>
      </View>
    );
  };

  // Pie Chart Component
  const PieChartComponent = ({ data }: { data: CategoryStats[] }) => {
    if (data.length === 0) {
      return (
        <View className="h-[200px] items-center justify-center">
          <Text className="text-gray-400">Sem dados disponíveis</Text>
        </View>
      );
    }

    const size = 150;
    const center = size / 2;
    const radius = size / 2 - 10;
    let currentAngle = -90;

    const colors_pie = [
      "#01C38D",
      "#3B82F6",
      "#8B5CF6",
      "#F59E0B",
      "#EF4444",
      "#EC4899",
      "#10B981",
      "#06B6D4",
      "#F97316",
      "#6366F1",
    ];

    const slices = data.map((item, index) => {
      const color = item.color || colors_pie[index % colors_pie.length];
      const angle = (item.percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startAngleRad);
      const y1 = center + radius * Math.sin(startAngleRad);
      const x2 = center + radius * Math.cos(endAngleRad);
      const y2 = center + radius * Math.sin(endAngleRad);

      const largeArc = angle > 180 ? 1 : 0;

      const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return {
        path,
        color,
        ...item,
      };
    });

    return (
      <View className="items-center">
        <Svg width={size} height={size}>
          {slices.map((slice, index) => (
            <Path
              key={index}
              d={slice.path}
              fill={slice.color}
              opacity={0.8}
            />
          ))}
        </Svg>
        <View className="mt-4 gap-2 w-full">
          {slices.slice(0, 5).map((slice, index) => (
            <View
              key={index}
              className="flex-row items-center justify-between py-1"
            >
              <View className="flex-row items-center gap-2 flex-1">
                <View
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <Text className="text-white text-sm flex-1" numberOfLines={1}>
                  {slice.category}
                </Text>
              </View>
              <Text className="text-gray-400 text-sm">
                {slice.percentage.toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Bar Chart Component
  const BarChartComponent = ({ data }: { data: MonthlyData[] }) => {
    if (data.length === 0) {
      return (
        <View className="h-[200px] items-center justify-center">
          <Text className="text-gray-400">Sem dados disponíveis</Text>
        </View>
      );
    }

    const padding = 40;
    const chartWidth = CHART_WIDTH - padding * 2;
    const chartHeight = CHART_HEIGHT - padding * 2;
    const barWidth = chartWidth / (data.length * 2 + 1);
    const gap = barWidth * 0.3;

    const maxValue = Math.max(
      ...data.map((d) => Math.max(d.income, d.expenses)),
      1
    );

    return (
      <View>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding + chartHeight - ratio * chartHeight;
            return (
              <Path
                key={ratio}
                d={`M ${padding} ${y} L ${CHART_WIDTH - padding} ${y}`}
                stroke="#333"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            );
          })}

          {/* Bars */}
          {data.map((item, index) => {
            const x = padding + index * (barWidth * 2 + gap);
            const incomeHeight = (item.income / maxValue) * chartHeight;
            const expenseHeight = (item.expenses / maxValue) * chartHeight;

            return (
              <G key={index}>
                {/* Income bar */}
                <Rect
                  x={x}
                  y={padding + chartHeight - incomeHeight}
                  width={barWidth}
                  height={incomeHeight}
                  fill="#10B981"
                  rx="4"
                />
                {/* Expense bar */}
                <Rect
                  x={x + barWidth + gap}
                  y={padding + chartHeight - expenseHeight}
                  width={barWidth}
                  height={expenseHeight}
                  fill="#EF4444"
                  rx="4"
                />
                {/* Month label */}
                <SvgText
                  x={x + barWidth}
                  y={CHART_HEIGHT - 10}
                  fontSize="10"
                  fill="#9CA3AF"
                  textAnchor="middle"
                >
                  {(() => {
                    const [year, month] = item.month.split("-");
                    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                    return `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`;
                  })()}
                </SvgText>
              </G>
            );
          })}
        </Svg>
        <View className="flex-row items-center justify-center gap-4 mt-4">
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded" style={{ backgroundColor: "#10B981" }} />
            <Text className="text-gray-400 text-xs">Receitas</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded" style={{ backgroundColor: "#EF4444" }} />
            <Text className="text-gray-400 text-xs">Despesas</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.accent} />
          <Text className="text-gray-400 mt-4">Carregando analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <View className="flex-row items-center gap-4">
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  navigation.goBack();
                }}
                className="w-10 h-10 bg-card-bg rounded-full items-center justify-center"
              >
                <ArrowLeft size={20} color="white" />
              </Pressable>
              <View>
                <Text className="text-white text-2xl font-bold">Analytics</Text>
                <Text className="text-gray-400 text-sm">
                  Análise completa das suas finanças
                </Text>
              </View>
            </View>
          </View>

          {/* Summary Cards */}
          <View className="flex-row flex-wrap gap-4 mb-6">
            <Card className="flex-1 min-w-[47%]">
              <View className="p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <DollarSign size={16} color={colors.accent} />
                  <Text className="text-gray-400 text-xs">Saldo Total</Text>
                </View>
                <Text className="text-white text-xl font-bold">
                  {formatCurrency(balance?.total)}
                </Text>
                <View className="flex-row items-center gap-1 mt-1">
                  {balance && balance.change >= 0 ? (
                    <TrendingUp size={12} color="#10B981" />
                  ) : (
                    <TrendingDown size={12} color="#EF4444" />
                  )}
                  <Text
                    className={`text-xs ${
                      balance && balance.change >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {balance?.changePercentage?.toFixed(1) || 0}%
                  </Text>
                </View>
              </View>
            </Card>

            <Card className="flex-1 min-w-[47%]">
              <View className="p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <TrendingUp size={16} color="#10B981" />
                  <Text className="text-gray-400 text-xs">Receitas</Text>
                </View>
                <Text className="text-white text-xl font-bold">
                  {formatCurrency(balance?.income)}
                </Text>
                <Text className="text-gray-400 text-xs mt-1">
                  {transactions.filter((t) => t.type === "income").length}{" "}
                  transações
                </Text>
              </View>
            </Card>

            <Card className="flex-1 min-w-[47%]">
              <View className="p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <TrendingDown size={16} color="#EF4444" />
                  <Text className="text-gray-400 text-xs">Despesas</Text>
                </View>
                <Text className="text-white text-xl font-bold">
                  {formatCurrency(balance?.expenses)}
                </Text>
                <Text className="text-gray-400 text-xs mt-1">
                  {transactions.filter((t) => t.type === "expense").length}{" "}
                  transações
                </Text>
              </View>
            </Card>

            {financialHealth && (
              <Card className="flex-1 min-w-[47%]">
                <View className="p-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Activity size={16} color={colors.accent} />
                    <Text className="text-gray-400 text-xs">Health Score</Text>
                  </View>
                  <Text className="text-white text-xl font-bold">
                    {financialHealth.score || 0}/100
                  </Text>
                  <Text className="text-gray-400 text-xs mt-1">
                    {financialHealth.category || "N/A"}
                  </Text>
                </View>
              </Card>
            )}
          </View>

          {/* Balance History Line Chart */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="flex-row items-center gap-2 mb-4">
                <LineChart size={20} color={colors.accent} />
                <Text className="text-white text-lg font-semibold">
                  Histórico de Saldo
                </Text>
              </View>
              <LineChartComponent data={balanceHistory} />
            </View>
          </Card>

          {/* Monthly Income vs Expenses Bar Chart */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="flex-row items-center gap-2 mb-4">
                <BarChart3 size={20} color={colors.accent} />
                <Text className="text-white text-lg font-semibold">
                  Receitas vs Despesas (Últimos 6 meses)
                </Text>
              </View>
              <BarChartComponent data={monthlyData} />
            </View>
          </Card>

          {/* Category Distribution Pie Chart */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="flex-row items-center gap-2 mb-4">
                <PieChart size={20} color={colors.accent} />
                <Text className="text-white text-lg font-semibold">
                  Distribuição por Categoria
                </Text>
              </View>
              <PieChartComponent data={categoryStats} />
            </View>
          </Card>

          {/* Top Categories Table */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="flex-row items-center gap-2 mb-4">
                <Target size={20} color={colors.accent} />
                <Text className="text-white text-lg font-semibold">
                  Top Categorias
                </Text>
              </View>
              <View className="gap-3">
                {categoryStats.slice(0, 5).map((stat, index) => (
                  <View
                    key={index}
                    className="flex-row items-center justify-between py-2 border-b border-white/10"
                  >
                    <View className="flex-1">
                      <Text className="text-white font-medium">
                        {stat.category}
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        {stat.count} transações
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-white font-semibold">
                        {formatCurrency(stat.total)}
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        {stat.percentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Card>

          {/* Financial Health Details */}
          {financialHealth && (
            <Card className="mb-6">
              <View className="p-4">
                <View className="flex-row items-center gap-2 mb-4">
                  <Activity size={20} color={colors.accent} />
                  <Text className="text-white text-lg font-semibold">
                    Saúde Financeira
                  </Text>
                </View>
                <View className="gap-3">
                  {financialHealth.metrics && (
                    <>
                      <View className="flex-row justify-between py-2">
                        <Text className="text-gray-400">Taxa de Poupança</Text>
                        <Text className="text-white font-medium">
                          {(() => {
                            // Use totalSavings from financialHealth first, then fallback to allocated savings
                            const totalSavings = 
                              financialHealth.metrics.totalSavings || 
                              savingsOverview?.totalAllocated || 
                              balance?.allocatedSavings || 
                              0;
                            const totalIncome = financialHealth.metrics.totalIncome || balance?.income || 0;
                            const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
                            return savingsRate.toFixed(1);
                          })()}%
                        </Text>
                      </View>
                      <View className="flex-row justify-between py-2">
                        <Text className="text-gray-400">Taxa de Despesas</Text>
                        <Text className="text-white font-medium">
                          {financialHealth.metrics.expenseRatio?.toFixed(1) || "0"}%
                        </Text>
                      </View>
                      <View className="flex-row justify-between py-2">
                        <Text className="text-gray-400">Total de Receitas</Text>
                        <Text className="text-green-400 font-medium">
                          {formatCurrency(financialHealth.metrics.totalIncome || 0)}
                        </Text>
                      </View>
                      <View className="flex-row justify-between py-2">
                        <Text className="text-gray-400">Total de Despesas</Text>
                        <Text className="text-red-400 font-medium">
                          {formatCurrency(financialHealth.metrics.totalExpenses || 0)}
                        </Text>
                      </View>
                      <View className="flex-row justify-between py-2">
                        <Text className="text-gray-400">Total de Poupança</Text>
                        <Text className="text-white font-medium">
                          {(() => {
                            // Use the exact same calculation as savings rate
                            const totalSavings = 
                              financialHealth.metrics.totalSavings || 
                              savingsOverview?.totalAllocated || 
                              balance?.allocatedSavings || 
                              0;
                            return formatCurrency(totalSavings);
                          })()}
                        </Text>
                      </View>
                      <View className="flex-row justify-between py-2">
                        <Text className="text-gray-400">Total de Transações</Text>
                        <Text className="text-white font-medium">
                          {financialHealth.metrics.transactionCount || 0}
                        </Text>
                      </View>
                    </>
                  )}
                  {financialHealth.recommendations &&
                    financialHealth.recommendations.length > 0 && (
                      <View className="mt-2">
                        <Text className="text-gray-400 text-sm mb-2">
                          Recomendações:
                        </Text>
                        {financialHealth.recommendations.map(
                          (rec: any, index: number) => (
                            <View
                              key={index}
                              className="flex-row items-start gap-2 py-2 border-b border-white/5"
                            >
                              <AlertCircle
                                size={14}
                                color={colors.accent}
                                style={{ marginTop: 2 }}
                              />
                              <View className="flex-1">
                                <Text className="text-white text-xs font-semibold mb-1">
                                  {rec.title || "Recomendação"}
                                </Text>
                                <Text className="text-gray-300 text-xs mb-1">
                                  {rec.description || rec.actionable || ""}
                                </Text>
                                {rec.actionable && rec.actionable !== rec.description && (
                                  <Text className="text-gray-400 text-xs italic">
                                    {rec.actionable}
                                  </Text>
                                )}
                              </View>
                            </View>
                          )
                        )}
                      </View>
                    )}
                </View>
              </View>
            </Card>
          )}

          {/* Transaction Statistics */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="flex-row items-center gap-2 mb-4">
                <Calendar size={20} color={colors.accent} />
                <Text className="text-white text-lg font-semibold">
                  Estatísticas de Transações
                </Text>
              </View>
              <View className="gap-3">
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-400">Total de Transações</Text>
                  <Text className="text-white font-medium">
                    {transactions.length}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-400">Receitas</Text>
                  <Text className="text-green-400 font-medium">
                    {transactions.filter((t) => t.type === "income").length}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-400">Despesas</Text>
                  <Text className="text-red-400 font-medium">
                    {transactions.filter((t) => t.type === "expense").length}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-400">Média por Transação</Text>
                  <Text className="text-white font-medium">
                    {formatCurrency(
                      transactions.length > 0
                        ? transactions.reduce(
                            (sum, t) => sum + Math.abs(t.amount),
                            0
                          ) / transactions.length
                        : 0
                    )}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-400">Maior Receita</Text>
                  <Text className="text-green-400 font-medium">
                    {formatCurrency(
                      Math.max(
                        ...transactions
                          .filter((t) => t.type === "income")
                          .map((t) => t.amount),
                        0
                      )
                    )}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-400">Maior Despesa</Text>
                  <Text className="text-red-400 font-medium">
                    {formatCurrency(
                      Math.max(
                        ...transactions
                          .filter((t) => t.type === "expense")
                          .map((t) => Math.abs(t.amount)),
                        0
                      )
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* AI Statistics */}
          {aiStats && (
            <Card className="mb-6">
              <View className="p-4">
                <View className="flex-row items-center gap-2 mb-4">
                  <Activity size={20} color={colors.accent} />
                  <Text className="text-white text-lg font-semibold">
                    Estatísticas de IA
                  </Text>
                </View>
                <View className="gap-3">
                  {aiStats.totalSuggestions && (
                    <View className="flex-row justify-between py-2">
                      <Text className="text-gray-400">Sugestões Totais</Text>
                      <Text className="text-white font-medium">
                        {aiStats.totalSuggestions}
                      </Text>
                    </View>
                  )}
                  {aiStats.acceptedSuggestions && (
                    <View className="flex-row justify-between py-2">
                      <Text className="text-gray-400">Aceitas</Text>
                      <Text className="text-green-400 font-medium">
                        {aiStats.acceptedSuggestions}
                      </Text>
                    </View>
                  )}
                  {aiStats.accuracy && (
                    <View className="flex-row justify-between py-2">
                      <Text className="text-gray-400">Precisão</Text>
                      <Text className="text-white font-medium">
                        {(aiStats.accuracy * 100).toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

