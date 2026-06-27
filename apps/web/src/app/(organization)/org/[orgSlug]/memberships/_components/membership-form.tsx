"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { Input } from "@membership-connector-app/ui/components/input";
import { Label } from "@membership-connector-app/ui/components/label";
import {
	NativeSelect,
	NativeSelectOption,
} from "@membership-connector-app/ui/components/native-select";
import { Switch } from "@membership-connector-app/ui/components/switch";
import { Textarea } from "@membership-connector-app/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

function slugify(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

type MembershipFormValues = {
	name: string;
	slug: string;
	categoryId: string;
	shortDescription: string;
	description: string;
	visibility: "public" | "private" | "invite_only";
	applicationRequired: boolean;
	publicAnnouncementsEnabled: boolean;
	membersOnlyContentEnabled: boolean;
};

type MembershipFormProps = {
	orgSlug: string;
	mode: "create" | "edit";
	membershipId?: string;
	categoryOptions: { id: string; name: string }[];
	defaultValues?: MembershipFormValues;
};

const EMPTY_VALUES: MembershipFormValues = {
	name: "",
	slug: "",
	categoryId: "",
	shortDescription: "",
	description: "",
	visibility: "public",
	applicationRequired: true,
	publicAnnouncementsEnabled: false,
	membersOnlyContentEnabled: false,
};

function MembershipForm({
	orgSlug,
	mode,
	membershipId,
	categoryOptions,
	defaultValues,
}: MembershipFormProps) {
	const router = useRouter();
	const slugTouched = useRef(mode === "edit");

	const createMutation = useMutation(
		trpc.membership.adminCreate.mutationOptions(),
	);
	const updateMutation = useMutation(
		trpc.membership.adminUpdate.mutationOptions(),
	);

	const form = useForm({
		defaultValues: defaultValues ?? {
			...EMPTY_VALUES,
			categoryId: categoryOptions[0]?.id ?? "",
		},
		onSubmit: async ({ value }) => {
			try {
				if (mode === "create") {
					const result = await createMutation.mutateAsync({
						organizationSlug: orgSlug,
						...value,
					});
					toast.success("Membership created");
					router.push(
						`/org/${orgSlug}/memberships/${result.membershipId}` as Route,
					);
				} else if (membershipId) {
					await updateMutation.mutateAsync({
						organizationSlug: orgSlug,
						membershipId,
						...value,
					});
					toast.success("Membership updated");
					router.push(`/org/${orgSlug}/memberships/${membershipId}` as Route);
				}
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Could not save membership",
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
				name="name"
				validators={{
					onSubmit: ({ value }) =>
						value.trim().length < 2 ? "Membership name is required" : undefined,
				}}
			>
				{(field) => (
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor={field.name}>Membership name</Label>
						<Input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => {
								field.handleChange(e.target.value);
								if (!slugTouched.current) {
									form.setFieldValue("slug", slugify(e.target.value));
								}
							}}
							placeholder="Community Builders Circle"
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
				name="slug"
				validators={{
					onSubmit: ({ value }) =>
						value.trim().length < 2 ? "Slug is required" : undefined,
				}}
			>
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Slug</Label>
						<Input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => {
								slugTouched.current = true;
								field.handleChange(slugify(e.target.value));
							}}
							placeholder="community-builders-circle"
						/>
						{field.state.meta.errors.map((error) => (
							<p key={String(error)} className="text-destructive text-sm">
								{String(error)}
							</p>
						))}
					</div>
				)}
			</form.Field>

			<form.Field name="categoryId">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Category</Label>
						<NativeSelect
							id={field.name}
							name={field.name}
							className="w-full"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
						>
							{categoryOptions.map((category) => (
								<NativeSelectOption key={category.id} value={category.id}>
									{category.name}
								</NativeSelectOption>
							))}
						</NativeSelect>
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
								field.handleChange(
									e.target.value as MembershipFormValues["visibility"],
								)
							}
						>
							<NativeSelectOption value="public">Public</NativeSelectOption>
							<NativeSelectOption value="private">Private</NativeSelectOption>
							<NativeSelectOption value="invite_only">
								Invite only
							</NativeSelectOption>
						</NativeSelect>
					</div>
				)}
			</form.Field>

			<form.Field name="shortDescription">
				{(field) => (
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor={field.name}>Short description</Label>
						<Input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="A one-line summary shown on listing cards"
						/>
						{field.state.meta.errors.map((error) => (
							<p key={String(error)} className="text-destructive text-sm">
								{String(error)}
							</p>
						))}
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
							placeholder="Tell prospective members what this membership offers"
							rows={5}
						/>
					</div>
				)}
			</form.Field>

			<div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
				<form.Field name="applicationRequired">
					{(field) => (
						<div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3">
							<Label htmlFor={field.name} className="text-sm">
								Application required
							</Label>
							<Switch
								id={field.name}
								checked={field.state.value}
								onCheckedChange={(checked) => field.handleChange(checked)}
							/>
						</div>
					)}
				</form.Field>

				<form.Field name="publicAnnouncementsEnabled">
					{(field) => (
						<div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3">
							<Label htmlFor={field.name} className="text-sm">
								Public announcements
							</Label>
							<Switch
								id={field.name}
								checked={field.state.value}
								onCheckedChange={(checked) => field.handleChange(checked)}
							/>
						</div>
					)}
				</form.Field>

				<form.Field name="membersOnlyContentEnabled">
					{(field) => (
						<div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3">
							<Label htmlFor={field.name} className="text-sm">
								Members-only content
							</Label>
							<Switch
								id={field.name}
								checked={field.state.value}
								onCheckedChange={(checked) => field.handleChange(checked)}
							/>
						</div>
					)}
				</form.Field>
			</div>

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
								? "Create membership"
								: "Save changes"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}

export { MembershipForm };
