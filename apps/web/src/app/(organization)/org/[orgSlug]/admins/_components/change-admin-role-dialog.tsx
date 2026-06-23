"use client";

import type { OrganizationAdminRoleValue } from "@membership-connector-app/api/organization-admin/types";
import { Button } from "@membership-connector-app/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@membership-connector-app/ui/components/dialog";
import {
	NativeSelect,
	NativeSelectOption,
} from "@membership-connector-app/ui/components/native-select";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

const ROLE_OPTIONS: { value: OrganizationAdminRoleValue; label: string }[] = [
	{ value: "owner", label: "Owner" },
	{ value: "admin", label: "Admin" },
	{ value: "membership_manager", label: "Membership manager" },
	{ value: "finance_manager", label: "Finance manager" },
	{ value: "content_manager", label: "Content manager" },
	{ value: "reviewer", label: "Reviewer" },
];

type ChangeAdminRoleDialogProps = {
	orgSlug: string;
	adminId: string;
	currentRole: OrganizationAdminRoleValue;
};

function ChangeAdminRoleDialog({
	orgSlug,
	adminId,
	currentRole,
}: ChangeAdminRoleDialogProps) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [role, setRole] = useState(currentRole);

	const changeRoleMutation = useMutation(
		trpc.organizationAdmin.changeRole.mutationOptions({
			onSuccess: () => {
				toast.success("Admin role updated");
				setOpen(false);
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button variant="outline" size="sm" />}>
				Change role
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Change this admin's role</DialogTitle>
					<DialogDescription>
						Only an owner can assign the owner role.
					</DialogDescription>
				</DialogHeader>
				<NativeSelect
					value={role}
					onChange={(event) =>
						setRole(event.target.value as OrganizationAdminRoleValue)
					}
				>
					{ROLE_OPTIONS.map((option) => (
						<NativeSelectOption key={option.value} value={option.value}>
							{option.label}
						</NativeSelectOption>
					))}
				</NativeSelect>
				<DialogFooter>
					<Button
						disabled={role === currentRole || changeRoleMutation.isPending}
						onClick={() =>
							changeRoleMutation.mutate({
								organizationSlug: orgSlug,
								adminId,
								role,
							})
						}
					>
						Save role
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { ChangeAdminRoleDialog };
