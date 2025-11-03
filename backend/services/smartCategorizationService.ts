import * as natural from "natural";
import compromise from "compromise";
import { removeStopwords } from "stopword";
import { Matrix } from "ml-matrix";
import NaiveBayes from "ml-naivebayes";
import { decryptObject, encryptObject } from "../middleware/encryption";
import { logger } from "../utils/logger";

interface MerchantPattern {
  category: string;
  confidence: number;
  usage: number;
}

interface DefaultRule {
  category: string;
  confidence: number;
  transactionType: number;
}

interface CategorySuggestion {
  category: string;
  confidence: number;
  source: string;
  pattern?: string;
  rule?: string;
}

interface FeedbackData {
  user_id: string;
  transaction_description: string;
  suggested_category: string;
  actual_category: string;
  was_suggestion_accepted: boolean;
  confidence_score: number;
  transaction_amount: number | null;
  merchant_pattern: string | null;
}

interface TrainingDataEntry {
  user_id: string;
  description: string;
  amount: number;
  category: string;
  transaction_type_id: number;
  processed_features: string;
  is_verified: boolean;
}

export default class SmartCategorizationService {
  private supabase: any;
  private tokenizer: natural.WordTokenizer;
  private stemmer: typeof natural.PorterStemmer;
  private classifier: any;
  private merchantPatterns: Map<string, MerchantPattern>;
  private defaultRules: Map<string, DefaultRule>;
  private isInitialized: boolean;

