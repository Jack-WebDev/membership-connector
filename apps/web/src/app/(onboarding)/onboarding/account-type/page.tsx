import { Button } from "@membership-connector-app/ui/components/button";
import { RoleSelectionCard } from "@membership-connector-app/ui/components/role-selection-card";
import Link from "next/link";

export default function AccountTypePage() {
	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<RoleSelectionCard
				title="Member"
				description="I want to browse memberships, apply to a tier, and access member-only announcements later."
				highlights={[
					"Browse public memberships",
					"Track applications",
					"Read member announcements",
				]}
				action={
					<Link href="/onboarding/member">
						<Button>Choose member</Button>
					</Link>
				}
			/>
			<RoleSelectionCard
				title="Organization"
				description="I want to create and manage memberships, tiers, applications, announcements, and admins."
				highlights={[
					"Create memberships",
					"Review applications",
					"Manage members and announcements",
				]}
				action={
					<Link href="/onboarding/organization">
						<Button>Choose organization</Button>
					</Link>
				}
			/>
		</div>
	);
}
