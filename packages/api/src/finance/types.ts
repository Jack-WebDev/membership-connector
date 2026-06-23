import { z } from "zod";

const financeTransactionTypeValues = [
	"membership_payment",
	"refund",
	"adjustment",
	"payout",
	"fee",
] as const;
export type FinanceTransactionType =
	(typeof financeTransactionTypeValues)[number];

const financeTransactionStatusValues = [
	"pending",
	"successful",
	"failed",
	"refunded",
	"cancelled",
] as const;
export type FinanceTransactionStatus =
	(typeof financeTransactionStatusValues)[number];

const financeTransactionProviderValues = [
	"manual",
	"cash",
	"eft",
	"demo",
] as const;
export type FinanceTransactionProvider =
	(typeof financeTransactionProviderValues)[number];

export {
	financeTransactionProviderValues,
	financeTransactionStatusValues,
	financeTransactionTypeValues,
};

export const transactionIdInput = z.object({
	transactionId: z.string().trim().min(1),
});
export type TransactionIdInput = z.infer<typeof transactionIdInput>;

export const financeMembershipIdInput = z.object({
	membershipId: z.string().trim().min(1),
});
export type FinanceMembershipIdInput = z.infer<typeof financeMembershipIdInput>;

export type FinanceTierOption = {
	id: string;
	name: string;
};

export type FinanceMemberOption = {
	userId: string;
	userName: string;
	tierName: string;
};

export const listAdminFinanceTransactionsInput = z.object({
	search: z.string().trim().max(160).optional(),
	status: z.enum(financeTransactionStatusValues).optional(),
	type: z.enum(financeTransactionTypeValues).optional(),
	provider: z.enum(financeTransactionProviderValues).optional(),
	membershipId: z.string().trim().min(1).optional(),
	membershipTierId: z.string().trim().min(1).optional(),
	dateFrom: z.coerce.date().optional(),
	dateTo: z.coerce.date().optional(),
	sortBy: z.enum(["createdAt", "amount"]).default("createdAt"),
	sortDir: z.enum(["asc", "desc"]).default("desc"),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListAdminFinanceTransactionsInput = z.infer<
	typeof listAdminFinanceTransactionsInput
>;

export const createFinanceTransactionInput = z.object({
	membershipId: z.string().trim().min(1),
	membershipTierId: z.string().trim().min(1).optional(),
	userId: z.string().trim().min(1).optional(),
	type: z.enum(financeTransactionTypeValues),
	status: z.enum(financeTransactionStatusValues).default("pending"),
	amount: z.coerce.number().min(0, "Amount cannot be negative"),
	currency: z.string().trim().min(1).max(10).default("ZAR"),
	provider: z.enum(financeTransactionProviderValues),
	providerReference: z.string().trim().max(200).optional(),
	description: z.string().trim().max(2000).optional(),
});
export type CreateFinanceTransactionInput = z.infer<
	typeof createFinanceTransactionInput
>;

export type AdminFinanceTransactionSummary = {
	id: string;
	type: FinanceTransactionType;
	status: FinanceTransactionStatus;
	provider: FinanceTransactionProvider;
	amount: string;
	currency: string;
	membershipId: string | null;
	membershipName: string | null;
	membershipTierId: string | null;
	tierName: string | null;
	userId: string | null;
	userName: string | null;
	userEmail: string | null;
	createdAt: Date;
};

export type AdminFinanceTransactionDetail = AdminFinanceTransactionSummary & {
	providerReference: string | null;
	description: string | null;
	updatedAt: Date;
};

export type FinanceRevenueByGroup = {
	id: string;
	name: string;
	amount: string;
};

export type FinanceDashboardOverview = {
	totalRevenue: string;
	monthlyRevenue: string;
	pendingAmount: string;
	failedAmount: string;
	currency: string;
	revenueByMembership: FinanceRevenueByGroup[];
	revenueByTier: FinanceRevenueByGroup[];
	recentTransactions: AdminFinanceTransactionSummary[];
};

export type FinanceFilterOptions = {
	memberships: { id: string; name: string }[];
	tiers: { id: string; membershipId: string; name: string }[];
};
