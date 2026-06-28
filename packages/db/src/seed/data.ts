export const DEMO_PASSWORD = "Password123!";

export type UserDef = {
	name: string;
	email: string;
};

export const ORG_KEYS = ["lulafi", "cpa", "wellness"] as const;
export type OrgKey = (typeof ORG_KEYS)[number];

export type OrgDef = {
	name: string;
	slug: string;
	description: string;
	email: string;
	phone: string;
	websiteUrl: string;
};

export const ownerDefs: Record<OrgKey, UserDef> = {
	lulafi: { name: "Naledi Khumalo", email: "naledi.khumalo@lulafi.demo" },
	cpa: { name: "Marco Alves", email: "marco.alves@cpa.demo" },
	wellness: { name: "Priya Naidoo", email: "priya.naidoo@wellnessclub.demo" },
};

export const orgDefs: Record<OrgKey, OrgDef> = {
	lulafi: {
		name: "LulaFi Business Network",
		slug: "lulafi-business-network",
		description:
			"A network connecting small business owners and entrepreneurs across South Africa.",
		email: "hello@lulafi.demo",
		phone: "+27110000001",
		websiteUrl: "https://lulafi.demo",
	},
	cpa: {
		name: "Creative Professionals Association",
		slug: "creative-professionals-association",
		description:
			"Supporting designers, writers, and creative professionals with community and resources.",
		email: "hello@cpa.demo",
		phone: "+27110000002",
		websiteUrl: "https://cpa.demo",
	},
	wellness: {
		name: "Wellness Members Club",
		slug: "wellness-members-club",
		description:
			"A membership club for wellness, fitness, and health coaching access.",
		email: "hello@wellnessclub.demo",
		phone: "+27110000003",
		websiteUrl: "https://wellnessclub.demo",
	},
};

export type AdminRole =
	| "admin"
	| "membership_manager"
	| "finance_manager"
	| "content_manager"
	| "reviewer";

export type AdminKey =
	| "thabo"
	| "lindiwe"
	| "sipho"
	| "anita"
	| "johan"
	| "grace";

export const adminDefs: Record<
	AdminKey,
	UserDef & { orgKey: OrgKey; role: AdminRole }
> = {
	thabo: {
		name: "Thabo Mokoena",
		email: "thabo.mokoena@lulafi.demo",
		orgKey: "lulafi",
		role: "admin",
	},
	lindiwe: {
		name: "Lindiwe Dube",
		email: "lindiwe.dube@lulafi.demo",
		orgKey: "lulafi",
		role: "reviewer",
	},
	sipho: {
		name: "Sipho Zulu",
		email: "sipho.zulu@cpa.demo",
		orgKey: "cpa",
		role: "content_manager",
	},
	anita: {
		name: "Anita Pillay",
		email: "anita.pillay@cpa.demo",
		orgKey: "cpa",
		role: "finance_manager",
	},
	johan: {
		name: "Johan van Wyk",
		email: "johan.vanwyk@wellnessclub.demo",
		orgKey: "wellness",
		role: "membership_manager",
	},
	grace: {
		name: "Grace Mthembu",
		email: "grace.mthembu@wellnessclub.demo",
		orgKey: "wellness",
		role: "reviewer",
	},
};

export type MemberKey =
	| "kabelo"
	| "zanele"
	| "ryan"
	| "fatima"
	| "tumi"
	| "chloe"
	| "bongani"
	| "aisha";

export const memberDefs: Record<MemberKey, UserDef> = {
	kabelo: { name: "Kabelo Sithole", email: "kabelo.sithole@member.demo" },
	zanele: { name: "Zanele Ngcobo", email: "zanele.ngcobo@member.demo" },
	ryan: { name: "Ryan Botha", email: "ryan.botha@member.demo" },
	fatima: { name: "Fatima Hassan", email: "fatima.hassan@member.demo" },
	tumi: { name: "Tumi Mahlangu", email: "tumi.mahlangu@member.demo" },
	chloe: {
		name: "Chloe van der Merwe",
		email: "chloe.vandermerwe@member.demo",
	},
	bongani: { name: "Bongani Khoza", email: "bongani.khoza@member.demo" },
	aisha: { name: "Aisha Patel", email: "aisha.patel@member.demo" },
};

export type CategoryDef = { slug: string; name: string; sortOrder: number };

