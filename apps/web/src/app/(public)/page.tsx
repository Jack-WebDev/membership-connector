import { Button } from "@membership-connector-app/ui/components/button";
import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { MembershipCard } from "@membership-connector-app/ui/components/membership-card";
import { OrganizationCard } from "@membership-connector-app/ui/components/organization-card";
import { PageHeader } from "@membership-connector-app/ui/components/page-header";
import { SearchInput } from "@membership-connector-app/ui/components/search-input";
import { SectionHeader } from "@membership-connector-app/ui/components/section-header";
import Link from "next/link";

import {
	toMembershipCardProps,
	toOrganizationCardProps,
} from "@/lib/membership-presenters";
import { serverTrpc } from "@/utils/trpc-server";

const FEATURED_COUNT = 2;

const steps = [
	{
		number: "1",
		title: "Browse memberships",
		description:
			"Look through clubs and groups near you. No account needed to look around.",
	},
	{
		number: "2",
		title: "Pick the one you like",
		description:
			"Read what each membership offers and choose the one that suits you.",
	},
	{
		number: "3",
		title: "Sign up in minutes",
		description:
			"Create a free account and join. We'll guide you through every step.",
	},
];

export default async function HomePage() {
	const [memberships, organizations] = await Promise.all([
		serverTrpc.membership.listPublic.query({ sort: "newest" }),
		serverTrpc.organization.listPublic.query({}),
	]);

	const featuredMemberships = memberships.items.slice(0, FEATURED_COUNT);
	const featuredOrganizations = organizations.items.slice(0, FEATURED_COUNT);

	return (
		<div className="space-y-14 pb-10">
			<PageHeader
				align="center"
				eyebrow="Welcome"
				title="Find a club or group you'll love"
				description="Search thousands of clubs and community groups, or browse by category. Joining takes just a few minutes — no computer experience needed."
				actions={
					<form
						action="/memberships"
						method="GET"
						className="flex w-full max-w-xl flex-col items-center gap-3 sm:flex-row"
					>
						<SearchInput
							name="search"
							placeholder="Search by club name, e.g. 'gardening' or 'bowls'"
							className="w-full sm:flex-1"
							aria-label="Search memberships"
						/>
						<Button type="submit" size="lg" className="w-full sm:w-auto">
							Browse all memberships
						</Button>
					</form>
				}
			/>

			<section className="fade-in slide-in-from-bottom-4 animate-in space-y-6 fill-mode-both delay-100 duration-700">
				<SectionHeader
					eyebrow="How it works"
					title="Joining takes just three simple steps"
					description="No forms to print, no offices to visit. Everything happens right here."
				/>
				<div className="grid gap-6 sm:grid-cols-3">
					{steps.map((step, index) => (
						<div
							key={step.number}
							style={{ animationDelay: `${150 + index * 100}ms` }}
							className="fade-in slide-in-from-bottom-4 flex animate-in flex-col gap-3 rounded-[calc(var(--radius)*1.2)] border border-border/80 bg-card/90 fill-mode-both p-6 text-center shadow-[var(--shadow-card)] duration-700 sm:text-left"
						>
							<div className="font-(family-name:--font-display) mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl sm:mx-0">
								{step.number}
							</div>
							<h3 className="font-(family-name:--font-display) text-2xl text-foreground">
								{step.title}
							</h3>
							<p className="text-base text-muted-foreground leading-7">
								{step.description}
							</p>
						</div>
					))}
				</div>
			</section>

			<section className="fade-in slide-in-from-bottom-4 animate-in space-y-6 fill-mode-both delay-150 duration-700">
				<SectionHeader
					eyebrow="Featured groups"
					title="Communities you can join today"
					description="A few of the groups already welcoming new members."
				/>
				{featuredOrganizations.length > 0 ? (
					<div className="grid gap-6 md:grid-cols-2">
						{featuredOrganizations.map((organization) => (
							<OrganizationCard
								key={organization.id}
								{...toOrganizationCardProps(organization, {
									href: `/organizations/${organization.slug}`,
								})}
							/>
						))}
					</div>
				) : (
					<EmptyState
						title="No groups yet"
						description="Organizations will appear here once they publish a membership."
					/>
				)}
				<div className="flex justify-center">
					<Link href="/organizations">
						<Button size="lg" variant="outline">
							See all groups
						</Button>
					</Link>
				</div>
			</section>

			<section className="fade-in slide-in-from-bottom-4 animate-in space-y-6 fill-mode-both delay-200 duration-700">
				<SectionHeader
					eyebrow="Get started"
					title="A few memberships to get you started"
					description="Each one shows the price and what's included before you join."
				/>
				{featuredMemberships.length > 0 ? (
					<div className="grid gap-6 lg:grid-cols-2">
						{featuredMemberships.map((membership) => (
							<MembershipCard
								key={membership.id}
								{...toMembershipCardProps(membership, {
									href: `/organizations/${membership.organizationSlug}/memberships/${membership.slug}`,
								})}
							/>
						))}
					</div>
				) : (
					<EmptyState
						title="No memberships yet"
						description="Published memberships will show up here as soon as they're live."
					/>
				)}
				<div className="flex justify-center">
					<Link href="/memberships">
						<Button size="lg" variant="outline">
							See all memberships
						</Button>
					</Link>
				</div>
			</section>
		</div>
	);
}
