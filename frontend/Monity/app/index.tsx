/// <reference types="nativewind/types" />
import { useEffect, useState } from "react";
import { StatusBar, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import "@/global.css";
import AppNavigation from "./src/navigation";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { StripePaymentProvider } from "./src/services/paymentService";
import { COLORS } from "./src/constants/colors";
import { preloadImages } from "./src/assets/images";

// Manter o splash screen visível enquanto carregamos
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    // Carregar fontes e imagens em paralelo
    async function loadResources() {
      try {
        // Carregar fontes e imagens simultaneamente
        await Promise.all([
          Font.loadAsync({
            EmonaRegular: require("../assets/fonts/EmonaRegular.ttf"),
            EmonaBold: require("../assets/fonts/Emona Bold.ttf"),
            Stratford: require("../assets/fonts/stratford.ttf"),
          }),
          preloadImages(),
        ]);
        setFontsLoaded(true);
        setImagesLoaded(true);
      } catch (error) {
        console.warn("Error loading resources:", error);
        setFontsLoaded(true); // Continuar mesmo se falhar
        setImagesLoaded(true);
      }
    }

    loadResources();
  }, []);

  useEffect(() => {
    if (fontsLoaded && imagesLoaded) {
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
    }
  }, [fontsLoaded, imagesLoaded]);

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
