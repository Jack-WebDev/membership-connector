"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { ConfirmDialog } from "@membership-connector-app/ui/components/confirm-dialog";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

function ApproveApplicationButton({
	orgSlug,
	applicationId,
}: {
	orgSlug: string;
	applicationId: string;
}) {
	const router = useRouter();

	const approveMutation = useMutation(
		trpc.membershipApplication.adminApprove.mutationOptions({
			onSuccess: () => {
				toast.success("Application approved");
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	return (
		<ConfirmDialog
			trigger={<Button>Approve</Button>}
			title="Approve this application?"
			description="This will create an active membership for this applicant. Paid tiers will be marked as pending payment until you confirm payment has been received."
			confirmLabel="Approve"
			onConfirm={() =>
				approveMutation.mutate({ organizationSlug: orgSlug, applicationId })
			}
		/>
	);
}

export { ApproveApplicationButton };
