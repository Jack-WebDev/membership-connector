import ScaffoldPage from "@/components/scaffold-page";

export default function OrganizationAdminsPage() {
	return (
		<ScaffoldPage
			title="Admins"
			description="Admin role management and invitation flows can plug into this route later without reshaping the org shell."
			statusLabel="Admin shell"
		/>
	);
}
