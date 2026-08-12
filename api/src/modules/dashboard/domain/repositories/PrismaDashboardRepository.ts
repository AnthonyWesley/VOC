import { PrismaClient, EventType } from "@prisma/client";
import { DashboardData, IDashboardRepository } from "./IDashboardRepository";

const INACTIVE_DAYS_THRESHOLD = 30;

export class PrismaDashboardRepository implements IDashboardRepository {
  constructor(private prisma: PrismaClient) {}

  async getDashboardData(): Promise<DashboardData> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thresholdDate = new Date(now.getTime() - INACTIVE_DAYS_THRESHOLD * 86_400_000);

    const eventTypes = Object.values(EventType);

    const [
      totalMembers,
      activeMembers,
      visitors,
      transferred,
      newMembersThisMonth,
      upcomingServices,
      lastService,
      financeIncome,
      financeExpense,
      recentPosts,
      ...inactiveByType
    ] = await Promise.all([
      // MEMBERS
      this.prisma.member.count(),
      this.prisma.member.count({ where: { status: "ACTIVE" } }),
      this.prisma.member.count({ where: { status: "VISITOR" } }),
      this.prisma.member.count({ where: { status: "TRANSFERRED" } }),
      this.prisma.member.count({
        where: { createdAt: { gte: startOfMonth } },
      }),

      // SERVICES
      this.prisma.event.findMany({
        where: {
          OR: [
            { endsAt: { gte: now } },
            { endsAt: null, startsAt: { gte: now } },
          ],
        },
        orderBy: { startsAt: "asc" },
        take: 5,
      }),

      this.prisma.event.findFirst({
        where: {
          OR: [
            { endsAt: { lt: now } },
            { endsAt: null, startsAt: { lt: now } },
          ],
        },
        orderBy: { startsAt: "desc" },
        include: { attendance: true },
      }),

      // FINANCE
      this.prisma.financialRecord.aggregate({
        where: {
          category: { type: "INCOME" },
          date: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),

      this.prisma.financialRecord.aggregate({
        where: {
          category: { type: "EXPENSE" },

          date: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),

      // POSTS
      this.prisma.post.findMany({
        where: { status: "PUBLISHED", deletedAt: null, publishedAt: { not: null } },
        include: {
          author: {
            select: {
              photoUrl: true,
              member: { select: { fullName: true } },
            },
          },
        },
        orderBy: { publishedAt: "desc" },
        take: 5,
      }),

      // INACTIVE MEMBERS BY EVENT TYPE
      ...eventTypes.map((type) =>
        this.prisma.member.findMany({
          where: {
            deletedAt: null,
            events: {
              some: { event: { type } },
            },
            NOT: {
              events: {
                some: {
                  event: {
                    type,
                    startsAt: { gte: thresholdDate },
                  },
                },
              },
            },
          },
          select: {
            id: true,
            fullName: true,
            phone: true,
            events: {
              where: { event: { type } },
              select: {
                joinedAt: true,
                event: { select: { startsAt: true } },
              },
              orderBy: { event: { startsAt: "desc" } },
              take: 1,
            },
          },
        }),
      ),
    ]);

    return {
      members: {
        total: totalMembers,
        active: activeMembers,
        visitors,
        transferred,
        newThisMonth: newMembersThisMonth,
      },

      events: {
        upcoming: upcomingServices,
        last: lastService,
      },

      finance: {
        incomeThisMonth: financeIncome._sum.amount?.toNumber() ?? 0,
        expenseThisMonth: financeExpense._sum.amount?.toNumber() ?? 0,
        balanceThisMonth:
          (financeIncome._sum.amount?.toNumber() ?? 0) -
          (financeExpense._sum.amount?.toNumber() ?? 0),
      },

      posts: recentPosts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        imageUrl: post.imageUrl,
        visibility: post.visibility,
        status: post.status,
        authorId: post.authorId,
        firstPublishedAt: post.firstPublishedAt,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        author: {
          fullName: post.author.member?.fullName ?? null,
          photoUrl: post.author?.photoUrl ?? null,
          roles: [],
        },
      })),

      inactiveMembers: Object.fromEntries(
        eventTypes.map((type, i) => [
          type,
          (inactiveByType[i] as any[]).map((m) => ({
            memberId: m.id,
            memberName: m.fullName,
            memberPhone: m.phone,
            lastEventDate: m.events[0]?.event.startsAt ?? new Date(0),
            daysSinceLastEvent: m.events[0]
              ? Math.floor(
                  (now.getTime() -
                    new Date(m.events[0].event.startsAt).getTime()) /
                    86_400_000,
                )
              : 999,
          })),
        ]),
      ),
    };
  }
}
