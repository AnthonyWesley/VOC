import { Prisma } from "@prisma/client";
import { IEventRepository } from "../domain/repositories/IEventRepository";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { ISocketServer } from "../../../infra/socket/ISocketServer";
import { CreateNotificationUseCase } from "../../notification/usecases/CreateNotificationUseCase";
import { PrismaClient } from "@prisma/client";

export type AssignMemberToEventInput = {
  eventId: string;
  memberId: string;
  ministryId?: string;
  userId: string;
  userLevel: number;
};

export type AssignMemberToEventOutput = { id: string; alreadyAssigned?: boolean; alreadyPresent?: boolean };

export class AssignMemberToEventUseCase {
  constructor(
    private readonly repo: IEventRepository,
    private readonly prisma: PrismaClient,
    private readonly socketServer?: ISocketServer,
    private readonly createNotification?: CreateNotificationUseCase,
  ) {}

  async execute(input: AssignMemberToEventInput): Promise<AssignMemberToEventOutput> {
    const { eventId, memberId, ministryId, userId, userLevel } = input;
    if (!eventId) throw new ValidationError("MISSING_EVENT_ID");
    if (!memberId) throw new ValidationError("MISSING_MEMBER_ID");

    if (ministryId) {
      const [ministry, user] = await Promise.all([
        this.prisma.ministry.findUnique({ where: { id: ministryId }, select: { leaderId: true } }),
        this.prisma.user.findUnique({ where: { id: userId }, include: { member: { select: { id: true } } } }),
      ]);

      const isLeader = user?.member?.id && user.member.id === ministry?.leaderId;
      if (!isLeader && userLevel < 80) {
        throw new ForbiddenError("NOT_MINISTRY_LEADER", undefined, "Você não é líder deste ministério");
      }

      try {
        await this.repo.assignAssignment(eventId, memberId, ministryId);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const existing = await this.repo.findAssignment(eventId, memberId, ministryId);
          if (existing) return { id: memberId, alreadyAssigned: true };
        }
        throw error;
      }

      await this._notifyMemberAssigned(eventId, memberId, ministryId);
    } else {
      try {
        await this.repo.assignMember(eventId, memberId);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const existing = await this.repo.findMemberAttendance(eventId, memberId);
          if (existing) return { id: memberId, alreadyPresent: true };
        }
        throw error;
      }
    }

    return { id: memberId };
  }

  private async _notifyMemberAssigned(eventId: string, memberId: string, ministryId: string) {
    const [event, member, ministry] = await Promise.all([
      this.prisma.event.findUnique({ where: { id: eventId }, select: { title: true, type: true, startsAt: true } }),
      this.prisma.member.findUnique({ where: { id: memberId }, select: { fullName: true, userId: true, phone: true } }),
      this.prisma.ministry.findUnique({ where: { id: ministryId }, select: { name: true } }),
    ]);
    if (!event || !member || !ministry) return;

    if (member.userId) {
      await this.createNotification?.execute({
        userId: member.userId, type: "MEMBRO_ESCALADO",
        title: "Você foi escalado!",
        message: `Você foi escalado para ${ministry.name} no evento ${event.title ?? event.type} em ${event.startsAt.toLocaleDateString("pt-BR")}.`,
        payload: { eventId, ministryId, ministryName: ministry.name, eventTitle: event.title, eventDate: event.startsAt.toISOString() },
      });
      this.socketServer?.emitToUser(member.userId, "notification", { type: "MEMBRO_ESCALADO", eventId });
    }
  }
}
