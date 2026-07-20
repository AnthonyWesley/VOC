// identity/infra/repositories/PrismaUserRepository.ts

import {
  AvailableMembers,
  BaseListFilters,
  IMemberRepository,
} from "./IMemberRepository";
import { Member } from "../entities/Member";
import { MemberStatus, Prisma, PrismaClient } from "@prisma/client";
import { DetailedMemberDTO } from "../../usecases/GetMemberDetailedUseCase";

export class PrismaMemberRepository implements IMemberRepository {
  constructor(private prisma: PrismaClient) {}

  async findDetailedMember(id: string): Promise<DetailedMemberDTO | null> {
    const data = await this.prisma.member.findUnique({
      where: { id },
      include: {
        ministries: {
          include: {
            ministry: true,
          },
        },
        events: {
          where: { event: { type: "HOUSE_SERVICE" } },
          take: 1,
        },
      },
    });

    if (!data) return null;

    return {
      id: data.id,
      fullName: data.fullName,
      nickname: data.nickname ?? null,
      birthDate: data.birthDate,
      phone: data.phone ?? null,
      postcode: data.postcode ?? null,
      address: data.address ?? null,
      baptismDate: data.baptismDate ?? null,
      churchJoinDate: data.churchJoinDate,
      status: data.status,
      userId: data.userId ?? null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
      hasHouseParticipation: data.events.length > 0,

      ministries: data.ministries.map((m) => ({
        id: m.ministry.id,
        name: m.ministry.name,
        description: m.ministry.description,
        joinedAt: m.joinedAt,
      })),
    };
  }

  async findById(id: string): Promise<Member | null> {
    const data = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!data) return null;

