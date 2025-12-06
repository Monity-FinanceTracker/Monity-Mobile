import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { apiService } from "../../services/apiService";
import { triggerHaptic } from "../../utils/haptics";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Target,
  Wallet,
  TrendingUp,
  Sparkles,
  Bell,
  CheckCircle,
} from "lucide-react-native";
import OnboardingStep1 from "./OnboardingStep1";
import OnboardingStep2 from "./OnboardingStep2";
import OnboardingStep3 from "./OnboardingStep3";
import OnboardingStep4 from "./OnboardingStep4";
import OnboardingStep5 from "./OnboardingStep5";

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingWizard({
  onComplete,
  onSkip,
}: OnboardingWizardProps) {
  const colors = COLORS;
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form data for each step
  const [formData, setFormData] = useState({
    // Step 1: Goal
    primaryGoal: "",

    // Step 2: Financial Context
    estimatedIncome: "",
    preferredCategories: [] as string[],

    // Step 3: First Transaction
    transactionAdded: false,
    firstTransaction: null as any,

    // Step 5: Notifications
    emailNotifications: true,
    pushNotifications: false,
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await apiService.getOnboardingProgress();
      if (response.success && response.data) {
        if (response.data.onboarding_completed) {
          onComplete();
          return;
        }
        setCurrentStep(response.data.current_step || 1);
        if (response.data.primary_goal) {
          setFormData((prev) => ({
            ...prev,
            primaryGoal: response.data.primary_goal,
          }));
        }
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === totalSteps) {
      await handleComplete();
      return;
    }

    triggerHaptic();
    await completeStepOnBackend(currentStep);
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      triggerHaptic();
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = async () => {
    try {
      triggerHaptic();
      await apiService.skipOnboarding();
      onSkip();
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      onSkip();
    }
  };

  const completeStepOnBackend = async (step: number) => {
    try {
      const stepData: any = {};

      if (step === 1) {
        stepData.goal = formData.primaryGoal;
      } else if (step === 2) {
        stepData.estimatedIncome = formData.estimatedIncome
          ? parseFloat(formData.estimatedIncome)
          : null;
        stepData.preferredCategories = formData.preferredCategories;
      } else if (step === 3) {
        stepData.transactionAdded = formData.transactionAdded;
      }

      await apiService.completeOnboardingStep(step, stepData);
    } catch (error) {
      console.error("Error saving step:", error);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      triggerHaptic();
      await completeStepOnBackend(currentStep);
      await apiService.completeOnboarding();

      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        onComplete();
      }, 2000);
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.primaryGoal !== "";
      case 2:
        return (
          formData.estimatedIncome !== "" &&
          formData.preferredCategories.length > 0
        );
      case 3:
        return formData.transactionAdded;
      case 4:
      case 5:
        return true;
      default:
        return false;
    }
  };

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1:
        return <Target size={24} color={colors.accent} />;
      case 2:
        return <Wallet size={24} color={colors.accent} />;
      case 3:
        return <TrendingUp size={24} color={colors.accent} />;
      case 4:
        return <Sparkles size={24} color={colors.accent} />;
      case 5:
        return <Bell size={24} color={colors.accent} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Modal visible={true} animationType="slide" transparent={false}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top", "bottom", "left", "right"]}
      >
        {/* Header with progress */}
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-text-primary text-xl font-bold">
              Configuração Inicial
            </Text>
            <Pressable onPress={handleSkip} className="p-2">
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Progress bar */}
          <View className="h-2 bg-card-bg rounded-full overflow-hidden">
            <View
              className="h-full bg-accent rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
          <Text className="text-text-secondary text-xs mt-2">
            Passo {currentStep} de {totalSteps}
          </Text>
        </View>

        {/* Step content */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {currentStep === 1 && (
            <OnboardingStep1
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
            />
          )}
          {currentStep === 2 && (
            <OnboardingStep2
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
            />
          )}
          {currentStep === 3 && (
            <OnboardingStep3
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
            />
          )}
          {currentStep === 4 && (
            <OnboardingStep4
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
            />
          )}
          {currentStep === 5 && (
            <OnboardingStep5
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
            />
          )}
        </ScrollView>

        {/* Navigation buttons */}
        <View className="px-6 py-4 border-t border-border-default bg-background">
          <View className="flex-row gap-3">
            {currentStep > 1 && (
              <Pressable
                onPress={handlePrevious}
                className="flex-1 bg-card-bg px-6 py-4 rounded-xl flex-row items-center justify-center gap-2"
              >
                <ArrowLeft size={20} color={colors.textPrimary} />
                <Text className="text-text-primary font-semibold">Anterior</Text>
              </Pressable>
            )}
            <Pressable
              onPress={canProceed() ? handleNext : undefined}
              disabled={!canProceed() || isSubmitting}
              className={`flex-1 bg-accent px-6 py-4 rounded-xl flex-row items-center justify-center gap-2 ${
                !canProceed() || isSubmitting ? "opacity-50" : ""
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#191E29" />
              ) : (
                <>
                  <Text className="text-[#191E29] font-semibold">
                    {currentStep === totalSteps ? "Concluir" : "Próximo"}
                  </Text>
                  {currentStep < totalSteps && (
                    <ArrowRight size={20} color="#191E29" />
                  )}
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* Confetti overlay */}
        {showConfetti && (
          <View className="absolute inset-0 items-center justify-center bg-black/50">
            <View className="bg-card-bg p-8 rounded-2xl items-center">
              <CheckCircle size={64} color={colors.success} />
              <Text className="text-text-primary text-xl font-bold mt-4">
                Parabéns!
              </Text>
              <Text className="text-text-secondary text-center mt-2">
                Configuração concluída com sucesso
              </Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

