import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";
import { createLogger } from "../logger/logger";

const portugueseMessages: Record<string, string> = {
  "Invalid input": "Valor inválido",
  "Required": "Campo obrigatório",
  "Expected string, received null": "Esperado texto, recebido nulo",
  "Expected date, received null": "Esperado data, recebido nulo",
  "Invalid datetime": "Data/hora inválida",
  "Invalid email": "E-mail inválido",
};

function translateIssue(message: string): string {
  return portugueseMessages[message] || message;
}

export function ErrorHandler(
  error: Error,
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const logger = createLogger("error-handler");

  if (error instanceof ZodError) {
    const issues = "issues" in error ? (error as any).issues : (error as any).errors ?? [];
    logger.warn({ errorCode: "VALIDATION_ERROR", path: request.path }, "Validation error");
    return response.status(422).json({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos. Verifique os campos e tente novamente.",
      details: issues.map((e: any) => ({
        campo: (e.path ?? []).join("."),
        mensagem: translateIssue(e.message),
      })),
    });
  }

  if (error instanceof AppError) {
    const level = error.statusCode >= 500 ? "error" : "warn";
    logger[level]({ errorCode: error.code, statusCode: error.statusCode, path: request.path }, error.message);
    return response.status(error.statusCode).json({
      code: error.code || "UNKNOWN_ERROR",
      message: error.message,
      details: error.details || null,
    });
  }

  logger.error({ errorCode: "INTERNAL_SERVER_ERROR", path: request.path, err: error }, error.message);
  return response.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "Erro interno do servidor. Tente novamente mais tarde.",
  });
}
