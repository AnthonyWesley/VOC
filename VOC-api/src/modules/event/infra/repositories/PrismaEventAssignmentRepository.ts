import { PrismaClient } from "@prisma/client";
import {
  IEventAssignmentRepository,
  CreateEventAssignmentInput,
  EventAssignmentRecord,
} from "../../domain/repositories/IEventAssignmentRepository";

type EventAssignmentDb = Pick<PrismaClient, "eventAssignment">;

export class PrismaEventAssignmentRepository implements IEventAssignmentRepository {
  constructor(private readonly db: EventAssignmentDb) {}

  async create(input: CreateEventAssignmentInput): Promise<EventAssignmentRecord> {
    return this.db.eventAssignment.create({
      data: {
        eventId: input.eventId,
        memberId: input.memberId,
        ministryId: input.ministryId,
        assignedAt: new Date(),
      },
    });
  }

  async find(eventId: string, memberId: string, ministryId: string): Promise<EventAssignmentRecord | null> {
    return this.db.eventAssignment.findUnique({
      where: { eventId_memberId_ministryId: { eventId, memberId, ministryId } },
    });
  }
}
