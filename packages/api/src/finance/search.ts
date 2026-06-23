type FinanceTransactionSearchable = {
	providerReference: string | null;
	description: string | null;
	user: { name: string; email: string } | null;
};

export function financeTransactionMatchesSearch(
	row: FinanceTransactionSearchable,
	search: string | undefined,
): boolean {
	if (!search?.trim()) {
		return true;
	}

	const haystack = [
		row.providerReference,
		row.description,
		row.user?.name,
		row.user?.email,
	]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();

	return haystack.includes(search.trim().toLowerCase());
}
