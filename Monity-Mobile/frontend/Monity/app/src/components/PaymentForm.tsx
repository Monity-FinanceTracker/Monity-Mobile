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
import Card from '../components/molecules/Card';
import { usePaymentService } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
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
  const paymentService = usePaymentService();
  
  const [isLoading, setIsLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    cardholderName: '',
  });

  const [errors, setErrors] = useState<string[]>([]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleCardNumberChange = (text: string) => {
    // Remove caracteres não numéricos
    const cleaned = text.replace(/\D/g, '');
    
    // Limita a 19 caracteres (maior número de cartão)
    const limited = cleaned.slice(0, 19);
    
    // Formata com espaços a cada 4 dígitos
    const formatted = paymentService.formatCardNumber(limited);
    
    setCardDetails({ ...cardDetails, number: formatted });
  };

  const handleExpiryChange = (text: string, field: 'expiryMonth' | 'expiryYear') => {
    const cleaned = text.replace(/\D/g, '');
    
    if (field === 'expiryMonth') {
      // Limita a 2 dígitos e valida mês
      const month = Math.min(parseInt(cleaned) || 0, 12);
      setCardDetails({ ...cardDetails, expiryMonth: month.toString().padStart(2, '0') });
    } else {
      // Limita a 4 dígitos para ano
      const year = cleaned.slice(0, 4);
      setCardDetails({ ...cardDetails, expiryYear: year });
    }
  };

  const handleCvcChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setCardDetails({ ...cardDetails, cvc: cleaned });
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!cardDetails.number || cardDetails.number.replace(/\s/g, '').length < 13) {
      newErrors.push('Número do cartão inválido');
    }

    if (!cardDetails.expiryMonth || parseInt(cardDetails.expiryMonth) < 1 || parseInt(cardDetails.expiryMonth) > 12) {
      newErrors.push('Mês de expiração inválido');
    }

    const currentYear = new Date().getFullYear();
    if (!cardDetails.expiryYear || parseInt(cardDetails.expiryYear) < currentYear) {
      newErrors.push('Ano de expiração inválido');
    }

    if (!cardDetails.cvc || cardDetails.cvc.length < 3) {
      newErrors.push('CVC inválido');
    }

    if (!cardDetails.cardholderName.trim()) {
      newErrors.push('Nome do portador é obrigatório');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setErrors([]);

      const result = await paymentService.processPremiumSubscription({
        number: cardDetails.number,
        expiryMonth: parseInt(cardDetails.expiryMonth),
        expiryYear: parseInt(cardDetails.expiryYear),
        cvc: cardDetails.cvc,
      });

      if (result.success) {
        Alert.alert(
          'Sucesso!',
          result.message,
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
        Alert.alert('Erro', result.message);
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      Alert.alert('Erro', 'Falha ao processar pagamento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCardBrand = () => {
    return paymentService.getCardBrand(cardDetails.number);
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
              <ArrowLeft size={20} color="#9CA3AF" />
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
                <CreditCard size={20} color="#9CA3AF" />
                <Text className="text-white text-lg font-semibold">
                  Dados do Cartão
                </Text>
              </View>

              {/* Card Number */}
              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">
                  Número do Cartão
                </Text>
                <TextInput
                  value={cardDetails.number}
                  onChangeText={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  maxLength={23} // 19 dígitos + 4 espaços
                  className="bg-[#23263a] border border-[#31344d] rounded-xl text-white px-4 py-3"
                />
                {getCardBrand() !== 'unknown' && (
                  <Text className="text-gray-400 text-xs mt-1 capitalize">
                    {getCardBrand()}
                  </Text>
                )}
              </View>

              {/* Cardholder Name */}
              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">
                  Nome do Portador
                </Text>
                <TextInput
                  value={cardDetails.cardholderName}
                  onChangeText={(text) => setCardDetails({ ...cardDetails, cardholderName: text })}
                  placeholder="Nome como no cartão"
                  placeholderTextColor="#6B7280"
                  autoCapitalize="words"
                  className="bg-[#23263a] border border-[#31344d] rounded-xl text-white px-4 py-3"
                />
              </View>

              {/* Expiry and CVC */}
              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-400 text-sm mb-2">
                    Mês/Ano
                  </Text>
                  <View className="flex-row gap-2">
                    <TextInput
                      value={cardDetails.expiryMonth}
                      onChangeText={(text) => handleExpiryChange(text, 'expiryMonth')}
                      placeholder="MM"
                      placeholderTextColor="#6B7280"
                      keyboardType="numeric"
                      maxLength={2}
                      className="bg-[#23263a] border border-[#31344d] rounded-xl text-white px-4 py-3 flex-1"
                    />
                    <TextInput
                      value={cardDetails.expiryYear}
                      onChangeText={(text) => handleExpiryChange(text, 'expiryYear')}
                      placeholder="AAAA"
                      placeholderTextColor="#6B7280"
                      keyboardType="numeric"
                      maxLength={4}
                      className="bg-[#23263a] border border-[#31344d] rounded-xl text-white px-4 py-3 flex-1"
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-400 text-sm mb-2">
                    CVC
                  </Text>
                  <TextInput
                    value={cardDetails.cvc}
                    onChangeText={handleCvcChange}
                    placeholder="123"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    className="bg-[#23263a] border border-[#31344d] rounded-xl text-white px-4 py-3"
                  />
                </View>
              </View>

              {/* Errors */}
              {errors.length > 0 && (
                <View className="mb-4">
                  {errors.map((error, index) => (
                    <View key={index} className="flex-row items-center gap-2 mb-1">
                      <X size={16} color="#EF4444" />
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
                <Shield size={20} color="#01C38D" />
                <Text className="text-white font-semibold">Segurança</Text>
              </View>
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Check size={16} color="#01C38D" />
                  <Text className="text-gray-300 text-sm">
                    Pagamento processado com segurança pelo Stripe
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Check size={16} color="#01C38D" />
                  <Text className="text-gray-300 text-sm">
                    Dados do cartão não são armazenados
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Check size={16} color="#01C38D" />
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
              isLoading ? 'bg-gray-600' : 'bg-[#01C38D]'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#191E29" />
            ) : (
              <Lock size={20} color="#191E29" />
            )}
            <Text className="text-[#191E29] font-bold text-lg">
              {isLoading ? 'Processando...' : `Pagar ${formatPrice(planPrice)}`}
            </Text>
          </Pressable>

          {/* Cancel Button */}
          <Pressable
            onPress={onCancel}
            disabled={isLoading}
            className="w-full py-3 rounded-xl border border-[#4B5563] mt-4"
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
