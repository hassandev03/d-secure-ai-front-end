"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Loader2, ArrowUpRight, CheckCircle2, XCircle, Clock,
    Building2, TrendingUp, Pencil, Activity, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import QuotaGauge from "@/components/shared/QuotaGauge";
import StatCard from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogClose,
} from "@/components/ui/dialog";

import {
    getOAOrgConfig, getOADepartments, getOAQuotaRequests,
    type OAOrgConfig, type OADepartment, type OAQuotaRequest,
} from "@/services/oa.service";

// ── Type aliases (keep existing variable names working) ───────────────────────

type ReqStatus      = OAQuotaRequest["status"];
type DeptAllocation = OADepartment;
type DeptQuotaRequest = OAQuotaRequest;

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const STATUS_COLOUR: Record<ReqStatus, string> = {
    APPROVED: "bg-success/10 text-success border-success/20",
    DENIED:   "bg-danger/10  text-danger  border-danger/20",
    PENDING:  "bg-warning/10 text-warning border-warning/20",
};

const STATUS_ICON: Record<ReqStatus, React.ReactNode> = {
    APPROVED: <CheckCircle2 className="h-4 w-4 text-success" />,
    DENIED:   <XCircle      className="h-4 w-4 text-danger"  />,
    PENDING:  <Clock        className="h-4 w-4 text-warning" />,
};

