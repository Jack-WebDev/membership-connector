"use client";

import {
	FilterBar,
	FilterBarReset,
} from "@membership-connector-app/ui/components/filter-bar";
import { SearchInput } from "@membership-connector-app/ui/components/search-input";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const STATUS_OPTIONS = [
	{ label: "Draft", value: "draft" },
	{ label: "Published", value: "published" },
	{ label: "Paused", value: "paused" },
	{ label: "Archived", value: "archived" },
];

const VISIBILITY_OPTIONS = [
	{ label: "Public", value: "public" },
	{ label: "Private", value: "private" },
	{ label: "Invite only", value: "invite_only" },
];

function MembershipFilters() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	function updateParam(key: string, value: string) {
		const params = new URLSearchParams(searchParams);

		if (value) {
			params.set(key, value);
		} else {
			params.delete(key);
		}
		params.delete("page");

		router.replace(
			(params.size > 0 ? `${pathname}?${params}` : pathname) as Route,
		);
	}

	return (
		<FilterBar
			filters={[
				{
					id: "status",
					label: "Status",
					placeholder: "All statuses",
					value: searchParams.get("status") ?? "",
					options: STATUS_OPTIONS,
					onValueChange: (value) => updateParam("status", value),
				},
				{
					id: "visibility",
					label: "Visibility",
					placeholder: "All visibilities",
					value: searchParams.get("visibility") ?? "",
					options: VISIBILITY_OPTIONS,
					onValueChange: (value) => updateParam("visibility", value),
				},
			]}
			trailing={
				<>
					<SearchInput
						placeholder="Search memberships"
						defaultValue={searchParams.get("search") ?? ""}
						onChange={(event) => updateParam("search", event.target.value)}
					/>
					<FilterBarReset onClick={() => router.replace(pathname as Route)} />
				</>
			}
		/>
	);
}

export { MembershipFilters };
