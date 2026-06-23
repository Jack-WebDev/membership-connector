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
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type FinanceTransactionType =
	| "membership_payment"
	| "refund"
	| "adjustment"
	| "payout"
	| "fee";

type FinanceTransactionStatus =
	| "pending"
	| "successful"
	| "failed"
	| "refunded"
	| "cancelled";

type FinanceTransactionProvider = "manual" | "cash" | "eft" | "demo";

type FinanceTransactionFormValues = {
	membershipId: string;
	membershipTierId: string;
	userId: string;
	type: FinanceTransactionType;
	status: FinanceTransactionStatus;
	amount: string;
	currency: string;
	provider: FinanceTransactionProvider;
	providerReference: string;
	description: string;
};

type FinanceTransactionFormProps = {
	orgSlug: string;
	memberships: { id: string; name: string }[];
};

const EMPTY_VALUES: FinanceTransactionFormValues = {
	membershipId: "",
	membershipTierId: "",
	userId: "",
	type: "membership_payment",
	status: "pending",
	amount: "0",
	currency: "ZAR",
	provider: "manual",
	providerReference: "",
	description: "",
};

function FinanceTransactionForm({
	orgSlug,
	memberships,
}: FinanceTransactionFormProps) {
	const router = useRouter();

	const createMutation = useMutation(
		trpc.finance.adminCreate.mutationOptions(),
	);

	const form = useForm({
		defaultValues: EMPTY_VALUES,
		onSubmit: async ({ value }) => {
			const payload = {
				organizationSlug: orgSlug,
				membershipId: value.membershipId,
				membershipTierId: value.membershipTierId || undefined,
				userId: value.userId || undefined,
				type: value.type,
				status: value.status,
				amount: Number(value.amount),
				currency: value.currency,
				provider: value.provider,
				providerReference: value.providerReference || undefined,
				description: value.description || undefined,
			};

			try {
				const result = await createMutation.mutateAsync(payload);
				toast.success("Finance transaction recorded");
				router.push(
					`/org/${orgSlug}/finances/${result.transactionId}` as Route,
				);
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: "Could not record finance transaction",
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
			<form.Field
				name="membershipId"
				validators={{
					onSubmit: ({ value }) =>
						value.trim().length === 0 ? "Select a membership" : undefined,
				}}
			>
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Membership</Label>
						<NativeSelect
							id={field.name}
							name={field.name}
							className="w-full"
							value={field.state.value}
							onChange={(e) => {
								field.handleChange(e.target.value);
								form.setFieldValue("membershipTierId", "");
								form.setFieldValue("userId", "");
							}}
						>
							<NativeSelectOption value="">
								Select a membership
							</NativeSelectOption>
							{memberships.map((membership) => (
								<NativeSelectOption key={membership.id} value={membership.id}>
									{membership.name}
								</NativeSelectOption>
							))}
						</NativeSelect>
						{field.state.meta.errors.map((error) => (
							<p key={String(error)} className="text-destructive text-sm">
								{String(error)}
							</p>
						))}
					</div>
				)}
			</form.Field>

			<form.Subscribe selector={(state) => state.values.membershipId}>
				{(membershipId) => (
					<form.Field name="membershipTierId">
						{(field) => (
							<TierSelectField
								orgSlug={orgSlug}
								membershipId={membershipId}
								value={field.state.value}
								onChange={field.handleChange}
							/>
						)}
					</form.Field>
				)}
			</form.Subscribe>

			<form.Subscribe selector={(state) => state.values.membershipId}>
				{(membershipId) => (
					<form.Field name="userId">
						{(field) => (
							<MemberSelectField
								orgSlug={orgSlug}
								membershipId={membershipId}
								value={field.state.value}
								onChange={field.handleChange}
							/>
						)}
					</form.Field>
				)}
			</form.Subscribe>

			<form.Field name="type">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Type</Label>
						<NativeSelect
							id={field.name}
							name={field.name}
							className="w-full"
							value={field.state.value}
							onChange={(e) =>
								field.handleChange(e.target.value as FinanceTransactionType)
							}
						>
							<NativeSelectOption value="membership_payment">
								Membership payment
							</NativeSelectOption>
							<NativeSelectOption value="refund">Refund</NativeSelectOption>
							<NativeSelectOption value="adjustment">
								Adjustment
							</NativeSelectOption>
							<NativeSelectOption value="payout">Payout</NativeSelectOption>
							<NativeSelectOption value="fee">Fee</NativeSelectOption>
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
								field.handleChange(e.target.value as FinanceTransactionStatus)
							}
						>
							<NativeSelectOption value="pending">Pending</NativeSelectOption>
							<NativeSelectOption value="successful">
								Successful
							</NativeSelectOption>
							<NativeSelectOption value="failed">Failed</NativeSelectOption>
							<NativeSelectOption value="refunded">Refunded</NativeSelectOption>
							<NativeSelectOption value="cancelled">
								Cancelled
							</NativeSelectOption>
						</NativeSelect>
					</div>
				)}
			</form.Field>

			<form.Field
				name="amount"
				validators={{
					onSubmit: ({ value }) =>
						Number(value) < 0 ? "Amount cannot be negative" : undefined,
				}}
			>
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Amount</Label>
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
						{field.state.meta.errors.map((error) => (
							<p key={String(error)} className="text-destructive text-sm">
								{String(error)}
							</p>
						))}
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
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					</div>
				)}
			</form.Field>

			<form.Field name="provider">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Provider</Label>
						<NativeSelect
							id={field.name}
							name={field.name}
							className="w-full"
							value={field.state.value}
							onChange={(e) =>
								field.handleChange(e.target.value as FinanceTransactionProvider)
							}
						>
							<NativeSelectOption value="manual">Manual</NativeSelectOption>
							<NativeSelectOption value="cash">Cash</NativeSelectOption>
							<NativeSelectOption value="eft">EFT</NativeSelectOption>
							<NativeSelectOption value="demo">Demo</NativeSelectOption>
						</NativeSelect>
					</div>
				)}
			</form.Field>

			<form.Field name="providerReference">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Provider reference</Label>
						<Input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="Optional reference number"
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
							placeholder="Optional notes about this transaction"
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
						{isSubmitting ? "Saving..." : "Record transaction"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}

