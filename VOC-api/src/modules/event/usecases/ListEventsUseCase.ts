import { EventType } from "@prisma/client";
import { IEventRepository } from "../domain/repositories/IEventRepository";

export type ListEventsOutput = {
  id: string;
  title?: string | null;
  type: EventType;
  startsAt: Date;
  endsAt?: Date | null;
  preacherId?: string | null;
  theme?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

export type ListEventsInput = {
  limit: number;
  cursor?: string | null;
  type?: EventType | null;
  month?: number; // 1-12
  year?: number;
};
export type PaginatedEventsOutput = {
  data: ListEventsOutput[];
  nextCursor: string | null;
};

export class ListEventsUseCase {
  constructor(private readonly repo: IEventRepository) {}

  async execute(input: ListEventsInput): Promise<PaginatedEventsOutput> {
    const { events, nextCursor } = await this.repo.findAll(input);

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
        deletedAt: e.deletedAt ?? null,
      })),
      nextCursor,
    };
  }
}
