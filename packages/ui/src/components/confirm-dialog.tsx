"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@membership-connector-app/ui/components/alert-dialog";
import type * as React from "react";

function ConfirmDialog({
	trigger,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	onConfirm,
}: {
	trigger: React.ReactElement;
	title: React.ReactNode;
	description: React.ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	onConfirm?: () => void;
}) {
	return (
		<AlertDialog>
			<AlertDialogTrigger render={trigger} />
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm}>
						{confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export { ConfirmDialog };
