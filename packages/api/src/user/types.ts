import { z } from "zod";

export const updateProfileInput = z.object({
	firstName: z.string().trim().max(120).optional(),
	lastName: z.string().trim().max(120).optional(),
	phone: z.string().trim().max(40).optional(),
	bio: z.string().trim().max(2000).optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileInput>;

export type MyProfile = {
	firstName: string;
	lastName: string;
	phone: string;
	bio: string;
};
