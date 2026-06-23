"use client";

import type { OrganizationAdminRoleValue } from "@membership-connector-app/api/organization-admin/types";
import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { Button } from "@membership-connector-app/ui/components/button";
import { ConfirmDialog } from "@membership-connector-app/ui/components/confirm-dialog";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

import { ChangeAdminRoleDialog } from "./change-admin-role-dialog";

type AdminRowActionsProps = {
	orgSlug: string;
	adminId: string;
	userName: string;
	role: OrganizationAdminRoleValue;
	status: "active" | "invited";
	viewerRole: OrganizationAdminRoleValue;
};

function AdminRowActions({
	orgSlug,
	adminId,
	userName,
	role,
	status,
	viewerRole,
}: AdminRowActionsProps) {
	const router = useRouter();

	const removeMutation = useMutation(
		trpc.organizationAdmin.remove.mutationOptions({
			onSuccess: () => {
				toast.success(
					status === "invited" ? "Invite cancelled" : "Admin removed",
				);
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const resendInviteMutation = useMutation(
		trpc.organizationAdmin.resendInvite.mutationOptions({
			onSuccess: () => {
				toast.success("Invite resent");
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const canChangeRole = hasOrganizationPermission(
		viewerRole,
		"change_admin_roles",
	);
	const canRemove = hasOrganizationPermission(viewerRole, "remove_admins");
	const canInvite = hasOrganizationPermission(viewerRole, "invite_admins");

	if (status === "active") {
		return (
			<div className="flex flex-wrap gap-2">
				{canChangeRole ? (
					<ChangeAdminRoleDialog
						orgSlug={orgSlug}
						adminId={adminId}
						currentRole={role}
					/>
				) : null}
				{canRemove ? (
					<ConfirmDialog
						trigger={
							<Button variant="destructive" size="sm">
								Remove
							</Button>
						}
						title={`Remove ${userName}?`}
						description="They will lose admin access to this organization immediately."
						confirmLabel="Remove"
						onConfirm={() =>
							removeMutation.mutate({ organizationSlug: orgSlug, adminId })
						}
					/>
				) : null}
			</div>
		);
	}

	return (
		<div className="flex flex-wrap gap-2">
			{canInvite ? (
				<Button
					variant="outline"
					size="sm"
					disabled={resendInviteMutation.isPending}
					onClick={() =>
						resendInviteMutation.mutate({ organizationSlug: orgSlug, adminId })
					}
				>
					Resend invite
				</Button>
			) : null}
			{canRemove ? (
				<ConfirmDialog
					trigger={
						<Button variant="destructive" size="sm">
							Cancel invite
						</Button>
					}
					title="Cancel this invite?"
					description="The invited person will no longer be able to accept it."
					confirmLabel="Cancel invite"
					onConfirm={() =>
						removeMutation.mutate({ organizationSlug: orgSlug, adminId })
					}
				/>
			) : null}
		</div>
	);
}

export { AdminRowActions };
