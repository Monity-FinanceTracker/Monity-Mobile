import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import Card from '../components/molecules/Card';
import { useAuth } from '../context/AuthContext';
import inAppPurchaseService, { PurchaseResult } from '../services/inAppPurchaseService';
import {
  ArrowLeft,
  CreditCard,
  Lock,
  Check,
  Shield,
  RefreshCw,
} from 'lucide-react-native';

interface PaymentFormProps {
  planId: string;
  planName: string;
  planPrice: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentForm({ 
  planId, 
  planName, 
  planPrice, 
  onSuccess, 
  onCancel 
}: PaymentFormProps) {
  const { refreshUser } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [product, setProduct] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpoGo, setIsExpoGo] = useState(false);

  useEffect(() => {
    // Verificar se está rodando no Expo Go
    const isExpoGoEnv = Constants.executionEnvironment === 'storeClient';
    setIsExpoGo(isExpoGoEnv);

    if (!isExpoGoEnv) {
      initializePurchase();
    } else {
      setIsInitializing(false);
      setError('Pagamentos in-app não estão disponíveis no Expo Go. É necessário fazer um build nativo para testar pagamentos.');
    }

    return () => {
      // Cleanup será feito quando o componente desmontar
    };
  }, []);

  const initializePurchase = async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // Inicializar serviço de pagamento
      const initialized = await inAppPurchaseService.initialize();
      if (!initialized) {
        setError('Falha ao inicializar serviço de pagamento');
        setIsInitializing(false);
        return;
      }

      // Buscar informações do produto
      const premiumProduct = await inAppPurchaseService.getPremiumProduct();
      if (!premiumProduct) {
        setError('Produto não encontrado na store. Verifique a configuração.');
        setIsInitializing(false);
        return;
      }

