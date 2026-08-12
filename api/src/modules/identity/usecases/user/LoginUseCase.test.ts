import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginUseCase } from "./LoginUseCase";
import { ForbiddenError } from "../../../../shared/errors/ForbiddenError";
import { UnauthorizedError } from "../../../../shared/errors/UnauthorizedError";

const MINUTE_MS = 60 * 1000;

function makeMocks() {
  const userRepo = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    findDetailedUser: vi.fn(),
    findAll: vi.fn(),
    findAuthUser: vi.fn(),
    assignRole: vi.fn(),
    removeRole: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };
  const hashProvider = {
    compare: vi.fn(),
    hash: vi.fn(),
  };
  const jwtProvider = {
    signAccessToken: vi.fn().mockReturnValue("access-token"),
    signRefreshToken: vi.fn().mockReturnValue("refresh-token"),
    verify: vi.fn(),
  };
  const refreshTokenRepo = {
    save: vi.fn(),
    findByUserId: vi.fn(),
    findByTokenHash: vi.fn(),
    deleteById: vi.fn(),
    deleteAllForUser: vi.fn(),
  };

  const useCase = new LoginUseCase(
    userRepo,
    hashProvider,
    jwtProvider,
    refreshTokenRepo,
  );

  return { useCase, userRepo, hashProvider, jwtProvider, refreshTokenRepo };
}

function makeUser(overrides: Record<string, any> = {}) {
  return {
    id: "user-1",
    email: "test@test.com",
    passwordHash: "hashed-password",
    isActive: true,
    isTemporaryPassword: false,
    roles: [{ id: "role-1", name: "MEMBER", level: 10 }],
    member: null,
    get highestLevel() {
      return 10;
    },
    ...overrides,
  };
}

describe("LoginUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve logar com credenciais válidas", async () => {
    const { useCase, userRepo, hashProvider } = makeMocks();
    const user = makeUser();
    userRepo.findByEmail.mockResolvedValue(user);
    hashProvider.compare.mockResolvedValue(true);

    const result = await useCase.execute({
      email: "test@test.com",
      password: "correct-password",
    });

    expect(result.token).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(result.userId).toBe("user-1");
  });

  it("deve lançar erro se email não existir", async () => {
    const { useCase, userRepo } = makeMocks();
    userRepo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: "notfound@test.com", password: "any" }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("deve lançar erro se senha estiver incorreta", async () => {
    const { useCase, userRepo, hashProvider } = makeMocks();
    userRepo.findByEmail.mockResolvedValue(makeUser());
    hashProvider.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: "test@test.com", password: "wrong" }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("deve lançar erro se usuário estiver inativo", async () => {
    const { useCase, userRepo } = makeMocks();
    userRepo.findByEmail.mockResolvedValue(makeUser({ isActive: false }));

    await expect(
      useCase.execute({ email: "test@test.com", password: "any" }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("deve lançar TEMPORARY_PASSWORD_REQUIRED se senha temporária for válida", async () => {
    const { useCase, userRepo, hashProvider } = makeMocks();
    const future = new Date(Date.now() + 60 * MINUTE_MS);
    const user = makeUser({ isTemporaryPassword: true, temporaryPasswordExpiresAt: future });
    userRepo.findByEmail.mockResolvedValue(user);
    hashProvider.compare.mockResolvedValue(true);

    await expect(
      useCase.execute({ email: "test@test.com", password: "temp-password" }),
    ).rejects.toMatchObject({ statusCode: 403, code: "TEMPORARY_PASSWORD_REQUIRED" });
  });

  it("deve lançar TEMPORARY_PASSWORD_EXPIRED se temporaryPasswordExpiresAt for nulo", async () => {
    const { useCase, userRepo, hashProvider } = makeMocks();
    const user = makeUser({ isTemporaryPassword: true, temporaryPasswordExpiresAt: null });
    userRepo.findByEmail.mockResolvedValue(user);
    hashProvider.compare.mockResolvedValue(true);

    await expect(
      useCase.execute({ email: "test@test.com", password: "temp-password" }),
    ).rejects.toMatchObject({ statusCode: 403, code: "TEMPORARY_PASSWORD_EXPIRED" });
  });

  it("deve lançar TEMPORARY_PASSWORD_EXPIRED se temporaryPasswordExpiresAt <= now", async () => {
    const { useCase, userRepo, hashProvider } = makeMocks();
    const past = new Date(Date.now() - MINUTE_MS);
    const user = makeUser({ isTemporaryPassword: true, temporaryPasswordExpiresAt: past });
    userRepo.findByEmail.mockResolvedValue(user);
    hashProvider.compare.mockResolvedValue(true);

    await expect(
      useCase.execute({ email: "test@test.com", password: "temp-password" }),
    ).rejects.toMatchObject({ statusCode: 403, code: "TEMPORARY_PASSWORD_EXPIRED" });
  });

  it("deve lançar TEMPORARY_PASSWORD_EXPIRED se temporaryPasswordExpiresAt === now", async () => {
    const { useCase, userRepo, hashProvider } = makeMocks();
    const now = new Date();
    const user = makeUser({ isTemporaryPassword: true, temporaryPasswordExpiresAt: now });
    userRepo.findByEmail.mockResolvedValue(user);
    hashProvider.compare.mockResolvedValue(true);

    await expect(
      useCase.execute({ email: "test@test.com", password: "temp-password" }),
    ).rejects.toMatchObject({ statusCode: 403, code: "TEMPORARY_PASSWORD_EXPIRED" });
  });
});
