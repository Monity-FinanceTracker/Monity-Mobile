/// <reference types="nativewind/types" />
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "@/global.css";
import AppNavigation from "./src/navigation";
import ErrorBoundary from "./src/components/ErrorBoundary";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#191E29" translucent={false} />
      <ErrorBoundary>
        <AppNavigation />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
