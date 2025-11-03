import React, { useState } from "react";
import { TextInput, View, TextInputProps } from "react-native";
import { COLORS } from "../../constants/colors";

interface InputProps extends TextInputProps {
  className?: string;
  hasError?: boolean;
}

const Input = (props: InputProps) => {
  const { className, hasError, ...rest } = props;

  // Handle focus state for border color
  const [isFocused, setIsFocused] = useState(false);
  const onFocus = () => setIsFocused(true);
  const onBlur = () => setIsFocused(false);

  // Determine border color based on state
  const getBorderColor = () => {
    if (hasError) return "border-error";
    if (isFocused) return "border-accent";
    return "border-border-default";
  };


  return (
    <View className="relative">
      <TextInput
        className={`w-full bg-card-bg/80 rounded-xl px-4 py-4 text-text-primary text-base border ${getBorderColor()} ${
          className || ""
        }`}
        placeholderTextColor={COLORS.textMuted}
        onFocus={onFocus}
        onBlur={onBlur}
        selectionColor={COLORS.accent}
        {...rest}
      />
    </View>
  );
};

export default Input;
