import React from "react";
import { View, ViewProps } from "react-native";

type CardProps = ViewProps & { className?: string };

export default function Card({ children, className, ...rest }: CardProps) {
  return (
    <View
      {...rest}
      className={`bg-[#23263a] rounded-2xl p-4 shadow-sm ${className || ""}`}
    >
      {children}
    </View>
  );
}
