// Thin wrapper around the Prisma CLI that loads `.env` with override:true.
// Prisma's own auto-load uses dotenv's default behavior (no override), so a
// stray DATABASE_URL exported in the user's shell would otherwise shadow
// the project's `.env` and produce a confusing schema/protocol mismatch.
import { config } from "dotenv";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

config({ override: true });

const prismaBin = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "node_modules",
  ".bin",
  "prisma",
);

const child = spawn(prismaBin, process.argv.slice(2), {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
