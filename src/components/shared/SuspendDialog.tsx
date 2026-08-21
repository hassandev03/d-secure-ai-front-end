"use client";

import { AlertTriangle, Ban, Clock, Download } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface SuspendDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Display name of the entity being suspended (user name or org name) */
    entityName: string;
    /** "account" | "organization" */
    entityType?: "account" | "organization";
    onConfirm: () => void | Promise<void>;
    isLoading?: boolean;
}

/**
 * Confirm-before-suspend dialog.
 *
 * Explains:
 * - The suspension is immediate
 * - Data will be deleted in 7 days
 * - The user/org admin will be notified by email
 * - They can download their data within the 7-day window
 */
export default function SuspendDialog({
    open,
    onOpenChange,
    entityName,
    entityType = "account",
    onConfirm,
    isLoading = false,
}: SuspendDialogProps) {
    const deletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                            <Ban className="h-5 w-5 text-warning" />
                        </div>
                        <AlertDialogTitle className="text-lg">
                            Suspend {entityType === "organization" ? "Organization" : "Account"}
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4 text-sm">
                            <p className="text-foreground font-medium">
                                You are about to suspend{" "}
                                <span className="text-warning font-semibold">{entityName}</span>.
                                This action is reversible but takes immediate effect.
                            </p>

                            {/* What happens */}
                            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    What happens next
                                </p>

                                <div className="flex items-start gap-2.5">
                                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                                    <p className="text-muted-foreground">
                                        All access to the platform will be <strong className="text-foreground">immediately blocked</strong>.
                                    </p>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <Clock className="h-4 w-4 text-danger mt-0.5 shrink-0" />
                                    <p className="text-muted-foreground">
                                        Account data will be{" "}
                                        <strong className="text-danger">permanently deleted on {deletionDate}</strong>{" "}
                                        (7 days from now) if not reactivated.
                                    </p>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <Download className="h-4 w-4 text-info mt-0.5 shrink-0" />
                                    <p className="text-muted-foreground">
                                        The {entityType === "organization" ? "organization admin" : "user"} will be{" "}
                                        <strong className="text-foreground">notified by email</strong> and given a link to
                                        download their data within the 7-day window.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-warning border-warning/30 bg-warning/5 text-xs">
                                    Reversible
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    You can reactivate this {entityType} at any time before deletion.
                                </span>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-warning text-warning-foreground hover:bg-warning/90"
                    >
                        {isLoading ? "Suspending…" : "Yes, Suspend"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
