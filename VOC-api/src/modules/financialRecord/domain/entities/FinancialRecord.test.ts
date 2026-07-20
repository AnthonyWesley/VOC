import { describe, it, expect } from "vitest";
import { FinancialRecord } from "./FinancialRecord";
import { Decimal } from "@prisma/client/runtime/library";
import { ConflictError } from "../../../../shared/errors/ConflictError";

function makeRecord(overrides: Record<string, any> = {}) {
  return FinancialRecord.create({
    amount: new Decimal(100),
    method: "PIX" as any,
    date: new Date(),
    recordedById: "user-1",
    categoryId: "cat-1",
    ...overrides,
  });
}

describe("FinancialRecord", () => {
  describe("create", () => {
    it("deve criar com status ACTIVE", () => {
      const record = makeRecord();
      expect(record.status).toBe("ACTIVE");
      expect(record.isCancelled).toBe(false);
    });

    it("deve lançar erro se amount for zero", () => {
      expect(() =>
        FinancialRecord.create({
          amount: new Decimal(0),
          method: "PIX" as any,
          date: new Date(),
          recordedById: "user-1",
          categoryId: "cat-1",
        }),
      ).toThrow("Amount must be greater than zero");
    });
  });

  describe("cancel", () => {
    it("deve cancelar o registro", () => {
      const record = makeRecord();
      record.cancel("user-2", "Erro na entrada");

      expect(record.status).toBe("CANCELLED");
      expect(record.isCancelled).toBe(true);
      expect(record.cancelledById).toBe("user-2");
      expect(record.cancelReason).toBe("Erro na entrada");
      expect(record.cancelledAt).toBeInstanceOf(Date);
    });

    it("deve lançar erro se já estiver cancelado", () => {
      const record = makeRecord();
      record.cancel("user-2", "Motivo");

      expect(() => record.cancel("user-3", "Outro motivo")).toThrow(ConflictError);
    });
  });

  describe("update", () => {
    it("deve atualizar campos permitidos", () => {
      const record = makeRecord();
      record.update({ description: "Nova descrição" });

      expect(record.description).toBe("Nova descrição");
    });

    it("não deve permitir alterar status via update", () => {
      const record = makeRecord();
      const originalStatus = record.status;
      (record as any).update({ status: "CANCELLED" });

      expect(record.status).toBe(originalStatus);
    });
  });
});
