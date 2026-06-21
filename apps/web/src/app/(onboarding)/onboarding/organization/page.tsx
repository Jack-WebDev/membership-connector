import { FormSection } from "@membership-connector-app/ui/components/form-section";
import { redirect } from "next/navigation";

import { OrganizationOnboardingForm } from "@/components/onboarding/organization-onboarding-form";
import {
	getAccountRoles,
	getAuthenticatedRedirectPath,
	requireSession,
} from "@/lib/server-auth";

export default async function OnboardingOrganizationPage() {
	const session = await requireSession("/onboarding/account-type");
	const roles = await getAccountRoles(session.user.id);

	if (roles.includes("organization")) {
		const redirectPath = await getAuthenticatedRedirectPath(session.user.id);

		if (redirectPath !== "/onboarding/organization") {
			redirect(redirectPath);
		}
	}

	return (
		<FormSection
			title="Set up your organization"
			description="This becomes your organization's public profile and admin workspace."
		>
			<OrganizationOnboardingForm />
		</FormSection>
	);
}
