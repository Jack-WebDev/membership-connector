import type { ReactNode } from "react";

export type NavigationItem = {
	label: string;
	href: string;
	icon?: ReactNode;
	badge?: string | number;
	description?: string;
	active?: boolean;
	disabled?: boolean;
};

export type StatusBadgeTone =
	| "draft"
	| "active"
	| "published"
	| "pending"
	| "paused"
	| "archived"
	| "success"
	| "warning"
	| "danger"
	| "info"
	| "muted";

export type MembershipCardProps = {
	name: string;
	organizationName: string;
	shortDescription: string;
	category: string;
	startingPrice: string;
	billingInterval: string;
	activeTiers: number;
	status?: string;
	ctaLabel?: string;
	metaLabel?: string;
};

export type OrganizationCardProps = {
	name: string;
	description: string;
	membershipCount: number;
	category: string;
	location?: string;
	highlight?: string;
	ctaLabel?: string;
};

export type TierPricingCardProps = {
	name: string;
	description: string;
	price: string;
	billingInterval: string;
	benefits: string[];
	requirements?: string[];
	status?: string;
};

export type AnnouncementCardProps = {
	title: string;
	body: string;
	authorName: string;
	publishedAt: string;
	visibilityLabel: string;
	pinned?: boolean;
	likes?: number;
	comments?: number;
};

export type CommentItem = {
	id: string;
	authorName: string;
	body: string;
	createdAt: string;
	status?: "visible" | "hidden" | "deleted";
	replyTo?: string;
};
