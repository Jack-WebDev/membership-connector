import { z } from "zod";

export const membershipIdInput = z.object({
	membershipId: z.string().trim().min(1),
});
export type MembershipIdInput = z.infer<typeof membershipIdInput>;

export type MemberAnnouncementSummary = {
	id: string;
	title: string;
	body: string;
	authorName: string;
	publishedAt: Date;
	pinned: boolean;
	visibilityLabel: string;
};
