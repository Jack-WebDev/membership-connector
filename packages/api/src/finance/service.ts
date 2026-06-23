import { db } from "@membership-connector-app/db";
import { auditLogs } from "@membership-connector-app/db/schema/audit";
import { financeTransactions } from "@membership-connector-app/db/schema/finance";
import {
	membershipMembers,
	membershipTiers,
} from "@membership-connector-app/db/schema/membership";
import type { DbExecutor } from "@membership-connector-app/db/types";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

import { findOrganizationMembershipOrThrow } from "../membership/service";
import { listMemberFilterOptions } from "../membership-member/service";
import {
	createNotification,
	notifyOrganizationAdmins,
} from "../notification/service";
import { financeTransactionMatchesSearch } from "./search";
import type {
	AdminFinanceTransactionDetail,
	AdminFinanceTransactionSummary,
	CreateFinanceTransactionInput,
	FinanceDashboardOverview,
	FinanceFilterOptions,
	FinanceMemberOption,
	FinanceRevenueByGroup,
	FinanceTierOption,
	ListAdminFinanceTransactionsInput,
} from "./types";

const DEFAULT_CURRENCY = "ZAR";
const RECENT_TRANSACTIONS_LIMIT = 5;

function startOfCurrentMonth(): Date {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), 1);
}

function sumAmounts(rows: { amount: string }[]): string {
	return rows.reduce((sum, row) => sum + Number(row.amount), 0).toFixed(2);
}

type FinanceTransactionWithRelations = Awaited<
	ReturnType<typeof listOrganizationFinanceTransactions>
>[number];

async function listOrganizationFinanceTransactions(organizationId: string) {
	return db.query.financeTransactions.findMany({
		where: eq(financeTransactions.organizationId, organizationId),
		with: { membership: true, membershipTier: true, user: true },
	});
}

function toSummary(
	row: FinanceTransactionWithRelations,
): AdminFinanceTransactionSummary {
	return {
		id: row.id,
		type: row.type,
		status: row.status,
		provider: row.provider,
		amount: row.amount,
		currency: row.currency,
		membershipId: row.membershipId,
		membershipName: row.membership?.name ?? null,
		membershipTierId: row.membershipTierId,
		tierName: row.membershipTier?.name ?? null,
		userId: row.userId,
		userName: row.user?.name ?? null,
		userEmail: row.user?.email ?? null,
		createdAt: row.createdAt,
	};
}

export { financeTransactionMatchesSearch } from "./search";

function sumByGroup(
	rows: FinanceTransactionWithRelations[],
	groupBy: (row: FinanceTransactionWithRelations) => string | null,
	nameFor: (row: FinanceTransactionWithRelations) => string | null,
): FinanceRevenueByGroup[] {
	const totalsById = new Map<string, { name: string; total: number }>();

	for (const row of rows) {
		const id = groupBy(row);
		const name = nameFor(row);

		if (!id || !name) {
			continue;
		}

		const existing = totalsById.get(id);
		totalsById.set(id, {
			name,
			total: (existing?.total ?? 0) + Number(row.amount),
		});
	}

	return Array.from(totalsById.entries()).map(([id, { name, total }]) => ({
		id,
		name,
		amount: total.toFixed(2),
	}));
}

export async function getFinanceDashboardOverview(
	organizationId: string,
): Promise<FinanceDashboardOverview> {
	const rows = await listOrganizationFinanceTransactions(organizationId);

	const successfulMembershipPayments = rows.filter(
		(row) => row.status === "successful" && row.type === "membership_payment",
	);
	const monthStart = startOfCurrentMonth();

	const recentTransactions = [...rows]
		.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
		.slice(0, RECENT_TRANSACTIONS_LIMIT)
		.map(toSummary);

	return {
		totalRevenue: sumAmounts(successfulMembershipPayments),
		monthlyRevenue: sumAmounts(
			successfulMembershipPayments.filter((row) => row.createdAt >= monthStart),
		),
		pendingAmount: sumAmounts(rows.filter((row) => row.status === "pending")),
		failedAmount: sumAmounts(rows.filter((row) => row.status === "failed")),
		currency: DEFAULT_CURRENCY,
		revenueByMembership: sumByGroup(
			successfulMembershipPayments,
			(row) => row.membershipId,
			(row) => row.membership?.name ?? null,
		),
		revenueByTier: sumByGroup(
			successfulMembershipPayments,
			(row) => row.membershipTierId,
			(row) => row.membershipTier?.name ?? null,
		),
		recentTransactions,
	};
}

export async function listFinanceFilterOptions(
	organizationId: string,
): Promise<FinanceFilterOptions> {
	return listMemberFilterOptions(organizationId);
}

export async function listFinanceTierOptions(
	organizationId: string,
	membershipId: string,
): Promise<FinanceTierOption[]> {
	await findOrganizationMembershipOrThrow(db, organizationId, membershipId);

	const tiers = await db.query.membershipTiers.findMany({
		where: and(
			eq(membershipTiers.membershipId, membershipId),
			eq(membershipTiers.status, "active"),
		),
		orderBy: (table, { asc }) => asc(table.sortOrder),
	});

	return tiers.map((tier) => ({ id: tier.id, name: tier.name }));
}

