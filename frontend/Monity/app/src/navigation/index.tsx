import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Home, Receipt, MessageCircle, ArrowLeftRight } from "lucide-react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import LoginScreen from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import EmailConfirmation from "../pages/auth/EmailConfirmation";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import Dashboard from "../pages/dashboard/Dashboard";
import Transactions from "../pages/transactions/Transactions";
import AddExpense from "../pages/expenses/AddExpense";
import AddExpenseForm from "../pages/expenses/AddExpenseForm";
import AddIncomeForm from "../pages/expenses/AddIncomeForm";
import Categories from "../pages/categories/Categories";
import Overview from "../pages/overview/Overview";
import Profile from "../pages/profile/Profile";
import Chat from "../pages/chat/Chat";
import SubscriptionPlans from "../pages/subscription/SubscriptionPlans";
import Savings from "../pages/savings/Savings";
import Analytics from "../pages/analytics/Analytics";
import Calendar from "../pages/overview/Calendar";
import RecurringTransactions from "../pages/recurring/RecurringTransactions";
import Help from "../pages/help/Help";
import { Platform, View, Text, Dimensions, Pressable, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { COLORS } from "../constants/colors";
import { triggerHaptic } from "../utils/haptics";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Images } from "../assets/images";

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  EmailConfirmation: { email: string };
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  Main: undefined;
  Profile: undefined;
  SubscriptionPlans: undefined;
  AddExpenseForm: { favoriteData?: any } | undefined;
  AddIncomeForm: { favoriteData?: any } | undefined;
  Categories: undefined;
  Savings: undefined;
  Analytics: undefined;
  Calendar: undefined;
  RecurringTransactions: undefined;
  Help: undefined;
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

// Componente wrapper para adicionar haptics nas tabs de navegação
function HapticTabButton({ children, onPress, ...props }: any) {
  const handlePress = (e: any) => {
    triggerHaptic();
    if (onPress) {
      onPress(e);
    }
  };

  return (
    <Pressable onPress={handlePress} {...props}>
      {children}
    </Pressable>
  );
}

// Tab bar customizada com blur
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = Platform.OS === "android"
    ? 60 + Math.max(0, insets.bottom)
    : 60;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: Platform.OS === "android" ? 16 : 20,
        left: 60,
        right: 60,
        height: tabBarHeight,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(38, 38, 38, 0.2)',
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 15 : 30}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <View
        style={{
          flexDirection: 'row',
          height: tabBarHeight,
          paddingBottom: Platform.OS === "android" ? Math.max(12, insets.bottom + 4) : Math.max(8, insets.bottom),
          paddingTop: 12,
          paddingHorizontal: 8,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isAddExpense = route.name === 'AddExpense';

          const handlePress = () => {
            triggerHaptic();
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          const handleLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const color = isFocused ? COLORS.accent : "#FAF9F5";
          const icon = options.tabBarIcon?.({ focused: isFocused, color, size: 24 });

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={handlePress}
              onLongPress={handleLongPress}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
              }}
            >
              {icon}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Componente de ícone customizado com 4 bolinhas 2x2
function GridIcon({ color, size = 24 }: { color: string; size?: number }) {
  const dotSize = size * 0.3;
  const gap = size * 0.2;
  
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flexDirection: 'column', marginRight: gap }}>
          <View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: color, marginBottom: gap }} />
          <View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: color }} />
        </View>
        <View style={{ flexDirection: 'column' }}>
          <View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: color, marginBottom: gap }} />
          <View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: color }} />
        </View>
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
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
              <Home size={24} color={color} />
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
              <ArrowLeftRight size={24} color={color} />
            </AnimatedTabIcon>
          ),
          tabBarLabel: "",
        }}
      />
      <Tab.Screen
        name="AddExpense"
        component={AddExpense}
        options={({ navigation }) => ({
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon focused={focused} activeColor={focused ? COLORS.accent : color}>
              <Image
                source={Images.MONITY_LOGO}
                style={{
                  width: 50,
                  height: 55,
                  tintColor: color,
                }}
                resizeMode="contain"
              />
            </AnimatedTabIcon>
          ),
          tabBarLabel: "",
        })}
      />
      <Tab.Screen
        name="Chat"
        component={Chat}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon focused={focused} activeColor={focused ? COLORS.accent : color}>
              <MessageCircle size={24} color={color} />
            </AnimatedTabIcon>
          ),
          tabBarLabel: "",
        }}
      />
      <Tab.Screen
        name="Overview"
        component={Overview}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon focused={focused} activeColor={focused ? COLORS.accent : color}>
              <GridIcon color={color} size={24} />
            </AnimatedTabIcon>
          ),
          tabBarLabel: "",
        }}
      />
    </Tab.Navigator>
  );
}

function Gate() {
  const { user, isInitializing } = useAuth();

  // Only show loading during initial bootstrap, not during login/signup
  if (isInitializing) {
    return (
      <View className="flex-1 items-center justify-center bg-primary-bg">
        <Text 
          className="text-text-primary text-base"
          style={{ fontFamily: "Stratford" }}
        >
          Loading...
        </Text>
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
          <RootStack.Screen name="AddExpenseForm" component={AddExpenseForm} />
          <RootStack.Screen name="AddIncomeForm" component={AddIncomeForm} />
          <RootStack.Screen name="Categories" component={Categories} />
          <RootStack.Screen name="Savings" component={Savings} />
          <RootStack.Screen name="Analytics" component={Analytics} />
          <RootStack.Screen name="Calendar" component={Calendar} />
          <RootStack.Screen name="RecurringTransactions" component={RecurringTransactions} />
          <RootStack.Screen name="Help" component={Help} />
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
                onNavigateToForgotPassword={() =>
                  navigation.navigate("ForgotPassword" as never)
                }
              />
            )}
          />
          <RootStack.Screen
            name="Signup"
            children={({ navigation }) => (
              <Signup
                onNavigateToLogin={() => navigation.navigate("Login" as never)}
                onNavigateToEmailConfirmation={(email: string) =>
                  navigation.navigate("EmailConfirmation" as never, { email } as never)
                }
              />
            )}
          />
          <RootStack.Screen
            name="EmailConfirmation"
            children={({ navigation, route }) => (
              <EmailConfirmation
                email={route.params?.email || ""}
                onNavigateToLogin={() => navigation.navigate("Login" as never)}
              />
            )}
          />
          <RootStack.Screen
            name="ForgotPassword"
            children={({ navigation }) => (
              <ForgotPassword
                onNavigateToLogin={() => navigation.navigate("Login" as never)}
              />
            )}
          />
          <RootStack.Screen
            name="ResetPassword"
            children={({ navigation, route }) => (
              <ResetPassword
                token={route.params?.token || ""}
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
