/// <reference types="nativewind/types" />
import { useEffect, useState } from "react";
import { StatusBar, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import * as Notifications from "expo-notifications";
import "@/global.css";
import AppNavigation from "./src/navigation";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { StripePaymentProvider } from "./src/services/paymentService";
import { COLORS } from "./src/constants/colors";
import NotificationService from "./src/services/notificationService";
// TODO: Descomentar quando for fazer build (não funciona no Expo Go)
// import { preloadImages } from "./src/assets/images";

// Manter o splash screen visível enquanto carregamos
SplashScreen.preventAutoHideAsync();

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  // TODO: Descomentar quando for fazer build (não funciona no Expo Go)
  // const [imagesLoaded, setImagesLoaded] = useState(false);

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
          // TODO: Descomentar quando for fazer build (não funciona no Expo Go)
          // preloadImages(),
        ]);
        setFontsLoaded(true);
        // TODO: Descomentar quando for fazer build (não funciona no Expo Go)
        // setImagesLoaded(true);
      } catch (error) {
        console.warn("Error loading resources:", error);
        setFontsLoaded(true); // Continuar mesmo se falhar
        // TODO: Descomentar quando for fazer build (não funciona no Expo Go)
        // setImagesLoaded(true);
      }
    }

    loadResources();
  }, []);

  // Setup notification listeners
  useEffect(() => {
    const cleanup = NotificationService.setupNotificationListeners();
    return cleanup;
  }, []);

  useEffect(() => {
    // TODO: Descomentar quando for fazer build (não funciona no Expo Go)
    // if (fontsLoaded && imagesLoaded) {
    if (fontsLoaded) {
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
    // TODO: Descomentar quando for fazer build (não funciona no Expo Go)
    // }, [fontsLoaded, imagesLoaded]);
  }, [fontsLoaded]);

  return (
    <SafeAreaProvider>
      <StripePaymentProvider>
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
          <StatusBar
            barStyle="light-content"
            backgroundColor={COLORS.background}
            translucent={false}
            animated={true}
          />
          <ErrorBoundary>
            <AppNavigation />
          </ErrorBoundary>
        </View>
      </StripePaymentProvider>
    </SafeAreaProvider>
  );
}
