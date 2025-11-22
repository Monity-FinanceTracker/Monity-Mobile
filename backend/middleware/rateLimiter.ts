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
  // Use a key generator that handles Railway's proxy properly
  keyGenerator: (req: Request) => {
    // Get the real IP from various headers Railway might use
    const ip = req.ip || 
               req.headers['x-real-ip'] as string ||
               req.headers['x-forwarded-for'] as string ||
               req.socket.remoteAddress ||
               'unknown';
    
    // If x-forwarded-for has multiple IPs, take the first one
    const clientIp = typeof ip === 'string' && ip.includes(',') 
      ? ip.split(',')[0].trim() 
      : ip;
    
    console.log(`🔑 Rate limiter key: ${clientIp} (from ${req.ip})`);
    return clientIp;
  },
  // Skip rate limiting for localhost in development
  skip: (req: Request) => {
    return (
      process.env.NODE_ENV === "development" &&
      (req.ip === "127.0.0.1" ||
        req.ip === "::1" ||
        req.ip === "::ffff:127.0.0.1")
    );
  },
  // Add error handler for rate limiter failures
  handler: (req, res) => {
    console.log(`⚠️ Rate limit exceeded for ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many requests from this IP, please try again in a minute.",
    });
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
  // Use the same key generator as apiLimiter
  keyGenerator: (req: Request) => {
    const ip = req.ip || 
               req.headers['x-real-ip'] as string ||
               req.headers['x-forwarded-for'] as string ||
               req.socket.remoteAddress ||
               'unknown';
    
    const clientIp = typeof ip === 'string' && ip.includes(',') 
      ? ip.split(',')[0].trim() 
      : ip;
    
    console.log(`🔐 Auth limiter key: ${clientIp}`);
    return clientIp;
  },
  handler: (req, res) => {
    console.log(`⚠️ Auth rate limit exceeded for ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many authentication attempts from this IP, please try again after 15 minutes.",
    });
  },
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
