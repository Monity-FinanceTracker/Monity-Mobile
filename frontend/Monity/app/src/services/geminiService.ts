// Gemini AI Service for chat functionality
// This service will handle communication with Google's Gemini AI API

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // base64
  };
}

interface GeminiRequest {
  contents: {
    parts: GeminiPart[];
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

export interface ExtractedTransactionData {
  name: string;
  amount: number;
  date: string;
  type: "expense" | "income";
  description?: string;
  categoryName?: string;
}

import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";

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

  /**
   * Process image in chat context - analyze and respond to images
   * @param imageUri - URI of the image file
   * @param context - Optional context about the user's financial situation
   * @returns Promise<string> - AI's response about the image
   */
  async processChatImage(imageUri: string, context?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    try {
      // Read image as base64 using legacy API
      const base64Data = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Get mime type from URI
      const mimeType = imageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

      const systemPrompt = `
        Você é um assistente financeiro especializado em economia pessoal brasileira. 
        Analise a imagem fornecida e responda de forma útil sobre finanças pessoais.
        Se a imagem for uma nota fiscal, comprovante ou recibo, analise e forneça insights financeiros.
        Se for outra coisa relacionada a finanças, ajude da melhor forma possível.
        Mantenha um tom conversacional e amigável, sempre em português brasileiro.
        
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
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: "Analise esta imagem e me ajude com informações financeiras relevantes.",
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
      console.error("Error processing chat image:", error);
      throw error;
    }
  }

  /**
   * Process audio in chat context - transcribe and respond to audio messages
   * @param audioUri - URI of the audio file
   * @param context - Optional context about the user's financial situation
   * @returns Promise<string> - AI's response about the audio
   */
  async processChatAudio(audioUri: string, context?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    try {
      // Read audio as base64 using legacy API
      const base64Data = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Determine mime type
      const mimeType = audioUri.toLowerCase().endsWith('.m4a') 
        ? 'audio/m4a' 
        : audioUri.toLowerCase().endsWith('.mp3')
        ? 'audio/mp3'
        : 'audio/webm';

      const systemPrompt = `
        Você é um assistente financeiro especializado em economia pessoal brasileira. 
        Transcreva o áudio e responda de forma útil sobre finanças pessoais.
        Se o áudio mencionar uma transação financeira, forneça insights e sugestões.
        Mantenha um tom conversacional e amigável, sempre em português brasileiro.
        
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
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: "Transcreva este áudio e me ajude com informações financeiras relevantes.",
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
      console.error("Error processing chat audio:", error);
      throw error;
    }
  }

  /**
   * Process image and extract transaction data from receipt/invoice
   * @param imageUri - URI of the image file
   * @returns Promise<ExtractedTransactionData> - Extracted transaction information
   */
  async processReceiptImage(imageUri: string): Promise<ExtractedTransactionData> {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    try {
      // Read image as base64 using legacy API
      const base64Data = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Get mime type from URI
      const mimeType = imageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

      const systemPrompt = `
        Você é um assistente especializado em extrair informações de notas fiscais e comprovantes brasileiros.
        Analise a imagem fornecida e extraia as seguintes informações:
        1. Nome/Descrição da transação (produto ou serviço principal)
        2. Valor total (em reais, apenas números)
        3. Data da transação (formato YYYY-MM-DD)
        4. Tipo: "expense" (despesa) ou "income" (receita)
        
        IMPORTANTE: Retorne APENAS um JSON válido no seguinte formato, sem explicações adicionais:
        {
          "name": "nome da transação",
          "amount": valor_numérico,
          "date": "YYYY-MM-DD",
          "type": "expense" ou "income",
          "description": "descrição adicional se houver",
          "categoryName": "categoria sugerida se possível identificar"
        }
        
        Se não conseguir identificar alguma informação, use valores padrão:
        - date: data de hoje no formato YYYY-MM-DD
        - type: "expense" (a menos que claramente seja uma receita)
        - amount: 0 se não conseguir identificar
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
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: "Extraia as informações desta nota fiscal ou comprovante.",
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
          const responseText = candidate.content.parts[0].text.trim();
          
          // Try to extract JSON from response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extractedData = JSON.parse(jsonMatch[0]);
            
            // Validate and format the data
            const transactionData: ExtractedTransactionData = {
              name: extractedData.name || "Transação",
              amount: parseFloat(extractedData.amount) || 0,
              date: extractedData.date || new Date().toISOString().split('T')[0],
              type: extractedData.type === "income" ? "income" : "expense",
              description: extractedData.description,
              categoryName: extractedData.categoryName,
            };

            return transactionData;
          } else {
            throw new Error("Não foi possível extrair dados estruturados da resposta");
          }
        }
      }

      throw new Error("No response received from Gemini API");
    } catch (error) {
      console.error("Error processing receipt image:", error);
      throw error;
    }
  }

  /**
   * Process audio and extract transaction data from voice recording
   * @param audioUri - URI of the audio file
   * @returns Promise<ExtractedTransactionData> - Extracted transaction information
   */
  async processTransactionAudio(audioUri: string): Promise<ExtractedTransactionData> {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    try {
      // Read audio as base64 using legacy API
      const base64Data = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Determine mime type (assuming m4a for iOS, mp3/3gp for Android)
      const mimeType = audioUri.toLowerCase().endsWith('.m4a') 
        ? 'audio/m4a' 
        : audioUri.toLowerCase().endsWith('.mp3')
        ? 'audio/mp3'
        : 'audio/webm'; // default for expo-av

      const systemPrompt = `
        Você é um assistente especializado em transcrever e extrair informações de transações financeiras em português brasileiro.
        Transcreva o áudio e extraia as seguintes informações:
        1. Nome/Descrição da transação
        2. Valor total (em reais, apenas números)
        3. Data da transação mencionada (se não mencionada, use hoje - formato YYYY-MM-DD)
        4. Tipo: "expense" (despesa) ou "income" (receita)
        
        IMPORTANTE: Retorne APENAS um JSON válido no seguinte formato, sem explicações adicionais:
        {
          "name": "nome da transação",
          "amount": valor_numérico,
          "date": "YYYY-MM-DD",
          "type": "expense" ou "income",
          "description": "descrição adicional se houver",
          "categoryName": "categoria sugerida se mencionada"
        }
        
        Exemplos:
        - "Comprei comida no supermercado por 150 reais" -> {"name": "Supermercado", "amount": 150, "type": "expense", ...}
        - "Recebi 5000 de salário hoje" -> {"name": "Salário", "amount": 5000, "type": "income", ...}
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
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: "Transcreva e extraia as informações de transação deste áudio.",
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
          const responseText = candidate.content.parts[0].text.trim();
          
          // Try to extract JSON from response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extractedData = JSON.parse(jsonMatch[0]);
            
            // Validate and format the data
            const transactionData: ExtractedTransactionData = {
              name: extractedData.name || "Transação",
              amount: parseFloat(extractedData.amount) || 0,
              date: extractedData.date || new Date().toISOString().split('T')[0],
              type: extractedData.type === "income" ? "income" : "expense",
              description: extractedData.description,
              categoryName: extractedData.categoryName,
            };

            return transactionData;
          } else {
            throw new Error("Não foi possível extrair dados estruturados da resposta");
          }
        }
      }

      throw new Error("No response received from Gemini API");
    } catch (error) {
      console.error("Error processing transaction audio:", error);
      throw error;
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
