// Gemini AI Service for chat functionality
// This service will handle communication with Google's Gemini AI API

interface GeminiRequest {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
  systemInstruction?: {
    parts: {
      text: string;
    }[];
  };
}

interface GeminiResponse {
  candidates?: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

import Constants from "expo-constants";

export class GeminiService {
  private apiKey: string;
  private baseUrl: string = "https://generativelanguage.googleapis.com/v1beta";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || Constants.expoConfig?.extra?.geminiApiKey || "";

    if (!this.apiKey) {
      console.warn(
        "Gemini API key not provided. Please configure the Gemini API key in app.json"
      );
    }
  }

  /**
   * Send a message to Gemini AI and get a response
   * @param message - The user's message
   * @param context - Optional context about the user's financial situation
   * @returns Promise<string> - The AI's response
   */
  async sendMessage(message: string, context?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    try {
      // Prepare the conversation context with financial assistant persona
      const systemPrompt = `
        Você é um assistente financeiro especializado em economia pessoal brasileira. 
        Suas respostas devem ser práticas, educativas e focadas em ajudar com finanças pessoais.
        Mantenha um tom conversacional e amigável, sempre em português brasileiro.
        Foque em dicas práticas de economia, organização financeira, investimentos básicos e educação financeira.
        
        ${context ? `Contexto do usuário: ${context}` : ""}
      `;

      const requestData: GeminiRequest = {
        systemInstruction: {
          parts: [
            {
              text: systemPrompt,
            },
          ],
        },
        contents: [
          {
            parts: [
              {
                text: message,
              },
            ],
          },
        ],
      };

      const response = await fetch(
        `${this.baseUrl}/models/gemini-2.0-flash-001:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Gemini API error: ${response.status} ${response.statusText}`
        );
      }

      const data: GeminiResponse = await response.json();

      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (
          candidate.content &&
          candidate.content.parts &&
          candidate.content.parts.length > 0
        ) {
          return candidate.content.parts[0].text.trim();
        }
      }

      throw new Error("No response received from Gemini API");
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw error;
    }
  }

  /**
   * Get financial advice based on user's transaction history and financial situation
   * @param userData - User's financial data context
   * @param specificQuestion - Specific question about their finances
   * @returns Promise<string> - AI's personalized advice
   */
  async getFinancialAdvice(
    userData: any,
    specificQuestion: string
  ): Promise<string> {
    const context = `
      Situação financeira atual do usuário:
      - Saldo total: R$ ${userData.balance?.total || 0}
      - Receita mensal: R$ ${userData.monthlyIncome || 0}
      - Gastos mensais: R$ ${userData.monthlyExpenses || 0}
      - Categorias de gastos principais: ${userData.topCategories?.join(", ") || "Nenhuma"}
      - Objetivos financeiros: ${userData.financialGoals || "Não definidos"}
    `;

    return this.sendMessage(specificQuestion, context);
  }

  /**
   * Validate if the API key is working correctly
   * @returns Promise<boolean> - True if API is accessible
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.sendMessage("Teste de conexão");
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();

// Environment configuration helper
export const configureGemini = (apiKey: string) => {
  const service = new GeminiService(apiKey);
  return service;
};

// Default export for React components
export default geminiService;
