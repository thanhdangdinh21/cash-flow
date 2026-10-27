#!/usr/bin/env node
// Runs `next dev` in its own process group and SIGKILLs the whole group if it
// gets too big, so a runaway Turbopack compile can't freeze the machine.
//
//   pnpm --filter web dev:guarded
//   DEV_GUARD_MAX_MB=3072 pnpm --filter web dev:guarded
//
// Two tripwires, checked every 500ms:
//   - summed RSS of every process in the group  > DEV_GUARD_MAX_MB (default 4096)
//   - system swap grew by more than DEV_GUARD_MAX_SWAP_MB (default 2048) since
//     start — catches memory macOS has compressed/swapped out of RSS.

/* global process */

import { execFileSync, spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Local-only knobs for this launcher; not turbo task inputs.
/* eslint-disable turbo/no-undeclared-env-vars */
const MAX_MB = Number(process.env.DEV_GUARD_MAX_MB ?? 4096);
const MAX_SWAP_MB = Number(process.env.DEV_GUARD_MAX_SWAP_MB ?? 2048);
/* eslint-enable turbo/no-undeclared-env-vars */
const INTERVAL_MS = 500;
const REPORT_EVERY_MS = 15_000;

const webDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = join(webDir, "node_modules", ".bin", "next");

function swapUsedMb() {
  // "total = 2048.00M  used = 123.25M  free = ..."
  const out = execFileSync("sysctl", ["-n", "vm.swapusage"], { encoding: "utf8" });
  const m = out.match(/used = ([\d.]+)([MG])/);
  if (!m) return 0;
  return Number(m[1]) * (m[2] === "G" ? 1024 : 1);
}

function groupRssMb(pgid) {
  const out = execFileSync("ps", ["-axo", "pgid=,rss="], { encoding: "utf8" });
  let kb = 0;
  let count = 0;
  for (const line of out.split("\n")) {
    const [g, rss] = line.trim().split(/\s+/).map(Number);
    if (g === pgid) {
      kb += rss;
      count += 1;
    }
  }
  return { mb: kb / 1024, count };
}

const child = spawn(nextBin, ["dev", "--port", "3000"], {
  cwd: webDir,
  detached: true, // new process group: child.pid is the pgid
  stdio: "inherit",
});
const pgid = child.pid;
const swapBaseline = swapUsedMb();
let lastReport = 0;
let killed = false;

function killGroup(reason) {
  if (killed) return;
  killed = true;
  console.error(`\n[dev-guard] KILLING next dev (pgid ${pgid}): ${reason}`);
  try {
    process.kill(-pgid, "SIGKILL");
  } catch {
    // group already gone
  }
}

console.error(
  `[dev-guard] next dev pgid ${pgid}; limits: RSS ${MAX_MB} MB, swap growth ${MAX_SWAP_MB} MB (baseline ${swapBaseline.toFixed(0)} MB)`,
);

const timer = setInterval(() => {
  try {
    const { mb, count } = groupRssMb(pgid);
    const swapGrowth = swapUsedMb() - swapBaseline;
    if (mb > MAX_MB) return killGroup(`RSS ${mb.toFixed(0)} MB > ${MAX_MB} MB across ${count} processes`);
    if (swapGrowth > MAX_SWAP_MB)
      return killGroup(`swap grew ${swapGrowth.toFixed(0)} MB > ${MAX_SWAP_MB} MB`);
    const now = Date.now();
    if (now - lastReport >= REPORT_EVERY_MS) {
      lastReport = now;
      console.error(
        `[dev-guard] RSS ${mb.toFixed(0)} MB across ${count} processes, swap +${swapGrowth.toFixed(0)} MB`,
      );
    }
  } catch (err) {
    console.error("[dev-guard] probe failed:", err.message);
  }
}, INTERVAL_MS);

for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => {
    try {
      process.kill(-pgid, "SIGTERM");
    } catch {
      // already gone
    }
  });
}

child.on("exit", (code, signal) => {
  clearInterval(timer);
  console.error(`[dev-guard] next dev exited (${signal ?? code})`);
  process.exit(killed ? 137 : (code ?? 1));
});
