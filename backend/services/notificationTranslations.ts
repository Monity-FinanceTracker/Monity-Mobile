/**
 * Notification Translation Service
 * Provides localized notification messages for multiple languages
 */

type Language = 'pt-BR' | 'en-US';

interface NotificationTranslations {
  dailyReminders: string[];
  weeklyInsight: {
    prefix: string;
    spent: string;
    earned: string;
    top: string;
    greatHealth: string;
    keepImproving: string;
    reduceExpenses: string;
  };
  goalReminders: {
    title: string;
    almostThere: (progress: number) => string;
    halfway: (progress: number) => string;
    keepGoing: (progress: number, daysLeft: number | null) => string;
  };
  reengagement: {
    title: string;
    body: string;
  };
}

const translations: Record<Language, NotificationTranslations> = {
  'pt-BR': {
    dailyReminders: [
      'Bom dia! 💰 Registre suas despesas hoje',
      'Olá! 📊 Como está seu orçamento?',
      'Hora de verificar! 💸 Alguma despesa nova?',
      'Ótimo dia para gerenciar suas finanças! ✨',
      'Não esqueça de registrar seus gastos! 📝',
    ],
    weeklyInsight: {
      prefix: 'Semana passada',
      spent: 'gasto',
      earned: 'recebido',
      top: 'Maior',
      greatHealth: '💪 Ótima saúde financeira!',
      keepImproving: 'Continue melhorando suas economias! 📈',
      reduceExpenses: 'Vamos trabalhar para reduzir despesas! 💡',
    },
    goalReminders: {
      title: '🎯 Atualização de Meta',
      almostThere: (progress: number) =>
        `🎉 Quase lá! Você está ${progress.toFixed(0)}% completo!`,
      halfway: (progress: number) =>
        `💪 Metade do caminho! ${progress.toFixed(0)}% concluído. Continue assim!`,
      keepGoing: (progress: number, daysLeft: number | null) => {
        if (daysLeft && daysLeft > 0) {
          return `🎯 ${progress.toFixed(0)}% completo. ${daysLeft} dias restantes!`;
        }
        return `🎯 Continue trabalhando! Você está ${progress.toFixed(0)}% lá.`;
      },
    },
    reengagement: {
      title: 'Sentimos sua falta! 👋',
      body: 'Volte e acompanhe suas finanças. Sua saúde financeira é importante!',
    },
  },
  'en-US': {
    dailyReminders: [
      'Good morning! 💰 Track your expenses today',
      'Hey there! 📊 How\'s your budget looking?',
      'Time to check in! 💸 Any new expenses?',
      'Great day to manage your finances! ✨',
      'Don\'t forget to log your spending! 📝',
    ],
    weeklyInsight: {
      prefix: 'Last week',
      spent: 'spent',
      earned: 'earned',
      top: 'Top',
      greatHealth: '💪 Great financial health!',
      keepImproving: 'Keep improving your savings! 📈',
      reduceExpenses: 'Let\'s work on reducing expenses! 💡',
    },
    goalReminders: {
      title: '🎯 Goal Progress Update',
      almostThere: (progress: number) =>
        `🎉 Almost there! You're ${progress.toFixed(0)}% complete!`,
      halfway: (progress: number) =>
        `💪 Halfway there! ${progress.toFixed(0)}% done. Keep going!`,
      keepGoing: (progress: number, daysLeft: number | null) => {
        if (daysLeft && daysLeft > 0) {
          return `🎯 ${progress.toFixed(0)}% complete. ${daysLeft} days left!`;
        }
        return `🎯 Keep working! You're ${progress.toFixed(0)}% there.`;
      },
    },
    reengagement: {
      title: 'We miss you! 👋',
      body: 'Come back and track your finances. Your financial health is important!',
    },
  },
};

/**
 * Get translations for a specific language
 */
export function getTranslations(language: string = 'pt-BR'): NotificationTranslations {
  const lang = (language === 'en-US' ? 'en-US' : 'pt-BR') as Language;
  return translations[lang];
}

/**
 * Get a daily reminder message in the specified language
 */
export function getDailyReminderMessage(language: string, index: number): string {
  const t = getTranslations(language);
  const messages = t.dailyReminders;
  return messages[index % messages.length];
}

/**
 * Format weekly insight message
 */
export function formatWeeklyInsight(
  language: string,
  totalSpent: number,
  totalIncome: number,
  healthScore: number
): string {
  const t = getTranslations(language);
  const currencySymbol = language === 'pt-BR' ? 'R$' : '$';

  let message = `${t.weeklyInsight.prefix}: ${currencySymbol}${totalSpent.toFixed(0)} ${t.weeklyInsight.spent}`;

  if (totalIncome > 0) {
    message += `, ${currencySymbol}${totalIncome.toFixed(0)} ${t.weeklyInsight.earned}`;
  }

  if (healthScore >= 70) {
    message += `. ${t.weeklyInsight.greatHealth}`;
  } else if (healthScore >= 50) {
    message += `. ${t.weeklyInsight.keepImproving}`;
  } else {
    message += `. ${t.weeklyInsight.reduceExpenses}`;
  }

  return message;
}

/**
 * Format goal reminder message
 */
export function formatGoalReminder(
  language: string,
  goalName: string,
  progress: number,
  daysLeft: number | null
): { title: string; body: string } {
  const t = getTranslations(language);

  let body: string;
  if (progress >= 90) {
    body = t.goalReminders.almostThere(progress);
  } else if (progress >= 50) {
    body = t.goalReminders.halfway(progress);
  } else {
    body = t.goalReminders.keepGoing(progress, daysLeft);
  }

  // Add goal name at the beginning
  body = `${goalName}: ${body}`;

  return {
    title: t.goalReminders.title,
    body,
  };
}

/**
 * Get re-engagement message
 */
export function getReengagementMessage(language: string): { title: string; body: string } {
  const t = getTranslations(language);
  return {
    title: t.reengagement.title,
    body: t.reengagement.body,
  };
}

export default {
  getTranslations,
  getDailyReminderMessage,
  formatWeeklyInsight,
  formatGoalReminder,
  getReengagementMessage,
};
