import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";

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
  console.error(`[${error.name}] ${error.message} — ${request.method} ${request.path}`);

  if (error instanceof ZodError) {
    const issues = "issues" in error ? (error as any).issues : (error as any).errors ?? [];
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
    return response.status(error.statusCode).json({
      code: error.code || "UNKNOWN_ERROR",
      message: error.message,
      details: error.details || null,
    });
  }

  return response.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "Erro interno do servidor. Tente novamente mais tarde.",
  });
}
