import { PrismaClient } from "@prisma/client";
import { IMinistryMembershipRepository, MemberMinistryRecord } from "../../domain/repositories/IMinistryMembershipRepository";

type MemberMinistryDb = Pick<PrismaClient, "memberMinistry">;

export class PrismaMinistryMembershipRepository implements IMinistryMembershipRepository {
  constructor(private readonly db: MemberMinistryDb) {}

  async create(input: { memberId: string; ministryId: string }): Promise<MemberMinistryRecord> {
    const data = await this.db.memberMinistry.create({
      data: { memberId: input.memberId, ministryId: input.ministryId, joinedAt: new Date() },
    });
    return {
      memberId: data.memberId,
      ministryId: data.ministryId,
      joinedAt: data.joinedAt,
    };
  }

  async find(memberId: string, ministryId: string): Promise<MemberMinistryRecord | null> {
    const data = await this.db.memberMinistry.findUnique({
      where: { memberId_ministryId: { memberId, ministryId } },
    });
    if (!data) return null;
    return {
      memberId: data.memberId,
      ministryId: data.ministryId,
      joinedAt: data.joinedAt,
    };
  }

  async delete(memberId: string, ministryId: string): Promise<boolean> {
    try {
      await this.db.memberMinistry.delete({
        where: { memberId_ministryId: { memberId, ministryId } },
      });
      return true;
    } catch {
      return false;
    }
  }
}
