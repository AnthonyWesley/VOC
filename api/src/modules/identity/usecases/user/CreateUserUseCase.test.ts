import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateUserUseCase } from "./CreateUserUseCase";
import { ConflictError } from "../../../../shared/errors/ConflictError";
import { ValidationError } from "../../../../shared/errors/ValidationError";

function makeMocks() {
  const userRepo = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    findDetailedUser: vi.fn(),
    findAll: vi.fn(),
    findAuthUser: vi.fn(),
    assignRole: vi.fn().mockResolvedValue(undefined),
    removeRole: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };
  const hashProvider = {
    hash: vi.fn().mockResolvedValue("hashed-password"),
    compare: vi.fn(),
  };
  const roleRepo = {
    findById: vi.fn(),
    findAll: vi.fn(),
    findByName: vi.fn().mockResolvedValue({ id: "member-role", name: "MEMBER", level: 10 }),
  };

  const useCase = new CreateUserUseCase(userRepo, hashProvider, roleRepo);

  return { useCase, userRepo, hashProvider, roleRepo };
}

describe("CreateUserUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve criar usuário com sucesso e retornar senha temporária", async () => {
    const { useCase, userRepo } = makeMocks();
    userRepo.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute({ email: "new@test.com" });

    expect(result.id).toBeDefined();
    expect(result.email).toBe("new@test.com");
    expect(result.temporaryPassword).toBeDefined();
    expect(result.temporaryPassword.length).toBeGreaterThan(8);
    expect(userRepo.save).toHaveBeenCalledOnce();
  });

  it("deve definir temporaryPasswordExpiresAt no futuro ao criar usuário", async () => {
    const { useCase, userRepo } = makeMocks();
    userRepo.findByEmail.mockResolvedValue(null);
    let savedUser: any;
    userRepo.save.mockImplementation((u: any) => { savedUser = u; });

    await useCase.execute({ email: "future@test.com" });

    expect(savedUser).toBeDefined();
    expect(savedUser.isTemporaryPassword).toBe(true);
    expect(savedUser.temporaryPasswordExpiresAt).toBeInstanceOf(Date);
    expect(savedUser.temporaryPasswordExpiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(savedUser.passwordChangedAt).toBeNull();
  });

  it("deve lançar erro se email já existir", async () => {
    const { useCase, userRepo } = makeMocks();
    userRepo.findByEmail.mockResolvedValue({ id: "existing", email: "existing@test.com" } as any);

    await expect(
      useCase.execute({ email: "existing@test.com" }),
    ).rejects.toThrow(ConflictError);
    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it("deve lançar erro se email não for fornecido", async () => {
    const { useCase } = makeMocks();

    await expect(
      useCase.execute({ email: "" }),
    ).rejects.toThrow(ValidationError);
  });
});
