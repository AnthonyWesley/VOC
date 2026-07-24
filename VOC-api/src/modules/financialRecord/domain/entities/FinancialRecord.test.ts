import { describe, it, expect } from "vitest";
import { FinancialRecord } from "./FinancialRecord";
import { Decimal } from "@prisma/client/runtime/library";
import { ConflictError } from "../../../../shared/errors/ConflictError";

function makeRecord(overrides: Record<string, any> = {}) {
  return FinancialRecord.create({
    amount: new Decimal(100),
    method: "PIX" as any,
    date: new Date(),
    direction: "INCOME" as any,
    recordedById: "user-1",
    categoryId: "cat-1",
    ...overrides,
  });
}

describe("FinancialRecord", () => {
  describe("create", () => {
    it("deve criar com status ACTIVE e direction", () => {
      const record = makeRecord({ direction: "EXPENSE" });
      expect(record.status).toBe("ACTIVE");
      expect(record.direction).toBe("EXPENSE");
      expect(record.isCancelled).toBe(false);
      expect(record.isReversed).toBe(false);
      expect(record.isReversal).toBe(false);
    });

    it("deve lançar erro se amount for zero", () => {
      expect(() =>
        FinancialRecord.create({
          amount: new Decimal(0),
          method: "PIX" as any,
          date: new Date(),
          direction: "INCOME" as any,
          recordedById: "user-1",
          categoryId: "cat-1",
        }),
      ).toThrow("Amount must be greater than zero");
    });

    it("deve lançar erro se direction for omitido", () => {
      expect(() =>
        FinancialRecord.create({
          amount: new Decimal(100),
          method: "PIX" as any,
          date: new Date(),
          direction: undefined as any,
          recordedById: "user-1",
          categoryId: "cat-1",
        }),
      ).toThrow("Direction is required");
    });
  });

  describe("cancel", () => {
    it("deve cancelar registro ACTIVE", () => {
      const record = makeRecord();
      record.cancel("user-2", "Erro na entrada");

      expect(record.status).toBe("CANCELLED");
      expect(record.isCancelled).toBe(true);
      expect(record.isReversed).toBe(false);
      expect(record.cancelledById).toBe("user-2");
      expect(record.cancelReason).toBe("Erro na entrada");
      expect(record.cancelledAt).toBeInstanceOf(Date);
    });

    it("deve lançar erro se já estiver cancelado", () => {
      const record = makeRecord();
      record.cancel("user-2", "Motivo");
      expect(() => record.cancel("user-3", "Outro")).toThrow(ConflictError);
    });

    it("deve lançar erro se REVERSED", () => {
      const record = makeRecord();
      record.reverse("user-1", "Estorno");
      expect(() => record.cancel("user-2", "Motivo")).toThrow(ConflictError);
    });

    it("deve lançar erro se for um estorno (reversalOfId setado)", () => {
      const record = FinancialRecord.create({
        amount: new Decimal(50),
        method: "CASH" as any,
        date: new Date(),
        direction: "EXPENSE" as any,
        recordedById: "user-2",
        categoryId: "cat-2",
        reversalOfId: "original-1",
      });
      expect(() => record.cancel("user-3", "Motivo")).toThrow(ConflictError);
    });
  });

  describe("reverse", () => {
    it("deve reverter registro ACTIVE para REVERSED", () => {
      const record = makeRecord();
      record.reverse("user-2", "Estorno");

      expect(record.status).toBe("REVERSED");
      expect(record.isReversed).toBe(true);
      expect(record.isCancelled).toBe(false);
      expect(record.reversedById).toBe("user-2");
      expect(record.reverseReason).toBe("Estorno");
      expect(record.reversedAt).toBeInstanceOf(Date);
      expect(record.cancelledAt).toBeUndefined();
      expect(record.cancelledById).toBeUndefined();
    });

    it("deve lançar erro se CANCELLED", () => {
      const record = makeRecord();
      record.cancel("user-1", "Cancelamento");
      expect(() => record.reverse("user-2", "Estorno")).toThrow(ConflictError);
    });

    it("deve lançar erro se já REVERSED", () => {
      const record = makeRecord();
      record.reverse("user-1", "Estorno");
      expect(() => record.reverse("user-2", "Outro estorno")).toThrow(ConflictError);
    });

    it("deve lançar erro se for um estorno (reversalOfId setado)", () => {
      const record = FinancialRecord.create({
        amount: new Decimal(50),
        method: "CASH" as any,
        date: new Date(),
        direction: "EXPENSE" as any,
        recordedById: "user-2",
        categoryId: "cat-2",
        reversalOfId: "original-1",
      });
      expect(() => record.reverse("user-3", "Motivo")).toThrow(ConflictError);
    });
  });

  describe("update", () => {
    it("deve atualizar campos permitidos em ACTIVE", () => {
      const record = makeRecord();
      record.update({ description: "Nova descrição" });
      expect(record.description).toBe("Nova descrição");
    });

    it("não deve permitir alterar direction", () => {
      const record = makeRecord({ direction: "INCOME" });
      (record as any).update({ direction: "EXPENSE" });
      expect(record.direction).toBe("INCOME");
    });

    it("deve lançar erro se CANCELLED", () => {
      const record = makeRecord();
      record.cancel("user-1", "Motivo");
      expect(() => record.update({ description: "teste" })).toThrow(ConflictError);
    });

    it("deve lançar erro se REVERSED", () => {
      const record = makeRecord();
      record.reverse("user-1", "Estorno");
      expect(() => record.update({ description: "teste" })).toThrow(ConflictError);
    });

    it("deve lançar erro se for reversal record", () => {
      const record = FinancialRecord.create({
        amount: new Decimal(50),
        method: "CASH" as any,
        date: new Date(),
        direction: "EXPENSE" as any,
        recordedById: "user-2",
        categoryId: "cat-2",
        reversalOfId: "original-1",
      });
      expect(() => record.update({ description: "teste" })).toThrow(ConflictError);
    });
  });
});
