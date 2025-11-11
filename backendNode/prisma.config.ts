import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: "postgresql://postgres:prossima@db.uxkovlvicqkhokmckyqv.supabase.co:5432/postgres?pgbouncer=true&sslmode=require",
  },
});
