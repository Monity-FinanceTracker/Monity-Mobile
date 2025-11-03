import * as Joi from "joi";
import type { Request, Response, NextFunction } from "express";

const validate =
  (schema: any) => (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.details.map((d: any) => d.message),
      });
    }
    next();
  };

const schemas = {
  // Example schema
  createUser: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().required(),
  }),
};

export { validate, schemas };
