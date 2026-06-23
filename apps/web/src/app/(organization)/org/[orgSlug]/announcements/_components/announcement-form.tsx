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

type AnnouncementVisibility =
	| "public"
	| "members_only"
	| "tier_specific"
	| "admins_only";

type AnnouncementFormValues = {
	membershipId: string;
	title: string;
	body: string;
	visibility: AnnouncementVisibility;
	targetMembershipTierId: string;
};

type AnnouncementFormProps = {
	orgSlug: string;
	mode: "create" | "edit";
	announcementId?: string;
	memberships: { id: string; name: string }[];
	defaultValues?: AnnouncementFormValues;
};

const EMPTY_VALUES: AnnouncementFormValues = {
	membershipId: "",
	title: "",
	body: "",
	visibility: "members_only",
	targetMembershipTierId: "",
};

function AnnouncementForm({
	orgSlug,
	mode,
	announcementId,
	memberships,
	defaultValues,
}: AnnouncementFormProps) {
	const router = useRouter();

	const createMutation = useMutation(
		trpc.announcement.adminCreate.mutationOptions(),
	);
	const updateMutation = useMutation(
		trpc.announcement.adminUpdate.mutationOptions(),
	);

	const form = useForm({
		defaultValues: defaultValues ?? EMPTY_VALUES,
		onSubmit: async ({ value }) => {
			if (
				value.visibility === "tier_specific" &&
				!value.targetMembershipTierId
			) {
				toast.error("Select a tier for a tier-specific announcement");
				return;
			}

			const payload = {
				organizationSlug: orgSlug,
				membershipId: value.membershipId,
				title: value.title,
				body: value.body,
				visibility: value.visibility,
				targetMembershipTierId:
					value.visibility === "tier_specific"
						? value.targetMembershipTierId
						: undefined,
			};

			try {
				if (mode === "create") {
					const result = await createMutation.mutateAsync(payload);
					toast.success("Announcement created as a draft");
					router.push(
						`/org/${orgSlug}/announcements/${result.announcementId}` as Route,
					);
				} else if (announcementId) {
					await updateMutation.mutateAsync({ ...payload, announcementId });
					toast.success("Announcement updated");
					router.push(
						`/org/${orgSlug}/announcements/${announcementId}` as Route,
					);
				}
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: "Could not save announcement",
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
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor={field.name}>Membership</Label>
						<NativeSelect
							id={field.name}
							name={field.name}
							className="w-full"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
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

			<form.Field
				name="title"
				validators={{
					onSubmit: ({ value }) =>
						value.trim().length < 2 ? "Title is required" : undefined,
				}}
			>
				{(field) => (
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor={field.name}>Title</Label>
						<Input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="New benefits available this month"
						/>
						{field.state.meta.errors.map((error) => (
							<p key={String(error)} className="text-destructive text-sm">
								{String(error)}
							</p>
						))}
					</div>
				)}
			</form.Field>

			<form.Field
				name="body"
				validators={{
					onSubmit: ({ value }) =>
						value.trim().length === 0 ? "Body is required" : undefined,
				}}
			>
				{(field) => (
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor={field.name}>Body</Label>
						<Textarea
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="Share the details members need to know"
							rows={6}
						/>
						{field.state.meta.errors.map((error) => (
							<p key={String(error)} className="text-destructive text-sm">
								{String(error)}
							</p>
						))}
					</div>
				)}
			</form.Field>

			<form.Field name="visibility">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Visibility</Label>
						<NativeSelect
							id={field.name}
							name={field.name}
							className="w-full"
							value={field.state.value}
							onChange={(e) =>
								field.handleChange(e.target.value as AnnouncementVisibility)
							}
						>
							<NativeSelectOption value="public">Public</NativeSelectOption>
							<NativeSelectOption value="members_only">
								Members only
							</NativeSelectOption>
							<NativeSelectOption value="tier_specific">
								Tier specific
							</NativeSelectOption>
							<NativeSelectOption value="admins_only">
								Admins only
							</NativeSelectOption>
						</NativeSelect>
					</div>
				)}
			</form.Field>

			<form.Subscribe selector={(state) => state.values}>
				{(values) =>
					values.visibility === "tier_specific" ? (
						<form.Field name="targetMembershipTierId">
							{(field) => (
								<TierSelectField
									orgSlug={orgSlug}
									membershipId={values.membershipId}
									value={field.state.value}
									onChange={field.handleChange}
								/>
							)}
						</form.Field>
					) : null
				}
			</form.Subscribe>

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
								? "Create announcement"
								: "Save changes"}
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
		...trpc.membershipTier.adminList.queryOptions({
			organizationSlug: orgSlug,
			membershipId,
			pageSize: 100,
		}),
		enabled: membershipId.length > 0,
	});

	const tiers = tiersQuery.data?.items ?? [];

	return (
		<div className="space-y-2">
			<Label htmlFor="targetMembershipTierId">Target tier</Label>
			<NativeSelect
				id="targetMembershipTierId"
				className="w-full"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={membershipId.length === 0}
			>
				<NativeSelectOption value="">
					{membershipId.length === 0
						? "Select a membership first"
						: "Select a tier"}
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

export { AnnouncementForm };
