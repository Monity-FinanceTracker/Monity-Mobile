import { logger } from "./logger";

// Invitation constants
const INVITATION_EXPIRATION_DAYS = 7;
const INVITATION_TOKEN_MASK_LENGTH = 8;

/**
 * Masks a token for logging (security)
 * @param token - Full token
 * @returns Masked token
 */
export function maskToken(token: string): string {
  if (!token || token.length < INVITATION_TOKEN_MASK_LENGTH) {
    return "***";
  }
  return token.substring(0, INVITATION_TOKEN_MASK_LENGTH) + "...";
}

/**
 * Gets the frontend URL based on environment
 * @returns Frontend URL
 */
export function getFrontendUrl(): string {
  return (
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://firstmonity.vercel.app"
      : "http://localhost:5173")
  );
}

/**
 * Builds the complete invitation link
 * @param token - Invitation token
 * @returns Complete invitation link
 */
export function buildInvitationLink(token: string): string {
  const frontendUrl = getFrontendUrl();
  // For mobile, we can use deep links or web URLs
  // Using web URL format that can be handled by mobile app via deep linking
  return `${frontendUrl}/groups/invite/${token}`;
}

/**
 * Calculates the invitation expiration date
 * @returns Expiration date
 */
export function calculateExpirationDate(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRATION_DAYS);
  return expiresAt;
}

/**
 * Checks if an invitation is expired
 * @param expiresAt - Expiration date
 * @returns True if expired
 */
export function isInvitationExpired(expiresAt: string | Date): boolean {
  if (!expiresAt) return false;
  const expirationDate = new Date(expiresAt);
  const now = new Date();
  return now > expirationDate;
}

/**
 * Validates if an invitation is valid (not expired and pending)
 * @param invitation - Invitation object
 * @returns Validation result
 */
export function validateInvitation(invitation: any): {
  valid: boolean;
  error?: string;
  statusCode?: number;
  expired?: boolean;
  status?: string;
  expiresAt?: string | Date;
} {
  if (!invitation) {
    return {
      valid: false,
      error: "Invitation not found or invalid token.",
      statusCode: 404,
    };
  }

  // Check if expired
  if (invitation.expires_at && isInvitationExpired(invitation.expires_at)) {
    logger.warn("Invitation expired", {
      invitationId: invitation.id,
      expiresAt: invitation.expires_at,
    });
    return {
      valid: false,
      error: "Invitation link has expired.",
      statusCode: 410,
      expired: true,
      expiresAt: invitation.expires_at,
    };
  }

  // Check if still pending
  if (invitation.status !== "pending") {
    logger.warn("Invitation already used", {
      invitationId: invitation.id,
      currentStatus: invitation.status,
    });
    return {
      valid: false,
      error: "This invitation has already been used.",
      statusCode: 410,
      status: invitation.status,
    };
  }

  return { valid: true };
}

/**
 * Checks if an error is related to schema (migration needed)
 * @param error - Error to check
 * @returns True if schema error
 */
export function isSchemaError(error: any): boolean {
  if (!error || !error.message) return false;

  const errorMessage = error.message.toLowerCase();
  const schemaKeywords = [
    "expires_at",
    "invitation_token",
    "column",
    "schema cache",
  ];

  return schemaKeywords.some((keyword) => errorMessage.includes(keyword));
}

/**
 * Returns the migration SQL for invitations
 * @returns Migration SQL
 */
export function getInvitationMigrationSQL(): string {
  return `-- Run this SQL in Supabase SQL Editor:
-- 1. Go to https://app.supabase.com
-- 2. Select your project
-- 3. Open "SQL Editor"
-- 4. Copy and execute the following:

ALTER TABLE group_invitations 
ADD COLUMN IF NOT EXISTS invitation_token UUID UNIQUE;

ALTER TABLE group_invitations 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_group_invitations_token ON group_invitations(invitation_token);

CREATE INDEX IF NOT EXISTS idx_group_invitations_expires_at ON group_invitations(expires_at);`;
}

/**
 * Creates error response for migration required
 * @returns Formatted error response
 */
export function createMigrationErrorResponse() {
  return {
    error:
      "Database migration required. The invitation_token and expires_at columns do not exist in the group_invitations table.",
    code: "MIGRATION_REQUIRED",
    migrationRequired: true,
    instructions:
      "Please run the migration SQL in Supabase SQL Editor to add the required columns.",
    migrationSQL: getInvitationMigrationSQL(),
  };
}

