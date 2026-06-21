import { cookies } from "next/headers";
import AppShell from "@/components/app-shell";
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
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/dashboard`,
	);
	const cookieStore = await cookies();
	const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

	return (
		<AppShell
			title={organizationAccess.name}
			subtitle={organizationAccess.role}
			items={organizationNavItems(orgSlug)}
			defaultOpen={defaultOpen}
		>
			{children}
		</AppShell>
	);
}
