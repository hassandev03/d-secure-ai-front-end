"use client";

import { useState } from "react";
import { Loader2, Plus, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import QuotaBar from "@/components/shared/QuotaBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";

const currentQuota = { used: 1200, total: 1500, renewsAt: "2026-01-01" };

const pastRequests = [
    { id: 1, amount: 300, reason: "Q3 hackathon week", status: "APPROVED", date: "2025-10-05", respondedBy: "Org Admin" },
    { id: 2, amount: 200, reason: "New team members onboarding", status: "APPROVED", date: "2025-09-12", respondedBy: "Org Admin" },
    { id: 3, amount: 500, reason: "Load testing project", status: "DENIED", date: "2025-08-20", respondedBy: "Org Admin" },
];

const statusColors: Record<string, string> = {
    APPROVED: "bg-success/10 text-success border-success/20",
    DENIED: "bg-danger/10 text-danger border-danger/20",
    PENDING: "bg-warning/10 text-warning border-warning/20",
};

export default function QuotaRequestsPage() {
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 600));
        setSubmitting(false);
        toast.success("Quota request submitted to Org Admin!");
    };

    return (
        <div className="mx-auto max-w-5xl">
            <PageHeader
                title="Quota Requests"
                subtitle="Request additional AI quota for your department."
                breadcrumbs={[{ label: "Dept Admin", href: "/da/dashboard" }, { label: "Quota Requests" }]}
                actions={
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-brand-700 hover:bg-brand-800"><ArrowUpRight className="mr-2 h-4 w-4" />New Request</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Request Quota Increase</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2"><Label>Additional Requests Needed</Label><Input type="number" placeholder="500" /></div>
                                <div className="space-y-2"><Label>Reason</Label><textarea className="w-full rounded-lg border border-border bg-transparent p-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" rows={3} placeholder="Explain why your department needs more quota..." /></div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                <Button className="bg-brand-700 hover:bg-brand-800" onClick={handleSubmit} disabled={submitting}>
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Request
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                }
            />

            {/* Current quota */}
            <Card className="mb-6">
                <CardHeader><CardTitle className="text-base font-semibold">Current Department Quota</CardTitle><CardDescription>Renews {currentQuota.renewsAt}</CardDescription></CardHeader>
                <CardContent><QuotaBar used={currentQuota.used} total={currentQuota.total} label="Monthly AI Requests" /></CardContent>
            </Card>

            {/* History */}
            <Card>
                <CardHeader><CardTitle className="text-base font-semibold">Request History</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {pastRequests.map((req) => (
                            <div key={req.id} className="rounded-lg border border-border p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium">+{req.amount} requests</p>
                                            <Badge variant="outline" className={statusColors[req.status]}>{req.status.charAt(0) + req.status.slice(1).toLowerCase()}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">{req.reason}</p>
                                        <p className="text-xs text-muted-foreground mt-2">{req.date} · Responded by {req.respondedBy}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
