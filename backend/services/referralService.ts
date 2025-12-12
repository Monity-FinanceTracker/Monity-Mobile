import { logger } from "../utils/logger";
import crypto from "crypto";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-09-30.clover",
    })
  : null;

/**
 * ReferralService
 * Handles all referral/invite reward system logic
 */
export default class ReferralService {
  private supabase: any;
  private rewardTiers: {
    tier_1: { minReferrals: number; maxReferrals: number; days: number };
    tier_2: { minReferrals: number; maxReferrals: number; days: number };
    tier_3: { minReferrals: number; maxReferrals: number; days: number };
    tier_4: { minReferrals: number; maxReferrals: number; days: number };
  };
  private lifetimeCapDays: number;
  private referralExpiryDays: number;

  constructor(supabase: any) {
    this.supabase = supabase;

    // Reward tier configuration
    this.rewardTiers = {
      tier_1: { minReferrals: 0, maxReferrals: 0, days: 14 }, // First referral
      tier_2: { minReferrals: 1, maxReferrals: 3, days: 7 }, // 2-4 referrals
      tier_3: { minReferrals: 4, maxReferrals: 8, days: 5 }, // 5-9 referrals
      tier_4: { minReferrals: 9, maxReferrals: Infinity, days: 3 }, // 10+ referrals
    };

    this.lifetimeCapDays = 60; // Maximum days that can be earned EVER (lifetime cap)
    this.referralExpiryDays = 30; // Days until pending referral expires
  }

