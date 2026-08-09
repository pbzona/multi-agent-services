import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.ts";

export type CommerceDatabase = PostgresJsDatabase<typeof schema>;

let client: ReturnType<typeof postgres> | undefined;
let database: CommerceDatabase | undefined;

function databaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error("DATABASE_URL is required to access commerce data.");
  }
  return value;
}

export function getDb(): CommerceDatabase {
  if (database) return database;

  client = postgres(databaseUrl(), {
    connect_timeout: 10,
    idle_timeout: 20,
    max: 5,
    prepare: false,
  });
  database = drizzle(client, { schema });
  return database;
}

export async function closeDb(): Promise<void> {
  await client?.end({ timeout: 5 });
  client = undefined;
  database = undefined;
}
