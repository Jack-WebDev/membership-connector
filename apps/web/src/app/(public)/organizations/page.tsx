import { OrganizationCard } from "@membership-connector-app/ui/components/organization-card";
import { SearchInput } from "@membership-connector-app/ui/components/search-input";
import { SectionHeader } from "@membership-connector-app/ui/components/section-header";

const organizations = [
	{
		name: "LulaFi Business Network",
		description:
			"A trusted network for business owners who want real advice and useful introductions.",
		membershipCount: 3,
		category: "Business network",
		location: "Johannesburg",
		highlight:
			"Members say the introductions they make here lead to real opportunities.",
	},
	{
		name: "Creative Professionals Association",
		description:
			"A welcoming home for designers, illustrators, and other creative professionals.",
		membershipCount: 3,
		category: "Creative collective",
		location: "Durban",
		highlight:
			"A supportive space to share your work and get honest, helpful feedback.",
	},
	{
		name: "Wellness Members Club",
		description:
			"Classes, helpful updates, and a caring community for your wellness journey.",
		membershipCount: 2,
		category: "Wellness",
		location: "Cape Town",
		highlight:
			"A calm, friendly club that keeps members informed every step of the way.",
	},
];

export default function OrganizationsPage() {
	return (
		<div className="space-y-6">
			<SectionHeader
				eyebrow="Organizations"
				title="Groups and clubs you can join"
				description="Browse the organizations below to see what each one offers."
				actions={<SearchInput placeholder="Search organizations" />}
			/>
			<p className="text-muted-foreground text-sm">
				Showing {organizations.length} organizations
			</p>
			<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
				{organizations.map((organization, index) => (
					<div
						key={organization.name}
						style={{ animationDelay: `${index * 80}ms` }}
						className="fade-in slide-in-from-bottom-4 h-full animate-in fill-mode-both duration-500"
					>
						<OrganizationCard {...organization} />
					</div>
				))}
			</div>
		</div>
	);
}
