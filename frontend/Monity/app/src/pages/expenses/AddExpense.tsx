import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../../constants/colors";
import { apiService, Transaction } from "../../services/apiService";
import {
  TrendingDown,
  TrendingUp,
  Tag,
  Repeat,
  HelpCircle,
  ChevronRight,
  Star,
  Camera as CameraIcon,
  Mic,
  ArrowDown,
  ArrowUp,
} from "lucide-react-native";
import { triggerHaptic } from "../../utils/haptics";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { geminiService } from "../../services/geminiService";

// Quick actions for the carousel
const quickActions = [
  {
    id: "create-category",
    title: "Criar Categoria",
    icon: Tag,
    onPress: (navigation: any) => {
      // Navigate to Categories page (stack navigation)
      navigation.navigate("Categories" as never);
    },
  },
  {
    id: "recurring",
    title: "Recorrente",
    icon: Repeat,
    onPress: (navigation: any) => {
      navigation.navigate("RecurringTransactions" as never);
    },
  },
  {
    id: "help",
    title: "Ajuda",
    icon: HelpCircle,
    onPress: (navigation: any) => {
      // TODO: Navigate to Help page (to be created)
      console.log("Navigate to Help page");
    },
  },
];


export default function AddExpense() {
  const navigation = useNavigation();
  const colors = COLORS;
  const [favoriteTransactions, setFavoriteTransactions] = useState<Transaction[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Solicitar permissões ao montar o componente
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      
      setCameraPermission(cameraStatus === "granted");
      setAudioPermission(audioStatus === "granted");
    })();
  }, []);

  // Cleanup ao desmontar o componente
  useEffect(() => {
    return () => {
      if (recording) {
        // Tenta parar a gravação, mas ignora erros se já foi unloaded
        recording.stopAndUnloadAsync().catch(() => {
          // Silenciosamente ignora erros de gravação já unloaded
          // Isso é esperado quando a gravação já foi parada manualmente
        });
      }
    };
  }, [recording]);

  const loadFavorites = async () => {
    try {
      setIsLoadingFavorites(true);
      const response = await apiService.getTransactions();
      if (response.success && response.data) {
        // Debug: Log all transactions to check isFavorite values
        console.log("🔍 AddExpense.loadFavorites - Total transactions:", response.data.length);
        console.log("🔍 AddExpense.loadFavorites - Sample transactions:", 
          response.data.slice(0, 5).map((t: any) => ({ 
            id: t.id, 
            description: t.description, 
            isFavorite: t.isFavorite, 
            is_favorite: (t as any).is_favorite,
            typeof_isFavorite: typeof t.isFavorite,
            typeof_is_favorite: typeof (t as any).is_favorite
          }))
        );
        
        // Filter only favorite transactions
        // Check both isFavorite (camelCase) and is_favorite (snake_case) for compatibility
        const favorites = response.data.filter((t) => {
          const isFavoriteValue = t.isFavorite === true || (t as any).is_favorite === true || 
                                  (t as any).is_favorite === "true" || (t as any).is_favorite === 1;
          if (isFavoriteValue) {
            console.log("✅ Found favorite transaction:", { 
              id: t.id, 
              description: t.description, 
              isFavorite: t.isFavorite, 
              is_favorite: (t as any).is_favorite 
            });
          }
          return isFavoriteValue;
        });
        
        console.log("🔍 AddExpense.loadFavorites - Favorites found:", favorites.length);
        
        // Sort by date descending (most recent first)
        favorites.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        });
        // Limit to last 5 favorites
        setFavoriteTransactions(favorites.slice(0, 5));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  // Load favorites when component mounts and when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
      // Reset processing state when screen is focused (in case user navigated back)
      setIsProcessing(false);
    }, [])
  );

  const handleNavigateToExpense = () => {
    triggerHaptic();
    navigation.navigate("AddExpenseForm" as never);
  };

  const handleNavigateToIncome = () => {
    triggerHaptic();
    navigation.navigate("AddIncomeForm" as never);
  };

  const handleFavoritePress = (transaction: Transaction) => {
    triggerHaptic();
    // Determine transaction type
    const transactionType = transaction.type || (transaction.categoryId === "1" ? "expense" : "income");
    
    // Prepare favoriteData object with transaction information
    const favoriteData = {
      name: transaction.title || transaction.description || "",
      amount: transaction.amount || 0,
      description: transaction.description || "",
      date: transaction.date || new Date().toISOString(),
      isFavorite: transaction.isFavorite || false,
      categoryName: transaction.category?.name || "",
    };

    // Navigate to the appropriate form based on transaction type
    if (transactionType === "income") {
      (navigation as any).navigate("AddIncomeForm", { favoriteData });
    } else {
      (navigation as any).navigate("AddExpenseForm", { favoriteData });
    }
  };

  const formatDate = (dateString: string) => {
    // Extract date parts from string (handles both ISO format and YYYY-MM-DD)
    const datePart = dateString.split('T')[0]; // Get YYYY-MM-DD part
    const [year, month, day] = datePart.split('-').map(Number);
    
    // Create date in local timezone to avoid timezone conversion issues
    const date = new Date(year, month - 1, day);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const compareDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const compareToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const compareYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );

    if (compareDate.getTime() === compareToday.getTime()) {
      return "Hoje";
    } else if (compareDate.getTime() === compareYesterday.getTime()) {
      return "Ontem";
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
    }
  };

  const processImageAndNavigate = async (imageUri: string) => {
    try {
      setIsProcessing(true);
      
      // Process image with Gemini AI
      const extractedData = await geminiService.processReceiptImage(imageUri);
      
      // Prepare favoriteData object
      const favoriteData = {
        name: extractedData.name,
        amount: extractedData.amount,
        description: extractedData.description || extractedData.name,
        date: extractedData.date,
        categoryName: extractedData.categoryName,
        isFavorite: false,
      };

      // Reset processing state before navigation
      setIsProcessing(false);

      // Navigate to appropriate form based on transaction type
      if (extractedData.type === "income") {
        (navigation as any).navigate("AddIncomeForm", { favoriteData });
      } else {
        (navigation as any).navigate("AddExpenseForm", { favoriteData });
      }
    } catch (error: any) {
      console.error("Erro ao processar imagem:", error);
      setIsProcessing(false);
      Alert.alert(
        "Erro ao Processar",
        error.message || "Não foi possível processar a imagem. Tente novamente.",
        [
          {
            text: "OK",
            onPress: () => {},
          },
        ]
      );
    }
  };

  const handleCameraPress = async () => {
    if (!cameraPermission) {
      Alert.alert(
        "Permissão Necessária",
        "Por favor, conceda permissão para usar a câmera nas configurações do aplicativo."
      );
      return;
    }

    if (isProcessing) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        console.log("Foto tirada:", photo.uri);
        // Process image with AI
        await processImageAndNavigate(photo.uri);
      } else {
        // User canceled, reset processing state
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Erro ao tirar foto:", error);
      setIsProcessing(false);
      Alert.alert("Erro", "Não foi possível tirar a foto.");
    }
  };

  const processAudioAndNavigate = async (audioUri: string | null) => {
    if (!audioUri) {
      setIsProcessing(false);
      Alert.alert("Erro", "URI do áudio não disponível.");
      return;
    }

    try {
      setIsProcessing(true);
      
      // Process audio with Gemini AI
      const extractedData = await geminiService.processTransactionAudio(audioUri);
      
      // Prepare favoriteData object
      const favoriteData = {
        name: extractedData.name,
        amount: extractedData.amount,
        description: extractedData.description || extractedData.name,
        date: extractedData.date,
        categoryName: extractedData.categoryName,
        isFavorite: false,
      };

      // Reset processing state before navigation
      setIsProcessing(false);

      // Navigate to appropriate form based on transaction type
      if (extractedData.type === "income") {
        (navigation as any).navigate("AddIncomeForm", { favoriteData });
      } else {
        (navigation as any).navigate("AddExpenseForm", { favoriteData });
      }
    } catch (error: any) {
      console.error("Erro ao processar áudio:", error);
      setIsProcessing(false);
      Alert.alert(
        "Erro ao Processar",
        error.message || "Não foi possível processar o áudio. Tente novamente.",
        [
          {
            text: "OK",
            onPress: () => {},
          },
        ]
      );
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

    if (isProcessing && !isRecording) return;

    try {
      if (isRecording && recording) {
        // Parar gravação
        try {
          await recording.stopAndUnloadAsync();
          const uri = recording.getURI();
          console.log("Áudio gravado:", uri);
          setIsRecording(false);
          setRecording(null);
          
          // Process audio with AI
          if (uri) {
            await processAudioAndNavigate(uri);
          } else {
            setIsProcessing(false);
            Alert.alert("Erro", "Não foi possível obter o áudio gravado.");
          }
        } catch (stopError) {
          console.error("Erro ao parar gravação:", stopError);
          setIsRecording(false);
          setRecording(null);
          setIsProcessing(false);
          Alert.alert("Erro", "Não foi possível parar a gravação.");
        }
      } else {
        // Iniciar gravação
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
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6 pb-6">
          {/* Header */}
          <View className="mb-6">
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold' }}>
              Adicionar Transação
            </Text>
          </View>

          {/* Expense Box */}
          <Pressable
            onPress={handleNavigateToExpense}
            className="mb-2"
          >
            <View
              style={{
                backgroundColor: colors.cardBg,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-4 flex-1">
                  <View
                    style={{
                      backgroundColor: colors.expenseBg,
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <TrendingDown
                      size={24}
                      color={colors.expense}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 18,
                        fontWeight: '600',
                        marginBottom: 4,
                      }}
                    >
                      Despesas
                    </Text>
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 14,
                      }}
                    >
                      Adicionar nova despesa
                    </Text>
                  </View>
                </View>
                <ChevronRight
                  size={20}
                  color={colors.accent}
                />
              </View>
            </View>
          </Pressable>

          {/* Income Box */}
          <Pressable
            onPress={handleNavigateToIncome}
            className="mb-6"
          >
            <View
              style={{
                backgroundColor: colors.cardBg,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-4 flex-1">
                  <View
                    style={{
                      backgroundColor: colors.incomeBg,
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <TrendingUp
                      size={24}
                      color={colors.income}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 18,
                        fontWeight: '600',
                        marginBottom: 4,
                      }}
                    >
                      Receitas
                    </Text>
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 14,
                      }}
                    >
                      Adicionar nova receita
                    </Text>
                  </View>
                </View>
                <ChevronRight
                  size={20}
                  color={colors.accent}
                />
              </View>
            </View>
          </Pressable>

          {/* Camera and Audio Cards */}
          <View className="mb-6">
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* Camera Card */}
              <Pressable
                onPress={handleCameraPress}
                disabled={!cameraPermission || isProcessing}
                style={{
                  flex: 1,
                  backgroundColor: colors.cardBg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  padding: 16,
                  opacity: cameraPermission && !isProcessing ? 1 : 0.5,
                }}
              >
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: colors.accentLight,
                      borderWidth: 1,
                      borderColor: colors.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color={colors.accent} />
                    ) : (
                      <CameraIcon size={24} color={colors.accent} />
                    )}
                  </View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 14,
                      fontWeight: '600',
                      textAlign: 'center',
                    }}
                  >
                    Foto
                  </Text>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 12,
                      textAlign: 'center',
                    }}
                    numberOfLines={2}
                  >
                    Capturar comprovante
                  </Text>
                </View>
              </Pressable>

              {/* Audio Card */}
              <Pressable
                onPress={handleAudioPress}
                disabled={!audioPermission || isProcessing}
                style={{
                  flex: 1,
                  backgroundColor: colors.cardBg,
                  borderWidth: 1,
                  borderColor: isRecording ? colors.error : colors.border,
                  borderRadius: 16,
                  padding: 16,
                  opacity: audioPermission && !isProcessing ? 1 : 0.5,
                }}
              >
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: isRecording ? colors.errorLight : colors.accentLight,
                      borderWidth: 1,
                      borderColor: isRecording ? colors.error : colors.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isProcessing && !isRecording ? (
                      <ActivityIndicator size="small" color={colors.accent} />
                    ) : (
                      <Mic size={24} color={isRecording ? colors.error : colors.accent} />
                    )}
                  </View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 14,
                      fontWeight: '600',
                      textAlign: 'center',
                    }}
                  >
                    {isRecording ? "Gravando..." : "Áudio"}
                  </Text>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 12,
                      textAlign: 'center',
                    }}
                    numberOfLines={2}
                  >
                    {isRecording ? "Toque para parar" : "Registrar por voz"}
                  </Text>
                  {isRecording && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colors.error,
                        marginTop: -4,
                      }}
                    />
                  )}
                </View>
              </Pressable>
            </View>
          </View>

          {/* Quick Actions Carousel */}
          <View className="mb-6">
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 12,
              }}
            >
              Ações Rápidas
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 24 }}
            >
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Pressable
                    key={action.id}
                    onPress={() => action.onPress(navigation)}
                    style={{
                      width: 80,
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: colors.cardBg,
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon
                        size={24}
                        color={colors.accent}
                      />
                    </View>
                    <Text
                      style={{
                        color: colors.textGray,
                        fontSize: 12,
                        textAlign: 'center',
                      }}
                      numberOfLines={2}
                    >
                      {action.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Favorites List */}
          <View className="mb-6">
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 12,
              }}
            >
              Favoritos
            </Text>
            {isLoadingFavorites ? (
              <View className="py-8 items-center">
                <Text style={{ color: colors.textMuted }}>Carregando favoritos...</Text>
              </View>
            ) : favoriteTransactions.length > 0 ? (
              <View className="gap-3">
                {favoriteTransactions.map((transaction) => {
                  const title = transaction.title || transaction.description || "Transação sem título";
                  const categoryName =
                    transaction.category?.name || transaction.category || "Sem categoria";
                  const transactionType =
                    transaction.type || (transaction.categoryId === "1" ? "expense" : "income");
                  const amount = transaction.amount || 0;
                  
                  // Use arrows instead of category icons
                  const ArrowIcon = transactionType === "income" ? ArrowDown : ArrowUp;
                  const arrowColor = transactionType === "income" ? "#4ADE80" : "#FFFFFF"; // Green-400 for income, white for expense

                  return (
                    <Pressable
                      key={transaction.id}
                      onPress={() => handleFavoritePress(transaction)}
                    >
                      <View
                        style={{
                          backgroundColor: colors.cardBg,
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 16,
                          padding: 16,
                        }}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-3 flex-1">
                            <View
                              className={`w-10 h-10 rounded-lg items-center justify-center ${
                                transactionType === "income"
                                  ? "bg-green-500/10"
                                  : "bg-white/10"
                              }`}
                            >
                              <ArrowIcon size={18} color={arrowColor} />
                            </View>
                            <View className="flex-1">
                              <View className="flex-row items-center gap-2">
                                <Text
                                  style={{
                                    color: colors.textPrimary,
                                    fontSize: 14,
                                    fontWeight: '500',
                                  }}
                                  numberOfLines={1}
                                >
                                  {title}
                                </Text>
                              </View>
                              <Text
                                style={{
                                  color: colors.textMuted,
                                  fontSize: 12,
                                  marginTop: 2,
                                }}
                              >
                                {categoryName as string} • {formatDate(transaction.date)}
                              </Text>
                            </View>
                          </View>
                          <View className="items-end">
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: transactionType === "income" ? colors.income : colors.expense,
                              }}
                            >
                              {transactionType === "income" ? "+" : "-"}
                              R$ {Math.abs(amount).toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: colors.cardBg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  padding: 24,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: colors.textGray,
                    fontSize: 14,
                    textAlign: 'center',
                  }}
                >
                  Você ainda não tem nenhum favorito
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
