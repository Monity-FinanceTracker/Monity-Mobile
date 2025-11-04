import rateLimit from "express-rate-limit";
import type { Request } from "express";

// More generous rate limiting for development and normal usage
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: process.env.NODE_ENV === "development" ? 1000 : 200, // More requests for development
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again in a minute.",
  },
  // Trust proxy is configured in server.ts to only trust Railway's proxy (trust proxy: 1)
  // This prevents rate limiting bypass while still allowing proper IP detection
  // Skip rate limiting for localhost in development
  skip: (req: Request) => {
    return (
      process.env.NODE_ENV === "development" &&
      (req.ip === "127.0.0.1" ||
        req.ip === "::1" ||
        req.ip === "::ffff:127.0.0.1")
    );
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 50 : 10, // More lenient for development
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many authentication attempts from this IP, please try again after 15 minutes.",
  },
  // Trust proxy is configured in server.ts
});

// Rate limiting específico para pagamentos (mais restritivo)
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 20 : 5, // Apenas 5 tentativas por IP em produção
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many payment attempts from this IP, please try again after 15 minutes.",
  },
  // Trust proxy is configured in server.ts
  // Skip rate limiting para localhost em desenvolvimento
  skip: (req: Request) => {
    return (
      process.env.NODE_ENV === "development" &&
      (req.ip === "127.0.0.1" ||
        req.ip === "::1" ||
        req.ip === "::ffff:127.0.0.1")
    );
  },
});

export { apiLimiter, authLimiter, paymentLimiter };
