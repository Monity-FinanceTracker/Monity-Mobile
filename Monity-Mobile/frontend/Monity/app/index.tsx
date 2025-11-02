/// <reference types="nativewind/types" />
import { useEffect } from "react";
import { StatusBar, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import "@/global.css";
import AppNavigation from "./src/navigation";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { StripePaymentProvider } from "./src/services/paymentService";
import { COLORS } from "./src/constants/colors";

// Manter o splash screen visível enquanto carregamos
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    // Esconder o splash screen após o app carregar
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // Ignorar erros ao esconder splash screen
      }
    };

    // Aguardar um pouco para garantir que tudo carregou
    const timer = setTimeout(() => {
      hideSplash();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <StripePaymentProvider>
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
          <StatusBar
            barStyle="light-content"
            backgroundColor={COLORS.background}
            translucent={false}
          />
          <ErrorBoundary>
            <AppNavigation />
          </ErrorBoundary>
        </View>
      </StripePaymentProvider>
    </SafeAreaProvider>
  );
}
