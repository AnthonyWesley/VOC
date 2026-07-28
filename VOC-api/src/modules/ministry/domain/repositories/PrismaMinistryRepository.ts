import { PrismaClient } from "@prisma/client";
import { Ministry } from "../entities/Ministry";
import { IMinistryRepository, MemberMinistryRecord } from "./IMinistryRepository";
import { DetailedMinistryDTO } from "../../usecases/GetMinistryDetailedUseCase";
import { ListMinistriesOutput } from "../../usecases/ListMinistriesUseCase";

export class PrismaMinistryRepository implements IMinistryRepository {
  constructor(private prisma: PrismaClient) {}

  async findDetailedMinistry(id: string): Promise<DetailedMinistryDTO | null> {
    const data = await this.prisma.ministry.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            member: true,
          },
        },
      },
    });

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description ?? null,
      leaderId: data.leaderId ?? null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,

      members: data.members.map((m) => ({
        id: m.member.id,
        fullName: m.member.fullName,
        birthDate: m.member.birthDate,
        phone: m.member.phone,
        joinedAt: m.joinedAt,
        status: m.member.status,
      })),
    };
  }

  async findById(id: string): Promise<Ministry | null> {
    const data = await this.prisma.ministry.findUnique({
      where: { id },
    });

    if (!data) return null;

    return Ministry.rehydrate({
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async findAll(): Promise<Ministry[]> {
    const data = await this.prisma.ministry.findMany({
      orderBy: { createdAt: "desc" },
    });

    return data.map((data) =>
      Ministry.rehydrate({
        id: data.id,
        name: data.name,
        description: data.description,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }),
    );
  }

  async findAllWithDetails(): Promise<ListMinistriesOutput[]> {
    const ministries = await this.prisma.ministry.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { members: true } },
      },
    });

    return ministries.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      leaderId: m.leaderId ?? null,
      memberCount: m._count.members,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }

  async assignMember(ministryId: string, memberId: string): Promise<void> {
    await this.prisma.memberMinistry.create({
      data: { ministryId, memberId, joinedAt: new Date() },
    });
  }

  async removeMember(ministryId: string, memberId: string): Promise<void> {
    await this.prisma.memberMinistry.delete({
      where: {
        memberId_ministryId: {
          ministryId,
          memberId,
        },
      },
    });
  }

  async findMemberMinistry(ministryId: string, memberId: string): Promise<MemberMinistryRecord | null> {
    const data = await this.prisma.memberMinistry.findUnique({
      where: {
        memberId_ministryId: { ministryId, memberId },
      },
    });
    if (!data) return null;
    return {
      memberId: data.memberId,
      ministryId: data.ministryId,
      joinedAt: data.joinedAt,
    };
  }

  async save(ministry: Ministry): Promise<void> {
    await this.prisma.ministry.upsert({
      where: { id: ministry.id },
      update: {
        name: ministry.name,
        description: ministry.description,
      },
      create: {
        id: ministry.id,
        name: ministry.name,
        description: ministry.description,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.ministry.delete({ where: { id } });
  }
}
