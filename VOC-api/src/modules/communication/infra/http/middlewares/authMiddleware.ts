// src/modules/auth/infra/http/middlewares/authMiddleware.ts

import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../../../../../shared/errors/UnauthorizedError";
import { IJwtProvider } from "../../../../identity/domain/services/IJwtProvider";

export const makeAuthMiddleware = (jwtProvider: IJwtProvider) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken;

    if (!token) {
      console.warn("[AUTH] MISSING_ACCESS_TOKEN cookies:", Object.keys(req.cookies || {}));
      throw new UnauthorizedError("MISSING_ACCESS_TOKEN");
    }

    try {
      const payload = jwtProvider.verify(token);
      req.auth = { userId: payload.userId, userLevel: payload.userLevel };
      next();
    } catch (err) {
      console.warn("[AUTH] INVALID_OR_EXPIRED_TOKEN for userId in token");
      throw new UnauthorizedError("INVALID_OR_EXPIRED_TOKEN");
    }
  };
};