    return Member.rehydrate({
      id: data.id,
      fullName: data.fullName,
      normalizedFullName: data.normalizedFullName,
      nickname: data.nickname ?? null,
      normalizedNickname: data.normalizedNickname ?? null,
      birthDate: data.birthDate,
      phone: data.phone ?? null,
      postcode: data.postcode ?? null,
      normalizedPostcode: data.normalizedPostcode ?? null,
      address: data.address ?? null,
      baptismDate: data.baptismDate ?? null,
      churchJoinDate: data.churchJoinDate,
      status: data.status,
      userId: data.userId ?? null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
    });
  }

  async findByUniqueness(normalizedFullName: string, birthDate: Date): Promise<Member | null> {
    const data = await this.prisma.member.findFirst({
      where: {
        normalizedFullName,
        birthDate,
        deletedAt: null,
      },
    });

    if (!data) return null;

    return Member.rehydrate({
      id: data.id,
      fullName: data.fullName,
      normalizedFullName: data.normalizedFullName,
      nickname: data.nickname ?? null,
      normalizedNickname: data.normalizedNickname ?? null,
      birthDate: data.birthDate,
      phone: data.phone ?? null,
      postcode: data.postcode ?? null,
      normalizedPostcode: data.normalizedPostcode ?? null,
      address: data.address ?? null,
      baptismDate: data.baptismDate ?? null,
      churchJoinDate: data.churchJoinDate,
      status: data.status,
      userId: data.userId ?? null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
    });
  }

  async findAllMembers(params: BaseListFilters): Promise<AvailableMembers> {
    const { limit, cursor, search, status } = params;

    const where: Prisma.MemberWhereInput = { deletedAt: null };

    if (status) where.status = status;

    if (search) {
      where.normalizedFullName = {
        contains: search.toLowerCase(),
      };
    }

    const data = await this.prisma.member.findMany({
      where,
      include: {
        user: { select: { photoUrl: true } },
        events: { where: { event: { type: "HOUSE_SERVICE" } }, take: 1 },
      },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    let nextCursor: string | null = null;
    if (data.length > limit) {
      nextCursor = data.pop()!.id;
    }

    return {
      members: data.map((m) => ({
        id: m.id,
        fullName: m.fullName,
        photoUrl: m.user?.photoUrl ?? null,
        birthDate: m.birthDate,
        phone: m.phone,
        baptismDate: m.baptismDate,
        churchJoinDate: m.churchJoinDate,
        status: m.status,
        hasHouseParticipation: m.events.length > 0,
      })),
      nextCursor,
    };
  }

  async findMembersAvailableForEvent(
    eventId: string,
    params: BaseListFilters,
  ): Promise<AvailableMembers> {
    const { limit, cursor, search, status } = params;

    const where: Prisma.MemberWhereInput = {
      deletedAt: null,
      events: { none: { eventId } },
    };

    if (status) where.status = status;

    if (search) {
      where.normalizedFullName = {
        contains: search.toLowerCase(),
      };
    }

    const data = await this.prisma.member.findMany({
      where,
      include: {
        user: { select: { photoUrl: true } },
        events: { where: { event: { type: "HOUSE_SERVICE" } }, take: 1 },
      },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    let nextCursor: string | null = null;
    if (data.length > limit) {
      nextCursor = data.pop()!.id;
    }

    return {
      members: data.map((m) => ({
        id: m.id,
        fullName: m.fullName,
        photoUrl: m.user?.photoUrl ?? null,
        birthDate: m.birthDate,
        phone: m.phone,
        baptismDate: m.baptismDate,
        churchJoinDate: m.churchJoinDate,
        status: m.status,
        hasHouseParticipation: m.events.length > 0,
      })),
      nextCursor,
    };
  }

  async findMembersAvailableForMinistry(
    ministryId: string,
    params: BaseListFilters,
  ): Promise<AvailableMembers> {
    const { limit, cursor, search, status } = params;

    const where: Prisma.MemberWhereInput = {
      deletedAt: null,
      ministries: { none: { ministryId } },
    };

    if (status) where.status = status;

    if (search) {
      where.normalizedFullName = {
        contains: search.toLowerCase(),
      };
    }

    const data = await this.prisma.member.findMany({
      where,
      include: {
        user: { select: { photoUrl: true } },
        events: { where: { event: { type: "HOUSE_SERVICE" } }, take: 1 },
      },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    let nextCursor: string | null = null;
    if (data.length > limit) {
      nextCursor = data.pop()!.id;
    }

    return {
      members: data.map((m) => ({
        id: m.id,
        fullName: m.fullName,
        photoUrl: m.user?.photoUrl ?? null,
        birthDate: m.birthDate,
        phone: m.phone,
        baptismDate: m.baptismDate,
        churchJoinDate: m.churchJoinDate,
        status: m.status,
        hasHouseParticipation: m.events.length > 0,
      })),
      nextCursor,
    };
  }

  async findMembersAvailableForAssignment(
    eventId: string,
    ministryId: string,
    params: BaseListFilters,
  ): Promise<AvailableMembers> {
    const { limit, cursor, search, status } = params;

    const where: Prisma.MemberWhereInput = {
      deletedAt: null,
      ministries: { some: { ministryId } },
      assignments: {
        none: {
          eventId,
          ministryId,
        },
      },
    };

    if (status) where.status = status;

    if (search) {
      where.normalizedFullName = {
        contains: search.toLowerCase(),
      };
    }

    const data = await this.prisma.member.findMany({
      where,
      include: {
        user: { select: { photoUrl: true } },
        events: { where: { event: { type: "HOUSE_SERVICE" } }, take: 1 },
      },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    let nextCursor: string | null = null;
    if (data.length > limit) {
      nextCursor = data.pop()!.id;
    }

    return {
      members: data.map((m) => ({
        id: m.id,
        fullName: m.fullName,
        photoUrl: m.user?.photoUrl ?? null,
        birthDate: m.birthDate,
        phone: m.phone,
        baptismDate: m.baptismDate,
        churchJoinDate: m.churchJoinDate,
        status: m.status,
        hasHouseParticipation: m.events.length > 0,
      })),
      nextCursor,
    };
  }

  async save(member: Member): Promise<void> {
    await this.prisma.member.upsert({
      where: { id: member.id },
      update: {
        fullName: member.fullName,
        normalizedFullName: member.normalizedFullName,
        nickname: member.nickname,
        normalizedNickname: member.normalizedNickname,
        birthDate: member.birthDate,
        phone: member.phone,
        postcode: member.postcode,
        normalizedPostcode: member.normalizedPostcode,
        address: member.address,
        baptismDate: member.baptismDate,
        churchJoinDate: member.churchJoinDate,
        status: member.status,
        userId: member.userId,
        updatedAt: new Date(),
        deletedAt: member.deletedAt,
      },
      create: {
        id: member.id,
        fullName: member.fullName,
        normalizedFullName: member.normalizedFullName,
        nickname: member.nickname,
        normalizedNickname: member.normalizedNickname,
        birthDate: member.birthDate,
        phone: member.phone,
        postcode: member.postcode,
        normalizedPostcode: member.normalizedPostcode,
        address: member.address,
        baptismDate: member.baptismDate,
        churchJoinDate: member.churchJoinDate,
        status: member.status,
        userId: member.userId,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
        deletedAt: member.deletedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.member.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
