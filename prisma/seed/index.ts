import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedSections } from "./sections.seed";
import { seedCalcDefs } from "./calc-defs.seed";
import { seedValidationRules } from "./validation-rules.seed";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter, log: ["error"] });

async function main() {
  console.log("Seeding database...");

  // Admin user
  const adminExists = await db.user.findUnique({ where: { email: "admin@corbstub.local" } });
  if (!adminExists) {
    const hash = await bcrypt.hash("changeme", 12);
    await db.user.create({
      data: { email: "admin@corbstub.local", name: "Admin", password: hash, role: "admin" },
    });
    console.log("  Created admin user: admin@corbstub.local / changeme");
  }

  console.log("\nSeeding section definitions...");
  await seedSections(db);

  console.log("\nSeeding calculation definitions...");
  await seedCalcDefs(db);

  console.log("\nSeeding validation rules...");
  await seedValidationRules(db);

  console.log("\nSeed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
