"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { StatusBadge } from "@membership-connector-app/ui/components/status-badge";
import { useMutation } from "@tanstack/react-query";
import { BellIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

export type NotificationListItem = {
	id: string;
	title: string;
	body: string;
	readAt: Date | string | null;
	createdAt: Date | string;
};

function NotificationList({
	notifications,
}: {
	notifications: NotificationListItem[];
}) {
	const router = useRouter();
	const [readIds, setReadIds] = useState<Set<string>>(
		new Set(notifications.filter((n) => n.readAt).map((n) => n.id)),
	);

	const markAsReadMutation = useMutation(
		trpc.notification.markAsRead.mutationOptions({
			onSuccess: () => router.refresh(),
			onError: (error, variables) => {
				toast.error(error.message);
				setReadIds((current) => {
					const next = new Set(current);
					next.delete(variables.notificationId);
					return next;
				});
			},
		}),
	);

	const markAllAsReadMutation = useMutation(
		trpc.notification.markAllAsRead.mutationOptions({
			onSuccess: () => router.refresh(),
			onError: (error) => {
				toast.error(error.message);
				setReadIds(
					new Set(notifications.filter((n) => n.readAt).map((n) => n.id)),
				);
			},
		}),
	);

	function handleMarkAsRead(notificationId: string) {
		setReadIds((current) => new Set(current).add(notificationId));
		markAsReadMutation.mutate({ notificationId });
	}

	function handleMarkAllAsRead() {
		setReadIds(new Set(notifications.map((n) => n.id)));
		markAllAsReadMutation.mutate();
	}

	if (notifications.length === 0) {
		return (
			<EmptyState
				icon={<BellIcon />}
				title="No notifications yet"
				description="Important updates about your applications, memberships, and announcements will show up here."
			/>
		);
	}

	const hasUnread = notifications.some((n) => !readIds.has(n.id));

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Button
					size="sm"
					variant="outline"
					disabled={!hasUnread || markAllAsReadMutation.isPending}
					onClick={handleMarkAllAsRead}
				>
					Mark all as read
				</Button>
			</div>
			<div className="divide-y divide-border rounded-[calc(var(--radius)*1.05)] border border-border bg-card">
				{notifications.map((notification) => {
					const isRead = readIds.has(notification.id);

					return (
						<div
							key={notification.id}
							className={`flex flex-wrap items-start justify-between gap-3 p-4 ${isRead ? "" : "bg-primary/5"}`}
						>
							<div className="min-w-0 space-y-1">
								<div className="flex items-center gap-2">
									{isRead ? null : <StatusBadge label="New" tone="info" />}
									<span className="font-medium text-foreground">
										{notification.title}
									</span>
								</div>
								<p className="text-muted-foreground text-sm">
									{notification.body}
								</p>
								<p className="text-muted-foreground text-xs">
									{new Date(notification.createdAt).toLocaleString()}
								</p>
							</div>
							{isRead ? null : (
								<Button
									size="sm"
									variant="ghost"
									onClick={() => handleMarkAsRead(notification.id)}
								>
									Mark as read
								</Button>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

export { NotificationList };
