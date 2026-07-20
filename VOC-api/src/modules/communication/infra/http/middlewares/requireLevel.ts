import { ForbiddenError } from "../../../../../shared/errors/ForbiddenError";
import { Request, Response, NextFunction } from "express";

export const requireLevel = (minLevel: number) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userLevel = req.auth?.userLevel ?? 0;

    if (userLevel < minLevel) {
      throw new ForbiddenError("INSUFFICIENT_PERMISSION_LEVEL");
    }

    next();
  };
};
