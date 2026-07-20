import "dotenv/config";
import { prisma } from "../src/package/prisma";

async function main() {
  const members = await prisma.member.findMany({
    where: { phone: { not: null } },
    select: { fullName: true, phone: true },
  });
  console.table(members);
  await prisma.$disconnect();
}

main();
