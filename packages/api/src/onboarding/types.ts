import { z } from "zod";

const optionalPhone = z.string().trim().max(32);

export const memberOnboardingInput = z.object({
	firstName: z.string().trim().min(1, "First name is required").max(120),
	lastName: z.string().trim().min(1, "Last name is required").max(120),
	phone: optionalPhone,
});
export type MemberOnboardingInput = z.infer<typeof memberOnboardingInput>;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalEmail = z
	.string()
	.trim()
	.refine((value) => value === "" || z.email().safeParse(value).success, {
		message: "Invalid email address",
	});

const optionalUrl = z
	.string()
	.trim()
	.refine((value) => value === "" || z.url().safeParse(value).success, {
		message: "Invalid URL",
	});

export const organizationOnboardingInput = z.object({
	name: z.string().trim().min(2, "Organization name is required").max(160),
	slug: z
		.string()
		.trim()
		.toLowerCase()
		.min(2, "Slug is required")
		.max(80)
		.regex(slugPattern, "Use lowercase letters, numbers, and hyphens only"),
	description: z.string().trim().max(2000),
	email: optionalEmail,
	phone: optionalPhone,
	websiteUrl: optionalUrl,
});
export type OrganizationOnboardingInput = z.infer<
	typeof organizationOnboardingInput
>;
