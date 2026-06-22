"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { ConfirmDialog } from "@membership-connector-app/ui/components/confirm-dialog";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

function PaymentReceivedButton({
	orgSlug,
	applicationId,
}: {
	orgSlug: string;
	applicationId: string;
}) {
	const router = useRouter();

	const markPaymentReceivedMutation = useMutation(
		trpc.membershipApplication.adminMarkPaymentReceived.mutationOptions({
			onSuccess: () => {
				toast.success("Payment received — membership is now active");
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	return (
		<ConfirmDialog
			trigger={<Button>Payment received</Button>}
			title="Confirm payment received?"
			description="This will activate the applicant's membership immediately."
			confirmLabel="Confirm"
			onConfirm={() =>
				markPaymentReceivedMutation.mutate({
					organizationSlug: orgSlug,
					applicationId,
				})
			}
		/>
	);
}

export { PaymentReceivedButton };
