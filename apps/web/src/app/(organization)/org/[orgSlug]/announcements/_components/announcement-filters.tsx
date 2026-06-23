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
	{ label: "Archived", value: "archived" },
];

const VISIBILITY_OPTIONS = [
	{ label: "Public", value: "public" },
	{ label: "Members only", value: "members_only" },
	{ label: "Tier specific", value: "tier_specific" },
	{ label: "Admins only", value: "admins_only" },
];

const PINNED_OPTIONS = [
	{ label: "Pinned", value: "true" },
	{ label: "Not pinned", value: "false" },
];

type AnnouncementFiltersProps = {
	memberships: { id: string; name: string }[];
};

function AnnouncementFilters({ memberships }: AnnouncementFiltersProps) {
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
				{
					id: "membershipId",
					label: "Membership",
					placeholder: "All memberships",
					value: searchParams.get("membershipId") ?? "",
					options: memberships.map((membership) => ({
						label: membership.name,
						value: membership.id,
					})),
					onValueChange: (value) => updateParam("membershipId", value),
				},
				{
					id: "pinned",
					label: "Pinned",
					placeholder: "All announcements",
					value: searchParams.get("pinned") ?? "",
					options: PINNED_OPTIONS,
					onValueChange: (value) => updateParam("pinned", value),
				},
			]}
			trailing={
				<>
					<SearchInput
						placeholder="Search title or body"
						defaultValue={searchParams.get("search") ?? ""}
						onChange={(event) => updateParam("search", event.target.value)}
					/>
					<FilterBarReset onClick={() => router.replace(pathname as Route)} />
				</>
			}
		/>
	);
}

export { AnnouncementFilters };
