import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Neon's direct (unpooled) host is the pooled one without "-pooler".
const directFromPooled = (url: string | undefined) => url?.replace("-pooler.", ".");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma CLI only (migrations, seed). Migrations take a Postgres advisory lock, which
    // leaks through a pooled connection, so they must use the direct address. The app
    // itself uses the pooled DATABASE_URL. The Neon integration on Vercel names the direct
    // URL DATABASE_URL_UNPOOLED or POSTGRES_URL_NON_POOLING.
    url:
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL_UNPOOLED ||
      process.env.POSTGRES_URL_NON_POOLING ||
      directFromPooled(process.env.DATABASE_URL) ||
      env("DATABASE_URL"),
  },
});
