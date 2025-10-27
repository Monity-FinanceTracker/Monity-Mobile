import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageCircle, Send, Bot, User, Loader } from "lucide-react-native";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { geminiService } from "../../services/geminiService";
import { COLORS } from "../../constants/colors";

interface Message {
  id: string;
  content: string;
  user: "user" | "ai";
  timestamp: Date;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Olá! Sou seu assistente financeiro IA. Como posso ajudar você hoje?",
      user: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const { refreshControl, isRefreshing, handleRefresh } = usePullToRefresh({
    onRefresh: async () => {
      // Refresh chat history or load new data
      console.log("Refreshing chat...");
    },
  });

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText.trim(),
      user: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // Try to use Gemini API
      const aiResponse = await geminiService.sendMessage(userMessage.content);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        user: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error calling Gemini API:", error);

      // Fallback response if Gemini API fails
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Entendi sua pergunta sobre: "${userMessage.content}". Para obter respostas mais inteligentes, configure sua chave de API do Gemini. Por enquanto, posso te ajudar com dicas básicas sobre finanças pessoais.`,
        user: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = (message: Message) => {
    const isUser = message.user === "user";
    return (
      <View
        key={message.id}
        className={`flex-row mb-4 ${isUser ? "justify-end" : "justify-start"}`}
      >
        <View
          className={`max-w-[80%] rounded-2xl p-3 ${
            isUser ? "bg-accent rounded-br-md" : "bg-card-bg border border-border-default rounded-bl-md"
          }`}
        >
          <View className={`flex-row items-start mb-1`}>
            {!isUser && (
              <Bot size={16} color={COLORS.accent} className="mr-2 mt-0.5" />
            )}
            {isUser && (
              <User size={16} color="#232323" className="mr-2 mt-0.5" />
            )}
            <Text
              className={`text-sm font-medium ${
                isUser ? "text-[#232323]" : "text-text-primary"
              }`}
            >
              {isUser ? "Você" : "IA Assistente"}
            </Text>
          </View>
          <Text
            className={`text-sm leading-5 ${
              isUser ? "text-[#232323]" : "text-text-primary"
            }`}
          >
            {message.content}
          </Text>
          <Text
            className={`text-xs mt-1 ${
              isUser ? "text-[#232323]/70" : "text-text-muted"
            }`}
          >
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const suggestedQuestions = [
    "Como posso economizar mais dinheiro?",
    "Qual é minha situação financeira atual?",
    "Dicas para controlar gastos",
    "Como criar um plano de poupança?",
  ];

  const handleSuggestedQuestion = (question: string) => {
    setInputText(question);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="bg-primary-bg px-6 py-4 border-b border-border-default">
        <View className="flex-row items-center">
          <MessageCircle size={24} color={COLORS.accent} className="mr-3" />
          <View>
            <Text className="text-text-primary text-base font-semibold">
              Chat com IA
            </Text>
            <Text className="text-text-muted text-xs">
              Seu assistente financeiro inteligente
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-6 py-4"
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.map(renderMessage)}

          {isLoading && (
            <View className="flex-row justify-start mb-4">
              <View className="bg-card-bg rounded-2xl rounded-bl-md p-3 border border-border-default">
                <View className="flex-row items-center">
                  <Bot size={16} color={COLORS.accent} className="mr-2" />
                  <Text className="text-text-primary text-xs font-medium mr-2">
                    IA Assistente está digitando
                  </Text>
                  <Loader size={14} color={COLORS.accent} className="animate-spin" />
                </View>
              </View>
            </View>
          )}

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <View className="mt-4">
              <Text className="text-text-muted text-sm font-medium mb-3">
                Perguntas sugeridas:
              </Text>
              <View className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSuggestedQuestion(question)}
                    className="bg-card-bg rounded-xl p-3 border border-border-default"
                  >
                    <Text className="text-text-primary text-sm">{question}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View className="bg-primary-bg px-6 py-4 border-t border-border-default" style={{ paddingBottom: Platform.OS === "android" ? 100 : 90 }}>
          <View className="flex-row items-end space-x-3">
            <View className="flex-1 bg-card-bg rounded-2xl px-4 py-3 border border-border-default">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Digite sua pergunta..."
                placeholderTextColor={COLORS.textMuted}
                className="text-text-primary text-base max-h-20"
                multiline
                textAlignVertical="top"
                editable={!isLoading}
                selectionColor={COLORS.accent}
              />
            </View>
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className={`bg-accent w-12 h-12 rounded-xl items-center justify-center ${
                !inputText.trim() || isLoading ? "opacity-50" : ""
              }`}
            >
              <Send size={20} color="#232323" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
