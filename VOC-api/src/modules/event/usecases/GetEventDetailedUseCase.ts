import { AttendanceMode } from "@prisma/client";
import { IEventRepository } from "../domain/repositories/IEventRepository";

export type DetailedEventInput = {
  eventId: string;
};

export type DetailedEventDTO = {
  id: string;
  title: string | null;
  type: string;
  startsAt: Date;
  endsAt: Date | null;
  attendanceMode: AttendanceMode;
  theme: string | null;
  notes: string | null;
  preacherId: string | null;

  preacher: {
    id: string;
    fullName: string;
    email?: string;
    photoUrl?: string;
  } | null;

  members: Array<{
    id: string;
    fullName: string;
    photoUrl?: string;
  }>;

  assignments: Array<{
    id: string;
    member: {
      id: string;
      fullName: string;
      photoUrl?: string;
    };
    ministry: {
      id: string;
      name: string;
    };
    description: string | null;
    assignedAt: Date;
  }>;

  attendance: {
    membersCount: number;
    visitorsCount: number;
  } | null;

  createdById: string | null;
  createdBy: { id: string; email: string; fullName: string | null; roleName: string | null } | null;
  deletedById: string | null;
  deletedAt: Date | null;
  deletedBy: { id: string; email: string } | null;
  deleteReason: string | null;

  createdAt: Date;
  updatedAt: Date;
};

export class GetEventDetailedUseCase {
  constructor(private readonly repo: IEventRepository) {}

  async execute(input: DetailedEventInput): Promise<DetailedEventDTO | null> {
    const event = await this.repo.findDetailedEvent(input.eventId);
    if (!event) return null;

    return {
      ...event,
    };
  }
}
