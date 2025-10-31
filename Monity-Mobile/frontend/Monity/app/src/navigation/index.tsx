import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Home, Receipt, MessageCircle, Tag } from "lucide-react-native";
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
import { Platform, View, Text, Dimensions, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
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

// Componente animado para ícones da tabbar com fundo
function AnimatedTabIcon({ 
  children, 
  focused, 
  activeColor = COLORS.accent 
}: { 
  children: React.ReactNode; 
  focused: boolean; 
  activeColor?: string;
}) {
  const scale = useSharedValue(focused ? 1 : 0);
  const opacity = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(1, {
        duration: 250,
      });
    } else {
      scale.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(0, {
        duration: 200,
      });
    }
  }, [focused]);

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value * 0.15, // Fundo bem suave (15% de opacidade)
    };
  });

  return (
    <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: 4 }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 55,
            height: 50,
            borderRadius: 25,
            backgroundColor: activeColor,
            alignSelf: 'center',
          },
          animatedBackgroundStyle,
        ]}
      />
      <View style={{ zIndex: 1 }}>
        {children}
      </View>
    </View>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: COLORS.cardBg,
          borderTopColor: COLORS.border,
          borderTopWidth: 0,
          // Add extra bottom padding for Android gesture nav / soft keys
          paddingBottom: Platform.OS === "android" ? Math.max(12, insets.bottom + 4) : Math.max(8, insets.bottom),
          paddingTop: 12,
          paddingHorizontal: 8,
          // Increase height slightly on Android when there is a bottom inset
          height:
            Platform.OS === "android"
              ? 60 + Math.max(0, insets.bottom)
              : 60,
          // Ensure tab bar is above system navigation - flutuante
          position: 'absolute',
          bottom: Platform.OS === "android" ? 16 : 20,
          left: 120,
          right: 120,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: COLORS.border,
          // Sombra para efeito flutuante
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: '#01C38D',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          display: 'none',
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarItemStyle: {
          paddingHorizontal: 4,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon focused={focused} activeColor={focused ? COLORS.accent : color}>
              <Home size={22} color={color} />
            </AnimatedTabIcon>
          ),
          tabBarLabel: "",
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={Transactions}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon focused={focused} activeColor={focused ? COLORS.accent : color}>
              <Receipt size={22} color={color} />
            </AnimatedTabIcon>
          ),
          tabBarLabel: "",
        }}
      />
      <Tab.Screen
        name="AddExpense"
        component={AddExpense}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon focused={focused} activeColor={focused ? COLORS.accent : color}>
              <Image
                source={require("../../../assets/images/MONITY_LOGO.png")}
                style={{
                  width: 70,
                  height: 70,
                  tintColor: color,
                }}
                resizeMode="contain"
              />
            </AnimatedTabIcon>
          ),
          tabBarLabel: "",
        }}
      />
      <Tab.Screen
        name="Chat"
        component={Chat}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon focused={focused} activeColor={focused ? COLORS.accent : color}>
              <MessageCircle size={22} color={color} />
            </AnimatedTabIcon>
          ),
          tabBarLabel: "",
        }}
      />
      <Tab.Screen
        name="Categories"
        component={Categories}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon focused={focused} activeColor={focused ? COLORS.accent : color}>
              <Tag size={22} color={color} />
            </AnimatedTabIcon>
          ),
          tabBarLabel: "",
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
