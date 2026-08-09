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

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("Usage: node scripts/run-with-env.mjs <command> [...args]");
  process.exit(1);
}

const child = spawn(command, args, {
  env: process.env,
  shell: process.platform === "win32",
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", (error) => {
  console.error(`Unable to start ${command}: ${error.message}`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exitCode = code ?? 1;
});
