import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const sql = neon(
  "postgresql://neondb_owner:npg_5Z9YhRdDvSeg@ep-rough-flower-a8ap68mx-pooler.eastus2.azure.neon.tech/neondb?sslmode=require"
);
// const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });
