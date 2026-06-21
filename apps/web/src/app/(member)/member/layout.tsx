import DashboardLayoutShell from "@/components/dashboard-layout-shell";
import { memberNavItems } from "@/components/nav-items";

export default function MemberLayout({
	children,
}: {
	children: React.ReactNode;
}) {
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
