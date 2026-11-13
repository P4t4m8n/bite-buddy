import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma CLI only (migrations, seed). Hosted Postgres like Neon needs the direct,
    // unpooled address for migrations; the app itself uses the pooled DATABASE_URL.
    url: process.env.DIRECT_URL || env("DATABASE_URL"),
  },
});
