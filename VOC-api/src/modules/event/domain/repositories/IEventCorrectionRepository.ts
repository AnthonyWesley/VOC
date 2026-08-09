export type EventCorrectionChanges = Record<string, { before: unknown; after: unknown }>;

export type CreateEventCorrectionInput = {
  eventId: string;
  correctedById: string;
  reason: string;
  changes: EventCorrectionChanges;
};

export interface IEventCorrectionRepository {
  create(input: CreateEventCorrectionInput): Promise<void>;
}