"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { Checkbox } from "@membership-connector-app/ui/components/checkbox";
import { Input } from "@membership-connector-app/ui/components/input";
import { Label } from "@membership-connector-app/ui/components/label";
import {
	NativeSelect,
	NativeSelectOption,
} from "@membership-connector-app/ui/components/native-select";
import { Textarea } from "@membership-connector-app/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type ApplicationFormTier = {
	id: string;
	name: string;
	price: string;
	currency: string;
	billingInterval:
		| "free"
		| "once_off"
		| "monthly"
		| "quarterly"
		| "yearly"
		| "custom";
};

type ApplicationFormValues = {
	membershipTierId: string;
	applicantName: string;
	applicantEmail: string;
	applicantPhone: string;
	reason: string;
	background: string;
	notes: string;
	agreement: boolean;
};

type ApplicationFormProps = {
	membershipId: string;
	tiers: ApplicationFormTier[];
	applicationId?: string;
	defaultValues?: ApplicationFormValues;
	mode: "apply" | "respond";
};

const EMPTY_VALUES: ApplicationFormValues = {
	membershipTierId: "",
	applicantName: "",
	applicantEmail: "",
	applicantPhone: "",
	reason: "",
	background: "",
	notes: "",
	agreement: false,
};

function formatTierLabel(tier: ApplicationFormTier) {
	if (tier.billingInterval === "free") {
		return `${tier.name} — Free`;
	}

	return `${tier.name} — ${tier.currency} ${tier.price} / ${tier.billingInterval.replace("_", " ")}`;
}

function ApplicationForm({
	membershipId,
	tiers,
	applicationId,
	defaultValues,
	mode,
}: ApplicationFormProps) {
	const router = useRouter();

	const saveDraftMutation = useMutation(
		trpc.membershipApplication.saveDraft.mutationOptions(),
	);
	const submitMutation = useMutation(
		trpc.membershipApplication.submit.mutationOptions(),
	);
	const respondMutation = useMutation(
		trpc.membershipApplication.respondToInformationRequest.mutationOptions(),
	);

	const form = useForm({
		defaultValues:
			defaultValues ??
			(tiers.length === 1
				? { ...EMPTY_VALUES, membershipTierId: tiers[0].id }
				: EMPTY_VALUES),
		onSubmit: async () => {
			// Submission is driven by the explicit action buttons below, since
			// "apply" mode needs two distinct actions (draft vs submit).
		},
	});

	function answersFromValues(values: ApplicationFormValues) {
		return {
			applicantName: values.applicantName,
			applicantEmail: values.applicantEmail,
			applicantPhone: values.applicantPhone,
			reason: values.reason,
			background: values.background,
			notes: values.notes,
			agreement: values.agreement,
		};
	}

	async function handleSaveDraft() {
		const values = form.state.values;

		try {
			const result = await saveDraftMutation.mutateAsync({
				applicationId,
				membershipId,
				membershipTierId: values.membershipTierId,
				answers: answersFromValues(values),
			});
			toast.success("Draft saved");
			if (!applicationId) {
				router.push(`/member/applications/${result.applicationId}` as Route);
			} else {
				router.refresh();
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Could not save draft",
			);
		}
	}

	async function handleSubmit() {
		const values = form.state.values;

		if (!values.membershipTierId) {
			toast.error("Select a tier to apply for");
			return;
		}

		try {
			const result = await submitMutation.mutateAsync({
				applicationId,
				membershipId,
				membershipTierId: values.membershipTierId,
				answers: answersFromValues(values),
			});
			toast.success("Application submitted");
			router.push(`/member/applications/${result.applicationId}` as Route);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Could not submit application",
			);
		}
	}

	async function handleRespond() {
		if (!applicationId) {
			return;
		}

		const values = form.state.values;

		try {
			await respondMutation.mutateAsync({
				applicationId,
				answers: answersFromValues(values),
			});
			toast.success("Application resubmitted");
			router.refresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Could not resubmit application",
			);
		}
	}

	const isSubmitting =
		saveDraftMutation.isPending ||
		submitMutation.isPending ||
		respondMutation.isPending;

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
			className="grid gap-4 sm:grid-cols-2"
		>
			{mode === "apply" ? (
				<form.Field name="membershipTierId">
					{(field) => (
						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor={field.name}>Tier</Label>
							<NativeSelect
								id={field.name}
								name={field.name}
								className="w-full"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
							>
								<NativeSelectOption value="" disabled>
									Select a tier
								</NativeSelectOption>
								{tiers.map((tier) => (
									<NativeSelectOption key={tier.id} value={tier.id}>
										{formatTierLabel(tier)}
									</NativeSelectOption>
								))}
							</NativeSelect>
						</div>
					)}
				</form.Field>
			) : null}

			<form.Field name="applicantName">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Your name</Label>
						<Input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="Jane Doe"
						/>
					</div>
				)}
			</form.Field>

			<form.Field name="applicantEmail">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Email</Label>
						<Input
							id={field.name}
							name={field.name}
							type="email"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="jane@example.com"
						/>
					</div>
				)}
			</form.Field>

			<form.Field name="applicantPhone">
				{(field) => (
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor={field.name}>Phone (optional)</Label>
						<Input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="+1 555 123 4567"
						/>
					</div>
				)}
			</form.Field>

			<form.Field name="reason">
				{(field) => (
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor={field.name}>Why are you applying?</Label>
						<Textarea
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="Tell the organization why you'd like to join"
							rows={4}
						/>
					</div>
				)}
			</form.Field>

			<form.Field name="background">
				{(field) => (
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor={field.name}>Relevant background (optional)</Label>
						<Textarea
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							rows={3}
						/>
					</div>
				)}
			</form.Field>

			<form.Field name="notes">
				{(field) => (
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor={field.name}>Additional notes (optional)</Label>
						<Textarea
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							rows={3}
						/>
					</div>
				)}
			</form.Field>

			<form.Field name="agreement">
				{(field) => (
					<div className="flex items-start gap-3 sm:col-span-2">
						<Checkbox
							id={field.name}
							checked={field.state.value}
							onCheckedChange={(checked) => field.handleChange(checked)}
						/>
						<Label htmlFor={field.name} className="text-sm leading-6">
							I confirm the information above is accurate and agree to this
							membership's terms.
						</Label>
					</div>
				)}
			</form.Field>

			<div className="flex flex-wrap gap-3 sm:col-span-2">
				{mode === "apply" ? (
					<>
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onClick={handleSaveDraft}
						>
							{saveDraftMutation.isPending ? "Saving..." : "Save draft"}
						</Button>
						<Button
							type="button"
							disabled={isSubmitting}
							onClick={handleSubmit}
						>
							{submitMutation.isPending
								? "Submitting..."
								: "Submit application"}
						</Button>
					</>
				) : (
					<Button type="button" disabled={isSubmitting} onClick={handleRespond}>
						{respondMutation.isPending ? "Resubmitting..." : "Resubmit"}
					</Button>
				)}
			</div>
		</form>
	);
}

export type { ApplicationFormTier, ApplicationFormValues };
export { ApplicationForm };
