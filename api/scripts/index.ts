import "dotenv/config";
import { prisma } from "../src/package/prisma";
import seedAdmin from "./seed-admin";
import seedTestData from "./seed-test";

async function main() {
  const args = process.argv.slice(2);
  const isAdminSeed = args.includes("--admin");

  console.log("🌱 Seeding database...\n");

  try {
    if (isAdminSeed) {
      await seedAdmin();
    } else {
      await seedTestData();
    }

    console.log("\n✅ Seed completed successfully");
  } catch (error) {
    console.error("\n❌ Seed failed");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
