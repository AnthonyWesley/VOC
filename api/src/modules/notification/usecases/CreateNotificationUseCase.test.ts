import { describe, it, expect, vi } from "vitest";
import { CreateNotificationUseCase } from "./CreateNotificationUseCase";
import { INotificationRepository } from "../domain/repositories/INotificationRepository";

function createMockRepo(): INotificationRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByDedupKey: vi.fn(),
    list: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    countUnread: vi.fn(),
  };
}

describe("CreateNotificationUseCase", () => {
  it("uses default repo when options omitted", async () => {
    const repo = createMockRepo();
    const uc = new CreateNotificationUseCase(repo);

    await uc.execute({
      userId: "u-1",
      type: "EVENTO_CRIADO",
      title: "Test",
      deduplicationKey: "k-1",
    });

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.findByDedupKey).not.toHaveBeenCalled();
  });

  it("uses provided repository when options.repository is set", async () => {
    const defaultRepo = createMockRepo();
    const customRepo = createMockRepo();
    const uc = new CreateNotificationUseCase(defaultRepo);

    await uc.execute({
      userId: "u-1",
      type: "MEMBRO_VINCULADO",
      title: "Test",
      deduplicationKey: "k-1",
    }, { repository: customRepo });

    expect(customRepo.create).toHaveBeenCalledTimes(1);
    expect(defaultRepo.create).not.toHaveBeenCalled();
  });

  it("rethrows P2002 when recoverDeduplicationConflict=false", async () => {
    const repo = createMockRepo();
    (repo.create as any).mockRejectedValue({ code: "P2002" });
    const uc = new CreateNotificationUseCase(repo);

    await expect(uc.execute({
      userId: "u-1",
      type: "MEMBRO_ESCALADO",
      title: "Test",
      deduplicationKey: "k-1",
    }, { recoverDeduplicationConflict: false })).rejects.toEqual({ code: "P2002" });

    expect(repo.findByDedupKey).not.toHaveBeenCalled();
  });


  it("creates notification without dedup key", async () => {
    const repo = createMockRepo();
    const uc = new CreateNotificationUseCase(repo);

    const result = await uc.execute({
      userId: "u-1",
      type: "EVENTO_CRIADO",
      title: "Novo evento",
      message: "Teste",
      payload: { eventId: "01ARZ3NDEKTSV4RRFFQ69G5FAV", eventTitle: "Culto", eventType: "SUNDAY_SERVICE", needsScale: false },
    });

    expect(result.created).toBe(true);
    expect(result.notification.type).toBe("EVENTO_CRIADO");
    expect(result.notification.title).toBe("Novo evento");
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it("returns created=true on first dedup call", async () => {
    const repo = createMockRepo();
    const uc = new CreateNotificationUseCase(repo);

    const result = await uc.execute({
      userId: "u-1",
      type: "MEMBRO_VINCULADO",
      title: "Bem-vindo",
      payload: { memberId: "01ARZ3NDEKTSV4RRFFQ69G5FAX", memberName: "João" },
      deduplicationKey: "v1:membro-vinculado:m-1",
    });

    expect(result.created).toBe(true);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it("returns created=false on duplicate dedup key (P2002)", async () => {
    const repo = createMockRepo();

    // First call succeeds; second call simulates P2002
    (repo.create as any)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce({ code: "P2002" });

    const memberId = "01ARZ3NDEKTSV4RRFFQ69G5FAX";
    const existingNotification = {
      id: "existing-id",
      userId: "u-1",
      type: "MEMBRO_VINCULADO",
      title: "Bem-vindo",
      message: null,
      payload: { memberId, memberName: "João" },
      payloadVersion: 1,
      deduplicationKey: "v1:membro-vinculado:m-1",
      readAt: null,
      createdAt: new Date(),
      toDTO: function () {
        return {
          id: this.id,
          type: this.type,
          title: this.title,
          message: this.message,
          payload: this.payload,
          payloadVersion: this.payloadVersion,
          readAt: null,
          createdAt: this.createdAt.toISOString(),
        };
      },
    };

    (repo.findByDedupKey as any).mockResolvedValue(existingNotification);

    const uc = new CreateNotificationUseCase(repo);

    await uc.execute({
      userId: "u-1",
      type: "MEMBRO_VINCULADO",
      title: "Bem-vindo",
      payload: { memberId, memberName: "João" },
      deduplicationKey: "v1:membro-vinculado:m-1",
    });

    const result = await uc.execute({
      userId: "u-1",
      type: "MEMBRO_VINCULADO",
      title: "Bem-vindo",
      payload: { memberId, memberName: "João" },
      deduplicationKey: "v1:membro-vinculado:m-1",
    });

    expect(result.created).toBe(false);
    expect(result.notification.id).toBe("existing-id");
  });

  it("throws for invalid payload", async () => {
    const repo = createMockRepo();
    const uc = new CreateNotificationUseCase(repo);

    await expect(uc.execute({
      userId: "u-1",
      type: "EVENTO_CRIADO",
      title: "Novo evento",
      payload: { eventId: "invalid-uuid", eventTitle: "Test", eventType: "SUNDAY_SERVICE", needsScale: false },
    })).rejects.toThrow();
  });

  it("accepts null payload", async () => {
    const repo = createMockRepo();
    const uc = new CreateNotificationUseCase(repo);

    const result = await uc.execute({
      userId: "u-1",
      type: "EVENTO_CRIADO",
      title: "No payload",
    });

    expect(result.created).toBe(true);
    expect(result.notification.payload).toBeNull();
  });
});
