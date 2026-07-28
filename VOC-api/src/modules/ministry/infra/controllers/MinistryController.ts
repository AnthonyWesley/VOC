import { Request, Response } from "express";

import { CreateMinistryUseCase } from "../../usecases/CreateMinistryUseCase";
import { UpdateMinistryUseCase } from "../../usecases/UpdateMinistryUseCase";
import { DeleteMinistryUseCase } from "../../usecases/DeleteMinistryUseCase";
import { AssignMemberToMinistryUseCase } from "../../usecases/AssignMemberToMinistryUseCase";
import { RemoveMemberFromMinistryUseCase } from "../../usecases/RemoveMemberFromMinistryUseCase";
import { ListMinistriesUseCase } from "../../usecases/ListMinistriesUseCase";
import { GetMinistryDetailedUseCase } from "../../usecases/GetMinistryDetailedUseCase";
import {
  ministryParamsSchema,
  ministryMemberBodySchema,
  createMinistryHttpSchema,
  updateMinistryHttpSchema,
} from "../../domain/validation/ministrySchemas";

export class MinistryController {
  constructor(
    private readonly createMinistryUseCase: CreateMinistryUseCase,
    private readonly updateMinistryUseCase: UpdateMinistryUseCase,
    private readonly deleteMinistryUseCase: DeleteMinistryUseCase,
    private readonly assignMemberToMinistryUseCase: AssignMemberToMinistryUseCase,
    private readonly removeMemberFromMinistryUseCase: RemoveMemberFromMinistryUseCase,
    private readonly getDetailedMinistryUseCase: GetMinistryDetailedUseCase,
    private readonly listMinistriesUseCase: ListMinistriesUseCase,
  ) {}

  async create(request: Request, response: Response): Promise<Response> {
    const body = createMinistryHttpSchema.parse(request.body);

    const result = await this.createMinistryUseCase.execute(body);

    return response.status(201).json(result);
  }

  async update(request: Request, response: Response): Promise<Response> {
    const { ministryId } = ministryParamsSchema.parse(request.params);
    const body = updateMinistryHttpSchema.parse(request.body);

    const result = await this.updateMinistryUseCase.execute({
      ministryId,
      ...body,
    });

    return response.status(200).json(result);
  }

  async assignMember(request: Request, response: Response): Promise<Response> {
    const { ministryId } = ministryParamsSchema.parse(request.params);
    const { memberId } = ministryMemberBodySchema.parse(request.body);

    const result = await this.assignMemberToMinistryUseCase.execute({
      ministryId,
      memberId,
      userId: request.auth!.userId,
      userLevel: request.auth!.userLevel ?? 0,
    });

    return response.status(200).json(result);
  }

  async removeMember(request: Request, response: Response): Promise<Response> {
    const { ministryId } = ministryParamsSchema.parse(request.params);
    const { memberId } = ministryMemberBodySchema.parse(request.body);

    const result = await this.removeMemberFromMinistryUseCase.execute({
      ministryId,
      memberId,
      userId: request.auth!.userId,
      userLevel: request.auth!.userLevel ?? 0,
    });

    return response.status(200).json(result);
  }

  async get(request: Request, response: Response): Promise<Response> {
    const { ministryId } = ministryParamsSchema.parse(request.params);

    const result = await this.getDetailedMinistryUseCase.execute({
      ministryId,
    });

    if (!result) {
      return response.status(404).json({ code: "MINISTRY_NOT_FOUND", message: "Ministério não encontrado" });
    }

    return response.status(200).json(result);
  }
  async list(request: Request, response: Response): Promise<Response> {
    const result = await this.listMinistriesUseCase.execute();

    return response.status(200).json(result);
  }

  async delete(request: Request, response: Response): Promise<Response> {
    const { ministryId } = ministryParamsSchema.parse(request.params);

    await this.deleteMinistryUseCase.execute({ ministryId });

    return response.status(204).send();
  }
}
