import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../constants/colors";
import {
  Tag,
  BarChart3,
  Calendar,
  Wallet,
} from "lucide-react-native";
import { triggerHaptic } from "../../utils/haptics";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";

interface InfoBox {
  id: string;
  title: string;
  icon: any;
  onPress: () => void;
  comingSoon?: boolean;
}

export default function Overview() {
  const colors = COLORS;
  const navigation = useNavigation();

  const { refreshControl } = usePullToRefresh({
    onRefresh: () => {
      // Refresh logic can be added here
      return Promise.resolve();
    },
  });

  const infoBoxes: InfoBox[] = [
    {
      id: "categories",
      title: "Categorias",
      icon: Tag,
      onPress: () => {
        triggerHaptic();
        (navigation as any).navigate("Categories");
      },
    },
    {
      id: "wallet",
      title: "Poupança",
      icon: Wallet,
      onPress: () => {
        triggerHaptic();
        (navigation as any).navigate("Savings");
      },
    },
    {
      id: "calendar",
      title: "Calendário",
      icon: Calendar,
      onPress: () => {
        triggerHaptic();
        (navigation as any).navigate("Calendar");
      },
    },
    {
      id: "analytics",
      title: "Analytics",
      icon: BarChart3,
      onPress: () => {
        triggerHaptic();
        (navigation as any).navigate("Analytics");
      },
    },
  ];

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
          <View className="mb-6">
            <Text className="text-white text-2xl font-bold mb-2">
              Informações
            </Text>
            <Text className="text-text-primary text-sm">
              Gerencie suas finanças e explore funcionalidades
            </Text>
          </View>

          {/* Info Boxes Grid */}
          <View className="flex-row flex-wrap gap-4">
            {infoBoxes.map((box) => {
              const IconComponent = box.icon;
              return (
                <Pressable
                  key={box.id}
                  onPress={box.onPress}
                  style={{ width: "47%" }}
                  className="mb-4"
                >
                  <View
                    style={{
                      backgroundColor: colors.cardBg,
                      borderRadius: 16,
                      padding: 16,
                      height: 120,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View className="flex-1 justify-between">
                      {/* Ícone no canto superior direito */}
                      <View className="items-end">
                        <IconComponent size={24} color={colors.accent} />
                      </View>
                      {/* Texto no canto inferior esquerdo */}
                      <View>
                        <Text className="text-white text-base font-semibold">
                          {box.title}
                        </Text>
                        {box.comingSoon && (
                          <Text className="text-text-primary text-xs mt-1">
                            Em breve
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

