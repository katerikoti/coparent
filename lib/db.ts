import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@/db/schema";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

export type DB = NeonHttpDatabase<typeof schema>;

let _db: DB | null = null;

export function getDb(): DB {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

export const db = new Proxy({} as DB, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});
