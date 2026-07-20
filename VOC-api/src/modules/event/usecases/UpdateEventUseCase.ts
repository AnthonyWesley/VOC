import { IEventRepository } from "../domain/repositories/IEventRepository";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";

export type UpdateEventInput = {
  eventId: string;
  userId: string;
  userLevel: number;
  title?: string | null;
  preacherId?: string | null;
  theme?: string | null;
  notes?: string | null;
};

export class UpdateEventUseCase {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(input: UpdateEventInput): Promise<void> {
    const event = await this.eventRepository.findById(input.eventId);

    if (!event) {
      throw new NotFoundError("Event not found");
    }

    if (event.createdById !== input.userId && input.userLevel < 80) {
      throw new ForbiddenError("NOT_EVENT_OWNER", undefined, "Você não tem permissão para editar este evento");
    }

    event.update({
      title: input.title ?? undefined,
      preacherId: input.preacherId ?? undefined,
      theme: input.theme ?? undefined,
      notes: input.notes ?? undefined,
    });

    await this.eventRepository.save(event);
  }
}