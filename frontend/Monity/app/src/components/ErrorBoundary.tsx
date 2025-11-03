import React from "react";
import { View, Text } from "react-native";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 justify-center items-center bg-red-500 p-4">
          <Text className="text-white text-lg font-bold mb-2">
            Something went wrong!
          </Text>
          <Text className="text-white text-sm text-center">
            {this.state.error?.message || "Unknown error"}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