export const categoryDefs: CategoryDef[] = [
	{ slug: "business", name: "Business", sortOrder: 0 },
	{ slug: "creative", name: "Creative", sortOrder: 1 },
	{ slug: "wellness", name: "Wellness", sortOrder: 2 },
	{ slug: "education", name: "Education", sortOrder: 3 },
	{ slug: "fitness", name: "Fitness", sortOrder: 4 },
	{ slug: "technology", name: "Technology", sortOrder: 5 },
	{ slug: "community", name: "Community", sortOrder: 6 },
	{ slug: "nonprofit", name: "Nonprofit", sortOrder: 7 },
	{ slug: "other", name: "Other", sortOrder: 8 },
];

export type MembershipKey =
	| "sfc"
	| "sbgc"
	| "len"
	| "scn"
	| "pdg"
	| "cpaAccess"
	| "pwa"
	| "hcc";

export type MembershipDef = {
	key: MembershipKey;
	orgKey: OrgKey;
	name: string;
	slug: string;
	categorySlug: string;
	shortDescription: string;
	description: string;
	status: "draft" | "published" | "paused";
};

export const membershipDefs: MembershipDef[] = [
	{
		key: "sfc",
		orgKey: "lulafi",
		name: "Startup Founder Circle",
		slug: "startup-founder-circle",
		categorySlug: "business",
		shortDescription:
			"A circle for early-stage startup founders to connect and grow.",
		description:
			"Startup Founder Circle brings together early-stage founders for peer support, resources, and networking events.",
		status: "published",
	},
	{
		key: "sbgc",
		orgKey: "lulafi",
		name: "Small Business Growth Club",
		slug: "small-business-growth-club",
		categorySlug: "business",
		shortDescription: "Tools and community for growing small businesses.",
		description:
			"Small Business Growth Club helps established small business owners scale through workshops and mentorship.",
		status: "published",
	},
	{
		key: "len",
		orgKey: "lulafi",
		name: "Local Entrepreneur Network",
		slug: "local-entrepreneur-network",
		categorySlug: "business",
		shortDescription: "Connecting local entrepreneurs in your area.",
		description:
			"Local Entrepreneur Network is a regional community for entrepreneurs to collaborate and trade leads.",
		status: "paused",
	},
	{
		key: "scn",
		orgKey: "cpa",
		name: "Student Creative Network",
		slug: "student-creative-network",
		categorySlug: "creative",
		shortDescription: "A free network for creative students.",
		description:
			"Student Creative Network gives design and arts students access to mentorship and portfolio feedback.",
		status: "published",
	},
	{
		key: "pdg",
		orgKey: "cpa",
		name: "Professional Design Guild",
		slug: "professional-design-guild",
		categorySlug: "creative",
		shortDescription: "A guild for working design professionals.",
		description:
			"Professional Design Guild connects working designers with paid opportunities and continued education.",
		status: "published",
	},
	{
		key: "cpaAccess",
		orgKey: "cpa",
		name: "Creative Partner Access",
		slug: "creative-partner-access",
		categorySlug: "creative",
		shortDescription: "Early access program for creative partners.",
		description:
			"Creative Partner Access is an in-progress partner program still being finalized.",
		status: "draft",
	},
	{
		key: "pwa",
		orgKey: "wellness",
		name: "Premium Wellness Access",
		slug: "premium-wellness-access",
		categorySlug: "wellness",
		shortDescription: "Full access to wellness facilities and classes.",
		description:
			"Premium Wellness Access gives members full access to studio classes and wellness facilities.",
		status: "published",
	},
	{
		key: "hcc",
		orgKey: "wellness",
		name: "Health Coaching Circle",
		slug: "health-coaching-circle",
		categorySlug: "wellness",
		shortDescription: "Group and 1:1 health coaching access.",
		description:
			"Health Coaching Circle offers introductory and ongoing coaching programs for members.",
		status: "published",
	},
];

export type TierKey =
	| "sfcFree"
	| "sfcPro"
	| "sbgcStarter"
	| "sbgcGrowth"
	| "lenStandard"
	| "scnFree"
	| "scnPlus"
	| "pdgAssociate"
	| "pdgSenior"
	| "cpaPartner"
	| "pwaEssential"
	| "pwaPremium"
	| "hccFreeIntro"
	| "hccCoaching"
	| "hccLegacy";

