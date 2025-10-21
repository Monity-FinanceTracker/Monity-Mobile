import crypto from "crypto";
import { config } from "../config";
import { logger } from "../utils/logger";

if (!config.ENCRYPTION_KEY || config.ENCRYPTION_KEY.length !== 64) {
  console.warn("ENCRYPTION_KEY not properly configured. Using fallback mode.");
  // Use a fallback key for development/testing
  const fallbackKey = "567b0eafc511a7817c518993c6f5883f0949e89b4df9d82fb5e48dd7a541b05d";
  config.ENCRYPTION_KEY = fallbackKey;
}

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(config.ENCRYPTION_KEY!, "hex");
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const SENSITIVE_FIELDS: Record<string, string[]> = {
  transactions: ["description"],
  categories: ["name"],
  savings_goals: ["goal_name"],
  groups: ["name"],
};

function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${authTag.toString(
      "hex"
    )}:${encrypted.toString("hex")}`;
  } catch (error) {
    logger.error("Encryption failed", { error });
    throw new Error("Failed to encrypt data.");
  }
}

function decrypt(text: string | null | undefined): string | null | undefined {
  if (!text || typeof text !== "string") {
    return text;
  }

  const parts = text.split(":");
  if (parts.length !== 3) {
    return text;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  const isHex = (str: string): boolean => /^[0-9a-fA-F]+$/.test(str);
  if (
    ivHex.length !== IV_LENGTH * 2 ||
    authTagHex.length !== AUTH_TAG_LENGTH * 2 ||
    !isHex(ivHex) ||
    !isHex(authTagHex) ||
    !isHex(encryptedHex)
  ) {
    return text;
  }

  try {
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encryptedText = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (error) {
    logger.error("Decryption failed for text", { text, error });
    return text;
  }
}

function encryptObject(tableName: string, data: any): any {
  const fields = SENSITIVE_FIELDS[tableName];
  if (!fields) return data;

  const encryptedData = { ...data };
  for (const field of fields) {
    if (encryptedData[field]) {
      encryptedData[field] = encrypt(encryptedData[field]);
    }
  }
  return encryptedData;
}

function decryptObject(tableName: string, data: any): any {
  const fields = SENSITIVE_FIELDS[tableName];
  if (!fields || !data) return data;

  if (Array.isArray(data)) {
    return data.map((item) => decryptObject(tableName, item));
  }

  const decryptedData = { ...data };
  for (const field of fields) {
    if (decryptedData[field]) {
      decryptedData[field] = decrypt(decryptedData[field]);
    }
  }
  return decryptedData;
}

export { encrypt, decrypt, encryptObject, decryptObject };
