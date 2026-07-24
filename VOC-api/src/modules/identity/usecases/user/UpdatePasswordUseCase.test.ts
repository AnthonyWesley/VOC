import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdatePasswordUseCase } from "./UpdatePasswordUseCase";
import { UnauthorizedError } from "../../../../shared/errors/UnauthorizedError";
import { ValidationError } from "../../../../shared/errors/ValidationError";
import { ForbiddenError } from "../../../../shared/errors/ForbiddenError";

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
    hash: vi.fn().mockResolvedValue("new-hashed-password"),
    compare: vi.fn(),
  };

  const useCase = new UpdatePasswordUseCase(userRepo, hashProvider);

  return { useCase, userRepo, hashProvider };
}

function makeUser(overrides: Record<string, any> = {}) {
  return {
    id: "user-1",
    email: "test@test.com",
    passwordHash: "old-hashed-password",
    isActive: true,
    isTemporaryPassword: true,
    temporaryPasswordExpiresAt: new Date(Date.now() + 3600000),
    passwordChangedAt: null,
    updatePassword: vi.fn(),
    markPasswordAsPermanent: vi.fn(),
    roles: [],
    member: null,
    ...overrides,
  };
}

describe("UpdatePasswordUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve atualizar senha com sucesso", async () => {
    const { useCase, userRepo, hashProvider } = makeMocks();
    const user = makeUser();
    userRepo.findByEmail.mockResolvedValue(user);
    hashProvider.compare.mockResolvedValue(true);

    await useCase.execute({
      email: "test@test.com",
      currentPassword: "old-password",
      newPassword: "NewValid@123",
    });

    expect(userRepo.save).toHaveBeenCalledOnce();
    expect(hashProvider.hash).toHaveBeenCalledWith("NewValid@123");
  });

  it("deve rejeitar senha nova fraca (sem mai?scula)", async () => {
    const { useCase, userRepo, hashProvider } = makeMocks();
    userRepo.findByEmail.mockResolvedValue(makeUser());
    hashProvider.compare.mockResolvedValue(true);

    await expect(
      useCase.execute({
        email: "test@test.com",
        currentPassword: "old-password",
        newPassword: "newvalid@123",
      }),
    ).rejects.toThrow(ValidationError);

    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it("deve rejeitar senha nova curta (menos de 8 chars)", async () => {
    const { useCase, userRepo, hashProvider } = makeMocks();
    userRepo.findByEmail.mockResolvedValue(makeUser());
    hashProvider.compare.mockResolvedValue(true);

    await expect(
      useCase.execute({
        email: "test@test.com",
        currentPassword: "old-password",
        newPassword: "Ab1@",
      }),
    ).rejects.toThrow(ValidationError);

    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it("deve rejeitar senha atual incorreta", async () => {
    const { useCase, userRepo, hashProvider } = makeMocks();
    userRepo.findByEmail.mockResolvedValue(makeUser());
    hashProvider.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        email: "test@test.com",
        currentPassword: "wrong-password",
        newPassword: "NewValid@123",
      }),
    ).rejects.toThrow(UnauthorizedError);

    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it("deve rejeitar usu?rio inativo", async () => {
    const { useCase, userRepo, hashProvider } = makeMocks();
    userRepo.findByEmail.mockResolvedValue(makeUser({ isActive: false }));
    hashProvider.compare.mockResolvedValue(true);

    await expect(
      useCase.execute({
        email: "test@test.com",
        currentPassword: "old-password",
        newPassword: "NewValid@123",
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});
