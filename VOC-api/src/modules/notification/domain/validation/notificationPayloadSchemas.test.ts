import { describe, it, expect } from "vitest";
import {
  validateNotificationPayload,
  notificationPayloadSchemas,
} from "../../domain/validation/notificationPayloadSchemas";

describe("notificationPayloadSchemas", () => {
  describe("EVENTO_CRIADO", () => {
    const valid = { eventId: "550e8400-e29b-41d4-a716-446655440000", eventTitle: "Culto", eventType: "SUNDAY_SERVICE", needsScale: false };

    it("accepts valid payload", () => {
      const result = validateNotificationPayload("EVENTO_CRIADO", valid);
      expect(result).toEqual(valid);
    });

    it("rejects missing eventId", () => {
      expect(() => validateNotificationPayload("EVENTO_CRIADO", { ...valid, eventId: undefined })).toThrow();
    });

    it("rejects extra fields (strict)", () => {
      expect(() => validateNotificationPayload("EVENTO_CRIADO", { ...valid, extraField: true })).toThrow();
    });

    it("rejects non-boolean needsScale", () => {
      expect(() => validateNotificationPayload("EVENTO_CRIADO", { ...valid, needsScale: "yes" })).toThrow();
    });
  });

  describe("MEMBRO_ESCALADO", () => {
    const valid = {
      eventId: "550e8400-e29b-41d4-a716-446655440000",
      ministryId: "550e8400-e29b-41d4-a716-446655440001",
      ministryName: "Louvor",
      eventTitle: "Culto de Domingo",
      eventDate: "2026-07-26T10:00:00.000Z",
    };

    it("accepts valid payload", () => {
      const result = validateNotificationPayload("MEMBRO_ESCALADO", valid);
      expect(result.eventTitle).toBe("Culto de Domingo");
    });

    it("rejects invalid date", () => {
      expect(() => validateNotificationPayload("MEMBRO_ESCALADO", { ...valid, eventDate: "not-a-date" })).toThrow();
    });
  });

  describe("MEMBER_AUSENTE", () => {
    const valid = { memberId: "550e8400-e29b-41d4-a716-446655440000", memberName: "João", eventType: "HOUSE_SERVICE", daysSinceLastEvent: 45 };

    it("accepts valid payload", () => {
      const result = validateNotificationPayload("MEMBER_AUSENTE", valid);
      expect(result.daysSinceLastEvent).toBe(45);
    });

    it("rejects negative days", () => {
      expect(() => validateNotificationPayload("MEMBER_AUSENTE", { ...valid, daysSinceLastEvent: -1 })).toThrow();
    });
  });

  describe("MEMBRO_VINCULADO", () => {
    const valid = { memberId: "550e8400-e29b-41d4-a716-446655440000", memberName: "Maria" };

    it("accepts valid payload", () => {
      const result = validateNotificationPayload("MEMBRO_VINCULADO", valid);
      expect(result.memberName).toBe("Maria");
    });

    it("rejects empty name", () => {
      expect(() => validateNotificationPayload("MEMBRO_VINCULADO", { memberId: valid.memberId, memberName: "" })).toThrow();
    });
  });

  describe("MEMBRO_REMOVIDO", () => {
    const valid = {
      eventId: "550e8400-e29b-41d4-a716-446655440000",
      memberId: "550e8400-e29b-41d4-a716-446655440001",
      ministryName: "Louvor",
      eventTitle: "Culto",
      eventDate: "2026-07-26",
    };

    it("accepts valid payload", () => {
      const result = validateNotificationPayload("MEMBRO_REMOVIDO", valid);
      expect(result.ministryName).toBe("Louvor");
    });
  });

  it("throws for unknown type", () => {
    expect(() => validateNotificationPayload("ESCALA_PENDENTE" as any, {})).toThrow();
  });

  it("throws for unknown version", () => {
    expect(() => validateNotificationPayload("EVENTO_CRIADO", { eventId: "550e8400-e29b-41d4-a716-446655440000", eventTitle: "Test", eventType: "SUNDAY_SERVICE", needsScale: false }, 99)).toThrow();
  });

  it("all schemas are registered and strict", () => {
    const types = Object.keys(notificationPayloadSchemas);
    expect(types).toEqual(["MEMBER_AUSENTE", "MEMBRO_VINCULADO", "MEMBRO_REMOVIDO", "EVENTO_CRIADO", "MEMBRO_ESCALADO"]);
  });
});
