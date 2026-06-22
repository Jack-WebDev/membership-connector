import type { MemberApplicationStatus } from "@membership-connector-app/api/membership-application/types";

import { ApproveApplicationButton } from "./approve-application-button";
import { MarkUnderReviewButton } from "./mark-under-review-button";
import { RejectApplicationDialog } from "./reject-application-dialog";
import { RequestInformationDialog } from "./request-information-dialog";

type ApplicationReviewActionsProps = {
	orgSlug: string;
	applicationId: string;
	status: MemberApplicationStatus;
};

function ApplicationReviewActions({
	orgSlug,
	applicationId,
	status,
}: ApplicationReviewActionsProps) {
	if (status === "submitted") {
		return (
			<div className="flex flex-wrap gap-2">
				<MarkUnderReviewButton
					orgSlug={orgSlug}
					applicationId={applicationId}
				/>
				<ApproveApplicationButton
					orgSlug={orgSlug}
					applicationId={applicationId}
				/>
				<RequestInformationDialog
					orgSlug={orgSlug}
					applicationId={applicationId}
				/>
				<RejectApplicationDialog
					orgSlug={orgSlug}
					applicationId={applicationId}
				/>
			</div>
		);
	}

	if (status === "under_review") {
		return (
			<div className="flex flex-wrap gap-2">
				<ApproveApplicationButton
					orgSlug={orgSlug}
					applicationId={applicationId}
				/>
				<RequestInformationDialog
					orgSlug={orgSlug}
					applicationId={applicationId}
				/>
				<RejectApplicationDialog
					orgSlug={orgSlug}
					applicationId={applicationId}
				/>
			</div>
		);
	}

	return null;
}

export { ApplicationReviewActions };