  /**
   * Generate a unique referral code for a user
   * Format: FIRSTNAME + 4 random digits (e.g., "JOAO2847")
   */
  async generateReferralCode(userId: string, userName: string) {
    try {
      // Check if user already has a referral code
      const { data: existing, error: checkError } = await this.supabase
        .from("referral_codes")
        .select("referral_code, short_link")
        .eq("user_id", userId)
        .single();

      if (!checkError && existing) {
        logger.info("User already has referral code", {
          userId,
          code: existing.referral_code,
        });
        return {
          referralCode: existing.referral_code,
          shortLink: existing.short_link,
        };
      }

      // Extract and normalize first name
      const firstName = this.normalizeFirstName(userName);

      // Generate unique code
      let referralCode: string = "";
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        const randomDigits = this.generateRandomDigits(4);
        referralCode = `${firstName}${randomDigits}`.toUpperCase();

        // Check uniqueness
        const { data: existingCode } = await this.supabase
          .from("referral_codes")
          .select("id")
          .eq("referral_code", referralCode)
          .single();

        if (!existingCode) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error(
          "Failed to generate unique referral code after multiple attempts"
        );
      }

      // Generate short link code (6 characters, alphanumeric)
      const shortLink = this.generateShortLinkCode();

      // Insert into database
      const { data: newCode, error: insertError } = await this.supabase
        .from("referral_codes")
        .insert({
          user_id: userId,
          referral_code: referralCode!,
          short_link: shortLink,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        logger.error("Failed to insert referral code", {
          userId,
          error: insertError.message,
        });
        throw insertError;
      }

      logger.info("Referral code generated successfully", {
        userId,
        referralCode,
        shortLink,
      });

      return {
        referralCode: newCode.referral_code,
        shortLink: newCode.short_link,
      };
    } catch (error: any) {
      logger.error("Error generating referral code", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Validate if a referral code exists and is active
   */
  async validateReferralCode(referralCode: string) {
    try {
      if (!referralCode || referralCode.trim().length === 0) {
        return { valid: false };
      }

      const normalizedCode = referralCode.trim().toUpperCase();

      // Look up referral code
      const { data: codeData, error } = await this.supabase
        .from("referral_codes")
        .select(
          `
                    user_id,
                    is_active,
                    profiles:user_id (
                        name
                    )
                `
        )
        .eq("referral_code", normalizedCode)
        .single();

      if (error || !codeData) {
        return { valid: false };
      }

      if (!codeData.is_active) {
        return { valid: false, reason: "Code is inactive" };
      }

      return {
        valid: true,
        referrerId: codeData.user_id,
        referrerName: codeData.profiles?.name || "A friend",
      };
    } catch (error: any) {
      logger.error("Error validating referral code", {
        referralCode,
        error: error.message,
      });
      return { valid: false };
    }
  }

  /**
   * Get referral statistics for a user
   */
  async getReferralStats(userId: string) {
    try {
      // Get user's referral code
      const { data: codeData } = await this.supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", userId)
        .single();

      // Get user profile for counters
      const { data: profile } = await this.supabase
        .from("profiles")
        .select("total_referrals, successful_referrals, premium_days_earned")
        .eq("id", userId)
        .single();

      // Get referral list
      const { data: referrals } = await this.supabase
        .from("referrals")
        .select("*, profiles:referred_user_id(name)")
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false });

      // Count by status
      const statusCounts = {
        pending: 0,
        qualified: 0,
        expired: 0,
        cancelled: 0,
      };

      if (referrals) {
        referrals.forEach((ref: any) => {
          statusCounts[ref.status as keyof typeof statusCounts] =
            (statusCounts[ref.status as keyof typeof statusCounts] || 0) + 1;
        });
      }

      // Calculate current tier and next tier
      const currentTier = this.calculateRewardTier(
        profile?.successful_referrals || 0
      );
      const nextTierInfo = this.getNextTierInfo(
        profile?.successful_referrals || 0
      );

      // Check lifetime cap remaining
      const lifetimeEarned = profile?.premium_days_earned || 0;
      const capRemaining = Math.max(0, this.lifetimeCapDays - lifetimeEarned);

      return {
        referralCode: codeData?.referral_code || null,
        shortLink: codeData?.short_link || null,
        totalReferrals: profile?.total_referrals || 0,
        successfulReferrals: profile?.successful_referrals || 0,
        pendingReferrals: statusCounts.pending,
        expiredReferrals: statusCounts.expired,
        totalDaysEarned: lifetimeEarned,
        currentTier: currentTier.tier,
        currentTierDays: currentTier.days,
        nextTier: nextTierInfo,
        lifetimeCapRemaining: capRemaining,
        lifetimeCapTotal: this.lifetimeCapDays,
        recentReferrals: referrals || [],
      };
    } catch (error: any) {
      logger.error("Error getting referral stats", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Calculate reward tier based on successful referral count
   */
  calculateRewardTier(successfulCount: number) {
    if (successfulCount === 0) {
      return { tier: "tier_1", days: 14 };
    } else if (successfulCount <= 3) {
      return { tier: "tier_2", days: 7 };
    } else if (successfulCount <= 8) {
      return { tier: "tier_3", days: 5 };
    } else {
      return { tier: "tier_4", days: 3 };
    }
  }

  /**
   * Get info about next reward tier
   */
  getNextTierInfo(successfulCount: number) {
    if (successfulCount < 1) {
      return { tier: "tier_2", daysPerReferral: 7, referralsNeeded: 1 };
    } else if (successfulCount < 4) {
      return {
        tier: "tier_3",
        daysPerReferral: 5,
        referralsNeeded: 4 - successfulCount,
      };
    } else if (successfulCount < 9) {
      return {
        tier: "tier_4",
        daysPerReferral: 3,
        referralsNeeded: 9 - successfulCount,
      };
    } else {
      return null; // Already at max tier
    }
  }

  /**
   * Check if user has hit LIFETIME referral cap (60 days total, ever)
   */
  async checkLifetimeReferralCap(userId: string) {
    try {
      // Get premium_days_earned from profile (cumulative lifetime total)
      const { data: profile, error } = await this.supabase
        .from("profiles")
        .select("premium_days_earned")
        .eq("id", userId)
        .single();

      if (error) {
        logger.error("Error checking lifetime cap", {
          userId,
          error: error.message,
        });
        return false;
      }

      const lifetimeEarned = profile?.premium_days_earned || 0;
      return lifetimeEarned >= this.lifetimeCapDays;
    } catch (error: any) {
      logger.error("Error checking lifetime cap", {
        userId,
        error: error.message,
      });
      return false;
    }
  }

  // ===== HELPER METHODS =====

  /**
   * Normalize first name for referral code
   * Removes accents, special characters, keeps only letters
   */
  normalizeFirstName(fullName: string) {
    if (!fullName) return "USER";

    const firstName = fullName.split(" ")[0];

    // Remove accents
    const normalized = firstName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase();

    // Limit to 8 characters
    return normalized.substring(0, 8) || "USER";
  }

  /**
   * Generate random digits
   */
  generateRandomDigits(length: number) {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Generate short link code (base62)
   */
  generateShortLinkCode() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Hash IP address using SHA-256
   */
  hashIP(ipAddress: string) {
    return crypto.createHash("sha256").update(ipAddress).digest("hex");
  }
}

