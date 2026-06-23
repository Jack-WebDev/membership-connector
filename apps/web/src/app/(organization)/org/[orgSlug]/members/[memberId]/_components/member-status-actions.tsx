"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { ConfirmDialog } from "@membership-connector-app/ui/components/confirm-dialog";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type MemberStatus =
	| "active"
	| "pending_payment"
	| "expired"
	| "cancelled"
	| "suspended";

function MemberStatusActions({
	orgSlug,
	memberId,
	status,
}: {
	orgSlug: string;
	memberId: string;
	status: MemberStatus;
}) {
	const router = useRouter();

	const updateStatusMutation = useMutation(
		trpc.membershipMember.adminUpdateStatus.mutationOptions({
			onSuccess: () => {
				toast.success("Member status updated");
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	if (status === "active") {
		return (
			<div className="flex flex-wrap gap-2">
				<ConfirmDialog
					trigger={<Button variant="outline">Suspend</Button>}
					title="Suspend this member?"
					description="The member will lose access until reactivated."
					confirmLabel="Suspend"
					onConfirm={() =>
						updateStatusMutation.mutate({
							organizationSlug: orgSlug,
							memberId,
							target: "suspended",
						})
					}
				/>
				<ConfirmDialog
					trigger={<Button variant="destructive">Cancel membership</Button>}
					title="Cancel this membership?"
					description="This cannot be undone. The member will lose access immediately."
					confirmLabel="Cancel membership"
					onConfirm={() =>
						updateStatusMutation.mutate({
							organizationSlug: orgSlug,
							memberId,
							target: "cancelled",
						})
					}
				/>
			</div>
		);
	}

	if (status === "suspended") {
		return (
			<div className="flex flex-wrap gap-2">
				<ConfirmDialog
					trigger={<Button>Reactivate</Button>}
					title="Reactivate this member?"
					description="The member will regain access to this membership."
					confirmLabel="Reactivate"
					onConfirm={() =>
						updateStatusMutation.mutate({
							organizationSlug: orgSlug,
							memberId,
							target: "active",
						})
					}
				/>
				<ConfirmDialog
					trigger={<Button variant="destructive">Cancel membership</Button>}
					title="Cancel this membership?"
					description="This cannot be undone."
					confirmLabel="Cancel membership"
					onConfirm={() =>
						updateStatusMutation.mutate({
							organizationSlug: orgSlug,
							memberId,
							target: "cancelled",
						})
					}
				/>
			</div>
		);
	}

	if (status === "pending_payment") {
		return (
			<ConfirmDialog
				trigger={<Button variant="destructive">Cancel membership</Button>}
				title="Cancel this membership?"
				description="This cannot be undone."
				confirmLabel="Cancel membership"
				onConfirm={() =>
					updateStatusMutation.mutate({
						organizationSlug: orgSlug,
						memberId,
						target: "cancelled",
					})
				}
			/>
		);
	}

	return null;
}

export { MemberStatusActions };
