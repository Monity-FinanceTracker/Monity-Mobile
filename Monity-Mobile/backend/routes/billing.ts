import express from "express";
import type { Request, Response, NextFunction } from "express";

export default (controllers: any) => {
  const router = express.Router(); // Suas rotas existentes

  router.post(
    "/create-checkout-session",
    (req: Request, res: Response, next: NextFunction) =>
      controllers.billingController.createCheckoutSession(req, res, next)
  );

  router.post(
    "/create-portal-session",
    controllers.billingController.createBillingPortalSession
  ); // A rota do webhook foi movida para server.js para evitar conflitos // e garantir que o corpo da requisição bruta seja analisado corretamente.

  return router;
};
