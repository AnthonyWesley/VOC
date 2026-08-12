import { MemberStatus } from "@prisma/client";
import {
  AvailableMembers,
  IMemberRepository,
} from "../domain/repositories/IMemberRepository";

/* ---------------- LIST MEMBERS ---------------- */

export type ListMembersInput = {
  limit: number;
  cursor?: string;
  search?: string;
  status?: MemberStatus;

  mode: "all" | "event" | "ministry" | "assignment";

  eventId?: string;
  ministryId?: string;
};

export type PaginatedMembersOutput = {
  data: AvailableMembers["members"];
  nextCursor: string | null;
};

export class ListMembersUseCase {
  constructor(private readonly memberRepository: IMemberRepository) {}

  async execute(input: ListMembersInput): Promise<PaginatedMembersOutput> {
    const { mode, eventId, ministryId, ...filters } = input;

    const strategies: Record<
      ListMembersInput["mode"],
      () => Promise<AvailableMembers>
    > = {
      all: () => this.memberRepository.findAllMembers(filters),

      event: () => {
        if (!eventId) throw new Error("eventId is required for mode=event");
        return this.memberRepository.findMembersAvailableForEvent(
          eventId,
          filters,
        );
      },

      ministry: () => {
        if (!ministryId)
          throw new Error("ministryId is required for mode=ministry");
        return this.memberRepository.findMembersAvailableForMinistry(
          ministryId,
          filters,
        );
      },

      assignment: () => {
        if (!eventId || !ministryId)
          throw new Error(
            "eventId and ministryId are required for mode=assignment",
          );
        return this.memberRepository.findMembersAvailableForAssignment(
          eventId,
          ministryId,
          filters,
        );
      },
    };

    // 🔥 Aqui o TS garante que sempre existe uma função válida
    const result = await strategies[mode]();

    return {
      data: result.members,
      nextCursor: result.nextCursor,
    };
  }
}
