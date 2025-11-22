// Importa o dotenv para carregar variáveis de ambiente
import "dotenv/config";
import { Express } from "express";
import cors, { CorsOptions } from "cors";
import express from "express";

// Importações de módulos locais. Assumimos que eles também estão em TypeScript (.ts)
import { logger, morganMiddleware } from "./utils/logger";
import { supabase } from "./config/supabase";
import { initializeControllers } from "./controllers";
import initializeRoutes from "./routes";
import initializeMiddleware from "./middleware";
import { errorHandler } from "./middleware/errorHandler";

// ============================================================================
// GLOBAL ERROR HANDLERS - Catch crashes before Express can handle them
// ============================================================================
process.on('uncaughtException', (error: Error) => {
  console.error('💥 UNCAUGHT EXCEPTION - Process will exit:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('💥 UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  // Don't exit on unhandled rejection, just log it
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Definindo a interface para o SupabaseClient, se você tiver uma
// Se não, você pode usar 'any' ou a tipagem correta do pacote Supabase
// import { SupabaseClient } from '@supabase/supabase-js';
type SupabaseClient = any; // Exemplo, substitua pela tipagem correta

// --- Middleware ---

const createServer = (supabaseClient?: SupabaseClient): Express => {
  console.log('🚀 Creating Express server...');
  const app: Express = express();

  // ============================================================================
  // IMMEDIATE REQUEST LOGGING - Logs BEFORE any other middleware
  // ============================================================================
  app.use((req, res, next) => {
    const requestId = Math.random().toString(36).substring(7);
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${requestId}] ⚡ REQUEST RECEIVED: ${req.method} ${req.url}`);
    console.log(`[${timestamp}] [${requestId}] IP: ${req.ip}, User-Agent: ${req.get('user-agent')}`);
    (req as any).requestId = requestId;
    next();
  });

  const corsOptions: CorsOptions = {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Permite requisições sem origem (aplicativos móveis, etc.)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:19000",
        "http://localhost:19001",
        "https://firstmonity.vercel.app",
        process.env.CLIENT_URL,
      ].filter(Boolean) as string[];

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn("CORS bloqueou a requisição da origem:", origin);
        callback(new Error("Não permitido pelo CORS"));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  };

  console.log('📦 Initializing controllers...');
  let controllers;
  try {
    controllers = initializeControllers(supabaseClient || supabase);
    console.log('✅ Controllers initialized successfully');
  } catch (error) {
    console.error('❌ FATAL: Failed to initialize controllers:', error);
    throw error;
  }

  // Trust proxy for Railway/production (needed for rate limiting behind proxies)
  // Configure trust proxy to only trust the first proxy (Railway's proxy)
  // This prevents rate limiting bypass while still allowing proper IP detection
  app.set('trust proxy', 1);

  console.log('🔧 Setting up middleware...');
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morganMiddleware);
  console.log('✅ Basic middleware configured');

  // --- Health Check Endpoint ---
  app.get("/", (req, res) => {
    res.status(200).json({
      status: "ok",
      message: "Monity API is running",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // --- Rotas da API ---

  console.log('🔐 Initializing middleware...');
  let middleware;
  try {
    middleware = initializeMiddleware(supabaseClient || supabase);
    console.log('✅ Middleware initialized successfully');
  } catch (error) {
    console.error('❌ FATAL: Failed to initialize middleware:', error);
    throw error;
  }
  
  // Add logging middleware before routes
  app.use("/api/v1", (req, res, next) => {
    const requestId = (req as any).requestId || 'unknown';
    console.log(`[${requestId}] 📨 API v1 route handler: ${req.method} ${req.originalUrl}`);
    logger.info("📨 Request received", {
      requestId,
      method: req.method,
      path: req.path,
      url: req.url,
      originalUrl: req.originalUrl,
      body: req.body,
      headers: req.headers
    });
    next();
  });
  
  console.log('🛣️  Initializing routes...');
  try {
    app.use("/api/v1", initializeRoutes(controllers, middleware));
    console.log('✅ Routes initialized successfully');
  } catch (error) {
    console.error('❌ FATAL: Failed to initialize routes:', error);
    throw error;
  }

  // --- Middleware de tratamento de erro ---
  app.use(errorHandler);
  
  // Catch-all error handler
  app.use((err: any, req: any, res: any, next: any) => {
    const requestId = (req as any).requestId || 'unknown';
    console.error(`[${requestId}] 💥 Unhandled error in Express:`, err);
    logger.error("💥 Unhandled error", {
      requestId,
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: err.message
      });
    }
  });

  return app;
};

console.log('🎬 Starting server initialization...');
console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`📍 Port: ${process.env.PORT || '3001'}`);
console.log(`📍 Host: ${process.env.HOST || '0.0.0.0'}`);

let app: Express;
try {
  app = createServer();
  console.log('✅ Server created successfully');
} catch (error) {
  console.error('❌ FATAL: Failed to create server:', error);
  process.exit(1);
}

const PORT: number = parseInt(process.env.PORT || '3001', 10);
const HOST: string = process.env.HOST || '0.0.0.0';

try {
  app.listen(PORT, HOST, () => {
    console.log('='.repeat(80));
    console.log('🚀 SERVER STARTED SUCCESSFULLY');
    console.log('='.repeat(80));
    console.log(`✅ Server running on ${HOST}:${PORT}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`✅ CORS enabled for origins: ${process.env.CLIENT_URL || "http://localhost:5173, https://firstmonity.vercel.app"}`);
    console.log('='.repeat(80));
    
    logger.info(`Server running on ${HOST}:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    logger.info(
      `CORS enabled for origins: ${
        process.env.CLIENT_URL ||
        "http://localhost:5173, https://firstmonity.vercel.app"
      }`
    );
  });
} catch (error) {
  console.error('❌ FATAL: Failed to start server:', error);
  process.exit(1);
}

export { createServer, app };
