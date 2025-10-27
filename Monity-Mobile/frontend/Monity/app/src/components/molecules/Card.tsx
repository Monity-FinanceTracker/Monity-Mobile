import React from "react";
import { View, ViewProps } from "react-native";

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
  // Define variant-specific styles using design system colors
  const variantStyles = {
    default: "bg-card-bg border border-border-default",
    elevated: "bg-card-bg border border-border-default shadow-lg",
    outline: "bg-transparent border-2 border-border-default",
    glass: "bg-card-bg/80 border border-border-default/50",
  };

  return (
    <View
      {...rest}
      className={`rounded-2xl p-4 ${variantStyles[variant]} ${className || ""}`}
    >
      {children}
    </View>
  );
}