      setProduct(premiumProduct);
      setIsInitializing(false);
    } catch (err: any) {
      console.error('Error initializing purchase:', err);
      setError(err.message || 'Erro ao inicializar pagamento');
      setIsInitializing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🛒 Iniciando compra...');

      // Iniciar o processo de compra
      const result: PurchaseResult = await inAppPurchaseService.purchasePremium();

      if (!result.success) {
        setError(result.error || 'Falha ao processar compra');
        Alert.alert('Erro', result.error || 'Falha ao processar compra');
        return;
      }

      // O resultado será processado pelo listener no serviço
      // Aguardar um pouco para o processamento assíncrono
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Atualizar dados do usuário
      await refreshUser();
      
      // Chamar callback de sucesso
      onSuccess();
    } catch (err: any) {
      console.error('Error in handlePayment:', err);
      const errorMessage = err.message || 'Erro ao processar pagamento';
      setError(errorMessage);
      Alert.alert('Erro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await inAppPurchaseService.restorePurchases();

      if (result.success) {
        await refreshUser();
        Alert.alert('Sucesso', 'Compras restauradas com sucesso!');
        onSuccess();
      } else {
        Alert.alert('Aviso', result.error || 'Nenhuma compra anterior encontrada');
      }
    } catch (err: any) {
      console.error('Error restoring purchases:', err);
      Alert.alert('Erro', err.message || 'Erro ao restaurar compras');
    } finally {
      setIsLoading(false);
    }
  };

  const displayPrice = product?.localizedPrice || formatPrice(planPrice);

  if (isInitializing) {
    return (
      <SafeAreaView
        className="flex-1 bg-[#191E29]"
        edges={["top", "bottom", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#01C38D" />
          <Text className="text-white mt-4 text-center">
            Inicializando pagamento...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isExpoGo) {
    return (
      <SafeAreaView
        className="flex-1 bg-[#191E29]"
        edges={["top", "bottom", "left", "right"]}
      >
        <ScrollView className="flex-1">
          <View className="px-6 pt-6 pb-6">
            <View className="flex-row items-center gap-4 mb-6">
              <Pressable onPress={onCancel} className="p-2">
                <ArrowLeft size={20} color="white" />
              </Pressable>
              <Text className="text-white text-xl font-bold">Assinatura Premium</Text>
            </View>

            <Card className="mb-6">
              <View className="p-4">
                <Text className="text-yellow-400 text-center mb-4 font-semibold">
                  ⚠️ Build Nativo Necessário
                </Text>
                <Text className="text-gray-300 text-center mb-4">
                  Pagamentos in-app não estão disponíveis no Expo Go.
                </Text>
                <Text className="text-gray-400 text-sm text-center mb-4">
                  Para testar pagamentos, você precisa fazer um build nativo usando EAS Build:
                </Text>
                <View className="bg-card-bg p-3 rounded-lg mb-4">
                  <Text className="text-gray-300 text-xs font-mono">
                    eas build --platform android --profile preview
                  </Text>
                  <Text className="text-gray-300 text-xs font-mono mt-2">
                    eas build --platform ios --profile preview
                  </Text>
                </View>
                <Pressable
                  onPress={onCancel}
                  className="bg-accent py-3 rounded-xl"
                >
                  <Text className="text-[#191E29] font-bold text-center">
                    Voltar
                  </Text>
                </Pressable>
              </View>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error && !product) {
    return (
      <SafeAreaView
        className="flex-1 bg-[#191E29]"
        edges={["top", "bottom", "left", "right"]}
      >
        <ScrollView className="flex-1">
          <View className="px-6 pt-6 pb-6">
            <View className="flex-row items-center gap-4 mb-6">
              <Pressable onPress={onCancel} className="p-2">
                <ArrowLeft size={20} color="white" />
              </Pressable>
              <Text className="text-white text-xl font-bold">Pagamento</Text>
            </View>

            <Card className="mb-6">
              <View className="p-4">
                <Text className="text-red-400 text-center mb-4">{error}</Text>
                <Pressable
                  onPress={initializePurchase}
                  className="bg-accent py-3 rounded-xl"
                >
                  <Text className="text-[#191E29] font-bold text-center">
                    Tentar Novamente
                  </Text>
                </Pressable>
              </View>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-[#191E29]"
      edges={["top", "bottom", "left", "right"]}
    >
      <ScrollView className="flex-1">
        <View className="px-6 pt-6 pb-6">
          {/* Header */}
          <View className="flex-row items-center gap-4 mb-6">
            <Pressable onPress={onCancel} className="p-2">
              <ArrowLeft size={20} color="white" />
            </Pressable>
            <Text className="text-white text-xl font-bold">Assinatura Premium</Text>
          </View>

          {/* Plan Summary */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white text-lg font-semibold">{planName}</Text>
                <Text className="text-[#01C38D] text-xl font-bold">
                  {displayPrice}
                </Text>
              </View>
              <Text className="text-gray-400 text-sm">
                Cobrança mensal
              </Text>
              {product?.description && (
                <Text className="text-gray-500 text-xs mt-2">
                  {product.description}
                </Text>
              )}
            </View>
          </Card>

          {/* Payment Info */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="flex-row items-center gap-2 mb-4">
                <CreditCard size={20} color="white" />
                <Text className="text-white text-lg font-semibold">
                  Pagamento Seguro
                </Text>
              </View>
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Check size={16} color="#01C38D" />
                  <Text className="text-gray-300 text-sm">
                    Pagamento processado pela {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Check size={16} color="#01C38D" />
                  <Text className="text-gray-300 text-sm">
                    Renovação automática mensal
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Check size={16} color="#01C38D" />
                  <Text className="text-gray-300 text-sm">
                    Cancelamento a qualquer momento
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Check size={16} color="#01C38D" />
                  <Text className="text-gray-300 text-sm">
                    Acesso imediato após confirmação
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Security Info */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <Shield size={20} color="white" />
                <Text className="text-white font-semibold">Segurança</Text>
              </View>
              <Text className="text-gray-300 text-sm">
                Seu pagamento é processado de forma segura pela {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}. 
                Não armazenamos informações de pagamento.
              </Text>
            </View>
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="mb-6 border border-red-500">
              <View className="p-4">
                <Text className="text-red-400 text-sm text-center">{error}</Text>
              </View>
            </Card>
          )}

          {/* Purchase Button */}
          <Pressable
            onPress={handlePayment}
            disabled={isLoading || !product}
            className={`w-full py-4 rounded-xl flex-row items-center justify-center gap-2 ${
              isLoading || !product ? 'bg-gray-600' : 'bg-accent'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Lock size={20} color={isLoading || !product ? "#999" : "#191E29"} />
            )}
            <Text className={`font-bold text-lg ${
              isLoading || !product ? 'text-gray-400' : 'text-[#191E29]'
            }`}>
              {isLoading ? 'Processando...' : `Assinar por ${displayPrice}`}
            </Text>
          </Pressable>

          {/* Restore Purchases Button */}
          <Pressable
            onPress={handleRestorePurchases}
            disabled={isLoading}
            className="w-full py-3 rounded-xl border border-border-default mt-4 flex-row items-center justify-center gap-2"
          >
            <RefreshCw size={16} color="#999" />
            <Text className="text-gray-300 font-medium">
              Restaurar Compras
            </Text>
          </Pressable>

          {/* Cancel Button */}
          <Pressable
            onPress={onCancel}
            disabled={isLoading}
            className="w-full py-3 rounded-xl border border-border-default mt-4"
          >
            <Text className="text-gray-300 font-medium text-center">
              Cancelar
            </Text>
          </Pressable>

          {/* Info Text */}
          <Text className="text-gray-500 text-xs text-center mt-4">
            Ao assinar, você concorda com os termos de serviço e política de privacidade.
            A assinatura será renovada automaticamente a menos que seja cancelada.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
