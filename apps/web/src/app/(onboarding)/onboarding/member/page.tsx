import { FormSection } from "@membership-connector-app/ui/components/form-section";
import { Input } from "@membership-connector-app/ui/components/input";
import { Label } from "@membership-connector-app/ui/components/label";

export default function OnboardingMemberPage() {
	return (
		<FormSection
			title="Member setup placeholder"
			description="This scaffold shows where member onboarding fields will live once role creation and profile persistence are implemented."
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label>First name</Label>
					<Input placeholder="Ava" />
				</div>
				<div className="space-y-2">
					<Label>Last name</Label>
					<Input placeholder="Mokoena" />
				</div>
				<div className="space-y-2 sm:col-span-2">
					<Label>Phone</Label>
					<Input placeholder="+27 82 000 0000" />
				</div>
			</div>
		</FormSection>
	);
}
