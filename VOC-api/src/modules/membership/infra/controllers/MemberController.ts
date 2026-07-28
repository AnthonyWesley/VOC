import { Request, Response } from "express";

import { CreateMemberUseCase } from "../../usecases/CreateMemberUseCase";
import { UpdateMemberUseCase } from "../../usecases/UpdateMemberUseCase";
import { DeleteMemberUseCase } from "../../usecases/DeleteMemberUseCase";
import { ListMembersUseCase } from "../../usecases/ListMembersUseCase";
import { GetMemberDetailedUseCase } from "../../usecases/GetMemberDetailedUseCase";
import {
  registerMemberHttpSchema,
  completeProfileHttpSchema,
  createMemberHttpSchema,
  updateMemberHttpSchema,
  listMembersQuerySchema,
} from "../../domain/validation/memberSchemas";

export class MemberController {
  constructor(
    private readonly createMemberUseCase: CreateMemberUseCase,
    private readonly updateMemberUseCase: UpdateMemberUseCase,
    private readonly getDetailedMemberUseCase: GetMemberDetailedUseCase,
    private readonly listMembersUseCase: ListMembersUseCase,
    private readonly deleteMemberUseCase: DeleteMemberUseCase,
  ) {}

  async create(request: Request, response: Response): Promise<Response> {
    const body = createMemberHttpSchema.parse(request.body);

    const result = await this.createMemberUseCase.execute({
      fullName: body.fullName,
      nickname: body.nickname,
      birthDate: body.birthDate,
      phone: body.phone,
    });

    return response.status(result.created ? 201 : 200).json({ id: result.id });
  }

  async register(request: Request, response: Response): Promise<Response> {
    const body = registerMemberHttpSchema.parse(request.body);

    const result = await this.createMemberUseCase.execute({
      fullName: body.fullName,
      nickname: body.nickname,
      birthDate: body.birthDate,
      phone: body.phone,
      postcode: body.postcode,
      address: body.address,
      baptismDate: body.baptismDate,
      churchJoinDate: body.churchJoinDate,
    }, { isPublicRegistration: true });

    return response.status(result.created ? 201 : 200).json({ id: result.id });
  }

  async completeProfile(request: Request, response: Response): Promise<Response> {
    const body = completeProfileHttpSchema.parse(request.body);
    const userId = request.auth!.userId;

    const result = await this.createMemberUseCase.execute({
      fullName: body.fullName,
      nickname: body.nickname,
      birthDate: body.birthDate,
      phone: body.phone,
      postcode: body.postcode,
      address: body.address,
      churchJoinDate: new Date(),
      userId,
    }, { isPublicRegistration: true });

    return response.status(200).json({ id: result.id });
  }

  async update(request: Request, response: Response): Promise<Response> {
    const memberId = String(request.params.memberId);
    const body = updateMemberHttpSchema.parse(request.body);

    const result = await this.updateMemberUseCase.execute({
      memberId,
      fullName: body.fullName,
      nickname: body.nickname,
      birthDate: body.birthDate,
      phone: body.phone,
      postcode: body.postcode,
      address: body.address,
      baptismDate: body.baptismDate,
      churchJoinDate: body.churchJoinDate,
      status: body.status,
    });

    return response.status(200).json(result);
  }

  async get(request: Request, response: Response): Promise<Response> {
    const memberId = String(request.params.memberId);

    const result = await this.getDetailedMemberUseCase.execute({ memberId });
    if (!result) return response.status(404).json({ code: "MEMBER_NOT_FOUND", message: "Membro não encontrado" });
    return response.status(200).json(result);
  }

  async list(request: Request, response: Response): Promise<Response> {
    const query = listMembersQuerySchema.parse(request.query);

    const result = await this.listMembersUseCase.execute({
      limit: query.limit ?? 20,
      cursor: query.cursor,
      status: query.status,
      search: query.search,
      mode: query.mode,
      eventId: "eventId" in query ? query.eventId : undefined,
      ministryId: "ministryId" in query ? query.ministryId : undefined,
    });

    return response.status(200).json(result);
  }

  async delete(request: Request, response: Response): Promise<Response> {
    const memberId = String(request.params.memberId);

    await this.deleteMemberUseCase.execute({ memberId });

    return response.status(204).send();
  }
}
