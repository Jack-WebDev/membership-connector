import type {
	ListPublicMembershipsInput,
	PublicMembershipSummary,
	PublicMembershipTierSummary,
} from "./types";

export type ActiveTier = {
	id: string;
	name: string;
	description: string | null;
	price: string;
	currency: string;
	billingInterval: PublicMembershipTierSummary["billingInterval"];
	benefits: unknown[];
	requirements: unknown[];
	sortOrder: number;
};

export function findStartingTier(
	tiers: ActiveTier[],
): PublicMembershipSummary["startingTier"] {
	if (tiers.length === 0) {
		return null;
	}

	const cheapest = tiers.reduce((current, tier) =>
		Number(tier.price) < Number(current.price) ? tier : current,
	);

	return {
		price: cheapest.price,
		currency: cheapest.currency,
		billingInterval: cheapest.billingInterval,
	};
}

export function membershipMatchesPricing(
	tiers: ActiveTier[],
	pricing: ListPublicMembershipsInput["pricing"],
): boolean {
	if (!pricing) {
		return true;
	}

	return tiers.some((tier) =>
		pricing === "free" ? Number(tier.price) === 0 : Number(tier.price) > 0,
	);
}

export function membershipMatchesBillingInterval(
	tiers: ActiveTier[],
	billingInterval: ListPublicMembershipsInput["billingInterval"],
): boolean {
	if (!billingInterval) {
		return true;
	}

	return tiers.some((tier) => tier.billingInterval === billingInterval);
}

export function membershipMatchesSearch(
	membership: {
		name: string;
		shortDescription: string | null;
		description: string | null;
		category: { name: string };
	},
	organizationName: string,
	search: string | undefined,
): boolean {
	if (!search?.trim()) {
		return true;
	}

	const haystack = [
		membership.name,
		membership.shortDescription,
		membership.description,
		membership.category.name,
		organizationName,
	]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();

	return haystack.includes(search.trim().toLowerCase());
}
