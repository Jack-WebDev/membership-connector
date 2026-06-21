import { Button } from "@membership-connector-app/ui/components/button";
import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { MembershipCard } from "@membership-connector-app/ui/components/membership-card";
import { OrganizationCard } from "@membership-connector-app/ui/components/organization-card";
import { PageHeader } from "@membership-connector-app/ui/components/page-header";
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

	const featuredMemberships = memberships.slice(0, FEATURED_COUNT);
	const featuredOrganizations = organizations.slice(0, FEATURED_COUNT);

	return (
		<div className="space-y-14 pb-10">
			<PageHeader
				align="center"
				eyebrow="Welcome"
				title="Find a club or group you'll love, and join in a few clicks."
				description="Membership Connector helps you discover trusted clubs, associations, and communities near you — and sign up without any fuss. No tech experience needed."
				actions={
					<>
						<Link href="/memberships">
							<Button size="lg">Browse memberships</Button>
						</Link>
						<Link href="/auth/login">
							<Button size="lg" variant="outline">
								Already a member? Log in
							</Button>
						</Link>
					</>
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
			</section>

			<section className="fade-in slide-in-from-bottom-4 animate-in space-y-6 fill-mode-both delay-200 duration-700">
				<SectionHeader
					eyebrow="Memberships"
					title="Popular memberships to get you started"
					description="Each membership shows you the price and what's included before you join."
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
			</section>

			<section className="fade-in slide-in-from-bottom-4 animate-in rounded-[calc(var(--radius)*1.25)] border border-border/80 bg-card/90 fill-mode-both p-8 text-center shadow-[var(--shadow-soft)] delay-300 duration-700 sm:p-10">
				<h2 className="font-(family-name:--font-display) text-3xl text-foreground">
					Not sure where to start? We're happy to help.
				</h2>
				<p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground leading-7">
					Browse at your own pace, or create a free account now — you can always
					ask for help once you're signed in.
				</p>
				<div className="mt-6 flex flex-wrap items-center justify-center gap-3">
					<Link href="/auth/register">
						<Button size="lg">Create a free account</Button>
					</Link>
					<Link href="/memberships">
						<Button size="lg" variant="outline">
							Keep browsing
						</Button>
					</Link>
				</div>
			</section>
		</div>
	);
}
