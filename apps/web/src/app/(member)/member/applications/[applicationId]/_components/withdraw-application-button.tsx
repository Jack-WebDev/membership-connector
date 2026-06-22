"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { ConfirmDialog } from "@membership-connector-app/ui/components/confirm-dialog";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type WithdrawApplicationButtonProps = {
	applicationId: string;
};

function WithdrawApplicationButton({
	applicationId,
}: WithdrawApplicationButtonProps) {
	const router = useRouter();

	const withdrawMutation = useMutation(
		trpc.membershipApplication.withdraw.mutationOptions({
			onSuccess: () => {
				toast.success("Application withdrawn");
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	return (
		<ConfirmDialog
			trigger={<Button variant="destructive">Withdraw application</Button>}
			title="Withdraw this application?"
			description="The organization will no longer review this application. You can apply again later if you change your mind."
			confirmLabel="Withdraw"
			onConfirm={() => withdrawMutation.mutate({ applicationId })}
		/>
	);
}

export { WithdrawApplicationButton };
