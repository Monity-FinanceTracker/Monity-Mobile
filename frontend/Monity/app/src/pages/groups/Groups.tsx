import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../../constants/colors";
import { apiService } from "../../services/apiService";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { triggerHaptic } from "../../utils/haptics";
import Card from "../../components/molecules/Card";
import {
  ArrowLeft,
  Plus,
  Users,
  DollarSign,
  ChevronRight,
} from "lucide-react-native";

interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  group_members?: any[];
  expenses?: any[];
}

export default function Groups() {
  const colors = COLORS;
  const navigation = useNavigation();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getGroups();
      if (response.success && response.data) {
        setGroups(response.data);
      } else {
        Alert.alert("Erro", response.error || "Falha ao carregar grupos");
      }
    } catch (error) {
      console.error("Error loading groups:", error);
      Alert.alert("Erro", "Falha ao carregar grupos");
    } finally {
      setLoading(false);
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

  const handleCreateGroup = () => {
    triggerHaptic();
    navigation.navigate("CreateGroup" as never);
  };

  const handleGroupPress = (group: Group) => {
    triggerHaptic();
    navigation.navigate("GroupDetail" as never, { groupId: group.id } as never);
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top", "bottom", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center">
          <Text className="text-text-primary">Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
                  Grupos
                </Text>
                <Text className="text-text-primary text-sm">
                  Despesas compartilhadas
                </Text>
              </View>
            </View>
            <Pressable
              onPress={handleCreateGroup}
              className="w-10 h-10 bg-accent rounded-full items-center justify-center"
            >
              <Plus size={20} color="#191E29" />
            </Pressable>
          </View>

          {/* Groups List */}
          {groups.length === 0 ? (
            <View className="items-center py-12">
              <View className="w-16 h-16 bg-accent/20 rounded-full items-center justify-center mb-4">
                <Users size={32} color={colors.accent} />
              </View>
              <Text className="text-text-primary text-base font-semibold mb-2">
                Nenhum grupo ainda
              </Text>
              <Text className="text-text-primary text-center mb-4 text-sm">
                Crie um grupo para dividir despesas com amigos ou família
              </Text>
              <Pressable
                onPress={handleCreateGroup}
                className="bg-accent px-6 py-3 rounded-xl"
              >
                <Text className="text-[#191E29] font-semibold">
                  Criar Grupo
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-4">
              {groups.map((group) => {
                const memberCount = group.group_members?.length || 0;
                const expenseCount = group.expenses?.length || 0;
                const totalAmount = group.expenses?.reduce(
                  (sum: number, exp: any) => sum + (parseFloat(exp.amount) || 0),
                  0
                ) || 0;

                return (
                  <Pressable
                    key={group.id}
                    onPress={() => handleGroupPress(group)}
                  >
                    <Card className="p-4">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="text-text-primary text-lg font-semibold mb-1">
                            {group.name}
                          </Text>
                          <View className="flex-row items-center gap-4">
                            <View className="flex-row items-center gap-1">
                              <Users size={14} color={colors.textSecondary} />
                              <Text className="text-text-secondary text-xs">
                                {memberCount} membro{memberCount !== 1 ? "s" : ""}
                              </Text>
                            </View>
                            <View className="flex-row items-center gap-1">
                              <DollarSign size={14} color={colors.textSecondary} />
                              <Text className="text-text-secondary text-xs">
                                {expenseCount} despesa{expenseCount !== 1 ? "s" : ""}
                              </Text>
                            </View>
                          </View>
                          {totalAmount > 0 && (
                            <Text className="text-text-primary text-sm font-medium mt-2">
                              Total: R$ {totalAmount.toFixed(2)}
                            </Text>
                          )}
                        </View>
                        <ChevronRight size={20} color={colors.textSecondary} />
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}



