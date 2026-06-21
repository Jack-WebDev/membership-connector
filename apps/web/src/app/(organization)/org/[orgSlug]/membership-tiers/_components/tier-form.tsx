"use client";

import { Button } from "@membership-connector-app/ui/components/button";
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

const BILLING_INTERVAL_OPTIONS = [
	{ label: "Free", value: "free" },
	{ label: "Once-off", value: "once_off" },
	{ label: "Monthly", value: "monthly" },
	{ label: "Quarterly", value: "quarterly" },
	{ label: "Yearly", value: "yearly" },
	{ label: "Custom", value: "custom" },
];

type TierFormValues = {
	membershipId: string;
	name: string;
	description: string;
	price: string;
	currency: string;
	billingInterval:
		| "free"
		| "once_off"
		| "monthly"
		| "quarterly"
		| "yearly"
		| "custom";
	benefitsText: string;
	requirementsText: string;
	maxMembers: string;
	status: "active" | "inactive";
};

type TierFormProps = {
	orgSlug: string;
	mode: "create" | "edit";
	tierId?: string;
	membershipOptions: { id: string; name: string }[];
	lockMembership?: boolean;
	defaultValues?: TierFormValues;
};

function linesToList(value: string): string[] {
	return value
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
}

function buildDefaultValues(
	membershipOptions: { id: string; name: string }[],
	preselectedMembershipId?: string,
): TierFormValues {
	return {
		membershipId: preselectedMembershipId ?? membershipOptions[0]?.id ?? "",
		name: "",
		description: "",
		price: "0",
		currency: "ZAR",
		billingInterval: "free",
		benefitsText: "",
		requirementsText: "",
		maxMembers: "",
		status: "active",
	};
}

function TierForm({
	orgSlug,
	mode,
	tierId,
	membershipOptions,
	lockMembership,
	defaultValues,
}: TierFormProps) {
	const router = useRouter();

	const createMutation = useMutation(
		trpc.membershipTier.adminCreate.mutationOptions(),
	);
	const updateMutation = useMutation(
		trpc.membershipTier.adminUpdate.mutationOptions(),
	);

	const form = useForm({
		defaultValues: defaultValues ?? buildDefaultValues(membershipOptions),
		onSubmit: async ({ value }) => {
			const payload = {
				membershipId: value.membershipId,
				name: value.name,
				description: value.description || undefined,
				price: Number(value.price),
				currency: value.currency,
				billingInterval: value.billingInterval,
				benefits: linesToList(value.benefitsText),
				requirements: linesToList(value.requirementsText),
				maxMembers: value.maxMembers ? Number(value.maxMembers) : undefined,
				status: value.status,
			};

			try {
				if (mode === "create") {
					await createMutation.mutateAsync({
						organizationSlug: orgSlug,
						...payload,
					});
					toast.success("Tier created");
					router.push(
						`/org/${orgSlug}/memberships/${payload.membershipId}` as Route,
					);
				} else if (tierId) {
					await updateMutation.mutateAsync({
						organizationSlug: orgSlug,
						tierId,
						...payload,
					});
					toast.success("Tier updated");
					router.push(
						`/org/${orgSlug}/memberships/${payload.membershipId}` as Route,
					);
				}
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Could not save tier",
				);
			}
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="grid gap-4 sm:grid-cols-2"
		>
			<form.Field name="membershipId">
				{(field) => (
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor={field.name}>Membership</Label>
						<NativeSelect
							id={field.name}
							name={field.name}
							className="w-full"
							value={field.state.value}
							disabled={lockMembership}
							onChange={(e) => field.handleChange(e.target.value)}
						>
							{membershipOptions.map((option) => (
								<NativeSelectOption key={option.id} value={option.id}>
									{option.name}
								</NativeSelectOption>
							))}
						</NativeSelect>
					</div>
				)}
			</form.Field>

			<form.Field
				name="name"
				validators={{
					onSubmit: ({ value }) =>
						value.trim().length < 2 ? "Tier name is required" : undefined,
				}}
			>
				{(field) => (
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor={field.name}>Tier name</Label>
						<Input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="Standard"
						/>
						{field.state.meta.errors.map((error) => (
							<p key={String(error)} className="text-destructive text-sm">
								{String(error)}
							</p>
						))}
					</div>
				)}
			</form.Field>

			<form.Field name="billingInterval">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Billing interval</Label>
						<NativeSelect
							id={field.name}
							name={field.name}
							className="w-full"
							value={field.state.value}
							onChange={(e) =>
								field.handleChange(
									e.target.value as TierFormValues["billingInterval"],
								)
							}
						>
							{BILLING_INTERVAL_OPTIONS.map((option) => (
								<NativeSelectOption key={option.value} value={option.value}>
									{option.label}
								</NativeSelectOption>
							))}
						</NativeSelect>
					</div>
				)}
			</form.Field>

			<form.Field name="status">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Status</Label>
						<NativeSelect
							id={field.name}
							name={field.name}
							className="w-full"
							value={field.state.value}
							onChange={(e) =>
								field.handleChange(e.target.value as TierFormValues["status"])
							}
						>
							<NativeSelectOption value="active">Active</NativeSelectOption>
							<NativeSelectOption value="inactive">Inactive</NativeSelectOption>
						</NativeSelect>
					</div>
				)}
			</form.Field>

			<form.Field name="price">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Price</Label>
						<Input
							id={field.name}
							name={field.name}
							type="number"
							min="0"
							step="0.01"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
						<p className="text-muted-foreground text-xs">
							Free tiers must be priced at 0.
						</p>
					</div>
				)}
			</form.Field>

			<form.Field name="currency">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Currency</Label>
						<Input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
							maxLength={10}
						/>
					</div>
				)}
			</form.Field>

			<form.Field name="maxMembers">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Max members</Label>
						<Input
							id={field.name}
							name={field.name}
							type="number"
							min="1"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="Unlimited"
						/>
					</div>
				)}
			</form.Field>

			<form.Field name="description">
				{(field) => (
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor={field.name}>Description</Label>
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

			<form.Field name="benefitsText">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Benefits</Label>
						<Textarea
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="One benefit per line"
							rows={4}
						/>
					</div>
				)}
			</form.Field>

			<form.Field name="requirementsText">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Requirements</Label>
						<Textarea
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="One requirement per line"
							rows={4}
						/>
					</div>
				)}
			</form.Field>

			<form.Subscribe
				selector={(state) => ({
					canSubmit: state.canSubmit,
					isSubmitting: state.isSubmitting,
				})}
			>
				{({ canSubmit, isSubmitting }) => (
					<Button
						type="submit"
						size="lg"
						className="sm:col-span-2"
						disabled={!canSubmit || isSubmitting}
					>
						{isSubmitting
							? "Saving..."
							: mode === "create"
								? "Create tier"
								: "Save changes"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}

export { TierForm };