export async function listFinanceMemberOptions(
	organizationId: string,
	membershipId: string,
): Promise<FinanceMemberOption[]> {
	await findOrganizationMembershipOrThrow(db, organizationId, membershipId);

	const members = await db.query.membershipMembers.findMany({
		where: and(
			eq(membershipMembers.membershipId, membershipId),
			eq(membershipMembers.organizationId, organizationId),
		),
		with: { user: true, membershipTier: true },
	});

	return members.map((member) => ({
		userId: member.userId,
		userName: member.user.name,
		tierName: member.membershipTier.name,
	}));
}

export async function listAdminFinanceTransactions(
	organizationId: string,
	input: ListAdminFinanceTransactionsInput,
): Promise<{ items: AdminFinanceTransactionSummary[]; total: number }> {
	const rows = await listOrganizationFinanceTransactions(organizationId);

	const filtered = rows
		.filter((row) => !input.status || row.status === input.status)
		.filter((row) => !input.type || row.type === input.type)
		.filter((row) => !input.provider || row.provider === input.provider)
		.filter(
			(row) => !input.membershipId || row.membershipId === input.membershipId,
		)
		.filter(
			(row) =>
				!input.membershipTierId ||
				row.membershipTierId === input.membershipTierId,
		)
		.filter((row) => !input.dateFrom || row.createdAt >= input.dateFrom)
		.filter((row) => !input.dateTo || row.createdAt <= input.dateTo)
		.filter((row) => financeTransactionMatchesSearch(row, input.search))
		.sort((a, b) => {
			const direction = input.sortDir === "asc" ? 1 : -1;

			if (input.sortBy === "amount") {
				return (Number(a.amount) - Number(b.amount)) * direction;
			}

			return (a.createdAt.getTime() - b.createdAt.getTime()) * direction;
		});

	const total = filtered.length;
	const start = (input.page - 1) * input.pageSize;
	const page = filtered.slice(start, start + input.pageSize);

	return {
		items: page.map(toSummary),
		total,
	};
}

export async function getFinanceTransactionDetail(
	organizationId: string,
	transactionId: string,
): Promise<AdminFinanceTransactionDetail> {
	const row = await db.query.financeTransactions.findFirst({
		where: and(
			eq(financeTransactions.id, transactionId),
			eq(financeTransactions.organizationId, organizationId),
		),
		with: { membership: true, membershipTier: true, user: true },
	});

	if (!row) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Finance transaction not found",
		});
	}

	return {
		...toSummary(row),
		providerReference: row.providerReference,
		description: row.description,
		updatedAt: row.updatedAt,
	};
}

async function findOrganizationTierOrThrow(
	executor: DbExecutor,
	membershipId: string,
	membershipTierId: string,
) {
	const tier = await executor.query.membershipTiers.findFirst({
		where: eq(membershipTiers.id, membershipTierId),
	});

	if (!tier || tier.membershipId !== membershipId) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Tier not found" });
	}

	return tier;
}

export async function createFinanceTransaction(
	organizationId: string,
	actorUserId: string,
	input: CreateFinanceTransactionInput,
): Promise<{ transactionId: string }> {
	const transactionId = crypto.randomUUID();

	await db.transaction(async (tx) => {
		const membership = await findOrganizationMembershipOrThrow(
			tx,
			organizationId,
			input.membershipId,
		);

		if (input.membershipTierId) {
			await findOrganizationTierOrThrow(
				tx,
				input.membershipId,
				input.membershipTierId,
			);
		}

		await tx.insert(financeTransactions).values({
			id: transactionId,
			organizationId,
			membershipId: input.membershipId,
			membershipTierId: input.membershipTierId ?? null,
			userId: input.userId ?? null,
			type: input.type,
			status: input.status,
			amount: input.amount.toFixed(2),
			currency: input.currency,
			provider: input.provider,
			providerReference: input.providerReference ?? null,
			description: input.description ?? null,
		});

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
			organizationId,
			actorUserId,
			action: "finance.created",
			entityType: "finance_transaction",
			entityId: transactionId,
			metadata: {
				type: input.type,
				status: input.status,
				amount: input.amount,
			},
		});

		await notifyOrganizationAdmins(tx, organizationId, "view_finances", {
			type: "finance.created",
			title: "Finance record created",
			body: `A ${input.type.replace("_", " ")} record of ${input.currency} ${input.amount.toFixed(2)} was recorded for ${membership.name}.`,
			data: { transactionId, membershipId: input.membershipId },
		});

		if (input.userId && input.status === "successful") {
			await createNotification(tx, {
				userId: input.userId,
				type: "finance.payment_successful",
				title: "Payment recorded as successful",
				body: `Your payment of ${input.currency} ${input.amount.toFixed(2)} for ${membership.name} was recorded as successful.`,
				data: { transactionId, membershipId: input.membershipId },
			});
		}

		if (input.userId && input.status === "failed") {
			await createNotification(tx, {
				userId: input.userId,
				type: "finance.payment_failed",
				title: "Payment recorded as failed",
				body: `Your payment of ${input.currency} ${input.amount.toFixed(2)} for ${membership.name} was recorded as failed.`,
				data: { transactionId, membershipId: input.membershipId },
			});
		}
	});

	return { transactionId };
}
