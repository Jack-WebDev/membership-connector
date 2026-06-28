import { router } from "../index";
import { lulafiSubmissionInboxProcedure } from "../procedures";
import { getLulafiSubmissionById, listLulafiSubmissions } from "./service";
import { listLulafiSubmissionsInput, lulafiSubmissionIdInput } from "./types";

export const lulafiSubmissionRouter = router({
	list: lulafiSubmissionInboxProcedure
		.input(listLulafiSubmissionsInput)
		.query(({ input }) => listLulafiSubmissions(input)),

	byId: lulafiSubmissionInboxProcedure
		.input(lulafiSubmissionIdInput)
		.query(({ input }) => getLulafiSubmissionById(input.submissionId)),
});
