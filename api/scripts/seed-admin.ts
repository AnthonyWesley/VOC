import { ulid } from "ulid";
import bcrypt from "bcrypt";
import { prisma } from "../src/package/prisma";
import { generateId } from "../src/shared/utils/generateId";

export default async function seedAdmin() {
  await prisma.role.upsert({
    where: { name: "PRESIDENT" },
    update: {},
    create: {
      id: generateId(),
      name: "PRESIDENT",
      level: 100,
      description: "Responsável legal e estatutário",
    },
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL environment variable is required for seeding");
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD environment variable is required for seeding");
  }
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // Cria ou atualiza usuário admin
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      id: ulid(),
      email: adminEmail,
      passwordHash,
      isActive: true,
      roles: {
        create: [{ role: { connect: { name: "PRESIDENT" } } }],
      },
    },
  });

  // Cria ou atualiza membro associado ao admin
  const now = new Date();
  await prisma.member.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      id: ulid(),
      fullName: "Anthony Wesley Nunes",
      normalizedFullName: "anthony wesley nunes",
      birthDate: new Date("1990-12-26"), // você pode ajustar para data real
      phone: "54992101557",
      churchJoinDate: now,
      status: "ACTIVE",
      userId: adminUser.id,
      createdAt: now,
      updatedAt: now,
    },
  });

  // Cria post inicial
  await prisma.post.create({
    data: {
      id: ulid(),
      category: "ANNOUNCEMENT",
      title: "Bem-vindo",
      content: "Estamos felizes de ter você aqui!",
      authorId: adminUser.id,
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log("Admin user created:", adminUser.email);
}
