import { Request, Response } from "express";

import { CreateMemberUseCase } from "../../usecases/CreateMemberUseCase";
import { UpdateMemberUseCase } from "../../usecases/UpdateMemberUseCase";
import { DeleteMemberUseCase } from "../../usecases/DeleteMemberUseCase";
import { ListMembersUseCase } from "../../usecases/ListMembersUseCase";
import { GetMemberDetailedUseCase } from "../../usecases/GetMemberDetailedUseCase";
import { MemberStatus } from "@prisma/client";

export class MemberController {
  constructor(
    private readonly createMemberUseCase: CreateMemberUseCase,
    private readonly updateMemberUseCase: UpdateMemberUseCase,
    private readonly getDetailedMemberUseCase: GetMemberDetailedUseCase,
    private readonly listMembersUseCase: ListMembersUseCase,
    private readonly deleteMemberUseCase: DeleteMemberUseCase,
  ) {}

  async create(request: Request, response: Response): Promise<Response> {
    const { fullName, nickname, birthDate, phone } = request.body;

    const result = await this.createMemberUseCase.execute({
      fullName,
      nickname,
      birthDate: new Date(birthDate),
      phone,
    });

    return response.status(201).json(result);
  }

  async register(request: Request, response: Response): Promise<Response> {
    const { fullName, nickname, birthDate, phone, postcode, address, baptismDate, churchJoinDate } = request.body;

    const result = await this.createMemberUseCase.execute({
      fullName,
      nickname,
      birthDate: new Date(birthDate),
      phone,
      postcode,
      address,
      baptismDate: baptismDate ? new Date(baptismDate) : undefined,
      churchJoinDate: churchJoinDate ? new Date(churchJoinDate) : new Date(),
    });

    return response.status(201).json(result);
  }

  async completeProfile(request: Request, response: Response): Promise<Response> {
    const { fullName, nickname, birthDate, phone, postcode, address } = request.body;
    const userId = request.auth!.userId;

    const result = await this.createMemberUseCase.execute({
      fullName,
      nickname,
      birthDate: new Date(birthDate),
      phone,
      postcode,
      address,
      churchJoinDate: new Date(),
      userId,
    });

    return response.status(200).json(result);
  }

  async update(request: Request, response: Response): Promise<Response> {
    const memberId = String(request.params.memberId);

    const result = await this.updateMemberUseCase.execute({
      memberId,
      ...request.body,
    });

    return response.status(200).json(result);
  }

  async get(request: Request, response: Response): Promise<Response> {
    const memberId = String(request.params.memberId);

    const result = await this.getDetailedMemberUseCase.execute({ memberId });
    return response.status(200).json(result);
  }

  async list(request: Request, response: Response): Promise<Response> {
    const {
      limit = "20",
      cursor,
      status,
      search,
      mode,
      eventId,
      ministryId,
    } = request.query;

    if (!mode) {
      return response.status(400).json({
        error: "Missing mode. Expected: event | ministry | assignment",
      });
    }

    const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 200);

    const result = await this.listMembersUseCase.execute({
      limit: parsedLimit,
      cursor: cursor ? String(cursor) : undefined,
      status: status ? (status as MemberStatus) : undefined,
      search: search ? String(search) : undefined,

      mode: mode as "all" | "event" | "ministry" | "assignment",
      eventId: eventId ? String(eventId) : undefined,
      ministryId: ministryId ? String(ministryId) : undefined,
    });

    return response.status(200).json(result);
  }

  async delete(request: Request, response: Response): Promise<Response> {
    const memberId = String(request.params.memberId);

    await this.deleteMemberUseCase.execute({ memberId });

    return response.status(204).send();
  }
}