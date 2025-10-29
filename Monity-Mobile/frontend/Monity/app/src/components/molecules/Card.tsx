import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

type CardProps = ViewProps & {
  className?: string;
  variant?: "default" | "elevated" | "outline" | "glass";
};

export default function Card({
  children,
  className,
  variant = "default",
  ...rest
}: CardProps) {
  const colors = COLORS;

  // Define variant-specific styles using design system colors
  const getVariantStyle = () => {
    const baseStyle = {
      borderRadius: 16,
      padding: 13,
      marginBottom: 8, // mb-3 equivalent
    };

    switch (variant) {
      case "elevated":
        return {
          ...baseStyle,
          backgroundColor: colors.cardBg,
          borderWidth: 1,
          borderColor: colors.border,
          // Add shadow for elevated
        };
      case "outline":
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.border,
        };
      case "glass":
        return {
          ...baseStyle,
          backgroundColor: colors.cardBg + 'CC', // 80% opacity
          borderWidth: 1,
          borderColor: colors.border + '80', // 50% opacity
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.cardBg,
          borderWidth: 1,
          borderColor: colors.border,
        };
    }
  };

  return (
    <View
      {...rest}
      style={[getVariantStyle(), rest.style]}
    >
      {children}
    </View>
  );
}
