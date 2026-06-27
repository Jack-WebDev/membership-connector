import {
	addComment,
	createAnnouncement,
	toggleAnnouncementLike,
	toggleAnnouncementPin,
	transitionAnnouncementStatus,
} from "@membership-connector-app/api/announcement/service";
import { setCommentStatus } from "@membership-connector-app/api/comment/service";
import { createFinanceTransaction } from "@membership-connector-app/api/finance/service";
import {
	createMembership,
	transitionMembershipStatus,
} from "@membership-connector-app/api/membership/service";
import {
	approveApplication,
	markApplicationPaymentReceived,
	markApplicationUnderReview,
	rejectApplication,
	requestApplicationInformation,
	submitApplication,
} from "@membership-connector-app/api/membership-application/service";
import { createMembershipTier } from "@membership-connector-app/api/membership-tier/service";
import { completeOrganizationOnboarding } from "@membership-connector-app/api/onboarding/service";
import {
	acceptInvite,
	inviteAdmin,
} from "@membership-connector-app/api/organization-admin/service";
import { auth } from "@membership-connector-app/auth";
import { closeDb, db } from "@membership-connector-app/db";
import { accountRoles } from "@membership-connector-app/db/schema/account";
import { user } from "@membership-connector-app/db/schema/auth";
import { savedMemberships } from "@membership-connector-app/db/schema/membership";
import { eq, sql } from "drizzle-orm";

const DEMO_PASSWORD = "Password123!";

async function truncateAll() {
	await db.execute(sql`
		TRUNCATE TABLE
			audit_logs,
			notifications,
			finance_transactions,
			announcement_comments,
			announcement_likes,
			announcements,
			saved_memberships,
			membership_members,
			membership_applications,
			membership_tiers,
			memberships,
			organization_admins,
			organizations,
			account_roles,
			user_profiles,
			session,
			account,
			verification,
			"user"
		RESTART IDENTITY CASCADE
	`);
}

async function createSeedUser(name: string, email: string) {
	const result = await auth.api.signUpEmail({
		body: { name, email, password: DEMO_PASSWORD },
	});

	await db
		.update(user)
		.set({ emailVerified: true })
		.where(eq(user.id, result.user.id));

	return result.user.id;
}

async function addAccountRole(userId: string, role: "member" | "organization") {
	await db
		.insert(accountRoles)
		.values({ id: crypto.randomUUID(), userId, role })
		.onConflictDoNothing({ target: [accountRoles.userId, accountRoles.role] });
}

type OrgKey = "lulafi" | "cpa" | "wellness";
type MembershipKey =
	| "sfc"
	| "sbgc"
	| "len"
	| "scn"
	| "pdg"
	| "cpaAccess"
	| "pwa"
	| "hcc";

