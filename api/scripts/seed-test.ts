import { prisma } from "../src/package/prisma";
import { generateId } from "../src/shared/utils/generateId";
import bcrypt from "bcrypt";

const PASSWORD_HASH = bcrypt.hashSync("123", 12);

const now = new Date();
const DAY = 86_400_000;

function daysAgo(n: number): Date {
  return new Date(now.getTime() - n * DAY);
}

function daysLater(n: number): Date {
  return new Date(now.getTime() + n * DAY);
}

export default async function seedTestData() {
  console.log("🧪 Iniciando seed de teste...\n");

  // ================================================================
  // LIMPEZA IDEMPOTENTE (ordem respeitando FK)
  // ================================================================
  console.log("→ Limpando dados existentes...");

  await prisma.eventCorrection.deleteMany();
  await prisma.eventAssignment.deleteMany();
  await prisma.eventAttendance.deleteMany();
  await prisma.eventMember.deleteMany();
  await prisma.memberRestoreLog.deleteMany();
  await prisma.ministryRestoreLog.deleteMany();
  await prisma.whatsAppInstance.deleteMany();
  await prisma.memberMinistry.deleteMany();
  await prisma.financialRecord.deleteMany({ where: { reversalOfId: { not: null } } });
  await prisma.financialRecord.deleteMany();
  await prisma.post.deleteMany();
  await prisma.event.deleteMany();
  await prisma.ministry.deleteMany();
  await prisma.member.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.role.deleteMany();
  await prisma.siteContentSettings.deleteMany();

  // ================================================================
  // ROLES
  // ================================================================
  console.log("→ Criando roles...");

  const rolesData = [
    {
      name: "PRESIDENT",
      level: 100,
      description: "Responsável legal e estatutário",
    },
    {
      name: "TREASURER",
      level: 80,
      description: "Gestão financeira e relatórios",
    },
    {
      name: "PASTOR",
      level: 60,
      description: "Pastoreio e gestão de ministérios",
    },
    {
      name: "HOUSE_LEADER",
      level: 50,
      description: "Gestão de células e grupos",
    },
    {
      name: "MINISTRY_LEADER",
      level: 40,
      description: "Liderança de ministérios específicos",
    },
    { name: "MEMBER", level: 10, description: "Usuário padrão/membro" },
  ];

  const roles: Record<string, string> = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: { id: generateId(), ...r },
    });
    roles[r.name] = role.id;
  }

  // ================================================================
  // USERS (cada um com role diferente)
  // ================================================================
  console.log("→ Criando usuários...");

  const usersData = [
    {
      email: "presidente@test.com",
      role: "PRESIDENT",
      name: "Carlos Presidente",
    },
    { email: "admin@test.com", role: "PRESIDENT", name: "Admin Sistema" },
    {
      email: "tesoureiro@test.com",
      role: "TREASURER",
      name: "João Tesoureiro",
    },
    { email: "pastor@test.com", role: "PASTOR", name: "Pastor Miguel" },
    { email: "lider@test.com", role: "MINISTRY_LEADER", name: "Ana Líder" },
    { email: "celula@test.com", role: "HOUSE_LEADER", name: "Pedro Célula" },
    { email: "membro@test.com", role: "MEMBER", name: "Maria Membro" },
  ];

  const users: Record<string, { id: string; memberId?: string }> = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: generateId(),
        email: u.email,
        passwordHash: PASSWORD_HASH,
        isActive: true,
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roles[u.role] } },
      update: {},
      create: { userId: user.id, roleId: roles[u.role] },
    });
    users[u.email] = { id: user.id };
  }

  // ================================================================
  // MEMBERS (cada usuário vira membro + extras sem user)
  // ================================================================
  console.log("→ Criando membros...");

  const membersData = [
    {
      email: "presidente@test.com",
      name: "Carlos Presidente",
      nickname: "Carlinhos",
      phone: "+5554992101557",
      status: "ACTIVE" as const,
      birthDate: daysAgo(15000),
      postcode: "SW1A 1AA",
      address: "10 Downing Street, London, SW1A 1AA",
    },
    {
      email: "admin@test.com",
      name: "Admin Sistema",
      nickname: null,
      phone: "+5554992101557",
      status: "ACTIVE" as const,
      birthDate: daysAgo(12000),
      postcode: "EC2R 8AH",
      address: "1 Bank Street, London, EC2R 8AH",
    },
    {
      email: "tesoureiro@test.com",
      name: "João Tesoureiro",
      nickname: "Jota",
      phone: "+5554992101557",
      status: "ACTIVE" as const,
      birthDate: daysAgo(14000),
      postcode: "M1 1AE",
      address: "25 Deansgate, Manchester, M1 1AE",
    },
    {
      email: "pastor@test.com",
      name: "Pastor Miguel",
      nickname: null,
      phone: "+5554992101557",
      status: "ACTIVE" as const,
      birthDate: daysAgo(18000),
      postcode: "B1 1BD",
      address: "100 Broad Street, Birmingham, B1 1BD",
    },
    {
      email: "lider@test.com",
      name: "Ana Líder",
      nickname: "Aninha",
      phone: "+5554992101557",
      status: "ACTIVE" as const,
      birthDate: daysAgo(10000),
      postcode: "LS1 2AB",
      address: "20 Briggate, Leeds, LS1 2AB",
    },
    {
      email: "celula@test.com",
      name: "Pedro Célula",
      nickname: null,
      phone: "+5554992101557",
      status: "ACTIVE" as const,
      birthDate: daysAgo(8000),
      postcode: "CF10 1AA",
      address: "5 St Mary Street, Cardiff, CF10 1AA",
    },
    {
      email: "membro@test.com",
      name: "Maria Membro",
      nickname: "Mary",
      phone: "+5554992101557",
      status: "ACTIVE" as const,
      birthDate: daysAgo(6000),
      postcode: "EH1 1YZ",
      address: "15 Princes Street, Edinburgh, EH1 1YZ",
    },
    // Membros sem vínculo com user
    {
      email: null,
      name: "Lucas Visitante",
      nickname: null,
      phone: "+5554992101557",
      status: "VISITOR" as const,
      birthDate: daysAgo(5000),
      postcode: "OX1 1AA",
      address: "30 High Street, Oxford, OX1 1AA",
    },
    {
      email: null,
      name: "Sofia Inativa",
      nickname: "Sofy",
      phone: "+5554992101557",
      status: "INACTIVE" as const,
      birthDate: daysAgo(9000),
      postcode: "CB1 1AA",
      address: "50 King Street, Cambridge, CB1 1AA",
    },
    {
      email: null,
      name: "Rafael Transferido",
      nickname: null,
      phone: "+5554992101557",
      status: "TRANSFERRED" as const,
      birthDate: daysAgo(11000),
      postcode: "NG1 1AA",
      address: "8 Market Street, Nottingham, NG1 1AA",
    },
    // Membro menor de 16 anos (phone não obrigatório)
    {
      email: null,
      name: "Gabriel Jovem",
      nickname: "Gabs",
      phone: null,
      status: "ACTIVE" as const,
      birthDate: daysAgo(2500),
      postcode: "BS1 1AA",
      address: "12 Park Street, Bristol, BS1 1AA",
    },
  ];

  const memberIds: string[] = [];
  for (const m of membersData) {
    const member = await prisma.member.create({
      data: {
        id: generateId(),
        fullName: m.name,
        normalizedFullName: m.name.toLowerCase(),
        nickname: m.nickname,
        normalizedNickname: m.nickname?.toLowerCase() ?? null,
        birthDate: m.birthDate,
        phone: m.phone,
        postcode: m.postcode ?? null,
        normalizedPostcode:
          m.postcode?.replace(/\s/g, "").toLowerCase() ?? null,
        address: m.address ?? null,
        baptismDate: daysAgo(2000),
        churchJoinDate: daysAgo(365),
        status: m.status,
        userId: m.email ? users[m.email].id : null,
      },
    });
    memberIds.push(member.id);
    if (m.email) {
      users[m.email].memberId = member.id;
    }
  }

  // ================================================================
  // MINISTRIES
  // ================================================================
  console.log("→ Criando ministérios...");

  const ministriesData = [
    {
      name: "Louvor",
      description: "Ministério de música e adoração",
      leaderEmail: "lider@test.com",
    },
    {
      name: "Intercessão",
      description: "Equipe de oração e intercessão",
      leaderEmail: "lider@test.com",
    },
    {
      name: "Recepção",
      description: "Acolhimento e recepção de visitantes",
      leaderEmail: "celula@test.com",
    },
    {
      name: "Mídia",
      description: "Som, projeção e transmissão",
      leaderEmail: null,
    },
    { name: "Infantil", description: "Ministério infantil", leaderEmail: null },
  ];

  const ministryIds: string[] = [];
  for (const m of ministriesData) {
    const ministry = await prisma.ministry.create({
      data: {
        id: generateId(),
        name: m.name,
        description: m.description,
        leaderId: m.leaderEmail ? users[m.leaderEmail].memberId! : null,
      },
    });
    ministryIds.push(ministry.id);
  }

  // ================================================================
  // MEMBER → MINISTRY (vincula membros ativos a ministérios)
  // ================================================================
  console.log("→ Vinculando membros a ministérios...");

  const activeMembers = memberIds.slice(0, 7);

  // Louvor → liderado por Ana, membros: Ana, Carlos, Admin, Pastor
  await prisma.memberMinistry.createMany({
    data: [
      { memberId: activeMembers[4], ministryId: ministryIds[0] }, // Ana Líder
      { memberId: activeMembers[0], ministryId: ministryIds[0] }, // Carlos Presidente
      { memberId: activeMembers[1], ministryId: ministryIds[0] }, // Admin
      { memberId: activeMembers[3], ministryId: ministryIds[0] }, // Pastor Miguel
    ],
  });

  // Intercessão → liderado por Ana, membros: Ana, Pastor
  await prisma.memberMinistry.createMany({
    data: [
      { memberId: activeMembers[4], ministryId: ministryIds[1] }, // Ana Líder
      { memberId: activeMembers[3], ministryId: ministryIds[1] }, // Pastor Miguel
    ],
  });

  // Recepção → liderado por Pedro, membros: Pedro, Maria
  await prisma.memberMinistry.createMany({
    data: [
      { memberId: activeMembers[5], ministryId: ministryIds[2] }, // Pedro Célula
      { memberId: activeMembers[6], ministryId: ministryIds[2] }, // Maria Membro
    ],
  });

  // Mídia → sem líder, membros: Carlos, Admin
  await prisma.memberMinistry.createMany({
    data: [
      { memberId: activeMembers[0], ministryId: ministryIds[3] }, // Carlos Presidente
      { memberId: activeMembers[1], ministryId: ministryIds[3] }, // Admin
    ],
  });

  // Infantil → sem líder, membros: Maria
  await prisma.memberMinistry.createMany({
    data: [
      { memberId: activeMembers[6], ministryId: ministryIds[4] }, // Maria Membro
    ],
  });

  // ================================================================
  // CATEGORIES (financeiras)
  // ================================================================
  console.log("→ Criando categorias financeiras...");

  const categoriesData = [
    { name: "Dízimo", type: "INCOME" as const },
    { name: "Oferta", type: "INCOME" as const },
    { name: "Doação", type: "INCOME" as const },
    { name: "Despesa", type: "EXPENSE" as const },
    { name: "Salário", type: "EXPENSE" as const },
  ];

  const categoryIds: Record<string, string> = {};
  const categoryTypes: Record<string, "INCOME" | "EXPENSE"> = {};
  for (const c of categoriesData) {
    const cat = await prisma.category.create({
      data: { id: generateId(), name: c.name, type: c.type },
    });
    categoryIds[c.name] = cat.id;
    categoryTypes[c.name] = c.type;
  }

  // ================================================================
  // EVENTS (todos os tipos)
  // ================================================================
  console.log("→ Criando eventos...");

  const preacherIds = [activeMembers[3], activeMembers[0], activeMembers[4]];

  const eventsData = [
    {
      title: "Culto de Domingo",
      type: "SUNDAY_SERVICE" as const,
      theme: "Fé e Propósito",
      preacherIdx: 0,
      daysFromNow: -3,
      creatorEmail: "presidente@test.com",
    },
    {
      title: "Encontro de Jovens",
      type: "YOUTH_NIGHT" as const,
      theme: "Identidade em Cristo",
      preacherIdx: 1,
      daysFromNow: -1,
      creatorEmail: "admin@test.com",
    },
    {
      title: "Estudo Bíblico",
      type: "BIBLE_STUDY" as const,
      theme: "Romanos 8",
      preacherIdx: 2,
      daysFromNow: 7,
      creatorEmail: "pastor@test.com",
    },
    {
      title: "Oração da Madrugada",
      type: "PRAYER_MEETING" as const,
      theme: "Intercessão",
      preacherIdx: 0,
      daysFromNow: 14,
      creatorEmail: "presidente@test.com",
    },
    {
      title: "Culto Especial de Natal",
      type: "SPECIAL_EVENT" as const,
      theme: "Jesus, a Luz do Mundo",
      preacherIdx: 1,
      daysFromNow: 30,
      creatorEmail: "admin@test.com",
    },
    {
      title: "Casa da Paz - Encontro",
      type: "HOUSE_SERVICE" as const,
      theme: "Comunhão",
      preacherIdx: null,
      daysFromNow: 5,
      creatorEmail: "lider@test.com",
    },
    // Evento deletado (soft delete)
    {
      title: "Culto Cancelado",
      type: "SUNDAY_SERVICE" as const,
      theme: "Cancelado",
      preacherIdx: null,
      daysFromNow: -10,
      creatorEmail: "admin@test.com",
      deleted: true,
    },
  ];

  interface CreatedEvent {
    id: string;
    title: string;
    type: string;
  }
  const createdEvents: CreatedEvent[] = [];

  for (const e of eventsData) {
    const event = await prisma.event.create({
      data: {
        id: generateId(),
        title: e.title,
        type: e.type,
        attendanceMode: "SUMMARY",
        startsAt: daysLater(e.daysFromNow),
        endsAt: daysLater(e.daysFromNow + 1),
        theme: e.theme,
        preacherId: e.preacherIdx !== null ? preacherIds[e.preacherIdx] : null,
        createdById: users[e.creatorEmail].id,
        ...(e.deleted
          ? {
              deletedAt: daysAgo(5),
              deletedById: users["admin@test.com"].id,
              deleteReason: "Evento teste para soft delete",
            }
          : {}),
      },
    });
    createdEvents.push({ id: event.id, title: event.title, type: event.type });
  }

  // ================================================================
  // EVENT ATTENDANCE
  // ================================================================
  console.log("→ Criando presenças...");

  for (const event of createdEvents) {
    if (event.title !== "Culto Cancelado") {
      await prisma.eventAttendance.create({
        data: {
          id: generateId(),
          eventId: event.id,
          membersCount: event.type === "YOUTH_NIGHT" ? 45 : 60,
          visitorsCount: event.type === "SPECIAL_EVENT" ? 25 : 8,
        },
      });
    }
  }

  // ================================================================
  // EVENT MEMBERS (membros presentes nos eventos)
  // ================================================================
  console.log("→ Vinculando membros a eventos...");

  for (let i = 0; i < createdEvents.length - 1; i++) {
    for (let j = 0; j < Math.min(activeMembers.length, 5); j++) {
      await prisma.eventMember.create({
        data: { eventId: createdEvents[i].id, memberId: activeMembers[j] },
      });
    }
  }

  // ================================================================
  // EVENT ASSIGNMENTS (escalas)
  // ================================================================
  console.log("→ Criando escalas de eventos...");

  for (let i = 0; i < Math.min(createdEvents.length - 1, 3); i++) {
    await prisma.eventAssignment.create({
      data: {
        id: generateId(),
        eventId: createdEvents[i].id,
        memberId: activeMembers[0],
        ministryId: ministryIds[0],
        description: "Louvor",
      },
    });
    await prisma.eventAssignment.create({
      data: {
        id: generateId(),
        eventId: createdEvents[i].id,
        memberId: activeMembers[2],
        ministryId: ministryIds[2],
        description: "Recepção",
      },
    });
  }

  // ================================================================
  // FINANCIAL RECORDS
  // ================================================================
  console.log("→ Criando registros financeiros...");

  const adminUser = users["admin@test.com"];
  const tesoureiroUser = users["tesoureiro@test.com"];

  const incomeCategories = ["Dízimo", "Oferta", "Doação"];

  // Registros de entrada (direction derivado da categoria)
  for (let i = 0; i < 5; i++) {
    const catName = incomeCategories[i % incomeCategories.length];
    await prisma.financialRecord.create({
      data: {
        id: generateId(),
        amount: [100, 250, 500, 50, 1000][i],
        method: ["CASH", "PIX", "CREDIT_CARD", "BANK_TRANSFER", "PIX"][i] as any,
        date: daysAgo(i * 7),
        direction: categoryTypes[catName],
        memberId: activeMembers[i % activeMembers.length],
        eventId: createdEvents[0].id,
        recordedById: tesoureiroUser.id,
        status: "ACTIVE",
        description: `${catName} - ${[100, 250, 500, 50, 1000][i]}`,
        categoryId: categoryIds[catName],
      },
    });
  }

  // Registro de despesa (direction derivado da categoria)
  await prisma.financialRecord.create({
    data: {
      id: generateId(),
      amount: 350,
      method: "BANK_TRANSFER",
      date: daysAgo(2),
      direction: categoryTypes["Despesa"],
      recordedById: tesoureiroUser.id,
      status: "ACTIVE",
      description: "Conta de luz",
      categoryId: categoryIds["Despesa"],
    },
  });

  // Cenário 1: Cancelamento (sem estorno)
  await prisma.financialRecord.create({
    data: {
      id: generateId(),
      amount: 30,
      method: "CASH",
      date: daysAgo(10),
      direction: categoryTypes["Oferta"],
      memberId: activeMembers[0],
      recordedById: tesoureiroUser.id,
      status: "CANCELLED",
      description: "Oferta duplicada - cancelada",
      categoryId: categoryIds["Oferta"],
      cancelledAt: daysAgo(8),
      cancelledById: adminUser.id,
      cancelReason: "Lançamento criado por engano",
    },
  });

  // Cenário 2: Estorno (original REVERSED + filho ACTIVE oposto)
  const reversedOriginal = await prisma.financialRecord.create({
    data: {
      id: generateId(),
      amount: 100,
      method: "PIX",
      date: daysAgo(8),
      direction: categoryTypes["Oferta"],
      memberId: activeMembers[2],
      eventId: createdEvents[0].id,
      recordedById: tesoureiroUser.id,
      status: "REVERSED",
      description: "Oferta duplicada",
      categoryId: categoryIds["Oferta"],
      reversedAt: daysAgo(8),
      reversedById: adminUser.id,
      reverseReason: "Registro duplicado",
    },
  });

  // Reversal compensatório (direção oposta, mesmos vínculos)
  await prisma.financialRecord.create({
    data: {
      id: generateId(),
      amount: reversedOriginal.amount,
      method: reversedOriginal.method,
      date: reversedOriginal.date,
      direction: "EXPENSE",
      status: "ACTIVE",
      memberId: reversedOriginal.memberId,
      eventId: reversedOriginal.eventId,
      recordedById: adminUser.id,
      description: `Estorno: ${reversedOriginal.description}`,
      categoryId: reversedOriginal.categoryId,
      reversalOfId: reversedOriginal.id,
    },
  });

  // ================================================================
  // POSTS
  // ================================================================
  console.log("→ Criando posts...");

  const publishedDate = daysAgo(5);
  const postsData = [
    {
      title: "Mensagem de Domingo",
      content: "A fé que move montanhas...",
      category: "SERMON" as const,
      visibility: "PUBLIC" as const,
      authorEmail: "pastor@test.com",
      status: "PUBLISHED" as const,
    },
    {
      title: "Aniversário da Igreja",
      content: "Programação especial...",
      category: "ANNOUNCEMENT" as const,
      visibility: "PUBLIC" as const,
      authorEmail: "admin@test.com",
      status: "PUBLISHED" as const,
    },
    {
      title: "Campanha de Natal",
      content: "Participe da nossa campanha...",
      category: "EVENT_NEWS" as const,
      visibility: "PUBLIC" as const,
      authorEmail: "presidente@test.com",
      status: "PUBLISHED" as const,
    },
    {
      title: "Devocional Diário",
      content: "Leia Salmos 23...",
      category: "DEVOTIONAL" as const,
      visibility: "INTERNAL" as const,
      authorEmail: "pastor@test.com",
      status: "PUBLISHED" as const,
    },
    {
      title: "Rascunho",
      content: "Post não publicado...",
      category: "ANNOUNCEMENT" as const,
      visibility: "INTERNAL" as const,
      authorEmail: "admin@test.com",
      status: "DRAFT" as const,
    },
  ];

  for (const p of postsData) {
    await prisma.post.create({
      data: {
        id: generateId(),
        title: p.title,
        content: p.content,
        category: p.category,
        visibility: p.visibility,
        status: p.status,
        firstPublishedAt: p.status === "PUBLISHED" ? publishedDate : null,
        publishedAt: p.status === "PUBLISHED" ? publishedDate : null,
        authorId: users[p.authorEmail].id,
      },
    });
  }

  // ================================================================
  // SITE CONTENT SETTINGS
  // ================================================================
  console.log("→ Criando configurações do site...");

  await prisma.siteContentSettings.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      churchName: "VOC Church Test",
      heroTitle: "VOC Church",
      heroSubtitle: "Uma comunidade de fé, amor e transformação.",
      aboutTitle: "Sobre Nós",
      footerText: "VOC Church Test - Todos os direitos reservados",
      contactPhone: "11900000000",
      contactEmail: "contato@voctest.com",
      instagramUrl: "https://instagram.com/voctest",
      youtubeUrl: "https://youtube.com/@voctest",
    },
  });

  // ================================================================
  // VALIDAÇÃO DE INTEGRIDADE
  // ================================================================
  console.log("→ Validando integridade dos dados...");

  const reversedWithoutChild = await prisma.financialRecord.count({
    where: {
      status: "REVERSED",
      id: { notIn: (await prisma.financialRecord.findMany({
        where: { reversalOfId: { not: null } },
        select: { reversalOfId: true },
      })).map(r => r.reversalOfId!).filter(Boolean) },
    },
  });
  if (reversedWithoutChild > 0) {
    throw new Error(
      "Seed created REVERSED record(s) without a reversal child",
    );
  }

  const cancelledWithChild = await prisma.financialRecord.count({
    where: {
      status: "CANCELLED",
      id: { in: (await prisma.financialRecord.findMany({
        where: { reversalOfId: { not: null } },
        select: { reversalOfId: true },
      })).map(r => r.reversalOfId!).filter(Boolean) },
    },
  });
  if (cancelledWithChild > 0) {
    throw new Error(
      "Seed created CANCELLED record(s) with a reversal child",
    );
  }

  // ================================================================
  // RESUMO
  // ================================================================
  console.log("\n📊 Resumo do seed de teste:");
  console.log(`   Roles: ${rolesData.length}`);
  console.log(`   Users: ${usersData.length}`);
  console.log(
    `   Members: ${membersData.length} (${membersData.filter((m) => m.status === "ACTIVE").length} ativos)`,
  );
  console.log(`   Ministries: ${ministriesData.length}`);
  console.log(`   Categories: ${categoriesData.length}`);
  console.log(`   Events: ${eventsData.length} (1 soft-deleted)`);
  console.log(`   Financial Records: 8 (1 cancelled + 1 reversal)`);
  console.log(`   Posts: ${postsData.length} (1 unpublished)`);
  console.log("\n🧪 Seed de teste concluído!");
}
