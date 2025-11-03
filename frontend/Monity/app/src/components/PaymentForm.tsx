import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import Card from '../components/molecules/Card';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import {
  ArrowLeft,
  CreditCard,
  Lock,
  Check,
  X,
  Shield,
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
  const navigation = useNavigation();
  const { refreshUser } = useAuth();
  const { createPaymentMethod } = useStripe();
  
  const [isLoading, setIsLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardHolderName, setCardHolderName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    // Validar se o cartão está completo
    if (!cardComplete) {
      newErrors.push('Por favor, preencha todos os dados do cartão');
    }

    // Validar nome do portador
    if (!cardHolderName.trim()) {
      newErrors.push('Nome do portador é obrigatório');
    } else if (cardHolderName.trim().length < 2) {
      newErrors.push('Nome do portador deve ter pelo menos 2 caracteres');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      Alert.alert('Dados Inválidos', 'Por favor, corrija os erros no formulário antes de continuar.');
      return;
    }

    if (!createPaymentMethod) {
      Alert.alert('Erro', 'Sistema de pagamento não inicializado. Tente novamente.');
      return;
    }

    try {
      setIsLoading(true);
      setErrors([]);

      console.log('Iniciando processamento do pagamento...');
      
      // 1. Criar método de pagamento usando o CardField do Stripe
      const { paymentMethod, error } = await createPaymentMethod({
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: cardHolderName,
          },
        },
      });

      if (error) {
        console.error('Erro ao criar método de pagamento:', error);
        Alert.alert('Erro no Pagamento', error.message || 'Falha ao processar dados do cartão');
        return;
      }

      if (!paymentMethod) {
        Alert.alert('Erro', 'Método de pagamento não foi criado');
        return;
      }

      console.log('Método de pagamento criado:', paymentMethod.id);

      // 2. Criar assinatura via API do backend
      console.log('Criando assinatura via API...');
      const response = await apiService.createSubscription('premium', paymentMethod.id);
      console.log('Resposta da API:', response);

      if (response.success) {
        Alert.alert(
          'Sucesso!',
          'Assinatura premium ativada com sucesso!',
          [
            {
              text: 'OK',
              onPress: () => {
                refreshUser();
                onSuccess();
              },
            },
          ]
        );
      } else {
        Alert.alert('Erro', response.error || 'Falha ao criar assinatura');
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      
      let errorMessage = 'Falha ao processar pagamento. Tente novamente.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
              <ArrowLeft size={20}  />
            </Pressable>
            <Text className="text-white text-xl font-bold">Pagamento</Text>
          </View>

          {/* Plan Summary */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white text-lg font-semibold">{planName}</Text>
                <Text className="text-[#01C38D] text-xl font-bold">
                  {formatPrice(planPrice)}
                </Text>
              </View>
              <Text className="text-gray-400 text-sm">Cobrança mensal</Text>
            </View>
          </Card>

          {/* Payment Form */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="flex-row items-center gap-2 mb-4">
                <CreditCard size={20}  />
                <Text className="text-white text-lg font-semibold">
                  Dados do Cartão
                </Text>
              </View>

              {/* Stripe Card Field - Coleta segura de dados do cartão */}
              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">
                  Dados do Cartão *
                </Text>
                <CardField
                  postalCodeEnabled={false}
                  placeholders={{
                    number: '4242 4242 4242 4242',
                  }}
                  cardStyle={{
                    backgroundColor: '#23263a',
                    textColor: '#FFFFFF',
                    borderColor: errors.some(e => e.includes('cartão')) ? '#EF4444' : '#31344d',
                    borderWidth: 1,
                    borderRadius: 12,
                  }}
                  style={{
                    width: '100%',
                    height: 50,
                    marginVertical: 0,
                  }}
                  onCardChange={(cardDetails) => {
                    console.log('Card details changed:', cardDetails);
                    setCardComplete(cardDetails.complete);
                  }}
                />
                <Text className="text-gray-400 text-xs mt-2">
                  Digite o número do cartão, data de validade (MM/AA) e CVC
                </Text>
              </View>

              {/* Cardholder Name */}
              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">
                  Nome do Titular *
                </Text>
                <TextInput
                  value={cardHolderName}
                  onChangeText={setCardHolderName}
                  placeholder="Nome completo como está no cartão"
                  placeholderTextColor="#6B7280"
                  autoCapitalize="words"
                  className={`bg-card-bg border-border-default rounded-xl text-white px-4 py-3 ${
                    errors.some(e => e.includes('portador')) ? 'border-red-500' : 'border-border-default'
                  }`}
                />
              </View>

              {/* Errors */}
              {errors.length > 0 && (
                <View className="mb-4">
                  {errors.map((error, index) => (
                    <View key={index} className="flex-row items-center gap-2 mb-1">
                      <X size={16}  />
                      <Text className="text-red-400 text-sm">{error}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Card>

          {/* Security Info */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <Shield size={20}  />
                <Text className="text-white font-semibold">Segurança</Text>
              </View>
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Check size={16}  />
                  <Text className="text-gray-300 text-sm">
                    Pagamento processado com segurança pelo Stripe
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Check size={16}  />
                  <Text className="text-gray-300 text-sm">
                    Dados do cartão não são armazenados
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Check size={16}  />
                  <Text className="text-gray-300 text-sm">
                    Cancelamento a qualquer momento
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Payment Button */}
          <Pressable
            onPress={handlePayment}
            disabled={isLoading}
            className={`w-full py-4 rounded-xl flex-row items-center justify-center gap-2 ${
              isLoading ? 'bg-gray-600' : 'bg-accent'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator size="small"  />
            ) : (
              <Lock size={20}  />
            )}
            <Text className="text-[#191E29] font-bold text-lg">
              {isLoading ? 'Processando...' : `Pagar ${formatPrice(planPrice)}`}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
