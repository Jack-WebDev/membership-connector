import {
	FilterBar,
	FilterBarReset,
} from "@membership-connector-app/ui/components/filter-bar";
import { MembershipCard } from "@membership-connector-app/ui/components/membership-card";
import { SearchInput } from "@membership-connector-app/ui/components/search-input";
import { SectionHeader } from "@membership-connector-app/ui/components/section-header";

const memberships = [
	{
		name: "Startup Founder Circle",
		organizationName: "LulaFi Business Network",
		shortDescription:
			"Meet other business owners, get introductions, and join free monthly meetups.",
		category: "Business",
		startingPrice: "R0",
		billingInterval: "free to join",
		activeTiers: 3,
		status: "Published",
	},
	{
		name: "Small Business Growth Club",
		organizationName: "LulaFi Business Network",
		shortDescription:
			"Easy-to-follow workshops and a support group for growing your business.",
		category: "Business",
		startingPrice: "R290",
		billingInterval: "per month",
		activeTiers: 2,
		status: "Published",
	},
	{
		name: "Professional Design Guild",
		organizationName: "Creative Professionals Association",
		shortDescription:
			"Friendly feedback on your work, plus showcases and partner opportunities.",
		category: "Creative",
		startingPrice: "R450",
		billingInterval: "per month",
		activeTiers: 2,
		status: "Published",
	},
];

export default function MembershipsPage() {
	return (
		<div className="space-y-6">
			<SectionHeader
				eyebrow="Memberships"
				title="Find a membership that's right for you"
				description="Use the filters below to narrow things down, or search by name. There's no cost to browse."
			/>
			<FilterBar
				filters={[
					{
						id: "category",
						label: "Category",
						placeholder: "All categories",
						options: [
							{ label: "Business", value: "business" },
							{ label: "Creative", value: "creative" },
						],
					},
					{
						id: "price",
						label: "Price",
						placeholder: "Free and paid",
						options: [
							{ label: "Free", value: "free" },
							{ label: "Paid", value: "paid" },
						],
					},
				]}
				trailing={
					<>
						<SearchInput placeholder="Search memberships" />
						<FilterBarReset />
					</>
				}
			/>
			<p className="text-muted-foreground text-sm">
				Showing {memberships.length} memberships
			</p>
			<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
				{memberships.map((membership, index) => (
					<div
						key={membership.name}
						style={{ animationDelay: `${index * 80}ms` }}
						className="fade-in slide-in-from-bottom-4 h-full animate-in fill-mode-both duration-500"
					>
						<MembershipCard {...membership} />
					</div>
				))}
			</div>
		</div>
	);
}
