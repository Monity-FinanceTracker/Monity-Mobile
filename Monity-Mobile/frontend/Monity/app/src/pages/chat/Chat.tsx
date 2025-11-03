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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowUp, Bot, Loader } from "lucide-react-native";
import { COLORS } from "../../constants/colors";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { geminiService } from "../../services/geminiService";
import { apiService, Balance, Transaction, Category } from "../../services/apiService";
import * as Font from "expo-font";
import { triggerHaptic } from "../../utils/haptics";

interface Message {
  id: string;
  content: string;
  user: "user" | "ai";
  timestamp: Date;
}

export default function Chat() {
  const colors = COLORS;
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
  const [userContext, setUserContext] = useState<string | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    const loadFont = async () => {
      try {
        await Font.loadAsync({
          EmonaRegular: require("../../../../assets/fonts/EmonaRegular.ttf"),
        });
        setFontLoaded(true);
      } catch (error) {
        console.warn("Error loading Emona font:", error);
        setFontLoaded(true); // Continuar mesmo se falhar
      }
    };
    loadFont();
  }, []);

  const { refreshControl, isRefreshing, handleRefresh } = usePullToRefresh({
    onRefresh: async () => {
      // Refresh user context when user pulls to refresh
      await loadUserContext();
      console.log("Chat context refreshed");
    },
  });

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Load user financial context when component mounts
  useEffect(() => {
    loadUserContext();
  }, []);

  const loadUserContext = async (): Promise<string | null> => {
    try {
      // Fetch all relevant user financial data in parallel
      const [balanceResponse, transactionsResponse, categoriesResponse, profileResponse] = await Promise.all([
        apiService.getBalance().catch(() => ({ success: false, data: null })),
        apiService.getRecentTransactions(30).catch(() => ({ success: false, data: [] })),
        apiService.getCategories().catch(() => ({ success: false, data: [] })),
        apiService.getProfile().catch(() => ({ success: false, data: null })),
      ]);

      // Format the context string
      const contextParts: string[] = [];

      // User profile info
      if (profileResponse.success && profileResponse.data) {
        const profile = profileResponse.data;
        contextParts.push(`Nome: ${profile.name || profile.email}`);
      }

      // Balance information
      if (balanceResponse.success && balanceResponse.data) {
        const balance = balanceResponse.data;
        contextParts.push(`Saldo total: R$ ${balance.total.toFixed(2)}`);
        contextParts.push(`Receita total: R$ ${balance.income.toFixed(2)}`);
        contextParts.push(`Despesas totais: R$ ${balance.expenses.toFixed(2)}`);
        contextParts.push(`Variação: ${balance.change >= 0 ? '+' : ''}R$ ${balance.change.toFixed(2)} (${balance.changePercentage >= 0 ? '+' : ''}${balance.changePercentage.toFixed(2)}%)`);
      }

      // Recent transactions - Include ALL recent transactions with full details
      if (transactionsResponse.success && transactionsResponse.data && transactionsResponse.data.length > 0) {
        const transactions = transactionsResponse.data;
        
        // Debug: Log first transaction to see actual structure
        if (transactions.length > 0) {
          const firstTxn = transactions[0] as any;
          console.log("🔍 DEBUG Transaction structure:", {
            keys: Object.keys(firstTxn),
            sample: {
              id: firstTxn.id,
              description: firstTxn.description,
              title: firstTxn.title,
              category: firstTxn.category,
              categoryId: firstTxn.categoryId,
              amount: firstTxn.amount,
              date: firstTxn.date,
              type: firstTxn.type,
              typeId: firstTxn.typeId,
            }
          });
        }
        
        const formattedTransactions = transactions.map((t: any, index: number) => {
          // Handle transaction type - same logic as Dashboard
          const type = t.type || ((t.categoryId === "1" || t.typeId === 1) ? 'expense' : 'income');
          const typeLabel = type === 'income' ? 'Receita' : 'Despesa';
          
          // Get transaction name/title - check ALL possible field names (camelCase and snake_case)
          // Try description first (encrypted field), then title, then check other fields
          let transactionName = t.description || t.title || t.name || t.transaction_description || t.transaction_name || 'Sem nome';
          
          // If still empty, check all string fields that might contain the name
          if (transactionName === 'Sem nome' || !transactionName || transactionName.trim() === '') {
            // Check all fields to find the transaction name
            const possibleNameFields = [
              'description', 
              'title', 
              'name', 
              'label', 
              'transactionName',
              'transaction_description',
              'transaction_name',
              'desc',
              'transacao'
            ];
            for (const field of possibleNameFields) {
              if (t[field] && typeof t[field] === 'string' && t[field].trim()) {
                transactionName = t[field].trim();
                break;
              }
            }
          }
          
          // Get category name - try ALL possible sources and field names (camelCase and snake_case)
          let categoryName = 'Sem categoria';
          
          // Try direct category field (string) - both camelCase and snake_case
          if (t.category && typeof t.category === 'string' && t.category.trim()) {
            categoryName = t.category.trim();
          } else if (t.category_name && typeof t.category_name === 'string' && t.category_name.trim()) {
            categoryName = t.category_name.trim();
          }
          // Try category object with name property
          else if (t.category && typeof t.category === 'object' && t.category.name) {
            categoryName = t.category.name.trim();
          }
          // Try categoryId lookup in categories list - both camelCase and snake_case
          else if (t.categoryId || t.category_id) {
            const catId = t.categoryId || t.category_id;
            if (categoriesResponse.success && categoriesResponse.data) {
              const foundCategory = categoriesResponse.data.find((c: Category) => 
                c.id === catId || String(c.id) === String(catId)
              );
              if (foundCategory) {
                categoryName = foundCategory.name;
              }
            }
          }
          // Try other possible category field names
          if (categoryName === 'Sem categoria') {
            const possibleCategoryFields = [
              'category', 
              'categoryName', 
              'category_name', 
              'cat',
              'categoria',
              'transaction_category'
            ];
            for (const field of possibleCategoryFields) {
              if (t[field]) {
                if (typeof t[field] === 'string' && t[field].trim()) {
                  categoryName = t[field].trim();
                  break;
                } else if (typeof t[field] === 'object' && t[field].name) {
                  categoryName = t[field].name.trim();
                  break;
                }
              }
            }
          }
          
          const amount = Math.abs(t.amount || 0);
          const date = t.date ? new Date(t.date).toLocaleDateString('pt-BR') : 'Data não disponível';
          
          // Format: Número, Tipo, NOME, Valor, Categoria, Data
          return `${index + 1}. ${typeLabel} | NOME: "${transactionName}" | VALOR: R$ ${amount.toFixed(2)} | CATEGORIA: "${categoryName}" | DATA: ${date}`;
        }).join('\n');
        
        contextParts.push(`TRANSAÇÕES RECENTES (últimas ${transactions.length}):\n${formattedTransactions}\n\nIMPORTANTE: Quando mencionar transações, sempre use o NOME exato e a CATEGORIA exata conforme listado acima.`);
      }

      // Categories - Include ALL categories organized by type
      if (categoriesResponse.success && categoriesResponse.data && categoriesResponse.data.length > 0) {
        const categories = categoriesResponse.data;
        
        // Separate categories by type
        const expenseCategories = categories.filter((c: Category) => c.typeId === 1 || c.type === 'expense');
        const incomeCategories = categories.filter((c: Category) => c.typeId === 2 || c.type === 'income');
        const savingsCategories = categories.filter((c: Category) => c.typeId === 3 || c.type === 'savings');
        
        // Format expense categories
        if (expenseCategories.length > 0) {
          const expenseList = expenseCategories.map((c: Category) => {
            const spent = c.totalSpent ? ` (Total gasto: R$ ${c.totalSpent.toFixed(2)})` : '';
            const count = c.transactionCount ? ` (${c.transactionCount} transações)` : '';
            return `  - ${c.name}${spent}${count}`;
          }).join('\n');
          contextParts.push(`Categorias de DESPESAS:\n${expenseList}`);
        }
        
        // Format income categories
        if (incomeCategories.length > 0) {
          const incomeList = incomeCategories.map((c: Category) => {
            const total = c.totalSpent ? ` (Total recebido: R$ ${c.totalSpent.toFixed(2)})` : '';
            const count = c.transactionCount ? ` (${c.transactionCount} transações)` : '';
            return `  - ${c.name}${total}${count}`;
          }).join('\n');
          contextParts.push(`Categorias de RECEITAS:\n${incomeList}`);
        }
        
        // Format savings categories
        if (savingsCategories.length > 0) {
          const savingsList = savingsCategories.map((c: Category) => {
            const total = c.totalSpent ? ` (Total poupado: R$ ${c.totalSpent.toFixed(2)})` : '';
            const count = c.transactionCount ? ` (${c.transactionCount} transações)` : '';
            return `  - ${c.name}${total}${count}`;
          }).join('\n');
          contextParts.push(`Categorias de POUPANÇA:\n${savingsList}`);
        }
      }

      const context = contextParts.length > 0 
        ? `INFORMAÇÕES FINANCEIRAS COMPLETAS DO USUÁRIO:\n${contextParts.join('\n')}\n\nVocê tem acesso completo a todas as informações financeiras do usuário, incluindo:\n- Saldo e resumo financeiro\n- Transações recentes (até 30 transações com TODOS os detalhes)\n- TODAS as categorias (despesas, receitas e poupança) com seus totais e quantidades\n\nINSTRUÇÕES IMPORTANTES:\n1. Ao mencionar transações, SEMPRE use o NOME/TÍTULO exato conforme aparece na lista (entre aspas duplas)\n2. Ao mencionar categorias, SEMPRE use o NOME DA CATEGORIA exato conforme aparece na lista\n3. Use os valores, datas e tipos (Receita/Despesa) exatamente como aparecem nas transações\n4. Se o usuário perguntar sobre "últimas transações", liste as transações mais recentes com todos os detalhes: nome, categoria, valor, tipo e data\n\nUse essas informações para responder com precisão perguntas sobre:\n- Saldo atual e situação financeira\n- Transações recentes (com nome, categoria, valor e data exatos)\n- Categorias disponíveis e seus gastos/receitas\n- Análise de transações recentes\n- Sugestões personalizadas baseadas nos dados reais do usuário\n\nSempre responda usando os dados fornecidos quando relevante, mencionando valores, nomes e categorias específicos exatamente como aparecem nos dados acima.`
        : null;

      setUserContext(context);
      return context;
    } catch (error) {
      console.error("Error loading user context:", error);
      // Continue without context if there's an error
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    triggerHaptic();

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
      // Reload context if not available or if user asks about balance/financial info
      const needsFinancialData = /\b(saldo|dinheiro|gasto|receita|despesa|transação|financeir|balance|quanto|tem)\b/i.test(userMessage.content);
      let context = userContext;

      // Always refresh context when user asks financial questions to get latest data
      if (needsFinancialData) {
        context = await loadUserContext();
      }

      // Try to use Gemini API with user context
      const aiResponse = await geminiService.sendMessage(userMessage.content, context || undefined);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
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
          contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
        >
          {messages.length === 1 ? (
            <View className="flex-1 justify-center items-center" style={{ minHeight: 400 }}>
              <Image
                source={require("../../../../assets/images/LOGO_MONITY_512px512px.png")}
                style={{
                  width: 80,
                  height: 100
                }}
                resizeMode="contain"
              />
              <Text
                style={{
                  fontFamily: fontLoaded ? "EmonaRegular" : undefined,
                  color: COLORS.textSecondary,
                  fontSize: 40,
                  textAlign: "center",
                }}
              >
                Como posso ajudar você hoje?
              </Text>
            </View>
          ) : (
            messages.map(renderMessage)
          )}

          {isLoading && (
            <View className="flex-row justify-start mb-4">
              <View className="bg-card-bg rounded-2xl rounded-bl-md p-3 border border-border-default">
                <View className="flex-row items-center">
                  <Bot size={16} color={COLORS.accent} className="mr-2" />
                  <Text className="text-text-primary text-xs font-medium mr-2 ml-2">
                    IA Assistente está digitando
                  </Text>
                  <Loader size={14} color={COLORS.accent} className="animate-spin" />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View className="bg-background px-4 py-4 border-t border-border-default" style={{ paddingBottom: Platform.OS === "android" ? 120 : 110 }}>
          <View className="flex-row items-center space-x-3">
            <View className="flex-1 bg-card-bg rounded-2xl px-4 border border-border-default" style={{ 
              paddingVertical: 8, 
              minHeight: 48, 
              justifyContent: 'center',
            }}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Converse com a Monity..."
                placeholderTextColor={COLORS.textMuted}
                className="text-text-primary text-base max-h-20"
                multiline
                textAlignVertical="center"
                editable={!isLoading}
                selectionColor={COLORS.accent}
                style={{ paddingVertical: 0 }}
              />
            </View>
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className={`bg-accent w-12 h-12 rounded-xl items-center justify-center ml-2 ${
                !inputText.trim() || isLoading ? "opacity-50" : ""
              }`}
            >
              <ArrowUp size={20} color="#232323" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
