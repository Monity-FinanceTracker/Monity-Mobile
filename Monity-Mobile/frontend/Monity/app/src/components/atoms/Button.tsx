import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableProps,
  View,
} from "react-native";
import { COLORS } from "../../constants/colors";

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
  // Define variant-specific styles using design system colors
  const variantStyles = {
    primary: "bg-accent border-accent active:bg-accent-hover",
    secondary: "bg-card-bg border-border-default active:bg-border-default",
    danger: "bg-error border-error active:opacity-90",
    ghost: "bg-transparent border-transparent active:bg-accent-light",
    outline: "bg-transparent border-accent active:bg-accent-light",
  };

  const textStyles = {
    primary: "text-[#232323]",
    secondary: "text-text-primary",
    danger: "text-text-primary",
    ghost: "text-accent",
    outline: "text-accent",
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`w-full rounded-xl border items-center justify-center px-6 py-3 mt-2 mb-5 ${
        variantStyles[variant]
      } ${disabled ? "opacity-50" : ""} ${className || ""}`}
      {...rest}
    >
      {disabled ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#232323" : COLORS.accent}
        />
      ) : // Render children if they exist, otherwise render the title
      children ? (
        children
      ) : (
        <Text className={`text-center font-semibold text-base ${textStyles[variant]}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
};

export default Button;
