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
  Animated,
  Keyboard,
} from "react-native";
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowUp, Bot, Loader, Plus, Mic, Image as ImageIcon, Headphones, Copy, ChevronDown } from "lucide-react-native";
import { COLORS } from "../../constants/colors";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { geminiService } from "../../services/geminiService";
import { apiService, Balance, Transaction, Category } from "../../services/apiService";
import { triggerHaptic } from "../../utils/haptics";
import { useAuth } from "../../context/AuthContext";
import { Images } from "../../assets/images";

interface Message {
  id: string;
  content: string;
  user: "user" | "ai";
  timestamp: Date;
  type?: "text" | "image" | "audio";
  mediaUri?: string;
}

// Extract first name from user's full name
const getFirstName = (fullName: string | undefined | null): string => {
  if (!fullName) return "Usuário";
  return fullName.split(" ")[0] || "Usuário";
};

export default function Chat() {
  const colors = COLORS;
  const { user } = useAuth();
  
  const firstName = getFirstName(user?.name);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        `Olá ${firstName}! Sou seu assistente financeiro IA. Como posso ajudar você hoje?`,
      user: "ai",
      timestamp: new Date(),
      type: "text",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [userContext, setUserContext] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRef = useRef<TextInput>(null);
  
  // Animated values for audio waves
  const wave1Anim = useRef(new Animated.Value(0)).current;
  const wave2Anim = useRef(new Animated.Value(0)).current;
  const wave3Anim = useRef(new Animated.Value(0)).current;

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

  // Update initial message when user is loaded
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === "1") {
      const currentFirstName = getFirstName(user?.name);
      setMessages([
        {
          id: "1",
          content: `Olá ${currentFirstName}! Sou seu assistente financeiro IA. Como posso ajudar você hoje?`,
          user: "ai",
          timestamp: new Date(),
          type: "text",
        },
      ]);
    }
  }, [user?.name]);

  // Load user financial context when component mounts
  useEffect(() => {
    loadUserContext();
  }, []);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      setCameraPermission(cameraStatus === "granted");
      setAudioPermission(audioStatus === "granted");
    })();
  }, []);

  // Keyboard visibility listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setIsKeyboardVisible(true);
        setKeyboardHeight(event.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Animate audio waves when recording
  useEffect(() => {
    if (isRecording) {
      // Start wave animations
      const createWaveAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              delay,
              useNativeDriver: true, // Can use native driver with transform
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const anim1 = createWaveAnimation(wave1Anim, 0);
      const anim2 = createWaveAnimation(wave2Anim, 150);
      const anim3 = createWaveAnimation(wave3Anim, 300);

      anim1.start();
      anim2.start();
      anim3.start();

      // Start recording timer
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
      };
    } else {
      // Stop animations and clear timer
      wave1Anim.setValue(0);
      wave2Anim.setValue(0);
      wave3Anim.setValue(0);
      setRecordingDuration(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, [isRecording]);

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

  const processImageAndGetResponse = async (imageUri: string) => {
    setIsLoading(true);
    
    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: "Imagem enviada",
      user: "user",
      timestamp: new Date(),
      type: "image",
      mediaUri: imageUri,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Reload context if needed
      let context = userContext;
      if (!context) {
        context = await loadUserContext();
      }

      // Process image with AI
      const aiResponse = await geminiService.processChatImage(imageUri, context || undefined);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        user: "ai",
        timestamp: new Date(),
        type: "text",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error processing image:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Desculpe, não consegui processar a imagem. Tente novamente ou envie uma pergunta em texto.",
        user: "ai",
        timestamp: new Date(),
        type: "text",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePress = async () => {
    Alert.alert(
      "Selecionar Imagem",
      "Escolha uma opção",
      [
        {
          text: "Câmera",
          onPress: async () => {
            if (!cameraPermission) {
              Alert.alert(
                "Permissão Necessária",
                "Por favor, conceda permissão para usar a câmera nas configurações do aplicativo."
              );
              return;
            }
            try {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                const photo = result.assets[0];
                await processImageAndGetResponse(photo.uri);
              }
            } catch (error) {
              console.error("Erro ao tirar foto:", error);
              Alert.alert("Erro", "Não foi possível tirar a foto.");
            }
          },
        },
        {
          text: "Galeria",
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                const image = result.assets[0];
                await processImageAndGetResponse(image.uri);
              }
            } catch (error) {
              console.error("Erro ao selecionar imagem:", error);
              Alert.alert("Erro", "Não foi possível selecionar a imagem.");
            }
          },
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ]
    );
  };

  const processAudioAndGetResponse = async (audioUri: string) => {
    setIsLoading(true);
    
    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: "Áudio enviado",
      user: "user",
      timestamp: new Date(),
      type: "audio",
      mediaUri: audioUri,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Reload context if needed
      let context = userContext;
      if (!context) {
        context = await loadUserContext();
      }

      // Process audio with AI
      const aiResponse = await geminiService.processChatAudio(audioUri, context || undefined);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        user: "ai",
        timestamp: new Date(),
        type: "text",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error processing audio:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Desculpe, não consegui processar o áudio. Tente novamente ou envie uma pergunta em texto.",
        user: "ai",
        timestamp: new Date(),
        type: "text",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioPress = async () => {
    if (!audioPermission) {
      Alert.alert(
        "Permissão Necessária",
        "Por favor, conceda permissão para usar o microfone nas configurações do aplicativo."
      );
      return;
    }

    if (isLoading && !isRecording) return;

    try {
      if (isRecording && recording) {
        // Stop recording
        try {
          await recording.stopAndUnloadAsync();
          const uri = recording.getURI();
          const duration = recordingDuration;
          
          // Clear interval and reset state
          if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
          }
          setIsRecording(false);
          setRecording(null);
          setRecordingDuration(0);
          
          if (uri && duration > 0) {
            await processAudioAndGetResponse(uri);
          } else {
            Alert.alert("Erro", "Gravação muito curta ou não foi possível obter o áudio.");
          }
        } catch (stopError) {
          console.error("Erro ao parar gravação:", stopError);
          if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
          }
          setIsRecording(false);
          setRecording(null);
          setRecordingDuration(0);
          Alert.alert("Erro", "Não foi possível parar a gravação.");
        }
      } else {
        // Start recording
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });

          const { recording: newRecording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
          );

          setRecording(newRecording);
          setIsRecording(true);
          triggerHaptic();
        } catch (startError) {
          console.error("Erro ao iniciar gravação:", startError);
          setIsRecording(false);
          setRecording(null);
          Alert.alert("Erro", "Não foi possível iniciar a gravação.");
        }
      }
    } catch (error) {
      console.error("Erro ao gravar áudio:", error);
      Alert.alert("Erro", "Não foi possível gravar o áudio.");
      setIsRecording(false);
      setRecording(null);
    }
  };

  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
    inputRef.current?.blur();
    setIsKeyboardVisible(false);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    triggerHaptic();

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText.trim(),
      user: "user",
      timestamp: new Date(),
      type: "text",
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
        type: "text",
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
        type: "text",
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

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await Clipboard.setStringAsync(content);
      triggerHaptic();
      Alert.alert("Copiado!", "Mensagem copiada para a área de transferência.");
    } catch (error) {
      console.error("Error copying message:", error);
      Alert.alert("Erro", "Não foi possível copiar a mensagem.");
    }
  };

  const renderAudioWave = (animValue: Animated.Value, minHeight: number, maxHeight: number) => {
    // Use scaleY for animation since height can't be animated with native driver
    const scaleY = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [minHeight / maxHeight, 1],
    });

    return (
      <View
        style={{
          height: maxHeight,
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginHorizontal: 2,
        }}
      >
        <Animated.View
          style={{
            width: 3,
            height: maxHeight,
            backgroundColor: COLORS.error,
            borderRadius: 2,
            transform: [{ scaleY }],
          }}
        />
      </View>
    );
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.user === "user";
    const messageType = message.type || "text";
    const isLastMessage = index === messages.length - 1;
    
    return (
      <View key={message.id}>
        <View
          className={`flex-row mb-4 ${isUser ? "justify-end" : "justify-start"}`}
        >
          <View
            className={`max-w-[80%] rounded-2xl p-3 relative ${
              isUser ? "bg-accent rounded-br-md" : "bg-card-bg border border-border-default rounded-bl-md"
            }`}
          >
            {/* Copy button - only for AI messages */}
            {!isUser && (
              <TouchableOpacity
                onPress={() => handleCopyMessage(message.content)}
                className="absolute top-2 right-2 p-1"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Copy 
                  size={14} 
                  color={COLORS.textMuted} 
                />
              </TouchableOpacity>
            )}

            {/* Image message */}
            {messageType === "image" && (
              <View className="flex-row items-center mb-2">
                <ImageIcon 
                  size={18} 
                  color={isUser ? "#232323" : COLORS.accent} 
                  style={{ marginRight: 8 }}
                />
                <Text
                  className={`text-sm font-medium ${
                    isUser ? "text-[#232323]" : "text-text-primary"
                  }`}
                >
                  Foto
                </Text>
              </View>
            )}
            
            {/* Audio message */}
            {messageType === "audio" && (
              <View className="flex-row items-center mb-2">
                <Headphones 
                  size={18} 
                  color={isUser ? "#232323" : COLORS.accent} 
                  style={{ marginRight: 8 }}
                />
                <Text
                  className={`text-sm font-medium ${
                    isUser ? "text-[#232323]" : "text-text-primary"
                  }`}
                >
                  Áudio
                </Text>
              </View>
            )}
            
            {/* Message content */}
            <Text
              className={`text-sm leading-5 pr-6 ${
                isUser ? "text-[#232323]" : "text-text-primary"
              }`}
            >
              {message.content}
            </Text>
            
            {/* Timestamp */}
            <Text
              className={`text-xs mt-1 ${
                isUser ? "text-[#232323]/70" : "text-text-muted"
              }`}
            >
              {formatTime(message.timestamp)}
            </Text>
          </View>
        </View>
        
        {/* Logo e disclaimer abaixo da última mensagem */}
        {isLastMessage && (
          <View className="flex-row items-start justify-between mb-4 w-full">
            <Image
              source={Images.LOGO_MONITY_512}
              style={{
                width: 32,
                height: 40,
                marginLeft: 0,
              }}
              resizeMode="contain"
            />
            <View className="flex-1 ml-4 mr-6">
              <Text
                style={{
                  color: COLORS.textMuted,
                  fontSize: 10,
                  opacity: 0.7,
                  lineHeight: 14,
                }}
              >
                A IA pode cometer erros. Sempre verifique duas vezes.
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
        enabled={false}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-6 py-4"
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 180, flexGrow: 1 }}
        >
          {messages.length === 1 ? (
            <View className="flex-1 justify-center items-center" style={{ minHeight: 400 }}>
              <Image
                source={Images.LOGO_MONITY_512}
                style={{
                  width: 80,
                  height: 100
                }}
                resizeMode="contain"
              />
              <Text
                style={{
                  fontFamily: "Stratford",
                  color: COLORS.textMuted,
                  fontSize: 35,
                  textAlign: "center",
                }}
              >
                Olá, {firstName}! 
              </Text>
            </View>
          ) : (
            messages.map((message, index) => renderMessage(message, index))
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

        {/* Input - Overlay */}
        <Animated.View 
          style={{ 
            position: 'absolute',
            bottom: isKeyboardVisible 
              ? keyboardHeight + (Platform.OS === "android" ? 5 : 5)
              : (Platform.OS === "android" ? 100 : 90),
            left: 0,
            right: 0,
            paddingHorizontal: 16,
            paddingTop: isKeyboardVisible ? 0 : 10,
          }}
        >
          {/* Close keyboard button - only visible when keyboard is open */}
          {isKeyboardVisible && (
            <TouchableOpacity
              onPress={handleDismissKeyboard}
              className="items-center mb-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronDown size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
          
          <View className="bg-card-bg rounded-2xl border border-border-default flex-row items-center px-3" style={{ 
            paddingVertical: 8, 
            minHeight: 48,
          }}>
            {/* Botão + (Imagem) */}
            <TouchableOpacity
              onPress={handleImagePress}
              disabled={isLoading || isRecording}
              className={`mr-2 ${isLoading || isRecording ? "opacity-50" : ""}`}
            >
              <Plus size={20} color={COLORS.accent} />
            </TouchableOpacity>

            {/* Botão Áudio */}
            <TouchableOpacity
              onPress={handleAudioPress}
              disabled={isLoading}
              className={`mr-2 ${isLoading ? "opacity-50" : ""}`}
            >
              <Mic size={20} color={isRecording ? COLORS.error : COLORS.accent} />
            </TouchableOpacity>

            {/* Input de Texto ou Audio Waves */}
            <View className="flex-1" style={{ 
              paddingVertical: 4,
              justifyContent: 'center',
            }}>
              {isRecording ? (
                <View className="flex-row items-center flex-1">
                  {/* Audio Waves */}
                  <View className="flex-row items-center mr-3">
                    {renderAudioWave(wave1Anim, 8, 20)}
                    {renderAudioWave(wave2Anim, 12, 24)}
                    {renderAudioWave(wave3Anim, 8, 20)}
                  </View>
                  {/* Recording Time */}
                  <Text
                    style={{
                      color: COLORS.error,
                      fontSize: 14,
                      fontWeight: '600',
                    }}
                  >
                    {formatRecordingTime(recordingDuration)}
                  </Text>
                </View>
              ) : (
                <TextInput
                  ref={inputRef}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Pergunte para Monity..."
                  placeholderTextColor={COLORS.textMuted}
                  className="text-text-primary text-base max-h-20"
                  multiline
                  textAlignVertical="center"
                  editable={!isLoading}
                  selectionColor={COLORS.accent}
                  style={{ paddingVertical: 0 }}
                  onFocus={() => setIsKeyboardVisible(true)}
                  onBlur={() => {
                    // Delay to allow keyboard dismiss animation
                    setTimeout(() => {
                      if (!isKeyboardVisible) {
                        setIsKeyboardVisible(false);
                      }
                    }, 100);
                  }}
                />
              )}
            </View>

            {/* Botão Enviar */}
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading || isRecording}
              className={`bg-accent rounded-xl items-center justify-center ml-2 ${
                !inputText.trim() || isLoading || isRecording ? "opacity-50" : ""
              }`}
              style={{ width: 36, height: 36 }}
            >
              <ArrowUp size={18} color="#232323" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