export type TierDef = {
	key: TierKey;
	membershipKey: MembershipKey;
	name: string;
	price: number;
	billingInterval:
		| "free"
		| "once_off"
		| "monthly"
		| "quarterly"
		| "yearly"
		| "custom";
	status: "active" | "inactive";
	benefits: string[];
};

export const tierDefs: TierDef[] = [
	{
		key: "sfcFree",
		membershipKey: "sfc",
		name: "Free",
		price: 0,
		billingInterval: "free",
		status: "active",
		benefits: ["Community access", "Monthly newsletter"],
	},
	{
		key: "sfcPro",
		membershipKey: "sfc",
		name: "Pro",
		price: 350,
		billingInterval: "monthly",
		status: "active",
		benefits: ["1:1 mentorship", "Priority events"],
	},
	{
		key: "sbgcStarter",
		membershipKey: "sbgc",
		name: "Starter",
		price: 0,
		billingInterval: "free",
		status: "active",
		benefits: ["Community forum"],
	},
	{
		key: "sbgcGrowth",
		membershipKey: "sbgc",
		name: "Growth",
		price: 750,
		billingInterval: "monthly",
		status: "active",
		benefits: ["Growth workshops", "Quarterly strategy call"],
	},
	{
		key: "lenStandard",
		membershipKey: "len",
		name: "Standard",
		price: 200,
		billingInterval: "monthly",
		status: "active",
		benefits: ["Local networking events"],
	},
	{
		key: "scnFree",
		membershipKey: "scn",
		name: "Free",
		price: 0,
		billingInterval: "free",
		status: "active",
		benefits: ["Portfolio reviews"],
	},
	{
		key: "scnPlus",
		membershipKey: "scn",
		name: "Plus",
		price: 150,
		billingInterval: "monthly",
		status: "active",
		benefits: ["Mentor matching", "Workshop access"],
	},
	{
		key: "pdgAssociate",
		membershipKey: "pdg",
		name: "Associate",
		price: 300,
		billingInterval: "monthly",
		status: "active",
		benefits: ["Job board access"],
	},
	{
		key: "pdgSenior",
		membershipKey: "pdg",
		name: "Senior",
		price: 600,
		billingInterval: "yearly",
		status: "active",
		benefits: ["Speaking opportunities", "Job board access"],
	},
	{
		key: "cpaPartner",
		membershipKey: "cpaAccess",
		name: "Partner",
		price: 0,
		billingInterval: "free",
		status: "active",
		benefits: ["Early access"],
	},
	{
		key: "pwaEssential",
		membershipKey: "pwa",
		name: "Essential",
		price: 250,
		billingInterval: "monthly",
		status: "active",
		benefits: ["Studio access"],
	},
	{
		key: "pwaPremium",
		membershipKey: "pwa",
		name: "Premium",
		price: 500,
		billingInterval: "monthly",
		status: "active",
		benefits: ["Studio access", "1:1 sessions"],
	},
	{
		key: "hccFreeIntro",
		membershipKey: "hcc",
		name: "Free Intro",
		price: 0,
		billingInterval: "free",
		status: "active",
		benefits: ["Intro session"],
	},
	{
		key: "hccCoaching",
		membershipKey: "hcc",
		name: "Coaching",
		price: 900,
		billingInterval: "quarterly",
		status: "active",
		benefits: ["Weekly coaching", "Progress tracking"],
	},
	{
		key: "hccLegacy",
		membershipKey: "hcc",
		name: "Legacy",
		price: 400,
		billingInterval: "monthly",
		status: "inactive",
		benefits: ["Discontinued plan"],
	},
];

export type AppOutcome =
	| "approved_free"
	| "approved_paid"
	| "rejected"
	| "under_review"
	| "needs_information"
	| "submitted";

export type ApplicationDef = {
	membershipKey: MembershipKey;
	tierKey: TierKey;
	memberKey: MemberKey;
	outcome: AppOutcome;
};

