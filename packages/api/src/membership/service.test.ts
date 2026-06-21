import { describe, expect, it } from "vitest";

import {
	findStartingTier,
	membershipMatchesBillingInterval,
	membershipMatchesPricing,
	membershipMatchesSearch,
} from "./eligibility";

function tier(
	overrides: Partial<Parameters<typeof findStartingTier>[0][number]>,
) {
	return {
		id: "tier-1",
		name: "Tier",
		description: null,
		price: "0.00",
		currency: "ZAR",
		billingInterval: "free" as const,
		benefits: [],
		requirements: [],
		sortOrder: 0,
		...overrides,
	};
}

describe("findStartingTier", () => {
	it("returns null when there are no active tiers", () => {
		expect(findStartingTier([])).toBeNull();
	});

	it("picks the cheapest tier by price", () => {
		const tiers = [
			tier({ id: "a", price: "390.00", billingInterval: "monthly" }),
			tier({ id: "b", price: "0.00", billingInterval: "free" }),
			tier({ id: "c", price: "150.00", billingInterval: "monthly" }),
		];

		expect(findStartingTier(tiers)).toEqual({
			price: "0.00",
			currency: "ZAR",
			billingInterval: "free",
		});
	});
});

describe("membershipMatchesPricing", () => {
	const freeTier = tier({ price: "0.00" });
	const paidTier = tier({ price: "199.00", billingInterval: "monthly" });

	it("matches everything when pricing filter is unset", () => {
		expect(membershipMatchesPricing([freeTier], undefined)).toBe(true);
		expect(membershipMatchesPricing([], undefined)).toBe(true);
	});

	it("requires a zero-price active tier for 'free'", () => {
		expect(membershipMatchesPricing([freeTier], "free")).toBe(true);
		expect(membershipMatchesPricing([paidTier], "free")).toBe(false);
	});

	it("requires a positive-price active tier for 'paid'", () => {
		expect(membershipMatchesPricing([paidTier], "paid")).toBe(true);
		expect(membershipMatchesPricing([freeTier], "paid")).toBe(false);
	});

	it("matches when at least one tier satisfies the filter", () => {
		expect(membershipMatchesPricing([freeTier, paidTier], "paid")).toBe(true);
		expect(membershipMatchesPricing([freeTier, paidTier], "free")).toBe(true);
	});
});

describe("membershipMatchesBillingInterval", () => {
	const monthlyTier = tier({ billingInterval: "monthly" });
	const yearlyTier = tier({ billingInterval: "yearly" });

	it("matches everything when no interval filter is set", () => {
		expect(membershipMatchesBillingInterval([monthlyTier], undefined)).toBe(
			true,
		);
	});

	it("requires a matching active tier", () => {
		expect(membershipMatchesBillingInterval([monthlyTier], "monthly")).toBe(
			true,
		);
		expect(membershipMatchesBillingInterval([monthlyTier], "yearly")).toBe(
			false,
		);
		expect(
			membershipMatchesBillingInterval([monthlyTier, yearlyTier], "yearly"),
		).toBe(true);
	});
});

describe("membershipMatchesSearch", () => {
	const membership = {
		name: "Startup Founder Circle",
		shortDescription: "Meet other business owners",
		description: "Full description text",
		category: "Business",
	};

	it("matches everything when search is empty", () => {
		expect(membershipMatchesSearch(membership, "LulaFi", undefined)).toBe(true);
		expect(membershipMatchesSearch(membership, "LulaFi", "  ")).toBe(true);
	});

	it("matches on membership name case-insensitively", () => {
		expect(membershipMatchesSearch(membership, "LulaFi", "founder")).toBe(true);
	});

	it("matches on organization name", () => {
		expect(
			membershipMatchesSearch(membership, "LulaFi Business Network", "lulafi"),
		).toBe(true);
	});

	it("matches on category", () => {
		expect(membershipMatchesSearch(membership, "LulaFi", "business")).toBe(
			true,
		);
	});

	it("returns false when nothing matches", () => {
		expect(membershipMatchesSearch(membership, "LulaFi", "wellness")).toBe(
			false,
		);
	});
});
