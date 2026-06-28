import PublicLayoutShell from "@/components/public-layout-shell";

export const dynamic = "force-dynamic";

export default function PublicLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <PublicLayoutShell>{children}</PublicLayoutShell>;
}