async function main() {
	console.info("Truncating existing data...");
	await truncateAll();

	console.info("Creating org owner, admin, and member users...");

	const owners = {
		lulafi: await createSeedUser(
			"Naledi Khumalo",
			"naledi.khumalo@lulafi.demo",
		),
		cpa: await createSeedUser("Marco Alves", "marco.alves@cpa.demo"),
		wellness: await createSeedUser(
			"Priya Naidoo",
			"priya.naidoo@wellnessclub.demo",
		),
	} satisfies Record<OrgKey, string>;

	const extraAdmins = {
		thabo: await createSeedUser("Thabo Mokoena", "thabo.mokoena@lulafi.demo"),
		lindiwe: await createSeedUser("Lindiwe Dube", "lindiwe.dube@lulafi.demo"),
		sipho: await createSeedUser("Sipho Zulu", "sipho.zulu@cpa.demo"),
		anita: await createSeedUser("Anita Pillay", "anita.pillay@cpa.demo"),
		johan: await createSeedUser(
			"Johan van Wyk",
			"johan.vanwyk@wellnessclub.demo",
		),
		grace: await createSeedUser(
			"Grace Mthembu",
			"grace.mthembu@wellnessclub.demo",
		),
	};

	const members = {
		kabelo: await createSeedUser(
			"Kabelo Sithole",
			"kabelo.sithole@member.demo",
		),
		zanele: await createSeedUser("Zanele Ngcobo", "zanele.ngcobo@member.demo"),
		ryan: await createSeedUser("Ryan Botha", "ryan.botha@member.demo"),
		fatima: await createSeedUser("Fatima Hassan", "fatima.hassan@member.demo"),
		tumi: await createSeedUser("Tumi Mahlangu", "tumi.mahlangu@member.demo"),
		chloe: await createSeedUser(
			"Chloe van der Merwe",
			"chloe.vandermerwe@member.demo",
		),
		bongani: await createSeedUser("Bongani Khoza", "bongani.khoza@member.demo"),
		aisha: await createSeedUser("Aisha Patel", "aisha.patel@member.demo"),
	};

	for (const memberId of Object.values(members)) {
		await addAccountRole(memberId, "member");
	}

	console.info("Creating organizations...");

	const orgInputs: Record<
		OrgKey,
		{
			name: string;
			slug: string;
			description: string;
			email: string;
			phone: string;
			websiteUrl: string;
		}
	> = {
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

	const orgIds: Record<OrgKey, string> = {} as Record<OrgKey, string>;

	for (const key of Object.keys(orgInputs) as OrgKey[]) {
		const { slug } = await completeOrganizationOnboarding(
			owners[key],
			orgInputs[key],
		);
		const [org] = await db.query.organizations.findMany({
			where: (table, { eq: equals }) => equals(table.slug, slug),
			limit: 1,
		});
		if (!org) throw new Error(`Organization ${slug} was not created`);
		orgIds[key] = org.id;
	}

	console.info("Inviting and activating additional organization admins...");

	const adminAssignments: {
		orgKey: OrgKey;
		userId: string;
		email: string;
		role:
			| "admin"
			| "membership_manager"
			| "finance_manager"
			| "content_manager"
			| "reviewer";
	}[] = [
		{
			orgKey: "lulafi",
			userId: extraAdmins.thabo,
			email: "thabo.mokoena@lulafi.demo",
			role: "admin",
		},
		{
			orgKey: "lulafi",
			userId: extraAdmins.lindiwe,
			email: "lindiwe.dube@lulafi.demo",
			role: "reviewer",
		},
		{
			orgKey: "cpa",
			userId: extraAdmins.sipho,
			email: "sipho.zulu@cpa.demo",
			role: "content_manager",
		},
		{
			orgKey: "cpa",
			userId: extraAdmins.anita,
			email: "anita.pillay@cpa.demo",
			role: "finance_manager",
		},
		{
			orgKey: "wellness",
			userId: extraAdmins.johan,
			email: "johan.vanwyk@wellnessclub.demo",
			role: "membership_manager",
		},
		{
			orgKey: "wellness",
			userId: extraAdmins.grace,
			email: "grace.mthembu@wellnessclub.demo",
			role: "reviewer",
		},
	];

	for (const assignment of adminAssignments) {
		await addAccountRole(assignment.userId, "organization");

		await inviteAdmin(
			orgIds[assignment.orgKey],
			owners[assignment.orgKey],
			"owner",
			orgInputs[assignment.orgKey].name,
			{ email: assignment.email, role: assignment.role },
		);

		const adminRow = await db.query.organizationAdmins.findFirst({
			where: (table, { eq: equals, and: combine }) =>
				combine(
					equals(table.organizationId, orgIds[assignment.orgKey]),
					equals(table.userId, assignment.userId),
				),
		});
		if (!adminRow) throw new Error("Admin invite row not found");

		await acceptInvite(assignment.userId, adminRow.id);
	}

	console.info("Creating memberships and tiers...");

	const categoryRows = await db.query.categories.findMany();
	const categoryIdBySlug = new Map(
		categoryRows.map((category) => [category.slug, category.id]),
	);

	const membershipInputs: {
		key: MembershipKey;
		orgKey: OrgKey;
		name: string;
		slug: string;
		categorySlug: string;
		shortDescription: string;
		description: string;
		targetStatus: "draft" | "published" | "paused";
	}[] = [
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
			targetStatus: "published",
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
			targetStatus: "published",
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
			targetStatus: "paused",
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
			targetStatus: "published",
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
			targetStatus: "published",
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
			targetStatus: "draft",
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
			targetStatus: "published",
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
			targetStatus: "published",
		},
	];

	const MEMBERSHIP_ORG_KEY = Object.fromEntries(
		membershipInputs.map((input) => [input.key, input.orgKey]),
	) as Record<MembershipKey, OrgKey>;

	const membershipIds: Record<MembershipKey, string> = {} as Record<
		MembershipKey,
		string
	>;

	for (const input of membershipInputs) {
		const categoryId = categoryIdBySlug.get(input.categorySlug);
		if (!categoryId) {
			throw new Error(`Unknown category slug: ${input.categorySlug}`);
		}

		const { membershipId } = await createMembership(
			orgIds[input.orgKey],
			owners[input.orgKey],
			{
				name: input.name,
				slug: input.slug,
				categoryId,
				shortDescription: input.shortDescription,
				description: input.description,
				visibility: "public",
				applicationRequired: true,
				publicAnnouncementsEnabled: true,
				membersOnlyContentEnabled: true,
			},
		);
		membershipIds[input.key] = membershipId;

		if (input.targetStatus === "published" || input.targetStatus === "paused") {
			await transitionMembershipStatus(
				orgIds[input.orgKey],
				owners[input.orgKey],
				membershipId,
				"published",
			);
		}
		if (input.targetStatus === "paused") {
			await transitionMembershipStatus(
				orgIds[input.orgKey],
				owners[input.orgKey],
				membershipId,
				"paused",
			);
		}
	}

	type TierKey =
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

	const tierInputs: {
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
	}[] = [
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

	const tierIds: Record<TierKey, string> = {} as Record<TierKey, string>;

	for (const input of tierInputs) {
		const orgKey = MEMBERSHIP_ORG_KEY[input.membershipKey];
		const { tierId } = await createMembershipTier(
			orgIds[orgKey],
			owners[orgKey],
			{
				membershipId: membershipIds[input.membershipKey],
				name: input.name,
				price: input.price,
				currency: "ZAR",
				billingInterval: input.billingInterval,
				benefits: input.benefits,
				requirements: [],
				status: input.status,
			},
		);
		tierIds[input.key] = tierId;
	}

	console.info("Submitting and reviewing applications...");

	type AppOutcome =
		| "approved_free"
		| "approved_paid"
		| "rejected"
		| "under_review"
		| "needs_information"
		| "submitted";

	const applicationPlans: {
		membershipKey: MembershipKey;
		tierKey: TierKey;
		memberId: string;
		outcome: AppOutcome;
		applicantName: string;
		applicantEmail: string;
	}[] = [
		{
			membershipKey: "sfc",
			tierKey: "sfcFree",
			memberId: members.kabelo,
			outcome: "approved_free",
			applicantName: "Kabelo Sithole",
			applicantEmail: "kabelo.sithole@member.demo",
		},
		{
			membershipKey: "sfc",
			tierKey: "sfcFree",
			memberId: members.zanele,
			outcome: "approved_free",
			applicantName: "Zanele Ngcobo",
			applicantEmail: "zanele.ngcobo@member.demo",
		},
		{
			membershipKey: "sfc",
			tierKey: "sfcPro",
			memberId: members.ryan,
			outcome: "approved_paid",
			applicantName: "Ryan Botha",
			applicantEmail: "ryan.botha@member.demo",
		},
		{
			membershipKey: "sbgc",
			tierKey: "sbgcStarter",
			memberId: members.fatima,
			outcome: "approved_free",
			applicantName: "Fatima Hassan",
			applicantEmail: "fatima.hassan@member.demo",
		},
		{
			membershipKey: "sbgc",
			tierKey: "sbgcStarter",
			memberId: members.tumi,
			outcome: "rejected",
			applicantName: "Tumi Mahlangu",
			applicantEmail: "tumi.mahlangu@member.demo",
		},
		{
			membershipKey: "sbgc",
			tierKey: "sbgcGrowth",
			memberId: members.chloe,
			outcome: "approved_paid",
			applicantName: "Chloe van der Merwe",
			applicantEmail: "chloe.vandermerwe@member.demo",
		},
		{
			membershipKey: "scn",
			tierKey: "scnFree",
			memberId: members.bongani,
			outcome: "approved_free",
			applicantName: "Bongani Khoza",
			applicantEmail: "bongani.khoza@member.demo",
		},
		{
			membershipKey: "scn",
			tierKey: "scnPlus",
			memberId: members.aisha,
			outcome: "rejected",
			applicantName: "Aisha Patel",
			applicantEmail: "aisha.patel@member.demo",
		},
		{
			membershipKey: "pdg",
			tierKey: "pdgAssociate",
			memberId: members.kabelo,
			outcome: "rejected",
			applicantName: "Kabelo Sithole",
			applicantEmail: "kabelo.sithole@member.demo",
		},
		{
			membershipKey: "pdg",
			tierKey: "pdgSenior",
			memberId: members.zanele,
			outcome: "under_review",
			applicantName: "Zanele Ngcobo",
			applicantEmail: "zanele.ngcobo@member.demo",
		},
		{
			membershipKey: "pwa",
			tierKey: "pwaEssential",
			memberId: members.ryan,
			outcome: "approved_paid",
			applicantName: "Ryan Botha",
			applicantEmail: "ryan.botha@member.demo",
		},
		{
			membershipKey: "pwa",
			tierKey: "pwaEssential",
			memberId: members.fatima,
			outcome: "needs_information",
			applicantName: "Fatima Hassan",
			applicantEmail: "fatima.hassan@member.demo",
		},
		{
			membershipKey: "pwa",
			tierKey: "pwaPremium",
			memberId: members.tumi,
			outcome: "under_review",
			applicantName: "Tumi Mahlangu",
			applicantEmail: "tumi.mahlangu@member.demo",
		},
		{
			membershipKey: "hcc",
			tierKey: "hccFreeIntro",
			memberId: members.chloe,
			outcome: "approved_free",
			applicantName: "Chloe van der Merwe",
			applicantEmail: "chloe.vandermerwe@member.demo",
		},
		{
			membershipKey: "hcc",
			tierKey: "hccCoaching",
			memberId: members.bongani,
			outcome: "submitted",
			applicantName: "Bongani Khoza",
			applicantEmail: "bongani.khoza@member.demo",
		},
	];

	const activeMemberships: {
		memberId: string;
		membershipKey: MembershipKey;
		tierKey: TierKey;
	}[] = [];

	const TIER_INFO = Object.fromEntries(
		tierInputs.map((input) => [
			input.key,
			{ price: input.price, name: input.name },
		]),
	) as Record<TierKey, { price: number; name: string }>;

	for (const plan of applicationPlans) {
		const orgKey = MEMBERSHIP_ORG_KEY[plan.membershipKey];
		const orgOwnerId = owners[orgKey];
		const orgId = orgIds[orgKey];

		const { applicationId } = await submitApplication(plan.memberId, {
			membershipId: membershipIds[plan.membershipKey],
			membershipTierId: tierIds[plan.tierKey],
			answers: {
				applicantName: plan.applicantName,
				applicantEmail: plan.applicantEmail,
				applicantPhone: "+27821234567",
				reason: `I would like to join ${plan.membershipKey} to connect with this community and grow.`,
				background:
					"I have several years of relevant experience in this space.",
				notes: "",
				agreement: true,
			},
		});

		if (plan.outcome === "approved_free") {
			await markApplicationUnderReview(orgId, orgOwnerId, applicationId);
			await approveApplication(
				orgId,
				orgOwnerId,
				applicationId,
				"Great fit for this community.",
			);
			activeMemberships.push({
				memberId: plan.memberId,
				membershipKey: plan.membershipKey,
				tierKey: plan.tierKey,
			});
		} else if (plan.outcome === "approved_paid") {
			await markApplicationUnderReview(orgId, orgOwnerId, applicationId);
			await approveApplication(
				orgId,
				orgOwnerId,
				applicationId,
				"Approved, awaiting payment.",
			);

			const tier = TIER_INFO[plan.tierKey];
			await createFinanceTransaction(orgId, orgOwnerId, {
				membershipId: membershipIds[plan.membershipKey],
				membershipTierId: tierIds[plan.tierKey],
				userId: plan.memberId,
				type: "membership_payment",
				status: "successful",
				amount: tier.price,
				currency: "ZAR",
				provider: "demo",
				providerReference: `DEMO-PAY-${applicationId.slice(0, 8)}`,
				description: `Membership payment for ${tier.name} tier`,
			});
			await markApplicationPaymentReceived(orgId, orgOwnerId, applicationId);
			activeMemberships.push({
				memberId: plan.memberId,
				membershipKey: plan.membershipKey,
				tierKey: plan.tierKey,
			});
		} else if (plan.outcome === "rejected") {
			await markApplicationUnderReview(orgId, orgOwnerId, applicationId);
			await rejectApplication(
				orgId,
				orgOwnerId,
				applicationId,
				"This membership is not the right fit at this time.",
			);
		} else if (plan.outcome === "under_review") {
			await markApplicationUnderReview(orgId, orgOwnerId, applicationId);
		} else if (plan.outcome === "needs_information") {
			await requestApplicationInformation(
				orgId,
				orgOwnerId,
				applicationId,
				"Please provide more detail about your background.",
			);
		}
		// "submitted" outcome: leave as-is, no further action
	}

	console.info("Recording additional demo finance transactions...");

	const extraFinanceTransactions: {
		membershipKey: MembershipKey;
		tierKey: TierKey;
		memberId?: string;
		type: "membership_payment" | "refund" | "adjustment" | "payout" | "fee";
		status: "pending" | "successful" | "failed" | "refunded" | "cancelled";
		amount: number;
		provider: "manual" | "cash" | "eft" | "demo";
		description: string;
	}[] = [
		{
			membershipKey: "sfc",
			tierKey: "sfcPro",
			memberId: members.zanele,
			type: "membership_payment",
			status: "pending",
			amount: 350,
			provider: "eft",
			description: "Pending EFT for Pro tier",
		},
		{
			membershipKey: "sbgc",
			tierKey: "sbgcGrowth",
			memberId: members.tumi,
			type: "membership_payment",
			status: "failed",
			amount: 750,
			provider: "eft",
			description: "Failed payment attempt for Growth tier",
		},
		{
			membershipKey: "scn",
			tierKey: "scnPlus",
			memberId: members.bongani,
			type: "membership_payment",
			status: "pending",
			amount: 150,
			provider: "manual",
			description: "Pending manual payment for Plus tier",
		},
		{
			membershipKey: "pdg",
			tierKey: "pdgAssociate",
			memberId: members.aisha,
			type: "membership_payment",
			status: "failed",
			amount: 300,
			provider: "cash",
			description: "Failed cash payment for Associate tier",
		},
		{
			membershipKey: "pwa",
			tierKey: "pwaPremium",
			memberId: members.chloe,
			type: "membership_payment",
			status: "pending",
			amount: 500,
			provider: "eft",
			description: "Pending EFT for Premium tier",
		},
		{
			membershipKey: "hcc",
			tierKey: "hccCoaching",
			memberId: members.fatima,
			type: "membership_payment",
			status: "successful",
			amount: 900,
			provider: "demo",
			description: "Quarterly coaching payment",
		},
		{
			membershipKey: "len",
			tierKey: "lenStandard",
			memberId: members.kabelo,
			type: "membership_payment",
			status: "successful",
			amount: 200,
			provider: "manual",
			description: "Monthly network fee",
		},
		{
			membershipKey: "len",
			tierKey: "lenStandard",
			memberId: members.ryan,
			type: "membership_payment",
			status: "failed",
			amount: 200,
			provider: "manual",
			description: "Failed monthly network fee",
		},
		{
			membershipKey: "sfc",
			tierKey: "sfcPro",
			memberId: members.ryan,
			type: "refund",
			status: "successful",
			amount: 350,
			provider: "demo",
			description: "Refund issued for duplicate charge",
		},
		{
			membershipKey: "sbgc",
			tierKey: "sbgcGrowth",
			memberId: members.chloe,
			type: "refund",
			status: "successful",
			amount: 200,
			provider: "demo",
			description: "Partial refund for billing adjustment",
		},
		{
			membershipKey: "pwa",
			tierKey: "pwaEssential",
			memberId: members.ryan,
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

	for (const tx of extraFinanceTransactions) {
		const orgKey = MEMBERSHIP_ORG_KEY[tx.membershipKey];
		await createFinanceTransaction(orgIds[orgKey], owners[orgKey], {
			membershipId: membershipIds[tx.membershipKey],
			membershipTierId: tierIds[tx.tierKey],
			userId: tx.memberId,
			type: tx.type,
			status: tx.status,
			amount: tx.amount,
			currency: "ZAR",
			provider: tx.provider,
			description: tx.description,
		});
	}

	console.info("Creating announcements...");

	type AnnouncementKey =
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

	const announcementInputs: {
		key: AnnouncementKey;
		membershipKey: MembershipKey;
		title: string;
		body: string;
		visibility: "public" | "members_only" | "tier_specific" | "admins_only";
		targetTierKey?: TierKey;
		publish: boolean;
		archive?: boolean;
		pin?: boolean;
	}[] = [
		{
			key: "sfcWelcome",
			membershipKey: "sfc",
			title: "Welcome to the Founder Circle",
			body: "We're excited to have you. Introduce yourself in the community thread!",
			visibility: "public",
			publish: true,
			pin: true,
		},
		{
			key: "sfcEvent",
			membershipKey: "sfc",
			title: "Upcoming founder meetup",
			body: "Join us next month for our quarterly founder meetup in Johannesburg.",
			visibility: "members_only",
			publish: true,
		},
		{
			key: "sfcProOnly",
			membershipKey: "sfc",
			title: "Pro mentorship slots open",
			body: "Pro tier members can now book 1:1 mentorship slots for this quarter.",
			visibility: "tier_specific",
			targetTierKey: "sfcPro",
			publish: true,
		},
		{
			key: "sbgcWelcome",
			membershipKey: "sbgc",
			title: "Welcome to the Growth Club",
			body: "Here's how to get the most out of your membership.",
			visibility: "public",
			publish: true,
			pin: true,
		},
		{
			key: "sbgcWorkshop",
			membershipKey: "sbgc",
			title: "Growth workshop recordings available",
			body: "Catch up on this month's growth workshop in the resources area.",
			visibility: "members_only",
			publish: true,
		},
		{
			key: "scnWelcome",
			membershipKey: "scn",
			title: "Welcome creative students",
			body: "Submit your portfolio for review by the end of the month.",
			visibility: "public",
			publish: true,
		},
		{
			key: "pdgWelcome",
			membershipKey: "pdg",
			title: "Guild news roundup",
			body: "Catch up on the latest opportunities posted to the job board.",
			visibility: "members_only",
			publish: true,
			archive: true,
		},
		{
			key: "pwaWelcome",
			membershipKey: "pwa",
			title: "Welcome to Premium Wellness Access",
			body: "Book your first studio class using the member portal.",
			visibility: "public",
			publish: true,
			pin: true,
		},
		{
			key: "pwaEssentialOnly",
			membershipKey: "pwa",
			title: "Essential tier class schedule",
			body: "Here's this month's class schedule for Essential tier members.",
			visibility: "tier_specific",
			targetTierKey: "pwaEssential",
			publish: true,
		},
		{
			key: "hccWelcome",
			membershipKey: "hcc",
			title: "Welcome to Health Coaching Circle",
			body: "We're finalizing our onboarding guide for new members.",
			visibility: "members_only",
			publish: false,
		},
	];

	const announcementIds: Record<AnnouncementKey, string> = {} as Record<
		AnnouncementKey,
		string
	>;
	const contentActors: Record<MembershipKey, string> = {
		sfc: owners.lulafi,
		sbgc: owners.lulafi,
		len: owners.lulafi,
		scn: extraAdmins.sipho,
		pdg: extraAdmins.sipho,
		cpaAccess: extraAdmins.sipho,
		pwa: owners.wellness,
		hcc: owners.wellness,
	};

	for (const input of announcementInputs) {
		const orgKey = MEMBERSHIP_ORG_KEY[input.membershipKey];
		const orgId = orgIds[orgKey];
		const actorId = contentActors[input.membershipKey];

		const { announcementId } = await createAnnouncement(orgId, actorId, {
			membershipId: membershipIds[input.membershipKey],
			title: input.title,
			body: input.body,
			visibility: input.visibility,
			targetMembershipTierId: input.targetTierKey
				? tierIds[input.targetTierKey]
				: undefined,
		});
		announcementIds[input.key] = announcementId;

		if (input.publish) {
			await transitionAnnouncementStatus(
				orgId,
				actorId,
				announcementId,
				"published",
			);
		}
		if (input.archive) {
			await transitionAnnouncementStatus(
				orgId,
				actorId,
				announcementId,
				"archived",
			);
		}
		if (input.pin) {
			await toggleAnnouncementPin(orgId, actorId, announcementId, true);
		}
	}

	console.info("Adding likes and comments from active members...");

	const viewableByMembership: Record<MembershipKey, AnnouncementKey[]> = {
		sfc: ["sfcWelcome", "sfcEvent"],
		sbgc: ["sbgcWelcome", "sbgcWorkshop"],
		len: [],
		scn: ["scnWelcome"],
		pdg: [],
		cpaAccess: [],
		pwa: ["pwaWelcome"],
		hcc: [],
	};

	const tierSpecificAnnouncements: {
		key: AnnouncementKey;
		membershipKey: MembershipKey;
		tierKey: TierKey;
	}[] = [
		{ key: "sfcProOnly", membershipKey: "sfc", tierKey: "sfcPro" },
		{ key: "pwaEssentialOnly", membershipKey: "pwa", tierKey: "pwaEssential" },
	];

	type ViewablePair = {
		memberId: string;
		announcementKey: AnnouncementKey;
		membershipKey: MembershipKey;
	};
	const viewablePairs: ViewablePair[] = [];

	for (const active of activeMemberships) {
		for (const announcementKey of viewableByMembership[active.membershipKey]) {
			viewablePairs.push({
				memberId: active.memberId,
				announcementKey,
				membershipKey: active.membershipKey,
			});
		}

		const tierSpecific = tierSpecificAnnouncements.find(
			(a) =>
				a.membershipKey === active.membershipKey &&
				a.tierKey === active.tierKey,
		);
		if (tierSpecific) {
			viewablePairs.push({
				memberId: active.memberId,
				announcementKey: tierSpecific.key,
				membershipKey: active.membershipKey,
			});
		}
	}

	for (const pair of viewablePairs) {
		await toggleAnnouncementLike(
			pair.memberId,
			announcementIds[pair.announcementKey],
		);
	}

	const commentBodies = [
		"This is great news, thanks for sharing!",
		"Looking forward to this.",
		"Could you share more details on timing?",
		"Really appreciate the update.",
		"Just signed up, excited to be part of this.",
		"This has been really helpful so far.",
	];

	const firstCommentByAnnouncement = new Map<
		string,
		{ commentId: string; userId: string }
	>();
	let commentCount = 0;
	let hiddenCommentId: string | null = null;

	function nextCommentBody(): string {
		return (
			commentBodies[commentCount % commentBodies.length] ??
			"Thanks for sharing!"
		);
	}

	for (const pair of viewablePairs) {
		const announcementId = announcementIds[pair.announcementKey];
		const { commentId } = await addComment(pair.memberId, {
			announcementId,
			body: nextCommentBody(),
		});
		commentCount += 1;

		if (!firstCommentByAnnouncement.has(announcementId)) {
			firstCommentByAnnouncement.set(announcementId, {
				commentId,
				userId: pair.memberId,
			});
		} else if (hiddenCommentId === null) {
			hiddenCommentId = commentId;
		}
	}

	for (const pair of viewablePairs) {
		const announcementId = announcementIds[pair.announcementKey];
		const parent = firstCommentByAnnouncement.get(announcementId);
		if (parent && parent.userId !== pair.memberId) {
			await addComment(pair.memberId, {
				announcementId,
				body: nextCommentBody(),
				parentCommentId: parent.commentId,
			});
			commentCount += 1;
		}
	}

	for (const pair of viewablePairs.slice(0, Math.max(0, 30 - commentCount))) {
		const announcementId = announcementIds[pair.announcementKey];
		await addComment(pair.memberId, {
			announcementId,
			body: nextCommentBody(),
		});
		commentCount += 1;
	}

	if (hiddenCommentId) {
		await setCommentStatus(
			orgIds.lulafi,
			owners.lulafi,
			hiddenCommentId,
			"hidden",
		);
	}

	console.info(
		`Created ${commentCount} comments and ${viewablePairs.length} likes.`,
	);

	console.info("Saving memberships for member 'Saved' lists...");

	const savedMembershipPlans: {
		memberId: string;
		membershipKey: MembershipKey;
	}[] = [
		{ memberId: members.kabelo, membershipKey: "pdg" },
		{ memberId: members.kabelo, membershipKey: "hcc" },
		{ memberId: members.zanele, membershipKey: "sbgc" },
		{ memberId: members.ryan, membershipKey: "scn" },
		{ memberId: members.fatima, membershipKey: "pwa" },
		{ memberId: members.fatima, membershipKey: "pdg" },
		{ memberId: members.tumi, membershipKey: "sfc" },
		{ memberId: members.chloe, membershipKey: "pdg" },
		{ memberId: members.bongani, membershipKey: "pwa" },
		{ memberId: members.aisha, membershipKey: "sfc" },
	];

	for (const plan of savedMembershipPlans) {
		await db
			.insert(savedMemberships)
			.values({
				id: crypto.randomUUID(),
				userId: plan.memberId,
				membershipId: membershipIds[plan.membershipKey],
			})
			.onConflictDoNothing({
				target: [savedMemberships.userId, savedMemberships.membershipId],
			});
	}

	console.info("Seed data created successfully.");
	console.info(`Active memberships created: ${activeMemberships.length}`);
}

main()
	.then(async () => {
		await closeDb();
		process.exit(0);
	})
	.catch(async (error) => {
		console.error("Seed script failed:", error);
		await closeDb();
		process.exit(1);
	});
