"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import {
	Card,
	CardContent,
} from "@membership-connector-app/ui/components/card";
import { Checkbox } from "@membership-connector-app/ui/components/checkbox";
import { Input } from "@membership-connector-app/ui/components/input";
import { Label } from "@membership-connector-app/ui/components/label";
import { Textarea } from "@membership-connector-app/ui/components/textarea";
import { cn } from "@membership-connector-app/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import {
	CheckCircle2,
	FileText,
	Mail,
	NotebookPen,
	Phone,
	Save,
	Send,
	ShieldCheck,
	Sparkles,
	StickyNote,
	User,
} from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
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

type ApplicantDefaults = {
	applicantName?: string;
	applicantEmail?: string;
	applicantPhone?: string;
};

type ApplicationFormProps = {
	membershipId: string;
	tiers: ApplicationFormTier[];
	applicationId?: string;
	defaultValues?: ApplicationFormValues;
	initialTierId?: string;
	applicantDefaults?: ApplicantDefaults;
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

function SectionHeading({ children }: { children: ReactNode }) {
	return (
		<h3 className="font-semibold text-[0.68rem] text-muted-foreground uppercase tracking-[0.2em]">
			{children}
		</h3>
	);
}

function SectionCard({
	title,
	eyebrow,
	description,
	children,
	className,
}: {
	title: string;
	eyebrow: string;
	description?: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<section
			className={cn(
				"fade-in slide-in-from-bottom-4 animate-in rounded-[calc(var(--radius)*1.1)] border border-border/70 bg-background/80 p-5 shadow-[0_18px_48px_rgb(15_23_42_/_0.06)] backdrop-blur-sm duration-500 sm:p-6",
				className,
			)}
		>
			<div className="mb-5 space-y-2">
				<SectionHeading>{eyebrow}</SectionHeading>
				<div>
					<h2 className="font-(family-name:--font-display) text-2xl text-foreground">
						{title}
					</h2>
					{description ? (
						<p className="mt-1 max-w-2xl text-muted-foreground text-sm leading-6">
							{description}
						</p>
					) : null}
				</div>
			</div>
			{children}
		</section>
	);
}

function FieldShell({
	htmlFor,
	label,
	description,
	icon,
	children,
}: {
	htmlFor?: string;
	label: string;
	description?: string;
	icon?: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="space-y-2.5">
			<div className="space-y-1">
				<Label
					htmlFor={htmlFor}
					className="flex items-center gap-2 text-foreground text-sm"
				>
					{icon}
					<span>{label}</span>
				</Label>
				{description ? (
					<p className="text-muted-foreground text-xs leading-5">
						{description}
					</p>
				) : null}
			</div>
			{children}
		</div>
	);
}

function ApplicationForm({
	membershipId,
	tiers,
	applicationId,
	defaultValues,
	initialTierId,
	applicantDefaults,
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
		defaultValues: defaultValues ?? {
			...EMPTY_VALUES,
			membershipTierId:
				tiers.length === 1 ? tiers[0].id : (initialTierId ?? ""),
			applicantName: applicantDefaults?.applicantName ?? "",
			applicantEmail: applicantDefaults?.applicantEmail ?? "",
			applicantPhone: applicantDefaults?.applicantPhone ?? "",
		},
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

	const selectedTier = tiers.find(
		(tier) => tier.id === form.state.values.membershipTierId,
	);

	const formBody = (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
			className={cn(
				"space-y-6",
				mode === "apply" &&
					"lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6 lg:space-y-0",
			)}
		>
			<div className="space-y-6">
				{mode === "apply" ? (
					<SectionCard
						title="Your selected tier"
						eyebrow="Membership Tier"
						description="This is the membership tier attached to this application."
						className="delay-75"
					>
						<div className="rounded-[calc(var(--radius)*1.05)] border border-primary/20 bg-linear-to-br from-primary/10 via-background to-background p-5 shadow-[0_18px_40px_rgb(47_111_163_/_0.12)]">
							{selectedTier ? (
								<div className="flex items-start justify-between gap-4">
									<div className="space-y-1.5">
										<div className="flex items-center gap-2">
											<CheckCircle2 className="size-4 text-primary" />
											<div className="font-semibold text-base text-foreground">
												{selectedTier.name}
											</div>
										</div>
										<p className="pl-6 text-muted-foreground text-sm leading-6">
											{selectedTier.billingInterval === "free"
												? "No cost to apply or join at this tier."
												: `Billed ${selectedTier.billingInterval.replace("_", " ")}.`}
										</p>
									</div>
									<div className="text-right">
										<div className="font-(family-name:--font-display) text-2xl text-foreground">
											{selectedTier.billingInterval === "free"
												? "Free"
												: `${selectedTier.currency} ${selectedTier.price}`}
										</div>
										<div className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
											{selectedTier.billingInterval === "free"
												? "Open access"
												: selectedTier.billingInterval.replace("_", " ")}
										</div>
									</div>
								</div>
							) : (
								<p className="text-muted-foreground text-sm">
									No membership tier was selected for this application.
								</p>
							)}
						</div>
					</SectionCard>
				) : null}

				<SectionCard
					title="Tell us about yourself"
					eyebrow="Applicant Details"
					description="Make it easy for the organization to recognize you and reach you if they need anything."
					className="delay-100"
				>
					<div className="grid gap-4 sm:grid-cols-2">
						<form.Field name="applicantName">
							{(field) => (
								<FieldShell
									htmlFor={field.name}
									label="Your name"
									description="Use the name the organization is most likely to know."
									icon={<User className="size-3.5 text-muted-foreground" />}
								>
									<div className="relative">
										<User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Jane Doe"
											className="h-12 rounded-[calc(var(--radius)*0.95)] border-border/70 bg-background/75 pl-10 text-sm shadow-[inset_0_1px_0_rgb(255_255_255_/_0.35)]"
										/>
									</div>
								</FieldShell>
							)}
						</form.Field>

						<form.Field name="applicantEmail">
							{(field) => (
								<FieldShell
									htmlFor={field.name}
									label="Email"
									description="This is where updates and information requests will be sent."
									icon={<Mail className="size-3.5 text-muted-foreground" />}
								>
									<div className="relative">
										<Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id={field.name}
											name={field.name}
											type="email"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="jane@example.com"
											className="h-12 rounded-[calc(var(--radius)*0.95)] border-border/70 bg-background/75 pl-10 text-sm shadow-[inset_0_1px_0_rgb(255_255_255_/_0.35)]"
										/>
									</div>
								</FieldShell>
							)}
						</form.Field>

						<form.Field name="applicantPhone">
							{(field) => (
								<FieldShell
									htmlFor={field.name}
									label="Phone"
									description="Optional, but useful if the organization needs to contact you quickly."
									icon={<Phone className="size-3.5 text-muted-foreground" />}
								>
									<div className="relative">
										<Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="+1 555 123 4567"
											className="h-12 rounded-[calc(var(--radius)*0.95)] border-border/70 bg-background/75 pl-10 text-sm shadow-[inset_0_1px_0_rgb(255_255_255_/_0.35)]"
										/>
									</div>
								</FieldShell>
							)}
						</form.Field>
					</div>
				</SectionCard>

				<SectionCard
					title={
						mode === "apply"
							? "Write a strong application"
							: "Send your updated response"
					}
					eyebrow="Application Answers"
					description={
						mode === "apply"
							? "A clear, specific application moves faster than a vague one. Keep it concise and concrete."
							: "Address the requested follow-up clearly so the reviewer can continue without back-and-forth."
					}
					className="delay-150"
				>
					<div className="space-y-4">
						<form.Field name="reason">
							{(field) => (
								<FieldShell
									htmlFor={field.name}
									label="Why are you applying?"
									description="Focus on your goals, fit, and what you hope to contribute."
									icon={<FileText className="size-3.5 text-muted-foreground" />}
								>
									<Textarea
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Tell the organization why you'd like to join"
										rows={4}
										className="min-h-32 rounded-[calc(var(--radius)*0.95)] border-border/70 bg-background/75 text-sm leading-6 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.35)]"
									/>
								</FieldShell>
							)}
						</form.Field>

						<form.Field name="background">
							{(field) => (
								<FieldShell
									htmlFor={field.name}
									label="Relevant background"
									description="Optional. Share experience, achievements, or context that supports your application."
									icon={
										<NotebookPen className="size-3.5 text-muted-foreground" />
									}
								>
									<Textarea
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										rows={3}
										className="min-h-28 rounded-[calc(var(--radius)*0.95)] border-border/70 bg-background/75 text-sm leading-6 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.35)]"
									/>
								</FieldShell>
							)}
						</form.Field>

						<form.Field name="notes">
							{(field) => (
								<FieldShell
									htmlFor={field.name}
									label="Additional notes"
									description="Optional. Add anything that did not fit cleanly in the fields above."
									icon={
										<StickyNote className="size-3.5 text-muted-foreground" />
									}
								>
									<Textarea
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										rows={3}
										className="min-h-28 rounded-[calc(var(--radius)*0.95)] border-border/70 bg-background/75 text-sm leading-6 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.35)]"
									/>
								</FieldShell>
							)}
						</form.Field>
					</div>
				</SectionCard>

				<form.Field name="agreement">
					{(field) => (
						<div
							className={cn(
								"fade-in slide-in-from-bottom-4 animate-in rounded-[calc(var(--radius)*1.05)] border p-4 shadow-[0_12px_30px_rgb(15_23_42_/_0.05)] duration-500",
								field.state.value
									? "border-primary/35 bg-linear-to-r from-primary/10 via-background to-background"
									: "border-border/70 bg-muted/20",
							)}
						>
							<div className="flex items-start gap-3">
								<Checkbox
									id={field.name}
									checked={field.state.value}
									onCheckedChange={(checked) => field.handleChange(checked)}
									className="mt-0.5"
								/>
								<div className="space-y-1">
									<Label
										htmlFor={field.name}
										className="flex items-center gap-2 text-foreground text-sm"
									>
										<ShieldCheck className="size-3.5 text-muted-foreground" />
										Confirm and agree
									</Label>
									<p className="text-foreground/85 text-sm leading-6">
										I confirm the information above is accurate and agree to
										this membership&apos;s terms.
									</p>
								</div>
							</div>
						</div>
					)}
				</form.Field>
			</div>

			<div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
				<div className="fade-in slide-in-from-bottom-4 animate-in overflow-hidden rounded-[calc(var(--radius)*1.15)] border border-border/70 bg-linear-to-br from-slate-950 via-slate-900 to-primary/80 text-white shadow-[0_24px_70px_rgb(15_23_42_/_0.28)] duration-700">
					<div className="space-y-4 p-5 sm:p-6">
						<div className="flex items-center gap-2 text-white/75 text-xs uppercase tracking-[0.2em]">
							<Sparkles className="size-3.5" />
							Application Summary
						</div>
						<div className="space-y-2">
							<div className="font-(family-name:--font-display) text-3xl leading-none">
								{selectedTier
									? selectedTier.billingInterval === "free"
										? "Free"
										: `${selectedTier.currency} ${selectedTier.price}`
									: "Select a tier"}
							</div>
							<div className="text-sm text-white/75 leading-6">
								{selectedTier
									? `${selectedTier.name} membership`
									: "Choose a membership tier to unlock a cleaner review summary."}
							</div>
						</div>
						<div className="rounded-[calc(var(--radius)*0.95)] border border-white/10 bg-white/8 p-4">
							<div className="space-y-3 text-sm">
								<div className="flex items-center justify-between gap-4">
									<span className="text-white/60">Billing</span>
									<span className="text-right text-white">
										{selectedTier
											? selectedTier.billingInterval === "free"
												? "No recurring charge"
												: selectedTier.billingInterval.replace("_", " ")
											: "Not selected"}
									</span>
								</div>
								<div className="flex items-center justify-between gap-4">
									<span className="text-white/60">Contact</span>
									<span className="max-w-[11rem] truncate text-right text-white">
										{form.state.values.applicantEmail || "Not provided yet"}
									</span>
								</div>
								<div className="flex items-center justify-between gap-4">
									<span className="text-white/60">Status</span>
									<span className="text-right text-white">
										{mode === "apply"
											? "Draft in progress"
											: "Ready to resubmit"}
									</span>
								</div>
							</div>
						</div>
						<p className="text-sm text-white/72 leading-6">
							{mode === "apply"
								? "Drafts save your progress. Submit once the details are accurate and complete."
								: "Resubmitting sends your updated answers back to the reviewer immediately."}
						</p>
					</div>
				</div>

				<div className="fade-in slide-in-from-bottom-4 animate-in rounded-[calc(var(--radius)*1.05)] border border-border/70 bg-background/90 p-4 shadow-[0_14px_34px_rgb(15_23_42_/_0.06)] duration-700">
					<div className="mb-4 space-y-1">
						<SectionHeading>Next Step</SectionHeading>
						<p className="text-foreground text-sm leading-6">
							{mode === "apply"
								? "Save progress or send your application when you are ready."
								: "Resubmit your updated application for review."}
						</p>
					</div>
					<div className="flex flex-col gap-3">
						{mode === "apply" ? (
							<>
								<Button
									type="button"
									variant="outline"
									size="lg"
									disabled={isSubmitting}
									onClick={handleSaveDraft}
									className="w-full justify-center rounded-[calc(var(--radius)*0.95)]"
								>
									<Save data-icon="inline-start" />
									{saveDraftMutation.isPending ? "Saving..." : "Save draft"}
								</Button>
								<Button
									type="button"
									size="lg"
									disabled={isSubmitting}
									onClick={handleSubmit}
									className="w-full justify-center rounded-[calc(var(--radius)*0.95)]"
								>
									<Send data-icon="inline-start" />
									{submitMutation.isPending
										? "Submitting..."
										: "Submit application"}
								</Button>
							</>
						) : (
							<Button
								type="button"
								size="lg"
								disabled={isSubmitting}
								onClick={handleRespond}
								className="w-full justify-center rounded-[calc(var(--radius)*0.95)]"
							>
								<Send data-icon="inline-start" />
								{respondMutation.isPending ? "Resubmitting..." : "Resubmit"}
							</Button>
						)}
					</div>
				</div>
			</div>
		</form>
	);

	if (mode === "respond") {
		return formBody;
	}

	return (
		<Card className="overflow-visible border border-border/70 bg-linear-to-br from-white via-muted/20 to-primary/6 py-0 ring-foreground/8">
			<CardContent className="px-4 py-4 sm:px-6 sm:py-6">
				{formBody}
			</CardContent>
		</Card>
	);
}

export type { ApplicationFormTier, ApplicationFormValues };
export { ApplicationForm };