export const applicationDefs: ApplicationDef[] = [
	{
		membershipKey: "sfc",
		tierKey: "sfcFree",
		memberKey: "kabelo",
		outcome: "approved_free",
	},
	{
		membershipKey: "sfc",
		tierKey: "sfcFree",
		memberKey: "zanele",
		outcome: "approved_free",
	},
	{
		membershipKey: "sfc",
		tierKey: "sfcPro",
		memberKey: "ryan",
		outcome: "approved_paid",
	},
	{
		membershipKey: "sbgc",
		tierKey: "sbgcStarter",
		memberKey: "fatima",
		outcome: "approved_free",
	},
	{
		membershipKey: "sbgc",
		tierKey: "sbgcStarter",
		memberKey: "tumi",
		outcome: "rejected",
	},
	{
		membershipKey: "sbgc",
		tierKey: "sbgcGrowth",
		memberKey: "chloe",
		outcome: "approved_paid",
	},
	{
		membershipKey: "scn",
		tierKey: "scnFree",
		memberKey: "bongani",
		outcome: "approved_free",
	},
	{
		membershipKey: "scn",
		tierKey: "scnPlus",
		memberKey: "aisha",
		outcome: "rejected",
	},
	{
		membershipKey: "pdg",
		tierKey: "pdgAssociate",
		memberKey: "kabelo",
		outcome: "rejected",
	},
	{
		membershipKey: "pdg",
		tierKey: "pdgSenior",
		memberKey: "zanele",
		outcome: "under_review",
	},
	{
		membershipKey: "pwa",
		tierKey: "pwaEssential",
		memberKey: "ryan",
		outcome: "approved_paid",
	},
	{
		membershipKey: "pwa",
		tierKey: "pwaEssential",
		memberKey: "fatima",
		outcome: "needs_information",
	},
	{
		membershipKey: "pwa",
		tierKey: "pwaPremium",
		memberKey: "tumi",
		outcome: "under_review",
	},
	{
		membershipKey: "hcc",
		tierKey: "hccFreeIntro",
		memberKey: "chloe",
		outcome: "approved_free",
	},
	{
		membershipKey: "hcc",
		tierKey: "hccCoaching",
		memberKey: "bongani",
		outcome: "submitted",
	},
];

export type FinanceTxDef = {
	membershipKey: MembershipKey;
	tierKey: TierKey;
	memberKey?: MemberKey;
	type: "membership_payment" | "refund" | "adjustment" | "payout" | "fee";
	status: "pending" | "successful" | "failed" | "refunded" | "cancelled";
	amount: number;
	provider: "manual" | "cash" | "eft" | "demo";
	description: string;
};

