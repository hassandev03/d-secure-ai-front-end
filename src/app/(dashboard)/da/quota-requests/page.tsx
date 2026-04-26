"use client";

import { useState, useEffect } from "react";
import { Loader2, ArrowUpRight, CheckCircle2, XCircle, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    getDeptQuota,
    getDeptEmployeeQuotaRequests,
    getDeptOrgQuotaHistory,
    approveEmployeeQuotaRequest,
    denyEmployeeQuotaRequest,
    submitOrgQuotaRequest,
    type DeptQuota,
    type EmpQuotaRequest,
    type OrgQuotaRequest,
} from "@/services/da.service";
import PageHeader from "@/components/layout/PageHeader";
import QuotaBar from "@/components/shared/QuotaBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";

// ── Helpers ───────────────────────────────────────────────────
type RequestStatus = "PENDING" | "APPROVED" | "DENIED";

const statusColors: Record<RequestStatus, string> = {
    APPROVED: "bg-success/10 text-success border-success/20",
    DENIED:   "bg-danger/10 text-danger border-danger/20",
    PENDING:  "bg-warning/10 text-warning border-warning/20",
};

const statusIcon: Record<RequestStatus, React.ReactNode> = {
    APPROVED: <CheckCircle2 className="h-4 w-4 text-success" />,
    DENIED:   <XCircle     className="h-4 w-4 text-danger"  />,
    PENDING:  <Clock       className="h-4 w-4 text-warning" />,
};

