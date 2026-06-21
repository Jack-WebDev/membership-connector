import DashboardLayoutShell from "@/components/dashboard-layout-shell";
import { organizationNavItems } from "@/components/nav-items";
import { requireOrganizationSession } from "@/lib/server-auth";

export default async function OrganizationLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ orgSlug: string }>;
}) {
	const { orgSlug } = await params;
	await requireOrganizationSession(orgSlug, `/org/${orgSlug}/dashboard`);

	return (
		<DashboardLayoutShell
			title="Organization area"
			subtitle={`Scaffolded org shell for ${orgSlug.replaceAll("-", " ")}`}
			topline="Organization workspace shell"
			items={organizationNavItems(orgSlug)}
		>
			{children}
		</DashboardLayoutShell>
	);
}
