import { PageHeader } from "@membership-connector-app/ui/components/page-header";

export default function OnboardingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
			<div className="space-y-8">
				<PageHeader
					eyebrow="Onboarding shell"
					title="Role selection and setup now have dedicated route scaffolds."
					description="These screens are static placeholders for Phase 2. Later phases will add transactions, Better Auth-aware redirects, and role persistence."
				/>
				{children}
			</div>
		</div>
	);
}
