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

// Definindo a interface para o SupabaseClient, se você tiver uma
// Se não, você pode usar 'any' ou a tipagem correta do pacote Supabase
// import { SupabaseClient } from '@supabase/supabase-js';
type SupabaseClient = any; // Exemplo, substitua pela tipagem correta

// --- Middleware ---

const createServer = (supabaseClient?: SupabaseClient): Express => {
  const app: Express = express();

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

  // O manipulador do webhook deve vir ANTES do express.json()
  const controllers = initializeControllers(supabaseClient || supabase);

  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morganMiddleware);

  // --- Rotas da API ---

  const middleware = initializeMiddleware(supabaseClient || supabase);
  app.use("/api/v1", initializeRoutes(controllers, middleware));

  // --- Middleware de tratamento de erro ---
  app.use(errorHandler);

  return app;
};

const app: Express = createServer();
const PORT: number | string = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(
    `CORS enabled for origins: ${
      process.env.CLIENT_URL ||
      "http://localhost:5173, https://firstmonity.vercel.app"
    }`
  );
});

export { createServer, app };