export const extraFinanceTxDefs: FinanceTxDef[] = [
	{
		membershipKey: "sfc",
		tierKey: "sfcPro",
		memberKey: "zanele",
		type: "membership_payment",
		status: "pending",
		amount: 350,
		provider: "eft",
		description: "Pending EFT for Pro tier",
	},
	{
		membershipKey: "sbgc",
		tierKey: "sbgcGrowth",
		memberKey: "tumi",
		type: "membership_payment",
		status: "failed",
		amount: 750,
		provider: "eft",
		description: "Failed payment attempt for Growth tier",
	},
	{
		membershipKey: "scn",
		tierKey: "scnPlus",
		memberKey: "bongani",
		type: "membership_payment",
		status: "pending",
		amount: 150,
		provider: "manual",
		description: "Pending manual payment for Plus tier",
	},
	{
		membershipKey: "pdg",
		tierKey: "pdgAssociate",
		memberKey: "aisha",
		type: "membership_payment",
		status: "failed",
		amount: 300,
		provider: "cash",
		description: "Failed cash payment for Associate tier",
	},
	{
		membershipKey: "pwa",
		tierKey: "pwaPremium",
		memberKey: "chloe",
		type: "membership_payment",
		status: "pending",
		amount: 500,
		provider: "eft",
		description: "Pending EFT for Premium tier",
	},
	{
		membershipKey: "hcc",
		tierKey: "hccCoaching",
		memberKey: "fatima",
		type: "membership_payment",
		status: "successful",
		amount: 900,
		provider: "demo",
		description: "Quarterly coaching payment",
	},
	{
		membershipKey: "len",
		tierKey: "lenStandard",
		memberKey: "kabelo",
		type: "membership_payment",
		status: "successful",
		amount: 200,
		provider: "manual",
		description: "Monthly network fee",
	},
	{
		membershipKey: "len",
		tierKey: "lenStandard",
		memberKey: "ryan",
		type: "membership_payment",
		status: "failed",
		amount: 200,
		provider: "manual",
		description: "Failed monthly network fee",
	},
	{
		membershipKey: "sfc",
		tierKey: "sfcPro",
		memberKey: "ryan",
		type: "refund",
		status: "successful",
		amount: 350,
		provider: "demo",
		description: "Refund issued for duplicate charge",
	},
	{
		membershipKey: "sbgc",
		tierKey: "sbgcGrowth",
		memberKey: "chloe",
		type: "refund",
		status: "successful",
		amount: 200,
		provider: "demo",
		description: "Partial refund for billing adjustment",
	},
	{
		membershipKey: "pwa",
		tierKey: "pwaEssential",
		memberKey: "ryan",
		type: "refund",
		status: "successful",
		amount: 100,
		provider: "demo",
		description: "Partial refund issued",
	},
	{
		membershipKey: "sfc",
		tierKey: "sfcPro",
		type: "adjustment",
		status: "successful",
		amount: 50,
		provider: "manual",
		description: "Manual ledger correction",
	},
	{
		membershipKey: "sbgc",
		tierKey: "sbgcGrowth",
		type: "adjustment",
		status: "successful",
		amount: 75,
		provider: "manual",
		description: "Manual ledger correction",
	},
	{
		membershipKey: "pwa",
		tierKey: "pwaPremium",
		type: "adjustment",
		status: "successful",
		amount: 25,
		provider: "manual",
		description: "Manual ledger correction",
	},
	{
		membershipKey: "sfc",
		tierKey: "sfcPro",
		type: "payout",
		status: "successful",
		amount: 1200,
		provider: "eft",
		description: "Monthly payout to organization",
	},
	{
		membershipKey: "sbgc",
		tierKey: "sbgcGrowth",
		type: "payout",
		status: "successful",
		amount: 1500,
		provider: "eft",
		description: "Monthly payout to organization",
	},
	{
		membershipKey: "pwa",
		tierKey: "pwaPremium",
		type: "payout",
		status: "successful",
		amount: 900,
		provider: "eft",
		description: "Monthly payout to organization",
	},
	{
		membershipKey: "sfc",
		tierKey: "sfcPro",
		type: "fee",
		status: "successful",
		amount: 35,
		provider: "demo",
		description: "Platform processing fee",
	},
	{
		membershipKey: "sbgc",
		tierKey: "sbgcGrowth",
		type: "fee",
		status: "successful",
		amount: 45,
		provider: "demo",
		description: "Platform processing fee",
	},
	{
		membershipKey: "hcc",
		tierKey: "hccCoaching",
		type: "fee",
		status: "successful",
		amount: 60,
		provider: "demo",
		description: "Platform processing fee",
	},
	{
		membershipKey: "scn",
		tierKey: "scnPlus",
		type: "membership_payment",
		status: "cancelled",
		amount: 150,
		provider: "manual",
		description: "Cancelled before completion",
	},
	{
		membershipKey: "pdg",
		tierKey: "pdgSenior",
		type: "membership_payment",
		status: "pending",
		amount: 600,
		provider: "eft",
		description: "Pending annual payment",
	},
	{
		membershipKey: "pwa",
		tierKey: "pwaEssential",
		type: "membership_payment",
		status: "successful",
		amount: 250,
		provider: "demo",
		description: "Monthly studio access payment",
	},
	{
		membershipKey: "hcc",
		tierKey: "hccFreeIntro",
		type: "adjustment",
		status: "successful",
		amount: 0,
		provider: "manual",
		description: "Zero-value record adjustment",
	},
];

export type AnnouncementKey =
	| "sfcWelcome"
	| "sfcEvent"
	| "sfcProOnly"
	| "sbgcWelcome"
	| "sbgcWorkshop"
	| "scnWelcome"
	| "pdgWelcome"
	| "pwaWelcome"
	| "pwaEssentialOnly"
	| "hccWelcome";

export type AnnouncementDef = {
	key: AnnouncementKey;
	membershipKey: MembershipKey;
	title: string;
	body: string;
	visibility: "public" | "members_only" | "tier_specific" | "admins_only";
	targetTierKey?: TierKey;
	status: "draft" | "published" | "archived";
	pinned?: boolean;
};

