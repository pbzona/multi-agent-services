import { gateway } from "ai";

export const AGENT_TAGS = {
  customer: "multi-agent-services:customer-agent",
  admin: "multi-agent-services:admin-agent",
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export function parseDate(value, name) {
  if (!DATE_PATTERN.test(value)) {
    throw new Error(`${name} must use YYYY-MM-DD format.`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || formatDate(date) !== value) {
    throw new Error(`${name} is not a valid calendar date.`);
  }

  return value;
}

export function dateRange(args, now = new Date()) {
  const today = formatDate(now);
  const monthStart = `${today.slice(0, 7)}-01`;
  const startDate = parseDate(args[0] ?? monthStart, "Start date");
  const endDate = parseDate(args[1] ?? today, "End date");

  if (startDate > endDate) {
    throw new Error("Start date must be on or before end date.");
  }

  return { startDate, endDate };
}

function numberValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function integerValue(value) {
  return Math.trunc(numberValue(value));
}

function money(value) {
  return `$${numberValue(value).toFixed(6)}`;
}

export function rowsForAgents(results) {
  const rowsByTag = new Map(
    results
      .filter((row) => typeof row.tag === "string")
      .map((row) => [row.tag, row]),
  );

  return Object.entries(AGENT_TAGS).map(([agent, tag]) => {
    const row = rowsByTag.get(tag);
    return {
      agent,
      requests: integerValue(row?.requestCount),
      inputTokens: integerValue(row?.inputTokens),
      outputTokens: integerValue(row?.outputTokens),
      cachedInputTokens: integerValue(row?.cachedInputTokens),
      chargedUsd: money(row?.totalCost),
      marketUsd: money(row?.marketCost),
    };
  });
}

function printReport({ endDate, rows, startDate }) {
  console.log(`AI Gateway usage from ${startDate} through ${endDate} UTC`);
  console.table(rows);

  const totals = rows.reduce(
    (summary, row) => ({
      requests: summary.requests + row.requests,
      inputTokens: summary.inputTokens + row.inputTokens,
      outputTokens: summary.outputTokens + row.outputTokens,
      cachedInputTokens: summary.cachedInputTokens + row.cachedInputTokens,
      chargedUsd: summary.chargedUsd + Number(row.chargedUsd.slice(1)),
      marketUsd: summary.marketUsd + Number(row.marketUsd.slice(1)),
    }),
    {
      requests: 0,
      inputTokens: 0,
      outputTokens: 0,
      cachedInputTokens: 0,
      chargedUsd: 0,
      marketUsd: 0,
    },
  );

  console.log(
    `Total: ${totals.requests} requests, ${totals.inputTokens} input tokens, ` +
      `${totals.outputTokens} output tokens, ${money(totals.chargedUsd)} charged`,
  );
  console.log(
    "Reporting data can take several minutes to appear. The report query may incur a charge.",
  );
}

export async function main(args = process.argv.slice(2)) {
  if (process.env.AI_GATEWAY_API_KEY?.trim()) {
    throw new Error(
      "AI_GATEWAY_API_KEY is set. Remove it and use Vercel OIDC instead.",
    );
  }

  const { endDate, startDate } = dateRange(args);
  const report = await gateway.getSpendReport({
    startDate,
    endDate,
    groupBy: "tag",
    tags: Object.values(AGENT_TAGS),
  });

  printReport({ endDate, rows: rowsForAgents(report.results), startDate });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  main(args[0] === "--" ? args.slice(1) : args).catch((error) => {
    console.error(
      `Unable to load the AI Gateway report: ${error instanceof Error ? error.message : "unknown error"}`,
    );
    console.error(
      "Link the repository to Vercel, run `vercel env pull`, and confirm that the project can query Custom Reporting.",
    );
    process.exitCode = 1;
  });
}
