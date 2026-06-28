import { db } from "../client";
import { lulafiSubmissions } from "../schema/lulafi-submission";

const demoSubmissions = [
	{
		formId: "membership-interest",
		formTitle: "Membership interest form",
		displayName: "Demo Submitter One",
		fields: { name: "Demo Submitter One", interest: "Startup Founder Circle" },
	},
	{
		formId: "membership-interest",
		formTitle: "Membership interest form",
		displayName: "Demo Submitter Two",
		fields: { name: "Demo Submitter Two", interest: "Premium Wellness Access" },
	},
	{
		formId: "event-rsvp",
		formTitle: "Event RSVP form",
		displayName: "Demo Submitter Three",
		fields: { name: "Demo Submitter Three", event: "Quarterly founder meetup" },
	},
];

export async function seedLulafiSubmissions(): Promise<void> {
	for (const [index, def] of demoSubmissions.entries()) {
		await db.insert(lulafiSubmissions).values({
			id: crypto.randomUUID(),
			externalEventId: `seed-event-${index}`,
			source: "lulafi-chat",
			displayName: def.displayName,
			formId: def.formId,
			formVersion: "1",
			formTitle: def.formTitle,
			rawPayload: { readable: def.fields },
			normalizedPayload: { source: "readable", fields: def.fields },
			submittedAt: new Date(),
		});
	}
}
