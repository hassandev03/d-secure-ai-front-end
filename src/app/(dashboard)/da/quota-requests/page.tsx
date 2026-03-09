"use client";

import { useState } from "react";
import { Loader2, ArrowUpRight, CheckCircle2, XCircle, Clock, Users } from "lucide-react";
import { toast } from "sonner";
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

// ── Types ─────────────────────────────────────────────────────
type RequestStatus = "PENDING" | "APPROVED" | "DENIED";

type EmployeeRequest = {
    id: number;
    name: string;
    email: string;
    amount: number;
    reason: string;
    date: string;
    status: RequestStatus;
};

type OrgRequest = {
    id: number;
    amount: number;
    reason: string;
    status: RequestStatus;
    date: string;
    respondedBy: string;
};

// ── Mock data ─────────────────────────────────────────────────
const currentQuota = { used: 1200, total: 1500, renewsAt: "2026-01-01" };

const initialEmployeeRequests: EmployeeRequest[] = [
    { id: 1, name: "Tom Baker",    email: "tom@acme.com",   amount: 150, reason: "Machine learning project requires additional prompt quota.",     date: "2025-12-28", status: "PENDING" },
    { id: 2, name: "Emily Zhao",   email: "emily@acme.com", amount:  50, reason: "Year-end analysis and reporting tasks.",                        date: "2025-12-27", status: "PENDING" },
    { id: 3, name: "Raj Patel",    email: "raj@acme.com",   amount: 100, reason: "Automated code-review workflows.",                             date: "2025-12-20", status: "APPROVED" },
    { id: 4, name: "John Miller",  email: "john@acme.com",  amount:  80, reason: "Documentation generation sprint.",                             date: "2025-12-15", status: "DENIED" },
];

const initialOrgRequests: OrgRequest[] = [
    { id: 1, amount: 300, reason: "Q3 hackathon week",              status: "APPROVED", date: "2025-10-05", respondedBy: "Org Admin" },
    { id: 2, amount: 200, reason: "New team members onboarding",    status: "APPROVED", date: "2025-09-12", respondedBy: "Org Admin" },
    { id: 3, amount: 500, reason: "Load testing project",           status: "DENIED",   date: "2025-08-20", respondedBy: "Org Admin" },
];

// ── Helpers ───────────────────────────────────────────────────
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
    const [submitting, setSubmitting] = useState(false);
    const [newAmount,  setNewAmount]  = useState("");
    const [newReason,  setNewReason]  = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);

    const [empRequests, setEmpRequests] = useState<EmployeeRequest[]>(initialEmployeeRequests);
    const [orgRequests, setOrgRequests] = useState<OrgRequest[]>(initialOrgRequests);

    const pendingCount = empRequests.filter((r) => r.status === "PENDING").length;

    // Approve / Deny employee request
    const handleDecision = (id: number, decision: "APPROVED" | "DENIED") => {
        setEmpRequests((prev) =>
            prev.map((r) => r.id === id ? { ...r, status: decision } : r),
        );
        const name = empRequests.find((r) => r.id === id)?.name;
        toast.success(`Request from ${name} ${decision === "APPROVED" ? "approved" : "denied"}.`);
    };

    // Submit new request to Org Admin
    const handleSubmit = async () => {
        if (!newAmount || !newReason.trim()) {
            toast.error("Please fill in both fields.");
            return;
        }
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 700));
        const newReq: OrgRequest = {
            id: Date.now(),
            amount: parseInt(newAmount),
            reason: newReason.trim(),
            status: "PENDING",
            date: new Date().toISOString().split("T")[0],
            respondedBy: "—",
        };
        setOrgRequests((prev) => [newReq, ...prev]);
        setNewAmount(""); setNewReason("");
        setDialogOpen(false);
        setSubmitting(false);
        toast.success("Quota request submitted to Org Admin!");
    };

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
                                    <Label>Additional Requests Needed</Label>
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

            {/* Current quota */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Current Department Quota</CardTitle>
                    <CardDescription>Renews {currentQuota.renewsAt}</CardDescription>
                </CardHeader>
                <CardContent>
                    <QuotaBar used={currentQuota.used} total={currentQuota.total} label="Monthly AI Requests" />
                </CardContent>
            </Card>

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
                    <CardDescription>Approve or deny additional quota requests submitted by your team members.</CardDescription>
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
                                        req.status === "PENDING"  ? "border-warning/30 bg-warning/5"
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
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-sm font-medium text-brand-700">+{req.amount} requests</span>
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
                                                    onClick={() => handleDecision(req.id, "APPROVED")}
                                                >
                                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-danger/40 text-danger hover:bg-danger/10 hover:text-danger"
                                                    onClick={() => handleDecision(req.id, "DENIED")}
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
                                            <p className="text-sm font-medium">+{req.amount} requests</p>
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
        </div>
    );
}
