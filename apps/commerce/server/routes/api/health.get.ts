import type { components } from "@repo/commerce-contract";
import { sql } from "drizzle-orm";
import { defineHandler } from "nitro";

import { getDb } from "../../db/client";

type HealthStatus = components["schemas"]["HealthStatus"];

export default defineHandler(async (event): Promise<HealthStatus> => {
  let status: HealthStatus["status"] = "ok";
  try {
    await getDb().execute(sql`select 1`);
  } catch {
    status = "degraded";
    event.res.status = 503;
  }

  return {
    status,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  };
});
