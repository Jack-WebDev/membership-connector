import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";

const dbRoot = path.resolve(import.meta.dirname, "..");

dotenv.config({
	path: path.resolve(dbRoot, "../../apps/server/.env"),
});

const tsxBin = path.resolve(
	dbRoot,
	`node_modules/.bin/tsx${process.platform === "win32" ? ".cmd" : ""}`,
);

const result = spawnSync(tsxBin, ["./src/seed/index.ts"], {
	cwd: dbRoot,
	stdio: "inherit",
	env: process.env,
});

process.exit(result.status ?? 1);
