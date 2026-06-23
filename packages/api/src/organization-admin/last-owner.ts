type OwnerCheckRow = {
	id: string;
	role: string;
	status: string;
};

export function isLastActiveOwner(
	admins: OwnerCheckRow[],
	adminId: string,
): boolean {
	const target = admins.find((admin) => admin.id === adminId);

	if (target?.role !== "owner" || target.status !== "active") {
		return false;
	}

	const activeOwnerCount = admins.filter(
		(admin) => admin.role === "owner" && admin.status === "active",
	).length;

	return activeOwnerCount <= 1;
}
