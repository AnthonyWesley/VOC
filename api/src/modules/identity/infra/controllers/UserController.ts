import { Request, Response } from "express";
import { ActivateUserUseCase } from "../../usecases/user/ActivateUserUseCase";
import { AssignRoleUseCase } from "../../usecases/user/AssignRoleUseCase";
import { CreateUserUseCase } from "../../usecases/user/CreateUserUseCase";
import { DeactivateUserUseCase } from "../../usecases/user/DeactivateUserUseCase";
import { GetAuthenticatedUser } from "../../usecases/user/GetAuthenticatedUser";
import { GetUserUseCase } from "../../usecases/user/GetUserUseCase";
import { ListUsersUseCase } from "../../usecases/user/ListUsersUseCase";
import { LoginUseCase } from "../../usecases/user/LoginUseCase";
import { LogoutUseCase } from "../../usecases/user/LogoutUseCase";
import { RefreshTokenUseCase } from "../../usecases/user/RefreshTokenUseCase";
import { UpdateUserUseCase } from "../../usecases/user/UpdateUserUseCase";
import { RemoveRoleUseCase } from "../../usecases/user/RemoveRoleUseCase";
import { UpdatePasswordUseCase } from "../../usecases/user/UpdatePasswordUseCase";
import { AdminResetPasswordUseCase } from "../../usecases/user/AdminResetPasswordUseCase";

export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly assignRoleUseCase: AssignRoleUseCase,
    private readonly removeRoleUseCase: RemoveRoleUseCase,
    private readonly activateUserUseCase: ActivateUserUseCase,
    private readonly deactivateUserUseCase: DeactivateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getAuthUserUseCase: GetAuthenticatedUser,
    private readonly updatePasswordUseCase: UpdatePasswordUseCase,
    private readonly adminResetPasswordUseCase: AdminResetPasswordUseCase,
  ) {}

  async create(request: Request, response: Response): Promise<Response> {
    const { email, password } = request.body;

    const result = await this.createUserUseCase.execute({
      email,
      password,
    });

    return response.status(201).json(result);
  }

  async assignRole(request: Request, response: Response): Promise<Response> {
    const userId = String(request.params.userId);

    const { roleId } = request.body;

    const result = await this.assignRoleUseCase.execute({
      userId,
      roleId,
      assignedById: request.auth!.userId,
    });

    return response.status(201).json(result);
  }

  async removeRole(request: Request, response: Response): Promise<Response> {
    const userId = String(request.params.userId);

    const { roleId } = request.body;

    const result = await this.removeRoleUseCase.execute({
      userId,
      roleId,
      removedById: request.auth!.userId,
    });

    return response.status(201).json(result);
  }

  async activate(request: Request, response: Response): Promise<Response> {
    const userId = String(request.params.userId);

    const result = await this.activateUserUseCase.execute({
      userId,
      assignedById: request.auth!.userId,
    });

    return response.status(200).json(result);
  }

  async deactivate(request: Request, response: Response): Promise<Response> {
    const userId = String(request.params.userId);

    const result = await this.deactivateUserUseCase.execute({
      userId,
      assignedById: request.auth!.userId,
    });

    return response.status(200).json(result);
  }

  async update(request: Request, response: Response): Promise<Response> {
    const userId = String(request.params.userId);

    const { email } = request.body;

    const result = await this.updateUserUseCase.execute({
      userId,
      email,
    });

    return response.status(200).json(result);
  }

  async list(request: Request, response: Response): Promise<Response> {
    const { limit = "20", cursor, search, isActive } = request.query;

    const result = await this.listUsersUseCase.execute({
      limit: Number(limit),
      cursor: cursor ? String(cursor) : undefined,
      search: search ? String(search) : undefined,
      isActive: typeof isActive === "string" ? isActive === "true" : undefined,
    });

    return response.status(200).json(result);
  }

  async get(request: Request, response: Response): Promise<Response> {
    const userId = String(request.params.userId);

    const result = await this.getUserUseCase.execute({ id: userId });

    return response.status(200).json(result);
  }

  async login(request: Request, response: Response): Promise<Response> {
    const { email, password } = request.body;

    const result = await this.loginUseCase.execute({
      email,
      password,
    });

    const isProd = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax" as const,
      path: "/",
    };

    response.cookie("accessToken", result.token, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000, // 1 dia
    });

    response.cookie("refreshToken", result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });

    return response.status(200).json(result);
  }

  async logout(request: Request, response: Response): Promise<Response> {
    const refreshToken = request.cookies.refreshToken as string;

    try {
      await this.logoutUseCase.execute({ refreshToken });
    } catch {
      // segue mesmo se o token for inválido — o importante é limpar os cookies
    }

    const isProd = process.env.NODE_ENV === "production";

    response.clearCookie("accessToken", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
    });
    response.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
    });

    return response.status(200).json({ message: "LOGGED_OUT" });
  }

  async refresh(request: Request, response: Response): Promise<Response> {
    const refreshToken = request.cookies.refreshToken as string;

    const result = await this.refreshUseCase.execute({ refreshToken });

    const isProd = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax" as const,
      path: "/",
    };

    response.cookie("accessToken", result.token, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });

    response.cookie("refreshToken", result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return response.status(200).json({ message: "TOKEN_REFRESHED" });
  }

  async getAuth(request: Request, response: Response): Promise<Response> {
    const result = await this.getAuthUserUseCase.execute({ id: request.auth!.userId });

    return response.status(200).json(result);
  }

  async adminResetPassword(request: Request, response: Response): Promise<Response> {
    const userId = String(request.params.userId);

    const result = await this.adminResetPasswordUseCase.execute({
      userId,
    });

    return response.status(200).json(result);
  }

  async updatePassword(request: Request, response: Response): Promise<Response> {
    const { email, currentPassword, newPassword } = request.body;

    await this.updatePasswordUseCase.execute({
      email,
      currentPassword,
      newPassword,
    });

    // Após atualizar a senha, faz login automaticamente
    const loginResult = await this.loginUseCase.execute({
      email,
      password: newPassword,
    });

    const isProd = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax" as const,
      path: "/",
    };

    response.cookie("accessToken", loginResult.token, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });

    response.cookie("refreshToken", loginResult.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return response.status(200).json(loginResult);
  }
}
