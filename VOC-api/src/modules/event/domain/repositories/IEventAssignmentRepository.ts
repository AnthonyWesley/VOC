export type EventAssignmentRecord = {
  id: string;
  eventId: string;
  memberId: string;
  ministryId: string;
  assignedAt: Date;
};

export type CreateEventAssignmentInput = {
  eventId: string;
  memberId: string;
  ministryId: string;
};

export interface IEventAssignmentRepository {
  create(input: CreateEventAssignmentInput): Promise<EventAssignmentRecord>;
  find(eventId: string, memberId: string, ministryId: string): Promise<EventAssignmentRecord | null>;
}
