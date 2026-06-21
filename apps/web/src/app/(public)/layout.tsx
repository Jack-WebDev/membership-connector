import PublicLayoutShell from "@/components/public-layout-shell";

export default function PublicLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <PublicLayoutShell>{children}</PublicLayoutShell>;
}
