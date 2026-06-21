import DashboardLayoutShell from "@/components/dashboard-layout-shell";
import { memberNavItems } from "@/components/nav-items";
import { requireMemberSession } from "@/lib/server-auth";

export default async function MemberLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	await requireMemberSession("/member/dashboard");

	return (
		<DashboardLayoutShell
			title="Member area"
			subtitle="Scaffolded navigation for member dashboards, applications, memberships, and saved items."
			topline="Member workspace shell"
			items={memberNavItems()}
		>
			{children}
		</DashboardLayoutShell>
	);
}
