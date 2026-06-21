import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import dotenv from "dotenv";
import pg from "pg";

const { Client } = pg;

const migrationsSchema = "drizzle";
const migrationsTable = "__drizzle_migrations";
const projectRoot = path.resolve(import.meta.dirname, "../../..");
const dbRoot = path.resolve(import.meta.dirname, "..");
const envPath = path.resolve(projectRoot, "apps/server/.env");
const migrationsDir = path.resolve(dbRoot, "src/migrations");
const journalPath = path.resolve(migrationsDir, "meta/_journal.json");
const invalidDownFileMarkers = [
	"Write the rollback SQL for this migration here.",
	"AUTO-GENERATION FAILED",
];

dotenv.config({ path: envPath, quiet: true });

function parseArgs(argv) {
	const parsed = {
		dryRun: false,
		help: false,
		steps: 1,
	};

	for (const arg of argv) {
		if (arg === "--") {
			continue;
		}

		if (arg === "--help" || arg === "-h") {
			parsed.help = true;
			continue;
		}

		if (arg === "--dry-run") {
			parsed.dryRun = true;
			continue;
		}

		if (arg.startsWith("--steps=")) {
			const value = Number.parseInt(arg.slice("--steps=".length), 10);
			if (!Number.isInteger(value) || value < 1) {
				throw new Error("`--steps` must be a positive integer.");
			}

			parsed.steps = value;
			continue;
		}

		throw new Error(`Unknown argument: ${arg}`);
	}

	return parsed;
}

function splitStatements(sql) {
	return sql
		.split("--> statement-breakpoint")
		.map((statement) => statement.trim())
		.filter(Boolean);
}

async function reseedMigrationSequence(client) {
	const sequenceNameResult = await client.query(
		`
			SELECT pg_get_serial_sequence($1, 'id') AS sequence_name
		`,
		[`"${migrationsSchema}"."${migrationsTable}"`],
	);

	const sequenceName = sequenceNameResult.rows[0]?.sequence_name;

	if (!sequenceName) {
		return null;
	}

	const maxIdResult = await client.query(
		`
			SELECT COALESCE(MAX(id), 0) AS max_id
			FROM "${migrationsSchema}"."${migrationsTable}"
		`,
	);

	const nextId = Number(maxIdResult.rows[0]?.max_id ?? 0) + 1;

	await client.query(
		`
			SELECT setval($1, $2, false)
		`,
		[sequenceName, nextId],
	);

	return nextId;
}

async function readRollbackPlan(steps) {
	const journal = JSON.parse(await fs.readFile(journalPath, "utf8"));
	const journalByWhen = new Map(
		journal.entries.map((entry) => [Number(entry.when), entry]),
	);

	const client = new Client({
		connectionString: process.env.DATABASE_URL,
	});

	await client.connect();

	try {
		const tableExistsQuery = `
			SELECT to_regclass($1) AS migration_table
		`;
		const tableName = `${migrationsSchema}.${migrationsTable}`;
		const tableExistsResult = await client.query(tableExistsQuery, [tableName]);

		if (!tableExistsResult.rows[0]?.migration_table) {
			return { client, plan: [] };
		}

		const query = `
			SELECT id, hash, created_at
			FROM "${migrationsSchema}"."${migrationsTable}"
			ORDER BY created_at DESC
			LIMIT $1
		`;
		const { rows } = await client.query(query, [steps]);

		if (rows.length === 0) {
			return { client, plan: [] };
		}

		const plan = [];

		for (const row of rows) {
			const createdAt = Number(row.created_at);
			const journalEntry = journalByWhen.get(createdAt);

			if (!journalEntry) {
				throw new Error(
					`Could not match applied migration timestamp ${createdAt} to packages/db/src/migrations/meta/_journal.json.`,
				);
			}

			const downFile = path.resolve(
				migrationsDir,
				`${journalEntry.tag}.down.sql`,
			);
			const downSql = await fs.readFile(downFile, "utf8").catch(() => {
				throw new Error(
					`Missing rollback file for ${journalEntry.tag}. Expected ${path.relative(projectRoot, downFile)}.`,
				);
			});

			for (const marker of invalidDownFileMarkers) {
				if (downSql.includes(marker)) {
					throw new Error(
						`Rollback file for ${journalEntry.tag} is not executable yet. Update ${path.relative(projectRoot, downFile)} before running rollback.`,
					);
				}
			}

			plan.push({
				id: Number(row.id),
				hash: row.hash,
				createdAt,
				tag: journalEntry.tag,
				downFile,
				statements: splitStatements(downSql),
			});
		}

		return { client, plan };
	} catch (error) {
		await client.end();
		throw error;
	}
}

async function run() {
	const { dryRun, help, steps } = parseArgs(process.argv.slice(2));

	if (help) {
		console.log("Usage: pnpm db:rollback -- --steps=1 [--dry-run]");
		console.log(
			"Each migration needs a matching packages/db/src/migrations/<tag>.down.sql file.",
		);
		return;
	}

	if (!process.env.DATABASE_URL) {
		throw new Error(
			`DATABASE_URL is not set. Expected it to be loaded from ${path.relative(projectRoot, envPath)}.`,
		);
	}

	const { client, plan } = await readRollbackPlan(steps);

	if (plan.length === 0) {
		console.log("No applied Drizzle migrations found to roll back.");
		return;
	}

	console.log(
		`${dryRun ? "Planned" : "Rolling back"} ${plan.length} migration${plan.length === 1 ? "" : "s"}:`,
	);

	for (const migration of plan) {
		console.log(
			`- ${migration.tag} (${path.relative(projectRoot, migration.downFile)})`,
		);
	}

	if (dryRun) {
		await client.end();
		return;
	}

	try {
		await client.query("BEGIN");

		for (const migration of plan) {
			for (const statement of migration.statements) {
				await client.query(statement);
			}

			await client.query(
				`
					DELETE FROM "${migrationsSchema}"."${migrationsTable}"
					WHERE id = $1 AND hash = $2 AND created_at = $3
				`,
				[migration.id, migration.hash, migration.createdAt],
			);
		}

		const nextMigrationId = await reseedMigrationSequence(client);

		await client.query("COMMIT");
		console.log(
			nextMigrationId
				? `Rollback complete. Next Drizzle migration row will use id ${nextMigrationId}.`
				: "Rollback complete.",
		);
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		await client.end();
	}
}

run().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
