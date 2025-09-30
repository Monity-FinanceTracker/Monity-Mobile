import React, { useState } from "react";
import { TextInput, View, TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  className?: string;
}

const Input = (props: InputProps) => {
  const { className, ...rest } = props;

  // You can handle focus state here similarly to the web example
  const [isFocused, setIsFocused] = useState(false);
  const onFocus = () => setIsFocused(true);
  const onBlur = () => setIsFocused(false);

  return (
    <View className="relative">
      <TextInput
        className={`w-full bg-[#2A3240]/80 rounded-xl px-4 py-4 text-white text-base caret-[#01C38D]
          ${isFocused ? "border-[#01C38D]" : "border-[#31344d]"} 
          ${className || ""}`}
        placeholderTextColor="#9ca3af"
        onFocus={onFocus}
        onBlur={onBlur}
        {...rest}
      />
    </View>
  );
};

export default Input;
