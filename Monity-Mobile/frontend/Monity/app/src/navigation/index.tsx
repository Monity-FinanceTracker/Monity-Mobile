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
import { View, Text } from "react-native";

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Profile: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#23263a",
          borderTopColor: "#31344d",
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarActiveTintColor: "#01C38D",
        tabBarInactiveTintColor: "#9ca3af",
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
          tabBarIcon: ({ color, size }) => <Home size={20} color={color} />,
          tabBarLabel: "Início",
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={Transactions}
        options={{
          tabBarIcon: ({ color, size }) => <Receipt size={20} color={color} />,
          tabBarLabel: "Transações",
        }}
      />
      <Tab.Screen
        name="AddExpense"
        component={AddExpense}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${
                focused ? "bg-[#01C38D]" : "bg-[#31344d]"
              }`}
            >
              <Plus size={24} color={focused ? "#191E29" : "#9ca3af"} />
            </View>
          ),
          tabBarLabel: "Adicionar",
        }}
      />
      <Tab.Screen
        name="Chat"
        component={Chat}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={20} color={color} />
          ),
          tabBarLabel: "IA Chat",
        }}
      />
      <Tab.Screen
        name="Categories"
        component={Categories}
        options={{
          tabBarIcon: ({ color, size }) => <Tag size={20} color={color} />,
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
      <View className="flex-1 items-center justify-center bg-[#191E29]">
        <Text className="text-white text-base">Loading...</Text>
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <RootStack.Screen name="Main" component={MainTabs} />
          <RootStack.Screen name="Profile" component={Profile} />
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
