import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

const envPaths = [
  fileURLToPath(new URL("../.env.local", import.meta.url)),
  fileURLToPath(new URL("../.env", import.meta.url)),
];
for (const envPath of envPaths) {
  if (existsSync(envPath)) loadEnvFile(envPath);
}

const port = process.env.PORT ?? "3000";
const host = process.env.HOST ?? "127.0.0.1";
const vercelCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const child = spawn(
  vercelCommand,
  ["exec", "vercel", "dev", "-L", "--listen", `${host}:${port}`],
  {
    env: process.env,
    shell: process.platform === "win32",
    stdio: "inherit",
  },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", (error) => {
  console.error(`Unable to start Vercel CLI: ${error.message}`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exitCode = code ?? 1;
});
