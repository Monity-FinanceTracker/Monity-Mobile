import React, { useState } from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableProps,
  View,
} from "react-native";
import { COLORS } from "../../constants/colors";
import { triggerHaptic } from "../../utils/haptics";

interface ButtonProps extends PressableProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  className?: string;
}

const Button = ({
  title,
  onPress,
  disabled,
  variant = "primary",
  className,
  children,
  ...rest
}: ButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);

  // Get border color based on variant and state
  // All buttons use #F5F0E6 border as per design requirements
  const getBorderColor = () => {
    if (disabled) return COLORS.buttonBorder;
    return COLORS.buttonBorder;
  };


  // Define variant-specific background styles
  const getBackgroundColor = () => {
    if (disabled) {
      switch (variant) {
        case "primary":
          return COLORS.textMuted;
        case "secondary":
          return COLORS.cardBg;
        case "danger":
          return COLORS.error + "80";
        case "ghost":
          return "transparent";
        case "outline":
          return "transparent";
        default:
          return COLORS.cardBg;
      }
    }
    switch (variant) {
      case "primary":
        return COLORS.accent;
      case "secondary":
        return COLORS.cardBg;
      case "danger":
        return COLORS.error;
      case "ghost":
        return "transparent";
      case "outline":
        return "transparent";
      default:
        return COLORS.cardBg;
    }
  };

  // Define variant-specific text styles
  const textStyles = {
    primary: "text-text-primary",
    secondary: "text-text-primary",
    danger: "text-text-primary",
    ghost: "text-accent",
    outline: "text-accent",
  };

  const handlePress = () => {
    if (!disabled) {
      triggerHaptic();
      onPress();
    }
  };

  return (
    <View className="relative">
      <Pressable
        onPress={handlePress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        disabled={disabled}
        className={`w-full rounded-xl border-2 items-center justify-center px-6 py-3 mt-2 mb-5 overflow-hidden ${
          disabled ? "opacity-50" : ""
        } ${className || ""}`}
        style={{
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        }}
      >
        {/* Efeito de profundidade - borda superior esquerda mais clara */}
        <View
          className="absolute top-0 left-0 w-8 h-8"
          style={{
            borderTopWidth: 1.5,
            borderLeftWidth: 1.5,
            borderTopColor: "rgba(255, 255, 255, 0.15)",
            borderLeftColor: "rgba(255, 255, 255, 0.15)",
            borderTopLeftRadius: 12,
          }}
        />
        {/* Efeito de profundidade - borda inferior direita mais clara */}
        <View
          className="absolute bottom-0 right-0 w-8 h-8"
          style={{
            borderBottomWidth: 1.5,
            borderRightWidth: 1.5,
            borderBottomColor: "rgba(255, 255, 255, 0.15)",
            borderRightColor: "rgba(255, 255, 255, 0.15)",
            borderBottomRightRadius: 12,
          }}
        />
        {disabled ? (
          <ActivityIndicator
            size="small"
            color={variant === "primary" ? COLORS.textPrimary : COLORS.accent}
          />
        ) : // Render children if they exist, otherwise render the title
        children && typeof children !== 'function' ? (
          children
        ) : (
          <Text className={`text-center font-semibold text-base ${textStyles[variant]}`}>
            {title}
          </Text>
        )}
      </Pressable>
    </View>
  );
};

export default Button;
