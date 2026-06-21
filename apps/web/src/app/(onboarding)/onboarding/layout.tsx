import { PageHeader } from "@membership-connector-app/ui/components/page-header";
import { requireSession } from "@/lib/server-auth";

export default async function OnboardingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	await requireSession("/onboarding/account-type");

	return (
		<div className="mx-auto max-w-380 px-4 py-10 sm:px-6 lg:px-8">
			<div className="space-y-8">
				<PageHeader
					eyebrow="Onboarding"
					title="Choose how you want to use Membership Connector."
					description="Your account is ready. Pick your path to continue into the right workspace."
				/>
				{children}
			</div>
		</div>
	);
}