function quotaHealth(percentageUsed: number) {
    if (percentageUsed < 70) return { label: "Normal",   cls: "bg-success/10 text-success border-success/20" };
    if (percentageUsed < 90) return { label: "Warning",  cls: "bg-warning/10 text-warning border-warning/20" };
    return              { label: "Critical",  cls: "bg-danger/10  text-danger  border-danger/20"  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function QuotaManagementPage() {
    const [orgConfig, setOrgConfig] = useState<OAOrgConfig | null>(null);
    const [depts,    setDepts]    = useState<DeptAllocation[]>([]);
    const [requests, setRequests] = useState<DeptQuotaRequest[]>([]);

    useEffect(() => {
        getOAOrgConfig().then(setOrgConfig);
        getOADepartments().then(setDepts);
        getOAQuotaRequests().then(setRequests);
    }, []);

    // Approve dialog
    const [approveTarget,  setApproveTarget]  = useState<DeptQuotaRequest | null>(null);
    const [approveAmount,  setApproveAmount]  = useState("");
    const [approving,      setApproving]      = useState(false);

    // Deny dialog
    const [denyTarget,  setDenyTarget]  = useState<DeptQuotaRequest | null>(null);
    const [denying,     setDenying]     = useState(false);

    // Edit allocation dialog
    const [editTarget,  setEditTarget]  = useState<DeptAllocation | null>(null);
    const [editAmount,  setEditAmount]  = useState("");
    const [editing,     setEditing]     = useState(false);

    // Request platform increase dialog
    const [requestOpen,  setRequestOpen]  = useState(false);
    const [reqAmount,    setReqAmount]    = useState("");
    const [reqReason,    setReqReason]    = useState("");
    const [requesting,   setRequesting]   = useState(false);

    // ── Derived ─────────────────────────────────────────────────────────────

    const totalAllocated = useMemo(() => depts.reduce((s, d) => s + d.budget, 0), [depts]);
    const totalUsedCredits = useMemo(() => depts.reduce((s, d) => s + (d.budget * d.percentageUsed / 100), 0), [depts]);
    const orgTotalBudget = orgConfig?.totalBudget ?? 0;
    const orgPercentageUsed = orgTotalBudget > 0 ? (totalUsedCredits / orgTotalBudget) * 100 : 0;
    const unallocated    = orgTotalBudget - totalAllocated;

    const pendingRequests  = requests.filter((r) => r.status === "PENDING");
    const historyRequests  = requests.filter((r) => r.status !== "PENDING");

    // ── Handlers ────────────────────────────────────────────────────────────

    const openApprove = (req: DeptQuotaRequest) => {
        setApproveTarget(req);
        setApproveAmount(String(Math.min(req.amount, Math.max(0, unallocated))));
    };

    const handleApprove = async () => {
        if (!approveTarget) return;
        const val = parseInt(approveAmount);
        if (!val || val <= 0) { toast.error("Amount must be at least 1."); return; }
        if (val > unallocated) { toast.error(`Only ${unallocated.toLocaleString()} unallocated budget available.`); return; }
        setApproving(true);
        await new Promise((r) => setTimeout(r, 700));
        const granted = val;
        setRequests((prev) => prev.map((r) =>
            r.id === approveTarget.id
                ? { ...r, status: "APPROVED" as const, grantedAmount: granted, respondedAt: new Date().toISOString().split('T')[0] }
                : r,
        ));
        setDepts((prev) => prev.map((d) =>
            d.id === approveTarget.deptId
                ? { ...d, budget: d.budget + granted }
                : d,
        ));
        const partial = granted < approveTarget.amount;
        toast.success(
            partial
                ? `Partially approved: +${granted} credits of ${approveTarget.amount} allocated to ${approveTarget.deptName}.`
                : `Approved +${granted} credits for ${approveTarget.deptName}.`,
        );
        setApproveTarget(null);
        setApproving(false);
    };

    const handleDeny = async () => {
        if (!denyTarget) return;
        setDenying(true);
        await new Promise((r) => setTimeout(r, 500));
        setRequests((prev) => prev.map((r) =>
            r.id === denyTarget.id
                ? { ...r, status: "DENIED" as const, respondedAt: new Date().toISOString().split('T')[0] }
                : r,
        ));
        toast.success(`Quota request from ${denyTarget.deptName} denied.`);
        setDenyTarget(null);
        setDenying(false);
    };

    const openEdit = (dept: DeptAllocation) => {
        setEditTarget(dept);
        setEditAmount(String(dept.budget));
    };

    const handleEditSave = async () => {
        if (!editTarget) return;
        const val = parseInt(editAmount);
        const currentUsed = editTarget.budget * (editTarget.percentageUsed / 100);
        if (!val || val < currentUsed) {
            toast.error(`Budget cannot be less than current usage (${Math.round(currentUsed).toLocaleString()}).`);
            return;
        }
        const diff = val - editTarget.budget;
        if (diff > 0 && diff > unallocated) {
            toast.error(`Only ${unallocated.toLocaleString()} unallocated budget remaining.`);
            return;
        }
        setEditing(true);
        await new Promise((r) => setTimeout(r, 600));
        setDepts((prev) => prev.map((d) =>
            d.id === editTarget.id ? { ...d, budget: val, percentageUsed: val > 0 ? (currentUsed / val) * 100 : 0 } : d,
        ));
        toast.success(`${editTarget.name} budget updated to ${val.toLocaleString()} credits.`);
        setEditTarget(null);
        setEditing(false);
    };

    const handleRequestPlatform = async () => {
        if (!reqAmount || !reqReason.trim()) { toast.error("Please fill in both fields."); return; }
        setRequesting(true);
        await new Promise((r) => setTimeout(r, 700));
        toast.success("Budget increase request submitted to Platform Admin!");
        setReqAmount(""); setReqReason("");
        setRequestOpen(false);
        setRequesting(false);
    };

    // Edit dialog derived
    const editVal        = parseInt(editAmount || "0");
    const editDiff       = editTarget ? editVal - editTarget.budget : 0;
    const editWouldExceed = editDiff > 0 && editDiff > unallocated;

    // ── JSX ─────────────────────────────────────────────────────────────────

    if (!orgConfig || depts.length === 0) return null;

    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader
                title="Quota Management"
                subtitle="Manage AI credit budgets across your organisation and act on department requests."
                breadcrumbs={[{ label: "Organization", href: "/oa/dashboard" }, { label: "Quota Management" }]}
                actions={
                    <Button variant="outline" onClick={() => setRequestOpen(true)}>
                        <ArrowUpRight className="mr-2 h-4 w-4" /> Request Platform Increase
                    </Button>
                }
            />

            {/* ── Stat cards ──────────────────────────────────────────── */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    title="Total Org Budget"
                    value={orgConfig.totalBudget.toLocaleString()}
                    icon={Activity}
                    iconColor="text-brand-700 bg-brand-50"
                />
                <StatCard
                    title="Credits Used This Month"
                    value={Math.round(totalUsedCredits).toLocaleString()}
                    icon={TrendingUp}
                    iconColor="text-blue-600 bg-blue-50"
                />
                <StatCard
                    title="Unallocated Budget"
                    value={unallocated.toLocaleString()}
                    icon={Building2}
                    iconColor={unallocated < 500 ? "text-danger bg-danger/10" : "text-success bg-success/10"}
                />
                <StatCard
                    title="Pending Requests"
                    value={pendingRequests.length}
                    icon={Clock}
                    iconColor={pendingRequests.length > 0 ? "text-warning bg-warning/10" : "text-muted-foreground bg-muted"}
                />
            </div>

            {/* ── Org Quota Overview ──────────────────────────────────── */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold">Organisation Budget Overview</CardTitle>
                            <CardDescription>{orgConfig.plan} Plan · Renews {orgConfig.quotaRenewsAt}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs font-medium">{orgConfig.plan}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-center py-4">
                        <QuotaGauge
                            percentageUsed={orgPercentageUsed}
                            planName={orgConfig.plan}
                            renewsAt={orgConfig.quotaRenewsAt}
                            size="lg"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
                            <p className="mb-1 text-xs text-muted-foreground">Total Budget</p>
                            <p className="text-xl font-bold">{orgConfig.totalBudget.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
                            <p className="mb-1 text-xs text-muted-foreground">Allocated to Depts</p>
                            <p className="text-xl font-bold text-brand-700">{totalAllocated.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
                            <p className="mb-1 text-xs text-muted-foreground">Unallocated</p>
                            <p className={cn("text-xl font-bold", unallocated < 500 ? "text-danger" : "text-success")}>
                                {unallocated.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Pending Department Requests ─────────────────────────── */}
            {pendingRequests.length > 0 && (
                <Card className="mb-6 border-warning/30">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-warning" />
                            <CardTitle className="text-base font-semibold">Pending Department Requests</CardTitle>
                            <Badge className="border border-warning/30 bg-warning/15 text-xs text-warning">
                                {pendingRequests.length} pending
                            </Badge>
                        </div>
                        <CardDescription>
                            Review and respond to budget increase requests from department admins.
                            You may approve the full amount, a custom amount, or deny the request.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {pendingRequests.map((req) => {
                                const dept = depts.find((d) => d.id === req.deptId);
                                const usagePct = dept ? dept.percentageUsed.toFixed(1) : 0;
                                return (
                                    <div
                                        key={req.id}
                                        className="rounded-xl border border-warning/30 bg-warning/5 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex min-w-0 items-center gap-3">
                                                {dept && (
                                                    <div
                                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                                                        style={{ backgroundColor: dept.color }}
                                                    >
                                                        <Building2 className="h-5 w-5 text-white" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-sm font-semibold">{req.deptName}</p>
                                                        <span className="text-xs text-muted-foreground">via {req.requestedBy}</span>
                                                        <Badge variant="outline" className="border-warning/30 bg-warning/10 text-xs text-warning">
                                                            +{req.amount.toLocaleString()} credits requested
                                                        </Badge>
                                                    </div>
                                                    {dept && (
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            Current allocation: {dept.budget.toLocaleString()} · {usagePct}% used
                                                        </p>
                                                    )}
                                                    <p className="mt-1.5 text-sm text-muted-foreground">{req.reason}</p>
                                                    <p className="mt-1 text-xs text-muted-foreground">{req.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-success/40 text-success hover:bg-success/10 hover:text-success"
                                                    onClick={() => openApprove(req)}
                                                >
                                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-danger/40 text-danger hover:bg-danger/10 hover:text-danger"
                                                    onClick={() => setDenyTarget(req)}
                                                >
                                                    <XCircle className="mr-1.5 h-3.5 w-3.5" /> Deny
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Department Allocations ──────────────────────────────── */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold">Department Allocations</CardTitle>
                            <CardDescription>
                                Distribute and adjust budget across departments. Allocated&nbsp;
                                <span className="font-medium text-foreground">{totalAllocated.toLocaleString()}</span>
                                &nbsp;/&nbsp;{orgConfig.totalBudget.toLocaleString()} ·{" "}
                                <span className={cn("font-medium", unallocated < 500 ? "text-danger" : "text-success")}>
                                    {unallocated.toLocaleString()} unallocated
                                </span>
                            </CardDescription>
                        </div>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Department</TableHead>
                                <TableHead>Head</TableHead>
                                <TableHead className="text-right">Employees</TableHead>
                                <TableHead className="text-right">Allocated</TableHead>
                                <TableHead className="text-right">Used</TableHead>
                                <TableHead className="text-right">Remaining</TableHead>
                                <TableHead className="text-center">Usage</TableHead>
                                <TableHead>Health</TableHead>
                                <TableHead className="w-14" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {depts.map((dept) => {
                                const currentUsed = dept.budget * (dept.percentageUsed / 100);
                                const remaining = dept.budget - currentUsed;
                                const health = quotaHealth(dept.percentageUsed);
                                return (
                                    <TableRow key={dept.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full")} style={{ backgroundColor: dept.color }} />
                                                <span className="text-sm font-medium">{dept.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarFallback className="text-xs">{initials(dept.head)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-muted-foreground">{dept.head}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-sm">{dept.employees}</TableCell>
                                        <TableCell className="text-right text-sm font-medium">{dept.budget.toLocaleString()}</TableCell>
                                        <TableCell className="text-right text-sm">{Math.round(currentUsed).toLocaleString()}</TableCell>
                                        <TableCell className={cn(
                                            "text-right text-sm font-medium",
                                            remaining < dept.budget * 0.1  ? "text-danger"
                                            : remaining < dept.budget * 0.3 ? "text-warning"
                                            : "text-success",
                                        )}>
                                            {Math.round(remaining).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="w-32 flex justify-center py-2">
                                            <QuotaGauge
                                                percentageUsed={dept.percentageUsed}
                                                size="sm"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("text-xs", health.cls)}>
                                                {health.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 w-7 p-0"
                                                onClick={() => openEdit(dept)}
                                                title="Edit allocation"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {/* Totals row */}
                            <TableRow className="bg-muted/30">
                                <TableCell colSpan={2} className="text-sm font-semibold">Total</TableCell>
                                <TableCell className="text-right text-sm font-semibold">
                                    {depts.reduce((s, d) => s + d.employees, 0)}
                                </TableCell>
                                <TableCell className="text-right text-sm font-semibold">{totalAllocated.toLocaleString()}</TableCell>
                                <TableCell className="text-right text-sm font-semibold">{Math.round(totalUsedCredits).toLocaleString()}</TableCell>
                                <TableCell className="text-right text-sm font-semibold">
                                    {Math.round(totalAllocated - totalUsedCredits).toLocaleString()}
                                </TableCell>
                                <TableCell colSpan={3} />
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ── Request History ─────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Request History</CardTitle>
                    <CardDescription>All resolved quota requests from departments.</CardDescription>
                </CardHeader>
                <CardContent>
                    {historyRequests.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">No resolved requests yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {historyRequests.map((req) => (
                                <div
                                    key={req.id}
                                    className={cn(
                                        "rounded-xl border p-4",
                                        req.status === "APPROVED"
                                            ? "border-success/20 bg-success/5"
                                            : "border-danger/20 bg-danger/5",
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-semibold">{req.deptName}</p>
                                                <span className="text-xs text-muted-foreground">via {req.requestedBy}</span>
                                                {STATUS_ICON[req.status]}
                                                <Badge variant="outline" className={cn("text-xs", STATUS_COLOUR[req.status])}>
                                                    {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                                                </Badge>
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                {req.status === "APPROVED" && req.grantedAmount !== undefined && req.grantedAmount !== req.amount ? (
                                                    <span className="text-sm font-medium">
                                                        <span className="text-success">+{req.grantedAmount.toLocaleString()}</span>
                                                        <span className="text-xs text-muted-foreground"> of {req.amount.toLocaleString()} granted</span>
                                                    </span>
                                                ) : (
                                                    <span className={cn(
                                                        "text-sm font-medium",
                                                        req.status === "APPROVED" ? "text-success" : "text-danger",
                                                    )}>
                                                        {req.status === "APPROVED" ? "+" : ""}
                                                        {(req.grantedAmount ?? req.amount).toLocaleString()} credits
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs text-muted-foreground">{req.reason}</p>
                                            <p className="mt-1.5 text-xs text-muted-foreground">
                                                Requested {req.date}
                                                {req.respondedAt && ` · Responded ${req.respondedAt}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ================================================================
                Approve Dialog
                ================================================================ */}
            <Dialog
                open={approveTarget !== null}
                onOpenChange={(open) => { if (!open && !approving) setApproveTarget(null); }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Budget Request</DialogTitle>
                    </DialogHeader>
                    {approveTarget && (() => {
                        const dept = depts.find((d) => d.id === approveTarget.deptId);
                        return (
                            <div className="space-y-4 py-1">
                                <div className="space-y-1.5 rounded-lg border border-border bg-muted/50 p-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Department</span>
                                        <span className="font-medium">{approveTarget.deptName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Amount requested</span>
                                        <span className="font-medium">+{approveTarget.amount.toLocaleString()} credits</span>
                                    </div>
                                    {dept && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Current allocation</span>
                                            <span className="font-medium">{dept.budget.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Org unallocated</span>
                                        <span className={cn(
                                            "font-medium",
                                            unallocated === 0                          ? "text-danger"
                                            : unallocated < approveTarget.amount      ? "text-warning"
                                            : "text-success",
                                        )}>
                                            {unallocated.toLocaleString()} available
                                        </span>
                                    </div>
                                </div>

                                {unallocated === 0 ? (
                                    <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                                        No unallocated budget remaining. Request a platform increase before approving.
                                    </div>
                                ) : unallocated < approveTarget.amount && (
                                    <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                                        Insufficient budget for the full request. You can grant up to {unallocated.toLocaleString()}.
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label>Credits to Allocate</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max={unallocated}
                                        value={approveAmount}
                                        onChange={(e) => setApproveAmount(e.target.value)}
                                        disabled={unallocated === 0}
                                        placeholder="Enter amount…"
                                    />
                                    {unallocated > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            Requested: {approveTarget.amount.toLocaleString()} · Max you can grant: {unallocated.toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={approving}>Cancel</Button>
                        </DialogClose>
                        <Button
                            className="bg-brand-700 hover:bg-brand-800"
                            onClick={handleApprove}
                            disabled={approving || unallocated === 0 || !approveAmount || parseInt(approveAmount) <= 0}
                        >
                            {approving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Allocate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ================================================================
                Deny Confirmation Dialog
                ================================================================ */}
            <Dialog
                open={denyTarget !== null}
                onOpenChange={(open) => { if (!open && !denying) setDenyTarget(null); }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Deny Budget Request</DialogTitle>
                    </DialogHeader>
                    {denyTarget && (
                        <div className="space-y-3 py-1">
                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to deny the budget request from{" "}
                                <span className="font-semibold text-foreground">{denyTarget.deptName}</span>?
                            </p>
                            <div className="space-y-1 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Amount requested</span>
                                    <span className="font-medium">+{denyTarget.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Requested by</span>
                                    <span className="font-medium">{denyTarget.requestedBy}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Reason</span>
                                    <span className="max-w-50 text-right text-muted-foreground">{denyTarget.reason}</span>
                                </div>
                            </div>
                            <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">
                                This action cannot be undone. The department admin will be notified.
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={denying}>Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleDeny} disabled={denying}>
                            {denying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Deny Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ================================================================
                Edit Allocation Dialog
                ================================================================ */}
            <Dialog
                open={editTarget !== null}
                onOpenChange={(open) => { if (!open && !editing) setEditTarget(null); }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Department Allocation</DialogTitle>
                    </DialogHeader>
                    {editTarget && (() => {
                        const currentUsed = editTarget.budget * (editTarget.percentageUsed / 100);
                        return (
                            <div className="space-y-4 py-1">
                                <div className="space-y-1.5 rounded-lg border border-border bg-muted/50 p-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Department</span>
                                        <span className="font-medium">{editTarget.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Current allocation</span>
                                        <span className="font-medium">{editTarget.budget.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Currently used</span>
                                        <span className="font-medium">{Math.round(currentUsed).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Org unallocated</span>
                                        <span className={cn("font-medium", unallocated < 200 ? "text-warning" : "text-success")}>
                                            {unallocated.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {editWouldExceed && (
                                    <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                                        This increase requires {editDiff.toLocaleString()} more but only{" "}
                                        {unallocated.toLocaleString()} is unallocated.
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label>New Budget Allocation</Label>
                                    <Input
                                        type="number"
                                        min={Math.round(currentUsed)}
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        placeholder="Enter new total budget…"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Minimum: {Math.round(currentUsed).toLocaleString()} (current usage) ·{" "}
                                        Max increase: +{unallocated.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        );
                    })()}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={editing}>Cancel</Button>
                        </DialogClose>
                        <Button
                            className="bg-brand-700 hover:bg-brand-800"
                            onClick={handleEditSave}
                            disabled={editing || !editAmount || editWouldExceed}
                        >
                            {editing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ================================================================
                Request Platform Increase Dialog
                ================================================================ */}
            <Dialog
                open={requestOpen}
                onOpenChange={(open) => { if (!open && !requesting) setRequestOpen(open); }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Platform Budget Increase</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="space-y-2">
                            <Label>Additional Credits Needed</Label>
                            <Input
                                type="number"
                                placeholder="5000"
                                value={reqAmount}
                                onChange={(e) => setReqAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <textarea
                                className="w-full rounded-lg border border-border bg-transparent p-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                rows={3}
                                placeholder="Explain why your organisation needs more budget…"
                                value={reqReason}
                                onChange={(e) => setReqReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={requesting}>Cancel</Button>
                        </DialogClose>
                        <Button
                            className="bg-brand-700 hover:bg-brand-800"
                            onClick={handleRequestPlatform}
                            disabled={requesting}
                        >
                            {requesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
