import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const TEST_DATABASE_URL = "postgresql://voc:voc_local@localhost:15432/voc_test?schema=public";

export default async function globalSetup() {
  if (!TEST_DATABASE_URL.includes("voc_test")) {
    throw new Error("Integration tests require the isolated voc_test database");
  }

  process.env.DATABASE_URL = TEST_DATABASE_URL;

  const prisma = new PrismaClient({ datasourceUrl: TEST_DATABASE_URL });

  try {
    // Drop and recreate schema for clean state
    await prisma.$executeRawUnsafe("DROP SCHEMA IF EXISTS public CASCADE");
    await prisma.$executeRawUnsafe("CREATE SCHEMA public");
    console.log("Schema public recreated");

    // Grant permissions
    await prisma.$executeRawUnsafe("GRANT ALL ON SCHEMA public TO voc");
    await prisma.$executeRawUnsafe("GRANT ALL ON ALL TABLES IN SCHEMA public TO voc");
  } finally {
    await prisma.$disconnect();
  }

  // Run migrations
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });

  console.log("Integration test database ready");
}
