import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { OrganizationCard } from "@membership-connector-app/ui/components/organization-card";
import { SectionHeader } from "@membership-connector-app/ui/components/section-header";

import { toOrganizationCardProps } from "@/lib/membership-presenters";
import { serverTrpc } from "@/utils/trpc-server";

import { OrganizationSearch } from "./_components/organization-search";

type OrganizationsPageProps = {
	searchParams: Promise<{ search?: string }>;
};

export default async function OrganizationsPage({
	searchParams,
}: OrganizationsPageProps) {
	const params = await searchParams;

	const organizations = await serverTrpc.organization.listPublic.query({
		search: params.search,
	});

	return (
		<div className="space-y-6">
			<SectionHeader
				eyebrow="Organizations"
				title="Groups and clubs you can join"
				description="Browse the organizations below to see what each one offers."
				actions={<OrganizationSearch />}
			/>
			<p className="text-muted-foreground text-sm">
				Showing {organizations.length} organizations
			</p>
			{organizations.length > 0 ? (
				<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
					{organizations.map((organization, index) => (
						<div
							key={organization.id}
							style={{ animationDelay: `${index * 80}ms` }}
							className="fade-in slide-in-from-bottom-4 h-full animate-in fill-mode-both duration-500"
						>
							<OrganizationCard
								{...toOrganizationCardProps(organization, {
									href: `/organizations/${organization.slug}`,
								})}
							/>
						</div>
					))}
				</div>
			) : (
				<EmptyState
					title="No organizations match your search"
					description="Try a different search term to find a group or club."
				/>
			)}
		</div>
	);
}
