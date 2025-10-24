import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableProps,
  View,
} from "react-native";

interface ButtonProps extends PressableProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
}

const Button = ({
  title,
  onPress,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`w-full rounded-xl border border-gray-600 items-center justify-center px-6 py-3 mt-2 mb-5 ${
        disabled ? "opacity-50" : ""
      } ${className || ""}`}
      {...rest}
    >
      {disabled ? (
        <ActivityIndicator size="small"  />
      ) : // Render children if they exist, otherwise render the title
      children ? (
        children
      ) : (
        <Text className="text-white text-center font-semibold text-base">
          {title}
        </Text>
      )}
    </Pressable>
  );
};

export default Button;
