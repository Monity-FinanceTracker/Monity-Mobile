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
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    security_code: '',
    card_holder_name: '',
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
    
    setCardDetails({ ...cardDetails, card_number: formatted });
  };

  const handleExpiryChange = (text: string, field: 'expiry_month' | 'expiry_year') => {
    const cleaned = text.replace(/\D/g, '');
    
    if (field === 'expiry_month') {
      // Limita a 2 dígitos e valida mês
      const month = parseInt(cleaned) || 0;
      if (month <= 12) {
        setCardDetails({ ...cardDetails, expiry_month: month.toString().padStart(2, '0') });
      } else if (month > 12 && month < 100) {
        // Se digitou mais de 12, assume que quer o primeiro dígito
        setCardDetails({ ...cardDetails, expiry_month: Math.floor(month / 10).toString().padStart(2, '0') });
      }
    } else {
      // Limita a 4 dígitos para ano
      const year = cleaned.slice(0, 4);
      setCardDetails({ ...cardDetails, expiry_year: year });
    }
  };

  const handleCvcChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setCardDetails({ ...cardDetails, security_code: cleaned });
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    // Validar número do cartão
    const cardNumber = cardDetails.card_number.replace(/\s/g, '');
    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
      newErrors.push('Número do cartão inválido (mínimo 13 dígitos)');
    }

    // Validar mês de expiração
    const month = parseInt(cardDetails.expiry_month);
    if (!cardDetails.expiry_month || month < 1 || month > 12) {
      newErrors.push('Mês de expiração inválido (01-12)');
    }

    // Validar ano de expiração
    const currentYear = new Date().getFullYear();
    const year = parseInt(cardDetails.expiry_year);
    if (!cardDetails.expiry_year || year < currentYear || year > currentYear + 20) {
      newErrors.push('Ano de expiração inválido');
    }

    // Validar CVC
    if (!cardDetails.security_code || cardDetails.security_code.length < 3 || cardDetails.security_code.length > 4) {
      newErrors.push('CVC inválido (3-4 dígitos)');
    }

    // Validar nome do portador
    if (!cardDetails.card_holder_name.trim()) {
      newErrors.push('Nome do portador é obrigatório');
    } else if (cardDetails.card_holder_name.trim().length < 2) {
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

    try {
      setIsLoading(true);
      setErrors([]);

      console.log('Iniciando processamento do pagamento...');
      
      // Mapear os novos nomes de campos para os nomes esperados pelo PaymentService
      const result = await paymentService.processPremiumSubscription({
        number: cardDetails.card_number,
        expiryMonth: parseInt(cardDetails.expiry_month),
        expiryYear: parseInt(cardDetails.expiry_year),
        cvc: cardDetails.security_code,
      });

      console.log('Resultado do pagamento:', result);

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
        Alert.alert('Erro no Pagamento', result.message);
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      
      let errorMessage = 'Falha ao processar pagamento. Tente novamente.';
      
      if (error instanceof Error) {
        if (error.message.includes('Stripe não foi inicializado')) {
          errorMessage = 'Erro de configuração do sistema de pagamento. Tente novamente mais tarde.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getCardBrand = () => {
    return paymentService.getCardBrand(cardDetails.card_number);
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

              {/* Card Number */}
              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">
                  Número do Cartão *
                </Text>
                <TextInput
                  id="card_number"
                  name="card_number"
                  value={cardDetails.card_number}
                  onChangeText={handleCardNumberChange}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  maxLength={23} // 19 dígitos + 4 espaços
                  className={`bg-[#23263a] border rounded-xl text-white px-4 py-3 ${
                    errors.some(e => e.includes('cartão')) ? 'border-red-500' : 'border-[#31344d]'
                  }`}
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
                  Nome Impresso *
                </Text>
                <TextInput
                  id="card_holder_name"
                  name="card_holder_name"
                  value={cardDetails.card_holder_name}
                  onChangeText={(text) => setCardDetails({ ...cardDetails, card_holder_name: text })}
                  placeholder="Nome completo do titular"
                  placeholderTextColor="#6B7280"
                  autoCapitalize="words"
                  className={`bg-[#23263a] border rounded-xl text-white px-4 py-3 ${
                    errors.some(e => e.includes('portador')) ? 'border-red-500' : 'border-[#31344d]'
                  }`}
                />
              </View>

              {/* Expiry and CVC */}
              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-400 text-sm mb-2">
                    Data de Validade *
                  </Text>
                  <View className="flex-row gap-2">
                    <TextInput
                      id="expiry_month"
                      name="expiry_month"
                      value={cardDetails.expiry_month}
                      onChangeText={(text) => handleExpiryChange(text, 'expiry_month')}
                      placeholder="MM"
                      placeholderTextColor="#6B7280"
                      keyboardType="numeric"
                      maxLength={2}
                      className={`bg-[#23263a] border rounded-xl text-white px-4 py-3 flex-1 ${
                        errors.some(e => e.includes('Mês')) ? 'border-red-500' : 'border-[#31344d]'
                      }`}
                    />
                    <TextInput
                      id="expiry_year"
                      name="expiry_year"
                      value={cardDetails.expiry_year}
                      onChangeText={(text) => handleExpiryChange(text, 'expiry_year')}
                      placeholder="AAAA"
                      placeholderTextColor="#6B7280"
                      keyboardType="numeric"
                      maxLength={4}
                      className={`bg-[#23263a] border rounded-xl text-white px-4 py-3 flex-1 ${
                        errors.some(e => e.includes('Ano')) ? 'border-red-500' : 'border-[#31344d]'
                      }`}
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-400 text-sm mb-2">
                    Código de Segurança (CVV/CVC) *
                  </Text>
                  <TextInput
                    id="security_code"
                    name="security_code"
                    value={cardDetails.security_code}
                    onChangeText={handleCvcChange}
                    placeholder="123"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    className={`bg-[#23263a] border rounded-xl text-white px-4 py-3 ${
                      errors.some(e => e.includes('CVC')) ? 'border-red-500' : 'border-[#31344d]'
                    }`}
                  />
                </View>
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
              isLoading ? 'bg-gray-600' : 'bg-[#01C38D]'
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
