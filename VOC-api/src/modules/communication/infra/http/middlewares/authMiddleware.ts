import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../../../../../shared/errors/UnauthorizedError";
import { IJwtProvider } from "../../../../identity/domain/services/IJwtProvider";
import { createLogger } from "../../../../../shared/logger/logger";

export const makeAuthMiddleware = (jwtProvider: IJwtProvider) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const logger = createLogger("auth");
    const token = req.cookies?.accessToken;

    if (!token) {
      logger.warn({ errorCode: "MISSING_ACCESS_TOKEN", path: req.path }, "Missing access token");
      throw new UnauthorizedError("MISSING_ACCESS_TOKEN");
    }

    try {
      const payload = jwtProvider.verify(token);
      req.auth = { userId: payload.userId, userLevel: payload.userLevel };
      next();
    } catch (err) {
      logger.warn({ errorCode: "INVALID_OR_EXPIRED_TOKEN", path: req.path }, "Invalid or expired token");
      throw new UnauthorizedError("INVALID_OR_EXPIRED_TOKEN");
    }
  };
};
