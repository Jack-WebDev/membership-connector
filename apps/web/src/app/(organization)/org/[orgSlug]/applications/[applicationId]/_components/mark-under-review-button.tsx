"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

function MarkUnderReviewButton({
	orgSlug,
	applicationId,
}: {
	orgSlug: string;
	applicationId: string;
}) {
	const router = useRouter();

	const markUnderReviewMutation = useMutation(
		trpc.membershipApplication.adminMarkUnderReview.mutationOptions({
			onSuccess: () => {
				toast.success("Application marked under review");
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	return (
		<Button
			variant="outline"
			onClick={() =>
				markUnderReviewMutation.mutate({
					organizationSlug: orgSlug,
					applicationId,
				})
			}
		>
			Mark under review
		</Button>
	);
}

export { MarkUnderReviewButton };
