import { prisma } from "../../../../package/prisma";
import { PrismaRefreshTokenRepository } from "../../../refreshToken/domain/repositories/PrismaRefreshTokenRepository";
import { PrismaRoleRepository } from "../../domain/repositories/PrismaRoleRepository";
import { PrismaUserRepository } from "../../domain/repositories/PrismaUserRepository";
import { ListRolesUseCase } from "../../usecases/role/ListRolesUseCase";
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
import { RemoveRoleUseCase } from "../../usecases/user/RemoveRoleUseCase";
import { UpdateUserUseCase } from "../../usecases/user/UpdateUserUseCase";
import { UpdatePasswordUseCase } from "../../usecases/user/UpdatePasswordUseCase";
import { AdminResetPasswordUseCase } from "../../usecases/user/AdminResetPasswordUseCase";
import { RoleController } from "../controllers/RoleController";
import { whatsAppService } from "../../../../infra/whatsapp/whatsappContainer";

import { UserController } from "../controllers/UserController";
import { BcryptHashProvider } from "../providers/BcryptHashProvider";
import { JwtProvider } from "../providers/JwtProvider";

const userRepository = new PrismaUserRepository(prisma);
const roleRepository = new PrismaRoleRepository(prisma);
const refreshTokenRepository = new PrismaRefreshTokenRepository(prisma);
const hashProvider = new BcryptHashProvider();
const jwtProvider = new JwtProvider();

const create = new CreateUserUseCase(userRepository, hashProvider, roleRepository);
const activate = new ActivateUserUseCase(userRepository);
const assignRole = new AssignRoleUseCase(userRepository, roleRepository);
const removeRole = new RemoveRoleUseCase(userRepository, roleRepository);
const deactivate = new DeactivateUserUseCase(userRepository);
const update = new UpdateUserUseCase(userRepository);
const list = new ListUsersUseCase(userRepository);
const get = new GetUserUseCase(userRepository);
const login = new LoginUseCase(
  userRepository,
  hashProvider,
  jwtProvider,
  refreshTokenRepository,
);
const logout = new LogoutUseCase(refreshTokenRepository, hashProvider);
const refresh = new RefreshTokenUseCase(
  refreshTokenRepository,
  userRepository,
  hashProvider,
  jwtProvider,
);
const getAuth = new GetAuthenticatedUser(userRepository);
const updatePassword = new UpdatePasswordUseCase(userRepository, hashProvider);
const adminResetPassword = new AdminResetPasswordUseCase(
  userRepository,
  hashProvider,
  whatsAppService,
);

const listRoles = new ListRolesUseCase(roleRepository);

export const userController = new UserController(
  create,
  assignRole,
  removeRole,
  activate,
  deactivate,
  update,
  list,
  get,
  login,
  refresh,
  logout,
  getAuth,
  updatePassword,
  adminResetPassword,
);

export const roleController = new RoleController(listRoles);