function TierSelectField({
	orgSlug,
	membershipId,
	value,
	onChange,
}: {
	orgSlug: string;
	membershipId: string;
	value: string;
	onChange: (value: string) => void;
}) {
	const tiersQuery = useQuery({
		...trpc.finance.adminTierOptions.queryOptions({
			organizationSlug: orgSlug,
			membershipId,
		}),
		enabled: membershipId.length > 0,
	});

	const tiers = tiersQuery.data ?? [];

	return (
		<div className="space-y-2">
			<Label htmlFor="membershipTierId">Tier (optional)</Label>
			<NativeSelect
				id="membershipTierId"
				className="w-full"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={membershipId.length === 0}
			>
				<NativeSelectOption value="">
					{membershipId.length === 0
						? "Select a membership first"
						: "No specific tier"}
				</NativeSelectOption>
				{tiers.map((tier) => (
					<NativeSelectOption key={tier.id} value={tier.id}>
						{tier.name}
					</NativeSelectOption>
				))}
			</NativeSelect>
		</div>
	);
}

function MemberSelectField({
	orgSlug,
	membershipId,
	value,
	onChange,
}: {
	orgSlug: string;
	membershipId: string;
	value: string;
	onChange: (value: string) => void;
}) {
	const membersQuery = useQuery({
		...trpc.finance.adminMemberOptions.queryOptions({
			organizationSlug: orgSlug,
			membershipId,
		}),
		enabled: membershipId.length > 0,
	});

	const members = membersQuery.data ?? [];

	return (
		<div className="space-y-2">
			<Label htmlFor="userId">Member (optional)</Label>
			<NativeSelect
				id="userId"
				className="w-full"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={membershipId.length === 0}
			>
				<NativeSelectOption value="">
					{membershipId.length === 0
						? "Select a membership first"
						: "No specific member"}
				</NativeSelectOption>
				{members.map((member) => (
					<NativeSelectOption key={member.userId} value={member.userId}>
						{member.userName} ({member.tierName})
					</NativeSelectOption>
				))}
			</NativeSelect>
		</div>
	);
}

export { FinanceTransactionForm };
