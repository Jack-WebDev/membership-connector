import type { OrganizationAdminRole } from "@membership-connector-app/api/account-access";
import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import type { NavigationItem } from "@membership-connector-app/ui/lib/app-types";
import {
	BadgeCheckIcon,
	BellIcon,
	BriefcaseBusinessIcon,
	Building2Icon,
	CreditCardIcon,
	FileTextIcon,
	FolderHeartIcon,
	LayoutDashboardIcon,
	MegaphoneIcon,
	SearchIcon,
	Settings2Icon,
	ShieldIcon,
	UsersIcon,
} from "lucide-react";

export const publicNavItems: NavigationItem[] = [
	{ label: "Home", href: "/" },
	{ label: "Memberships", href: "/memberships" },
	{ label: "Organizations", href: "/organizations" },
	{ label: "Login", href: "/auth/login" },
	{ label: "Register", href: "/auth/register" },
];

export const memberNavItems = (
	basePath = "/member",
	unreadNotifications = 0,
): NavigationItem[] => [
	{
		label: "Dashboard",
		href: `${basePath}/dashboard`,
		icon: <LayoutDashboardIcon className="size-4" />,
	},
	{
		label: "Applications",
		href: `${basePath}/applications`,
		icon: <FileTextIcon className="size-4" />,
	},
	{
		label: "Memberships",
		href: `${basePath}/memberships`,
		icon: <BadgeCheckIcon className="size-4" />,
	},
	{
		label: "Browse",
		href: `${basePath}/browse`,
		icon: <SearchIcon className="size-4" />,
	},
	{
		label: "Saved",
		href: `${basePath}/saved`,
		icon: <FolderHeartIcon className="size-4" />,
	},
	{
		label: "Notifications",
		href: `${basePath}/notifications`,
		icon: <BellIcon className="size-4" />,
		badge: unreadNotifications > 0 ? unreadNotifications : undefined,
	},
	{
		label: "Settings",
		href: `${basePath}/settings`,
		icon: <Settings2Icon className="size-4" />,
	},
];

export const organizationNavItems = (
	orgSlug: string,
	role: OrganizationAdminRole,
	unreadNotifications = 0,
): NavigationItem[] => {
	const basePath = `/org/${orgSlug}`;

	return [
		{
			label: "Dashboard",
			href: `${basePath}/dashboard`,
			icon: <LayoutDashboardIcon className="size-4" />,
		},
		{
			label: "Applications",
			href: `${basePath}/applications`,
			icon: <FileTextIcon className="size-4" />,
		},
		...(hasOrganizationPermission(role, "manage_memberships")
			? [
					{
						label: "Memberships",
						href: `${basePath}/memberships`,
						icon: <BriefcaseBusinessIcon className="size-4" />,
					},
				]
			: []),
		...(hasOrganizationPermission(role, "manage_tiers")
			? [
					{
						label: "Membership Tiers",
						href: `${basePath}/membership-tiers`,
						icon: <BadgeCheckIcon className="size-4" />,
					},
				]
			: []),
		{
			label: "Members",
			href: `${basePath}/members`,
			icon: <UsersIcon className="size-4" />,
		},
		{
			label: "Announcements",
			href: `${basePath}/announcements`,
			icon: <MegaphoneIcon className="size-4" />,
		},
		{
			label: "Finances",
			href: `${basePath}/finances`,
			icon: <CreditCardIcon className="size-4" />,
		},
		{
			label: "Admins",
			href: `${basePath}/admins`,
			icon: <ShieldIcon className="size-4" />,
		},
		{
			label: "Notifications",
			href: `${basePath}/notifications`,
			icon: <BellIcon className="size-4" />,
			badge: unreadNotifications > 0 ? unreadNotifications : undefined,
		},
		{
			label: "Settings",
			href: `${basePath}/settings`,
			icon: <Building2Icon className="size-4" />,
		},
	];
};

export function withActiveItems(items: NavigationItem[], pathname: string) {
	return items.map((item) => ({
		...item,
		active:
			pathname === item.href ||
			(item.href !== "/" && pathname.startsWith(`${item.href}/`)),
	}));
}
