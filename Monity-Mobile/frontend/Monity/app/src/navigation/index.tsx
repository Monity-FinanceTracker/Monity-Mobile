import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Home, Receipt, Plus, MessageCircle, Tag } from "lucide-react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import LoginScreen from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import Dashboard from "../pages/dashboard/Dashboard";
import Transactions from "../pages/transactions/Transactions";
import AddExpense from "../pages/expenses/AddExpense";
import Categories from "../pages/categories/Categories";
import Profile from "../pages/profile/Profile";
import Chat from "../pages/chat/Chat";
import SubscriptionPlans from "../pages/subscription/SubscriptionPlans";
import { Platform, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Profile: undefined;
  SubscriptionPlans: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          // Add extra bottom padding for Android gesture nav / soft keys
          paddingBottom: Platform.OS === "android" ? Math.max(16, insets.bottom + 8) : Math.max(8, insets.bottom),
          paddingTop: 8,
          // Increase height slightly on Android when there is a bottom inset
          height:
            Platform.OS === "android"
              ? 70 + Math.max(0, insets.bottom)
              : 70,
          // Ensure tab bar is above system navigation
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarActiveTintColor: '#01C38D',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
          tabBarLabel: "Início",
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={Transactions}
        options={{
          tabBarIcon: ({ color }) => <Receipt size={20} color={color} />,
          tabBarLabel: "Transações",
        }}
      />
      <Tab.Screen
        name="AddExpense"
        component={AddExpense}
        options={{
          tabBarIcon: ({ focused, color: tabColor }) => (
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${
                focused ? "bg-accent" : "bg-border-default"
              }`}
            >
              <Plus size={24} color={COLORS.textPrimary} />
            </View>
          ),
          tabBarLabel: "Adicionar",
        }}
      />
      <Tab.Screen
        name="Chat"
        component={Chat}
        options={{
          tabBarIcon: ({ color }) => (
            <MessageCircle size={20} color={color} />
          ),
          tabBarLabel: "IA Chat",
        }}
      />
      <Tab.Screen
        name="Categories"
        component={Categories}
        options={{
          tabBarIcon: ({ color }) => <Tag size={20} color={color} />,
          tabBarLabel: "Categorias",
        }}
      />
    </Tab.Navigator>
  );
}

function Gate() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-primary-bg">
        <Text className="text-text-primary text-base">Loading...</Text>
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <RootStack.Screen name="Main" component={MainTabs} />
          <RootStack.Screen name="Profile" component={Profile} />
          <RootStack.Screen name="SubscriptionPlans" component={SubscriptionPlans} />
        </>
      ) : (
        <>
          <RootStack.Screen
            name="Login"
            children={({ navigation }) => (
              <LoginScreen
                onNavigateToSignup={() =>
                  navigation.navigate("Signup" as never)
                }
              />
            )}
          />
          <RootStack.Screen
            name="Signup"
            children={({ navigation }) => (
              <Signup
                onNavigateToLogin={() => navigation.navigate("Login" as never)}
              />
            )}
          />
        </>
      )}
    </RootStack.Navigator>
  );
}

export default function AppNavigation() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
