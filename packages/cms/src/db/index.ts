import { _bundleExt, neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

console.log(Bun.env.DATABASE_URL);
const sql = neon(Bun.env.DATABASE_URL);
export const db = drizzle(sql);
