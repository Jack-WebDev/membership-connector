import {
	Avatar,
	AvatarFallback,
} from "@membership-connector-app/ui/components/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@membership-connector-app/ui/components/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
} from "@membership-connector-app/ui/components/sidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuSkeleton showIcon />
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	if (!session) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						size="lg"
						tooltip="Sign in"
						render={<Link href="/auth/login" />}
					>
						<Avatar size="sm">
							<AvatarFallback>?</AvatarFallback>
						</Avatar>
						<span className="truncate">Sign in</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={<SidebarMenuButton size="lg" tooltip={session.user.name} />}
					>
						<Avatar size="sm">
							<AvatarFallback>
								{session.user.name.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<span className="flex min-w-0 flex-col text-left">
							<span className="truncate font-medium">{session.user.name}</span>
							<span className="truncate text-sidebar-foreground/65 text-xs">
								{session.user.email}
							</span>
						</span>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-56 bg-card">
						<DropdownMenuGroup>
							<DropdownMenuLabel>My Account</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem>{session.user.email}</DropdownMenuItem>
							<DropdownMenuItem
								variant="destructive"
								onClick={() => {
									authClient.signOut({
										fetchOptions: {
											onSuccess: () => {
												router.push("/");
											},
										},
									});
								}}
							>
								Sign Out
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
