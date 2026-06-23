import { describe, expect, it } from "vitest";

import { financeTransactionMatchesSearch } from "./search";

function transaction(
	overrides: Partial<Parameters<typeof financeTransactionMatchesSearch>[0]>,
) {
	return {
		providerReference: "REF-001",
		description: "Monthly membership payment",
		user: { name: "Jane Doe", email: "jane@example.com" },
		...overrides,
	};
}

describe("financeTransactionMatchesSearch", () => {
	it("matches everything when search is empty", () => {
		expect(financeTransactionMatchesSearch(transaction({}), undefined)).toBe(
			true,
		);
		expect(financeTransactionMatchesSearch(transaction({}), "  ")).toBe(true);
	});

	it("matches on provider reference", () => {
		expect(financeTransactionMatchesSearch(transaction({}), "ref-001")).toBe(
			true,
		);
	});

	it("matches on description", () => {
		expect(financeTransactionMatchesSearch(transaction({}), "membership")).toBe(
			true,
		);
	});

	it("matches on member name", () => {
		expect(financeTransactionMatchesSearch(transaction({}), "jane")).toBe(true);
	});

	it("matches on member email", () => {
		expect(
			financeTransactionMatchesSearch(transaction({}), "jane@example.com"),
		).toBe(true);
	});

	it("handles a missing member gracefully", () => {
		expect(
			financeTransactionMatchesSearch(transaction({ user: null }), "jane"),
		).toBe(false);
	});

	it("returns false when nothing matches", () => {
		expect(financeTransactionMatchesSearch(transaction({}), "wellness")).toBe(
			false,
		);
	});
});
