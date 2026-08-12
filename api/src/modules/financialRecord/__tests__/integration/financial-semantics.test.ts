import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { PrismaFinancialRecordRepository } from "../../domain/repositories/PrismaFinancialRecordRepository";
import { INTEGRATION_DATABASE_URL, cleanIntegrationDatabase, seedTestCategories, seedTestUser, seedFinancialRecord } from "../../../../__tests__/helpers";

describe("Semântica financeira — PostgreSQL", () => {
  let prisma: PrismaClient;
  let repo: PrismaFinancialRecordRepository;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: INTEGRATION_DATABASE_URL });
    repo = new PrismaFinancialRecordRepository(prisma);
    await seedTestCategories(prisma);
    await seedTestUser(prisma);
  });

  beforeEach(async () => { await prisma.financialRecord.deleteMany(); });
  afterAll(async () => { await cleanIntegrationDatabase(prisma); await prisma.$disconnect(); });

  async function totals() {
    const records = await repo.findAll();
    let income = new Decimal(0);
    let expense = new Decimal(0);
    for (const r of records) {
      if (r.direction === "INCOME") income = income.add(r.amount);
      else expense = expense.add(r.amount);
    }
    return { income, expense, balance: income.sub(expense) };
  }

  it("receita 200 + despesa 100 = saldo 100", async () => {
    await seedFinancialRecord(prisma, { id: "fi-1", amount: 200, direction: "INCOME" });
    await seedFinancialRecord(prisma, { id: "fi-2", amount: 100, direction: "EXPENSE", categoryId: "cat-expense-1" });
    const t = await totals();
    expect(t.income.equals(200)).toBe(true);
    expect(t.expense.equals(100)).toBe(true);
    expect(t.balance.equals(100)).toBe(true);
  });

  it("receita 200 estornada = saldo ZERO", async () => {
    const o = await seedFinancialRecord(prisma, { id: "fi-est-1", amount: 200, direction: "INCOME" });
    await prisma.financialRecord.update({ where: { id: o.id }, data: { status: "REVERSED", reversedAt: new Date(), reversedById: "u-1", reverseReason: "Estorno" } });
    await seedFinancialRecord(prisma, { id: "fi-est-rev", amount: 200, direction: "EXPENSE", reversalOfId: o.id });
    const t = await totals();
    expect(t.balance.equals(0)).toBe(true);
  });

  it("despesa 100 cancelada = não conta", async () => {
    await seedFinancialRecord(prisma, { id: "fi-canc-1", amount: 100, direction: "EXPENSE", categoryId: "cat-expense-1", status: "CANCELLED", cancelledAt: new Date(), cancelledById: "u-1", cancelReason: "T" });
    const t = await totals();
    expect(t.balance.equals(0)).toBe(true);
  });

  it("REVERSED aparece na listagem", async () => {
    await seedFinancialRecord(prisma, { id: "fi-rev-list", status: "REVERSED" });
    expect((await repo.findAll()).find(r => r.id === "fi-rev-list")).toBeDefined();
  });

  it("reversal ACTIVE aparece na listagem", async () => {
    await seedFinancialRecord(prisma, { id: "fi-orig" });
    await seedFinancialRecord(prisma, { id: "fi-child", direction: "EXPENSE", reversalOfId: "fi-orig", categoryId: "cat-expense-1" });
    expect((await repo.findAll()).find(r => r.id === "fi-child")).toBeDefined();
  });

  it("CANCELLED não aparece na listagem", async () => {
    await seedFinancialRecord(prisma, { id: "fi-canc-list", status: "CANCELLED", cancelledAt: new Date(), cancelledById: "u-1", cancelReason: "T" });
    expect((await repo.findAll()).find(r => r.id === "fi-canc-list")).toBeUndefined();
  });
});
