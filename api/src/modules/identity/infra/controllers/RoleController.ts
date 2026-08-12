import { Request, Response } from "express";
import { ListRolesUseCase } from "../../usecases/role/ListRolesUseCase";

export class RoleController {
  constructor(private readonly listRolesUseCase: ListRolesUseCase) {}

  async list(request: Request, response: Response): Promise<Response> {
    const result = await this.listRolesUseCase.execute();

    return response.status(200).json(result);
  }
}