  constructor(supabase: any) {
    this.supabase = supabase;
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.classifier = null;
    this.merchantPatterns = new Map();
    this.defaultRules = new Map();
    this.isInitialized = false;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      logger.info("[SmartCategorization] Initializing engine...");

      await this.loadMerchantPatterns();
      await this.loadDefaultRules();
      await this.loadMLModel();

      this.isInitialized = true;
      logger.info("[SmartCategorization] Engine initialized successfully");
    } catch (error: any) {
      logger.error("[SmartCategorization] Failed to initialize:", { error });
      throw error;
    }
  }

  async loadMerchantPatterns(): Promise<void> {
    const { data: patterns, error } = await this.supabase
      .from("merchant_patterns")
      .select("*")
      .order("confidence_score", { ascending: false });

    if (error) {
      logger.error("[SmartCategorization] Error loading merchant patterns:", {
        error,
      });
      return;
    }

    this.merchantPatterns.clear();

    if (patterns && patterns.length > 0) {
      patterns.forEach((pattern: any) => {
        this.merchantPatterns.set(pattern.pattern.toLowerCase(), {
          category: pattern.suggested_category,
          confidence: pattern.confidence_score,
          usage: pattern.usage_count,
        });
      });

      logger.info(
        `[SmartCategorization] Loaded ${patterns.length} merchant patterns`
      );
    } else {
      logger.info(
        "[SmartCategorization] No merchant patterns found in database"
      );
    }
  }

  async loadDefaultRules(): Promise<void> {
    const { data: rules, error } = await this.supabase
      .from("default_category_rules")
      .select("*")
      .eq("is_active", true)
      .order("confidence_score", { ascending: false });

    if (error) {
      logger.error("[SmartCategorization] Error loading default rules:", {
        error,
      });
      return;
    }

    this.defaultRules.clear();

    if (rules && rules.length > 0) {
      rules.forEach((rule: any) => {
        const key = `${rule.rule_type}:${rule.rule_value.toLowerCase()}`;
        this.defaultRules.set(key, {
          category: rule.suggested_category,
          confidence: rule.confidence_score,
          transactionType: rule.transaction_type_id,
        });
      });

      logger.info(`[SmartCategorization] Loaded ${rules.length} default rules`);
    } else {
      logger.info("[SmartCategorization] No default rules found in database");
    }
  }

  async loadMLModel(): Promise<void> {
    try {
      const { data: trainingData, error } = await this.supabase
        .from("transactions")
        .select("description, category, amount, typeId")
        .not("category", "is", null)
        .not("description", "is", null)
        .limit(5000);

      if (error) {
        logger.error("[SmartCategorization] Error loading training data:", {
          error,
        });
        return;
      }

      if (
        !trainingData ||
        !Array.isArray(trainingData) ||
        trainingData.length === 0
      ) {
        logger.info(
          "[SmartCategorization] No training data available, using rule-based approach only"
        );
        return;
      }

      const decryptedTrainingData = decryptObject("transactions", trainingData);

      // Filter out any invalid data after decryption
      const validTrainingData = decryptedTrainingData.filter(
        (transaction: any) =>
          transaction &&
          transaction.description &&
          transaction.description.trim() &&
          transaction.category &&
          transaction.category.trim()
      );

      if (validTrainingData.length < 10) {
        logger.info(
          `[SmartCategorization] Insufficient valid training data (${validTrainingData.length} samples), using rule-based approach only`
        );
        return;
      }

      await this.trainNaiveBayesModel(validTrainingData);
    } catch (error: any) {
      logger.error("[SmartCategorization] Error training ML model:", {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  async trainNaiveBayesModel(trainingData: any[]): Promise<void> {
    try {
      const features: number[][] = [];
      const labels: string[] = [];

      for (const transaction of trainingData) {
        try {
          const extractedFeatures = this.extractFeatures(
            transaction.description,
            transaction.amount
          );

          // Only add if we extracted valid features
          if (extractedFeatures && extractedFeatures.length > 0) {
            features.push(extractedFeatures);
            labels.push(transaction.category);
          }
        } catch (featureError: any) {
          logger.warn(
            "[SmartCategorization] Error extracting features for transaction:",
            {
              description: transaction.description,
              error: featureError.message,
            }
          );
          continue;
        }
      }

      if (features.length === 0 || labels.length === 0) {
        logger.warn(
          "[SmartCategorization] No valid features extracted from training data"
        );
        return;
      }

      if (features.length !== labels.length) {
        logger.error(
          "[SmartCategorization] Mismatch between features and labels count"
        );
        return;
      }

      // Initialize classifier
      this.classifier = new NaiveBayes();

      // Prepare training set with proper format
      const trainingSet = features.map((feature, index) => ({
        input: feature,
        output: labels[index],
      }));

      // Filter out any invalid training samples
      const validTrainingSet = trainingSet.filter(
        (sample) =>
          sample.input &&
          sample.input.length > 0 &&
          sample.output &&
          sample.output.trim()
      );

      if (validTrainingSet.length === 0) {
        logger.warn(
          "[SmartCategorization] No valid training samples after filtering"
        );
        return;
      }

      // Train the model
      this.classifier.train(validTrainingSet);

      logger.info(
        `[SmartCategorization] Successfully trained Naive Bayes model with ${validTrainingSet.length} valid samples`
      );
    } catch (error: any) {
      logger.error("[SmartCategorization] Error in trainNaiveBayesModel:", {
        error: error.message,
        stack: error.stack,
      });
      // Reset classifier on error
      this.classifier = null;
    }
  }

  extractFeatures(description: string, amount: number = 0): number[] {
    if (!description || typeof description !== "string") return [];

    try {
      const features: number[] = [];
      const cleanDesc = description.toLowerCase().trim();

      if (!cleanDesc) return [];

      // Tokenize with error handling
      let tokens: string[] = [];
      try {
        tokens = this.tokenizer.tokenize(cleanDesc) || [];
      } catch (tokenError: any) {
        logger.warn("[SmartCategorization] Error tokenizing description:", {
          description: cleanDesc,
          error: tokenError.message,
        });
        // Fallback to simple word splitting
        tokens = cleanDesc.split(/\s+/).filter((token) => token.length > 0);
      }

      const portugueseStopWords = [
        "de",
        "da",
        "do",
        "das",
        "dos",
        "em",
        "na",
        "no",
        "nas",
        "nos",
        "para",
        "por",
        "com",
        "sem",
        "sob",
        "sobre",
        "entre",
        "durante",
        "antes",
        "depois",
        "ate",
        "desde",
        "contra",
        "segundo",
        "conforme",
        "perante",
        "mediante",
        "durante",
        "excepto",
        "salvo",
        "menos",
        "fora",
        "afora",
        "alem",
        "aquem",
        "atraves",
        "junto",
        "perto",
        "longe",
        "dentro",
        "fora",
        "cima",
        "baixo",
        "frente",
        "tras",
        "lado",
        "vez",
        "vezes",
      ];

      // Remove stopwords with error handling
      try {
        tokens = removeStopwords(tokens, portugueseStopWords);
      } catch (stopwordError: any) {
        logger.warn("[SmartCategorization] Error removing stopwords:", {
          error: stopwordError.message,
        });
      }

      // Stem tokens with error handling
      try {
        tokens = tokens.map((token) => {
          try {
            return this.stemmer.stem(token);
          } catch (stemError) {
            // Return original token if stemming fails
            return token;
          }
        });
      } catch (stemError: any) {
        logger.warn("[SmartCategorization] Error stemming tokens:", {
          error: stemError.message,
        });
      }

      // Filter valid tokens
      const validTokens = tokens.filter(
        (token) =>
          token &&
          typeof token === "string" &&
          token.trim().length > 0 &&
          token.length <= 50 // Prevent extremely long tokens
      );

      features.push(...validTokens.map(() => 1)); // Convert to numeric features

      // Extract merchant with error handling
      try {
        const merchant = this.extractMerchant(cleanDesc);
        if (merchant) {
          features.push(1); // merchant feature
        }
      } catch (merchantError: any) {
        logger.warn("[SmartCategorization] Error extracting merchant:", {
          error: merchantError.message,
        });
      }

      // Add amount feature with validation
      if (
        amount &&
        typeof amount === "number" &&
        amount > 0 &&
        isFinite(amount)
      ) {
        try {
          const amountFeature = this.getAmountRangeFeature(amount);
          if (amountFeature) {
            features.push(1); // amount range feature
          }
        } catch (amountError: any) {
          logger.warn(
            "[SmartCategorization] Error processing amount feature:",
            {
              amount,
              error: amountError.message,
            }
          );
        }
      }

      // Add additional features with error handling
      try {
        features.push(1); // length feature
      } catch (lengthError: any) {
        logger.warn("[SmartCategorization] Error processing length feature:", {
          error: lengthError.message,
        });
      }

      try {
        this.addBrazilianFeatures(cleanDesc, features);
      } catch (brazilianError: any) {
        logger.warn("[SmartCategorization] Error adding Brazilian features:", {
          error: brazilianError.message,
        });
      }

      // NLP features with error handling
      try {
        const doc = compromise(cleanDesc);
        const places = doc.places().out("array");
        const organizations = doc.organizations().out("array");

        places.forEach((place: string) => {
          if (place && typeof place === "string") {
            features.push(1); // place feature
          }
        });
        organizations.forEach((org: string) => {
          if (org && typeof org === "string") {
            features.push(1); // org feature
          }
        });
      } catch (nlpError: any) {
        logger.warn("[SmartCategorization] Error processing NLP features:", {
          error: nlpError.message,
        });
      }

      return features.filter((feature) => feature && feature > 0);
    } catch (error: any) {
      logger.error("[SmartCategorization] Error in extractFeatures:", {
        description,
        error: error.message,
      });
      return [];
    }
  }

  addBrazilianFeatures(description: string, features: number[]): void {
    const bankingTerms = {
      tef: "banking_tef",
      pix: "banking_pix",
      transferencia: "banking_transfer",
      saque: "banking_withdrawal",
      deposito: "banking_deposit",
      pgto: "payment",
      pagamento: "payment",
      compra: "purchase",
      debito: "debit",
      credito: "credit",
    };

    for (const [term, feature] of Object.entries(bankingTerms)) {
      if (description.includes(term)) {
        features.push(1); // feature present
      }
    }

    if (description.includes("r$") || description.includes("real")) {
      features.push(1); // currency feature
    }

    if (/\d{3}\.\d{3}\.\d{3}-\d{2}/.test(description)) {
      features.push(1); // CPF feature
    }
    if (/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/.test(description)) {
      features.push(1); // CNPJ feature
    }
  }

  extractMerchant(description: string): string | null {
    const patterns = [
      /^([A-Z]+[A-Z\s&]+?)[\s\*]/,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /^([\w\s]+?)(?:\s+\d+|\s*\*|$)/,
      /^([A-ZÁÇÉÍÓÚÂÊÎÔÛÀÈÌÒÙÃ]+[\w\s&]*?)[\s\*]/,
      /(TEF|PIX|TRANSFERENCIA|SAQUE|DEPOSITO)/i,
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        return match[1].trim().toLowerCase();
      }
    }

    const brazilianPatterns = [
      /^(.*?)\s+(LTDA|S\/A|SA|ME|EPP)(\s|$)/i,
      /^(PGTO|PAG|COMPRA)\s+(.*)/i,
      /^(.*?)\s+(\d{2}\/\d{2}|\d{4})/,
    ];

    for (const pattern of brazilianPatterns) {
      const match = description.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        return match[1].trim().toLowerCase();
      }
    }

    return null;
  }

  getAmountRangeFeature(amount: number): string | null {
    if (amount <= 10) return "amount_very_small";
    if (amount <= 50) return "amount_small";
    if (amount <= 200) return "amount_medium";
    if (amount <= 1000) return "amount_large";
    return "amount_very_large";
  }

  getDescriptionLengthCategory(description: string): string {
    const length = description.length;
    if (length <= 10) return "short";
    if (length <= 30) return "medium";
    return "long";
  }

  async suggestCategory(
    description: string,
    amount: number = 0,
    transactionType: number = 1,
    userId: string | null = null
  ): Promise<CategorySuggestion[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const suggestions: CategorySuggestion[] = [];
    const cleanDesc = description.toLowerCase().trim();

    try {
      const merchantSuggestion = this.checkMerchantPatterns(cleanDesc);
      if (merchantSuggestion) {
        suggestions.push(merchantSuggestion);
      }

      const ruleSuggestions = this.checkDefaultRules(
        cleanDesc,
        transactionType
      );
      suggestions.push(...ruleSuggestions);

      if (this.classifier) {
        const mlSuggestion = this.getMLPrediction(description, amount);
        if (mlSuggestion) {
          suggestions.push(mlSuggestion);
        }
      }

      if (userId) {
        const userSuggestion = await this.getUserSpecificSuggestion(
          description,
          userId
        );
        if (userSuggestion) {
          suggestions.push(userSuggestion);
        }
      }

      const sortedSuggestions = this.rankSuggestions(suggestions);

      return sortedSuggestions.slice(0, 3);
    } catch (error: any) {
      logger.error("[SmartCategorization] Error in categorization:", { error });
      return [
        {
          category: "Uncategorized",
          confidence: 0.3,
          source: "fallback",
        },
      ];
    }
  }

  checkMerchantPatterns(description: string): CategorySuggestion | null {
    for (const [pattern, data] of this.merchantPatterns) {
      if (description.includes(pattern)) {
        return {
          category: data.category,
          confidence: Math.min(data.confidence + data.usage / 1000, 0.98),
          source: "merchant_pattern",
          pattern: pattern,
        };
      }
    }
    return null;
  }

  checkDefaultRules(
    description: string,
    transactionType: number
  ): CategorySuggestion[] {
    const suggestions: CategorySuggestion[] = [];

    for (const [ruleKey, data] of this.defaultRules) {
      const [ruleType, ruleValue] = ruleKey.split(":");

      if (data.transactionType !== transactionType) continue;

      let matches = false;

      if (ruleType === "keyword" && description.includes(ruleValue)) {
        matches = true;
      } else if (ruleType === "merchant" && description.includes(ruleValue)) {
        matches = true;
      }

      if (matches) {
        suggestions.push({
          category: data.category,
          confidence: data.confidence,
          source: "rule",
          rule: ruleKey,
        });
      }
    }

    return suggestions;
  }

  getMLPrediction(
    description: string,
    amount: number
  ): CategorySuggestion | null {
    if (!this.classifier) return null;

    try {
      const features = this.extractFeatures(description, amount);
      const prediction = this.classifier.predict(features);

      return {
        category: prediction.category,
        confidence: Math.min(prediction.probability * 0.8, 0.9),
        source: "ml_model",
      };
    } catch (error: any) {
      logger.error("[SmartCategorization] ML prediction error:", { error });
      return null;
    }
  }

  async getUserSpecificSuggestion(
    description: string,
    userId: string
  ): Promise<CategorySuggestion | null> {
    try {
      const { data: userTransactions, error } = await this.supabase
        .from("transactions")
        .select("description, category")
        .eq("userId", userId)
        .not("category", "is", null)
        .limit(100);

      if (error || !userTransactions.length) return null;

      const decryptedUserTransactions = decryptObject(
        "transactions",
        userTransactions
      );

      let bestMatch: any = null;
      let bestSimilarity = 0;

      for (const transaction of decryptedUserTransactions) {
        const similarity = this.calculateStringSimilarity(
          description.toLowerCase(),
          transaction.description.toLowerCase()
        );

        if (similarity > bestSimilarity && similarity > 0.6) {
          bestSimilarity = similarity;
          bestMatch = transaction;
        }
      }

      if (bestMatch) {
        return {
          category: bestMatch.category,
          confidence: Math.min(bestSimilarity * 0.8, 0.85),
          source: "user_history",
        };
      }
    } catch (error: any) {
      logger.error("[SmartCategorization] User suggestion error:", { error });
    }

    return null;
  }

  calculateStringSimilarity(str1: string, str2: string): number {
    const tokens1 = new Set(this.tokenizer.tokenize(str1) || []);
    const tokens2 = new Set(this.tokenizer.tokenize(str2) || []);

    const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);

    return intersection.size / union.size;
  }

  rankSuggestions(suggestions: CategorySuggestion[]): CategorySuggestion[] {
    const categoryMap = new Map<string, CategorySuggestion>();

    for (const suggestion of suggestions) {
      if (!categoryMap.has(suggestion.category)) {
        categoryMap.set(suggestion.category, suggestion);
      } else {
        const existing = categoryMap.get(suggestion.category)!;
        if (suggestion.confidence > existing.confidence) {
          categoryMap.set(suggestion.category, suggestion);
        }
      }
    }

    return Array.from(categoryMap.values()).sort(
      (a, b) => b.confidence - a.confidence
    );
  }

  async recordFeedback(
    userId: string,
    transactionDescription: string,
    suggestedCategory: string,
    actualCategory: string,
    wasAccepted: boolean,
    confidence: number,
    amount: number | null = null
  ): Promise<void> {
    try {
      const merchantPattern = this.extractMerchant(
        transactionDescription.toLowerCase()
      );

      const feedbackData: FeedbackData = {
        user_id: userId,
        transaction_description: transactionDescription,
        suggested_category: suggestedCategory,
        actual_category: actualCategory,
        was_suggestion_accepted: wasAccepted,
        confidence_score: confidence,
        transaction_amount: amount,
        merchant_pattern: merchantPattern,
      };

      const encryptedFeedback = encryptObject(
        "categorization_feedback",
        feedbackData
      );

      const { error } = await this.supabase
        .from("categorization_feedback")
        .insert([encryptedFeedback]);

      if (error) {
        logger.error("[SmartCategorization] Error recording feedback:", {
          error,
        });
        return;
      }

      if (merchantPattern && !wasAccepted) {
        await this.updateMerchantPattern(merchantPattern, actualCategory);
      }

      await this.addToTrainingData(
        userId,
        transactionDescription,
        actualCategory,
        amount
      );

      logger.info(
        `[SmartCategorization] Recorded feedback: ${
          wasAccepted ? "accepted" : "corrected"
        }`
      );
    } catch (error: any) {
      logger.error("[SmartCategorization] Error in recordFeedback:", { error });
    }
  }

  async updateMerchantPattern(
    pattern: string,
    category: string
  ): Promise<void> {
    try {
      const { data: existing, error: fetchError } = await this.supabase
        .from("merchant_patterns")
        .select("*")
        .eq("pattern", pattern.toUpperCase())
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        logger.error("[SmartCategorization] Error checking merchant pattern:", {
          fetchError,
        });
        return;
      }

      if (existing) {
        const { error: updateError } = await this.supabase
          .from("merchant_patterns")
          .update({
            suggested_category: category,
            usage_count: existing.usage_count + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (updateError) {
          logger.error(
            "[SmartCategorization] Error updating merchant pattern:",
            { updateError }
          );
        }
      } else {
        const { error: insertError } = await this.supabase
          .from("merchant_patterns")
          .insert([
            {
              pattern: pattern.toUpperCase(),
              suggested_category: category,
              confidence_score: 0.7,
              usage_count: 1,
            },
          ]);

        if (insertError) {
          logger.error(
            "[SmartCategorization] Error creating merchant pattern:",
            { insertError }
          );
        }
      }

      await this.loadMerchantPatterns();
    } catch (error: any) {
      logger.error("[SmartCategorization] Error in updateMerchantPattern:", {
        error,
      });
    }
  }

  async addToTrainingData(
    userId: string,
    description: string,
    category: string,
    amount: number | null,
    transactionType: number = 1
  ): Promise<void> {
    try {
      const features = this.extractFeatures(description, amount || 0);

      const trainingDataEntry: TrainingDataEntry = {
        user_id: userId,
        description: description,
        amount: amount || 0,
        category: category,
        transaction_type_id: transactionType,
        processed_features: JSON.stringify(features),
        is_verified: true,
      };

      const encryptedEntry = encryptObject(
        "ml_training_data",
        trainingDataEntry
      );

      const { error } = await this.supabase
        .from("ml_training_data")
        .insert([encryptedEntry]);

      if (error) {
        logger.error("[SmartCategorization] Error adding training data:", {
          error,
        });
      }
    } catch (error: any) {
      logger.error("[SmartCategorization] Error in addToTrainingData:", {
        error,
      });
    }
  }

  async retrainModel(): Promise<void> {
    logger.info("[SmartCategorization] Starting model retraining...");

    try {
      const { data: trainingData, error } = await this.supabase
        .from("ml_training_data")
        .select("description, category, amount, transaction_type_id")
        .eq("is_verified", true);

      if (error) {
        logger.error(
          "[SmartCategorization] Error fetching training data for retraining:",
          { error }
        );
        return;
      }

      if (trainingData.length < 50) {
        logger.info("[SmartCategorization] Insufficient data for retraining");
        return;
      }

      await this.trainNaiveBayesModel(trainingData);

      logger.info(
        `[SmartCategorization] Model retrained with ${trainingData.length} samples`
      );
    } catch (error: any) {
      logger.error("[SmartCategorization] Error during model retraining:", {
        error,
      });
    }
  }
}
