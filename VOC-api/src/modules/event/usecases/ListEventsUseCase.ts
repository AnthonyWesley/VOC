import { EventType } from "@prisma/client";
import { IEventRepository } from "../domain/repositories/IEventRepository";
import { listEventsInputSchema } from "../domain/validation/eventQuerySchemas";
import { decodeEventCursor, encodeEventCursor } from "../domain/utils/eventCursor";

export type ListEventsOutput = {
  id: string;
  title: string | null;
  type: EventType;
  startsAt: Date;
  endsAt: Date | null;
  preacherId: string | null;
  theme: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
  cancelledById: string | null;
  cancelReason: string | null;
  deletedAt: Date | null;
};

export type PaginatedEventsOutput = {
  data: ListEventsOutput[];
  nextCursor: string | null;
};

export class ListEventsUseCase {
  constructor(private readonly repo: IEventRepository) {}

  async execute(input: unknown): Promise<PaginatedEventsOutput> {
    const parsed = listEventsInputSchema.parse(input);

    const decodedCursor = parsed.cursor !== undefined ? decodeEventCursor(parsed.cursor) : undefined;

    const { events, nextCursor } = await this.repo.findAll({
      limit: parsed.limit,
      cursor: decodedCursor,
      type: parsed.type ?? null,
      month: parsed.month,
      year: parsed.year,
    });

    return {
      data: events.map((e) => ({
        id: e.id,
        title: e.title ?? null,
        type: e.type,
        startsAt: e.startsAt,
        endsAt: e.endsAt ?? null,
        preacherId: e.preacherId ?? null,
        theme: e.theme ?? null,
        notes: e.notes ?? null,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        cancelledAt: e.cancelledAt ?? null,
        cancelledById: e.cancelledById ?? null,
        cancelReason: e.cancelReason ?? null,
        deletedAt: e.deletedAt ?? null,
      })),
      nextCursor: nextCursor ? encodeEventCursor(nextCursor) : null,
    };
  }
}
