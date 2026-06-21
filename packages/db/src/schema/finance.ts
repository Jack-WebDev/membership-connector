import { relations, sql } from "drizzle-orm";
import {
	check,
	index,
	numeric,
	pgEnum,
	pgTable,
	text,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { memberships, membershipTiers } from "./membership";
import { organizations } from "./organization";
import { timestamps } from "./shared";

export const financeTransactionTypeEnum = pgEnum("finance_transaction_type", [
	"membership_payment",
	"refund",
	"adjustment",
	"payout",
	"fee",
]);

export const financeTransactionStatusEnum = pgEnum(
	"finance_transaction_status",
	["pending", "successful", "failed", "refunded", "cancelled"],
);

export const financeTransactionProviderEnum = pgEnum(
	"finance_transaction_provider",
	["manual", "cash", "eft", "demo"],
);

export const financeTransactions = pgTable(
	"finance_transactions",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id),
		membershipId: text("membership_id").references(() => memberships.id),
		membershipTierId: text("membership_tier_id").references(
			() => membershipTiers.id,
		),
		userId: text("user_id").references(() => user.id),
		type: financeTransactionTypeEnum("type").notNull(),
		status: financeTransactionStatusEnum("status").notNull().default("pending"),
		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
		currency: text("currency").notNull().default("ZAR"),
		provider: financeTransactionProviderEnum("provider").notNull(),
		providerReference: text("provider_reference"),
		description: text("description"),
		...timestamps,
	},
	(table) => [
		index("finance_transactions_organization_id_idx").on(table.organizationId),
		index("finance_transactions_status_idx").on(table.status),
		check(
			"finance_transactions_amount_non_negative_check",
			sql`${table.amount} >= 0`,
		),
	],
);

export const financeTransactionRelations = relations(
	financeTransactions,
	({ one }) => ({
		organization: one(organizations, {
			fields: [financeTransactions.organizationId],
			references: [organizations.id],
		}),
		membership: one(memberships, {
			fields: [financeTransactions.membershipId],
			references: [memberships.id],
		}),
		membershipTier: one(membershipTiers, {
			fields: [financeTransactions.membershipTierId],
			references: [membershipTiers.id],
		}),
		user: one(user, {
			fields: [financeTransactions.userId],
			references: [user.id],
		}),
	}),
);