export const announcementDefs: AnnouncementDef[] = [
	{
		key: "sfcWelcome",
		membershipKey: "sfc",
		title: "Welcome to the Founder Circle",
		body: "We're excited to have you. Introduce yourself in the community thread!",
		visibility: "public",
		status: "published",
		pinned: true,
	},
	{
		key: "sfcEvent",
		membershipKey: "sfc",
		title: "Upcoming founder meetup",
		body: "Join us next month for our quarterly founder meetup in Johannesburg.",
		visibility: "members_only",
		status: "published",
	},
	{
		key: "sfcProOnly",
		membershipKey: "sfc",
		title: "Pro mentorship slots open",
		body: "Pro tier members can now book 1:1 mentorship slots for this quarter.",
		visibility: "tier_specific",
		targetTierKey: "sfcPro",
		status: "published",
	},
	{
		key: "sbgcWelcome",
		membershipKey: "sbgc",
		title: "Welcome to the Growth Club",
		body: "Here's how to get the most out of your membership.",
		visibility: "public",
		status: "published",
		pinned: true,
	},
	{
		key: "sbgcWorkshop",
		membershipKey: "sbgc",
		title: "Growth workshop recordings available",
		body: "Catch up on this month's growth workshop in the resources area.",
		visibility: "members_only",
		status: "published",
	},
	{
		key: "scnWelcome",
		membershipKey: "scn",
		title: "Welcome creative students",
		body: "Submit your portfolio for review by the end of the month.",
		visibility: "public",
		status: "published",
	},
	{
		key: "pdgWelcome",
		membershipKey: "pdg",
		title: "Guild news roundup",
		body: "Catch up on the latest opportunities posted to the job board.",
		visibility: "members_only",
		status: "archived",
	},
	{
		key: "pwaWelcome",
		membershipKey: "pwa",
		title: "Welcome to Premium Wellness Access",
		body: "Book your first studio class using the member portal.",
		visibility: "public",
		status: "published",
		pinned: true,
	},
	{
		key: "pwaEssentialOnly",
		membershipKey: "pwa",
		title: "Essential tier class schedule",
		body: "Here's this month's class schedule for Essential tier members.",
		visibility: "tier_specific",
		targetTierKey: "pwaEssential",
		status: "published",
	},
	{
		key: "hccWelcome",
		membershipKey: "hcc",
		title: "Welcome to Health Coaching Circle",
		body: "We're finalizing our onboarding guide for new members.",
		visibility: "members_only",
		status: "draft",
	},
];

export const announcementAuthors: Record<
	MembershipKey,
	{ type: "owner"; orgKey: OrgKey } | { type: "admin"; adminKey: AdminKey }
> = {
	sfc: { type: "owner", orgKey: "lulafi" },
	sbgc: { type: "owner", orgKey: "lulafi" },
	len: { type: "owner", orgKey: "lulafi" },
	scn: { type: "admin", adminKey: "sipho" },
	pdg: { type: "admin", adminKey: "sipho" },
	cpaAccess: { type: "admin", adminKey: "sipho" },
	pwa: { type: "owner", orgKey: "wellness" },
	hcc: { type: "owner", orgKey: "wellness" },
};

export const viewableByMembership: Record<MembershipKey, AnnouncementKey[]> = {
	sfc: ["sfcWelcome", "sfcEvent"],
	sbgc: ["sbgcWelcome", "sbgcWorkshop"],
	len: [],
	scn: ["scnWelcome"],
	pdg: [],
	cpaAccess: [],
	pwa: ["pwaWelcome"],
	hcc: [],
};

export const tierSpecificAnnouncements: {
	key: AnnouncementKey;
	membershipKey: MembershipKey;
	tierKey: TierKey;
}[] = [
	{ key: "sfcProOnly", membershipKey: "sfc", tierKey: "sfcPro" },
	{ key: "pwaEssentialOnly", membershipKey: "pwa", tierKey: "pwaEssential" },
];

export const commentBodies = [
	"This is great news, thanks for sharing!",
	"Looking forward to this.",
	"Could you share more details on timing?",
	"Really appreciate the update.",
	"Just signed up, excited to be part of this.",
	"This has been really helpful so far.",
];

export type SavedMembershipDef = {
	memberKey: MemberKey;
	membershipKey: MembershipKey;
};

export const savedMembershipDefs: SavedMembershipDef[] = [
	{ memberKey: "kabelo", membershipKey: "pdg" },
	{ memberKey: "kabelo", membershipKey: "hcc" },
	{ memberKey: "zanele", membershipKey: "sbgc" },
	{ memberKey: "ryan", membershipKey: "scn" },
	{ memberKey: "fatima", membershipKey: "pwa" },
	{ memberKey: "fatima", membershipKey: "pdg" },
	{ memberKey: "tumi", membershipKey: "sfc" },
	{ memberKey: "chloe", membershipKey: "pdg" },
	{ memberKey: "bongani", membershipKey: "pwa" },
	{ memberKey: "aisha", membershipKey: "sfc" },
];
