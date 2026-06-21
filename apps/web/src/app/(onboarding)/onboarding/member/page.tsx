import { FormSection } from "@membership-connector-app/ui/components/form-section";
import { redirect } from "next/navigation";

import { MemberOnboardingForm } from "@/components/onboarding/member-onboarding-form";
import { getAccountRoles, requireSession } from "@/lib/server-auth";

export default async function OnboardingMemberPage() {
	const session = await requireSession("/onboarding/account-type");
	const roles = await getAccountRoles(session.user.id);

	if (roles.includes("member")) {
		redirect("/member/dashboard");
	}

	return (
		<FormSection
			title="Tell us about you"
			description="We'll use this to personalize your member experience."
		>
			<MemberOnboardingForm />
		</FormSection>
	);
}
