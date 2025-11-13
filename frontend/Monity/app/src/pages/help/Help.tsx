import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../constants/colors";
import {
  ArrowLeft,
  HelpCircle,
  Mail,
  Phone,
  Info,
  BookOpen,
  MessageCircle,
  Shield,
  CreditCard,
  TrendingUp,
} from "lucide-react-native";
import { triggerHaptic } from "../../utils/haptics";

export default function Help() {
  const navigation = useNavigation();
  const colors = COLORS;

  const handleEmailPress = () => {
    triggerHaptic();
    Linking.openURL("mailto:firstmonity@gmail.com");
  };

  const handlePhonePress = () => {
    triggerHaptic();
    Linking.openURL("tel:+5531993159249");
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6 pb-6">
          {/* Header */}
          <View className="flex-row items-center gap-4 mb-6">
            <Pressable
              onPress={() => {
                triggerHaptic();
                navigation.goBack();
              }}
              className="p-2"
            >
              <ArrowLeft size={20} color={colors.textPrimary} />
            </Pressable>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 24,
                fontWeight: "bold",
                fontFamily: "Stratford",
              }}
            >
              Central de Ajuda
            </Text>
          </View>

          {/* Welcome Section */}
          <View className="mb-8">
            <View className="bg-card-bg border border-border-default rounded-xl p-6 mb-6">
              <View className="flex-row items-center gap-3 mb-4">
                <HelpCircle size={28} color={colors.accent} />
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 20,
                    fontWeight: "bold",
                    fontFamily: "Stratford",
                  }}
                >
                  Bem-vindo à Central de Ajuda
                </Text>
              </View>
              <Text
                style={{
                  color: colors.textGray,
                  fontSize: 16,
                  lineHeight: 24,
                }}
              >
                Estamos aqui para ajudar você a aproveitar ao máximo a Monity.
                Encontre respostas para suas dúvidas ou entre em contato conosco.
              </Text>
            </View>
          </View>

          {/* Contact Section */}
          <View className="mb-8">
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 16,
                fontFamily: "Stratford",
              }}
            >
              Entre em Contato
            </Text>

            <Pressable
              onPress={handleEmailPress}
              className="bg-card-bg border border-border-default rounded-xl p-4 mb-3 flex-row items-center gap-4"
            >
              <View className="bg-accent/20 rounded-full p-3">
                <Mail size={20} color={colors.accent} />
              </View>
              <View className="flex-1">
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 4,
                  }}
                >
                  E-mail
                </Text>
                <Text
                  style={{
                    color: colors.accent,
                    fontSize: 14,
                  }}
                >
                  firstmonity@gmail.com
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handlePhonePress}
              className="bg-card-bg border border-border-default rounded-xl p-4 flex-row items-center gap-4"
            >
              <View className="bg-accent/20 rounded-full p-3">
                <Phone size={20} color={colors.accent} />
              </View>
              <View className="flex-1">
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 4,
                  }}
                >
                  Telefone
                </Text>
                <Text
                  style={{
                    color: colors.accent,
                    fontSize: 14,
                  }}
                >
                  (31) 99315-9249
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Features Section */}
          <View className="mb-8">
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 16,
                fontFamily: "Stratford",
              }}
            >
              Funcionalidades Principais
            </Text>

            <View className="bg-card-bg border border-border-default rounded-xl p-5 mb-3">
              <View className="flex-row items-start gap-4">
                <View className="bg-accent/20 rounded-full p-2 mt-1">
                  <CreditCard size={18} color={colors.accent} />
                </View>
                <View className="flex-1">
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 6,
                    }}
                  >
                    Gestão de Transações
                  </Text>
                  <Text
                    style={{
                      color: colors.textGray,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    Registre suas receitas e despesas de forma rápida e
                    organizada. Categorize suas transações para ter um melhor
                    controle financeiro.
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-card-bg border border-border-default rounded-xl p-5 mb-3">
              <View className="flex-row items-start gap-4">
                <View className="bg-accent/20 rounded-full p-2 mt-1">
                  <TrendingUp size={18} color={colors.accent} />
                </View>
                <View className="flex-1">
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 6,
                    }}
                  >
                    Análises e Relatórios
                  </Text>
                  <Text
                    style={{
                      color: colors.textGray,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    Visualize gráficos e relatórios detalhados sobre seus
                    gastos e receitas. Acompanhe sua evolução financeira ao
                    longo do tempo.
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-card-bg border border-border-default rounded-xl p-5 mb-3">
              <View className="flex-row items-start gap-4">
                <View className="bg-accent/20 rounded-full p-2 mt-1">
                  <Shield size={18} color={colors.accent} />
                </View>
                <View className="flex-1">
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 6,
                    }}
                  >
                    Segurança e Privacidade
                  </Text>
                  <Text
                    style={{
                      color: colors.textGray,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    Seus dados estão protegidos com criptografia de ponta a
                    ponta. Sua privacidade é nossa prioridade.
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-card-bg border border-border-default rounded-xl p-5">
              <View className="flex-row items-start gap-4">
                <View className="bg-accent/20 rounded-full p-2 mt-1">
                  <MessageCircle size={18} color={colors.accent} />
                </View>
                <View className="flex-1">
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 6,
                    }}
                  >
                    Assistente Inteligente
                  </Text>
                  <Text
                    style={{
                      color: colors.textGray,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    Use nosso assistente de IA para obter sugestões
                    personalizadas de categorias e insights sobre suas
                    finanças.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tips Section */}
          <View className="mb-8">
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 16,
                fontFamily: "Stratford",
              }}
            >
              Dicas para Melhor Uso
            </Text>

            <View className="bg-card-bg border border-border-default rounded-xl p-5">
              <View className="mb-4">
                <View className="flex-row items-center gap-3 mb-2">
                  <View className="w-6 h-6 bg-accent rounded-full items-center justify-center">
                    <Text
                      style={{
                        color: "#191E29",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      1
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    Organize suas Categorias
                  </Text>
                </View>
                <Text
                  style={{
                    color: colors.textGray,
                    fontSize: 14,
                    lineHeight: 20,
                    marginLeft: 36,
                  }}
                >
                  Crie categorias personalizadas que façam sentido para seu
                  estilo de vida. Isso facilitará a análise dos seus gastos.
                </Text>
              </View>

              <View className="mb-4">
                <View className="flex-row items-center gap-3 mb-2">
                  <View className="w-6 h-6 bg-accent rounded-full items-center justify-center">
                    <Text
                      style={{
                        color: "#191E29",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      2
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    Registre Transações Regularmente
                  </Text>
                </View>
                <Text
                  style={{
                    color: colors.textGray,
                    fontSize: 14,
                    lineHeight: 20,
                    marginLeft: 36,
                  }}
                >
                  Mantenha o hábito de registrar suas transações assim que
                  ocorrerem. Isso garante dados mais precisos e análises mais
                  confiáveis.
                </Text>
              </View>

              <View className="mb-4">
                <View className="flex-row items-center gap-3 mb-2">
                  <View className="w-6 h-6 bg-accent rounded-full items-center justify-center">
                    <Text
                      style={{
                        color: "#191E29",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      3
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    Use Transações Recorrentes
                  </Text>
                </View>
                <Text
                  style={{
                    color: colors.textGray,
                    fontSize: 14,
                    lineHeight: 20,
                    marginLeft: 36,
                  }}
                >
                  Para despesas fixas como aluguel, assinaturas e contas,
                  configure transações recorrentes para economizar tempo.
                </Text>
              </View>

              <View>
                <View className="flex-row items-center gap-3 mb-2">
                  <View className="w-6 h-6 bg-accent rounded-full items-center justify-center">
                    <Text
                      style={{
                        color: "#191E29",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      4
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    Revise seus Relatórios
                  </Text>
                </View>
                <Text
                  style={{
                    color: colors.textGray,
                    fontSize: 14,
                    lineHeight: 20,
                    marginLeft: 36,
                  }}
                >
                  Acompanhe regularmente os gráficos e relatórios para
                  identificar padrões de gastos e oportunidades de economia.
                </Text>
              </View>
            </View>
          </View>

          {/* FAQ Section */}
          <View className="mb-8">
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 16,
                fontFamily: "Stratford",
              }}
            >
              Perguntas Frequentes
            </Text>

            <View className="bg-card-bg border border-border-default rounded-xl p-5 mb-3">
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 15,
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                Como adiciono uma nova categoria?
              </Text>
              <Text
                style={{
                  color: colors.textGray,
                  fontSize: 14,
                  lineHeight: 20,
                }}
              >
                Acesse a seção de Categorias no menu principal e toque no botão
                de adicionar. Escolha um nome, cor e tipo (receita ou despesa)
                para sua categoria.
              </Text>
            </View>

            <View className="bg-card-bg border border-border-default rounded-xl p-5">
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 15,
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                Como funciona o assistente de IA?
              </Text>
              <Text
                style={{
                  color: colors.textGray,
                  fontSize: 14,
                  lineHeight: 20,
                }}
              >
                O assistente de IA analisa suas transações e sugere
                automaticamente categorias apropriadas. Quanto mais você usa o
                app, mais preciso ele fica nas sugestões.
              </Text>
            </View>
          </View>

          {/* Support Section */}
          <View className="bg-accent/10 border border-accent/30 rounded-xl p-6">
            <View className="flex-row items-center gap-3 mb-3">
              <Info size={24} color={colors.accent} />
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 18,
                  fontWeight: "600",
                  fontFamily: "Stratford",
                }}
              >
                Precisa de Mais Ajuda?
              </Text>
            </View>
            <Text
              style={{
                color: colors.textGray,
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 16,
              }}
            >
              Nossa equipe está sempre pronta para ajudar. Entre em contato
              através do e-mail ou telefone acima e responderemos o mais breve
              possível.
            </Text>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 12,
                fontStyle: "italic",
              }}
            >
              Horário de atendimento: Segunda a Sexta, das 9h às 18h
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