function initials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─────────────────────────────────────────────────────────────
export default function QuotaRequestsPage() {
    const [loading, setLoading] = useState(true);
    const [quota, setQuota]     = useState<DeptQuota | null>(null);
    const [empRequests, setEmpRequests] = useState<EmpQuotaRequest[]>([]);
    const [orgRequests, setOrgRequests] = useState<OrgQuotaRequest[]>([]);

    // "Request More Quota" dialog state
    const [submitting, setSubmitting] = useState(false);
    const [newAmount,  setNewAmount]  = useState("");
    const [newReason,  setNewReason]  = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);

    // Allocation dialog state
    const [allocateTarget, setAllocateTarget] = useState<{
        id: string; name: string; amount: number;
    } | null>(null);
    const [allocateAmount, setAllocateAmount] = useState("");
    const [allocating, setAllocating] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [q, emp, org] = await Promise.all([
                    getDeptQuota(),
                    getDeptEmployeeQuotaRequests(),
                    getDeptOrgQuotaHistory(),
                ]);
                if (!cancelled) {
                    setQuota(q);
                    setEmpRequests(emp);
                    setOrgRequests(org);
                }
            } catch {
                toast.error("Failed to load quota data.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const pendingCount = empRequests.filter((r) => r.status === "PENDING").length;
    // Derive used/remaining from the new DeptQuota shape
    const usedBudget   = quota ? Math.round(quota.budget * quota.percentageUsed / 100) : 0;
    const remaining    = quota ? quota.budget - usedBudget : 0;

    // Open allocation dialog — pre-fill with the lesser of requested vs available
    const openAllocate = (req: EmpQuotaRequest) => {
        setAllocateTarget({ id: req.id, name: req.name, amount: req.credits });
        setAllocateAmount(String(Math.min(req.credits, Math.max(0, remaining))));
    };

    // Confirm allocation with a custom (or full) amount
    const handleAllocate = async () => {
        if (!allocateTarget) return;
        const val = parseInt(allocateAmount);
        if (!val || val <= 0) { toast.error("Amount must be at least 1."); return; }
        setAllocating(true);
        try {
            const result = await approveEmployeeQuotaRequest(allocateTarget.id, val);
            setEmpRequests((prev) =>
                prev.map((r) =>
                    r.id === allocateTarget.id
                        ? { ...r, status: "APPROVED" as const, grantedCredits: result.grantedCredits }
                        : r,
                ),
            );
            // Reflect the committed quota in the UI immediately (percentageUsed stays read-only here)
            setQuota((q) => q ? { ...q, percentageUsed: q.budget > 0 ? Math.round(((usedBudget + result.grantedCredits) / q.budget) * 100) : 0 } : q);
            const partial = result.grantedCredits < allocateTarget.amount;
            toast.success(
                partial
                    ? `Partially approved: ${result.grantedCredits} of ${allocateTarget.amount} allocated to ${allocateTarget.name}.`
                    : `Approved ${result.grantedCredits} credits for ${allocateTarget.name}.`,
            );
            setAllocateTarget(null);
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to approve request.");
        } finally {
            setAllocating(false);
        }
    };

    // Deny — direct action, no dialog needed
    const handleDeny = async (id: string) => {
        const name = empRequests.find((r) => r.id === id)?.name;
        try {
            await denyEmployeeQuotaRequest(id);
            setEmpRequests((prev) =>
                prev.map((r) => r.id === id ? { ...r, status: "DENIED" as const } : r),
            );
            toast.success(`Request from ${name} denied.`);
        } catch {
            toast.error("Failed to deny request.");
        }
    };

    // Submit new request to Org Admin
    const handleSubmit = async () => {
        if (!newAmount || !newReason.trim()) {
            toast.error("Please fill in both fields.");
            return;
        }
        setSubmitting(true);
        try {
            const newReq = await submitOrgQuotaRequest(parseInt(newAmount), newReason.trim());
            setOrgRequests((prev) => [newReq, ...prev]);
            setNewAmount(""); setNewReason("");
            setDialogOpen(false);
            toast.success("Quota request submitted to Org Admin!");
        } catch {
            toast.error("Failed to submit request.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-5xl">
                <PageHeader
                    title="Quota Requests"
                    subtitle="Review employee requests and request additional quota from Org Admin."
                    breadcrumbs={[{ label: "Dept Admin", href: "/da/dashboard" }, { label: "Quota Requests" }]}
                />
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl">
            <PageHeader
                title="Quota Requests"
                subtitle="Review employee requests and request additional quota from Org Admin."
                breadcrumbs={[{ label: "Dept Admin", href: "/da/dashboard" }, { label: "Quota Requests" }]}
                actions={
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-brand-700 hover:bg-brand-800">
                                <ArrowUpRight className="mr-2 h-4 w-4" /> Request More Quota
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Request Quota Increase</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Additional Credits Needed (CU)</Label>
                                    <Input type="number" placeholder="500" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Reason</Label>
                                    <textarea
                                        className="w-full rounded-lg border border-border bg-transparent p-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        rows={3}
                                        placeholder="Explain why your department needs more quota…"
                                        value={newReason}
                                        onChange={(e) => setNewReason(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                <Button className="bg-brand-700 hover:bg-brand-800" onClick={handleSubmit} disabled={submitting}>
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Request
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                }
            />

            {/* ── Current quota ──────────────────────────────────── */}
            {quota && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Current Department Quota</CardTitle>
                        <CardDescription>Renews {quota.renewsAt}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <QuotaBar used={usedBudget} total={quota.budget} label="Monthly Credit Budget" />
                        <p className={cn(
                            "mt-2 text-xs font-medium",
                            remaining === 0   ? "text-danger"
                            : remaining < 200 ? "text-warning"
                            : "text-success",
                        )}>
                            {remaining === 0
                                ? "No quota remaining — employee requests cannot be approved."
                                : `${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CU available to allocate`
                            }
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* ── Incoming employee requests ──────────────────────── */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-brand-700" />
                            <CardTitle className="text-base font-semibold">Employee Quota Requests</CardTitle>
                        </div>
                        {pendingCount > 0 && (
                            <Badge className="bg-warning/15 text-warning border border-warning/30 text-xs">
                                {pendingCount} pending
                            </Badge>
                        )}
                    </div>
                    <CardDescription>
                        Approve or deny additional quota requests submitted by your team members.
                        You can grant a custom amount if the full request cannot be fulfilled.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {empRequests.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">No employee requests yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {empRequests.map((req) => (
                                <div
                                    key={req.id}
                                    className={`rounded-xl border p-4 ${
                                        req.status === "PENDING"   ? "border-warning/30 bg-warning/5"
                                        : req.status === "APPROVED" ? "border-success/20 bg-success/5"
                                        : "border-danger/20 bg-danger/5"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Avatar className="h-8 w-8 shrink-0">
                                                <AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">
                                                    {initials(req.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-semibold">{req.name}</p>
                                                    <p className="text-xs text-muted-foreground">{req.email}</p>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                    {/* Show partial grant when grantedAmount differs from requested */}
                                                    {req.status === "APPROVED"
                                                        && req.grantedCredits !== undefined
                                                        && req.grantedCredits !== req.credits ? (
                                                        <span className="text-sm font-medium">
                                                            <span className="text-success">+{req.grantedCredits}</span>
                                                            <span className="text-muted-foreground text-xs"> / {req.credits} requested</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm font-medium text-brand-700">
                                                            +{req.grantedCredits ?? req.credits} credits
                                                        </span>
                                                    )}
                                                    {statusIcon[req.status]}
                                                    <Badge variant="outline" className={`text-xs ${statusColors[req.status]}`}>
                                                        {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">{req.reason}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{req.date}</p>
                                            </div>
                                        </div>

                                        {req.status === "PENDING" && (
                                            <div className="flex gap-2 shrink-0">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-success/40 text-success hover:bg-success/10 hover:text-success"
                                                    onClick={() => openAllocate(req)}
                                                >
                                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-danger/40 text-danger hover:bg-danger/10 hover:text-danger"
                                                    onClick={() => handleDeny(req.id)}
                                                >
                                                    <XCircle className="mr-1.5 h-3.5 w-3.5" /> Deny
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Dept Admin's own requests to Org Admin ──────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Your Requests to Org Admin</CardTitle>
                    <CardDescription>History of quota increases you have requested from the organisation admin.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {orgRequests.map((req) => (
                            <div key={req.id} className="rounded-xl border border-border p-4 hover:bg-muted/30 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-medium">+{req.credits} credits</p>
                                            {statusIcon[req.status]}
                                            <Badge variant="outline" className={`text-xs ${statusColors[req.status]}`}>
                                                {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">{req.reason}</p>
                                        <p className="text-xs text-muted-foreground mt-1.5">
                                            {req.date}
                                            {req.respondedBy !== "—" && ` · Responded by ${req.respondedBy}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {orgRequests.length === 0 && (
                            <p className="py-6 text-center text-sm text-muted-foreground">No requests submitted yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── Allocation dialog (opened programmatically) ─────── */}
            <Dialog
                open={allocateTarget !== null}
                onOpenChange={(open) => { if (!open) setAllocateTarget(null); }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Allocate Quota</DialogTitle>
                    </DialogHeader>
                    {allocateTarget && (
                        <div className="space-y-4 py-1">
                            {/* Context summary */}
                            <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Employee</span>
                                    <span className="font-medium">{allocateTarget.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Amount requested</span>
                                    <span className="font-medium">{allocateTarget.amount} credits</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Available quota</span>
                                    <span className={cn(
                                        "font-medium",
                                        remaining === 0                         ? "text-danger"
                                        : remaining < allocateTarget.amount     ? "text-warning"
                                        : "text-success",
                                    )}>
                                        {remaining} available
                                    </span>
                                </div>
                            </div>

                            {/* Warning banners */}
                            {remaining === 0 ? (
                                <div className="rounded-lg bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger">
                                    No quota remaining. Consider requesting more quota from Org Admin before approving.
                                </div>
                            ) : remaining < allocateTarget.amount && (
                                <div className="rounded-lg bg-warning/10 border border-warning/30 px-3 py-2 text-xs text-warning">
                                    Not enough quota to fulfil the full request. You can allocate up to {remaining}.
                                </div>
                            )}

                            {/* Amount input */}
                            <div className="space-y-1.5">
                                <Label>Requests to Allocate</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max={remaining}
                                    value={allocateAmount}
                                    onChange={(e) => setAllocateAmount(e.target.value)}
                                    disabled={remaining === 0}
                                    placeholder="Enter amount…"
                                />
                                {remaining > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        Requested: {allocateTarget.amount} · Max you can grant: {remaining}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button
                            className="bg-brand-700 hover:bg-brand-800"
                            onClick={handleAllocate}
                            disabled={
                                allocating
                                || remaining === 0
                                || !allocateAmount
                                || parseInt(allocateAmount) <= 0
                            }
                        >
                            {allocating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Allocate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
