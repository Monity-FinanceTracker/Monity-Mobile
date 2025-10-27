/// <reference types="nativewind/types" />
import { StatusBar, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "@/global.css";
import AppNavigation from "./src/navigation";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { StripePaymentProvider } from "./src/services/paymentService";
import { COLORS } from "./src/constants/colors";

export default function App() {
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
