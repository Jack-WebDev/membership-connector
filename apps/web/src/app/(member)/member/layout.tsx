import { cookies } from "next/headers";
import AppShell from "@/components/app-shell";
import { memberNavItems } from "@/components/nav-items";
import { requireMemberSession } from "@/lib/server-auth";

export default async function MemberLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	await requireMemberSession("/member/dashboard");
	const cookieStore = await cookies();
	const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

	return (
		<AppShell
			title="Member area"
			subtitle="Applications, memberships, and saved items"
			items={memberNavItems()}
			defaultOpen={defaultOpen}
		>
			{children}
		</AppShell>
	);
}
