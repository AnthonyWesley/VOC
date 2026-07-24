// identity/domain/repositories/IUserRepository.ts

import { EventType } from "@prisma/client";
import { DetailedEventDTO } from "../../usecases/GetEventDetailedUseCase";
import { Event } from "../entities/Event";
import { EventAttendance } from "../entities/EventAttendance";
import { FinancialRecord } from "../../../financialRecord/domain/entities/FinancialRecord";

export type MarkAsFinishedInput = {
  id: string;
  endsAt: Date;
};

export type MarkAsCancelledInput = {
  id: string;
  cancelledAt: Date;
  cancelledById: string;
  cancelReason: string;
};

export interface IEventRepository {
  findDetailedEvent(id: string): Promise<DetailedEventDTO | null>;
  findById(id: string): Promise<Event | null>;
  findAssignment(eventId: string, memberId: string, ministryId: string): Promise<{ id: string } | null>;
  findMemberAttendance(eventId: string, memberId: string): Promise<{ eventId: string; memberId: string } | null>;
  findAll(params: {
    limit: number;
    cursor?: string | null;
    type?: EventType | null;
    month?: number;
    year?: number;
  }): Promise<{
    events: Event[];
    nextCursor: string | null;
  }>;
  getMonthlyReport(params: {
    month: number;
    year: number;
    type?: EventType | null;
  }): Promise<{
    month: number;
    year: number;
    events: Array<{
      id: string;
      title: string | null;
      type: EventType;
      startsAt: Date;
      preacherName: string | null;
      membersCount: number;
      visitorsCount: number;
      assignmentsCount: number;
      attendanceMode: string;
    }>;
    summary: {
      totalEvents: number;
      totalMembers: number;
      totalVisitors: number;
      averageMembers: number;
    };
  }>;
  create(event: Event): Promise<void>;
  update(event: Event): Promise<void>;
  saveWithAttendanceAndFinancial(
    event: Event,
    attendance?: EventAttendance,
    financialRecords?: FinancialRecord[],
  ): Promise<void>;
  markAsFinishedIfScheduled(input: MarkAsFinishedInput): Promise<boolean>;
  markAsCancelledIfScheduled(input: MarkAsCancelledInput): Promise<boolean>;
  softDelete(id: string, deletedById: string, reason?: string): Promise<void>;
  assignAssignment(
    eventId: string,
    memberId: string,
    ministryId: string,
  ): Promise<void>;
  assignMember(eventId: string, memberId: string): Promise<void>;
  removeMember(eventId: string, memberId: string): Promise<void>;
  removeAssignment(assignmentId: string): Promise<void>;
}
