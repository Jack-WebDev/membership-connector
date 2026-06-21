import { FormSection } from "@membership-connector-app/ui/components/form-section";
import { Input } from "@membership-connector-app/ui/components/input";
import { Label } from "@membership-connector-app/ui/components/label";

export default function OnboardingOrganizationPage() {
	return (
		<FormSection
			title="Organization setup placeholder"
			description="This shell reserves the exact onboarding route and visual structure for organization creation without implementing transactions yet."
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2 sm:col-span-2">
					<Label>Organization name</Label>
					<Input placeholder="LulaFi Business Network" />
				</div>
				<div className="space-y-2">
					<Label>Slug</Label>
					<Input placeholder="lulafi-business-network" />
				</div>
				<div className="space-y-2">
					<Label>Contact email</Label>
					<Input placeholder="hello@lulafi.example" />
				</div>
				<div className="space-y-2">
					<Label>Phone</Label>
					<Input placeholder="+27 11 000 0000" />
				</div>
				<div className="space-y-2">
					<Label>Website</Label>
					<Input placeholder="https://example.com" />
				</div>
			</div>
		</FormSection>
	);
}
