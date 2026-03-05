"use client";

import { useState } from "react";
import { Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import QuotaBar from "@/components/shared/QuotaBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";

const orgQuota = { used: 3200, total: 5000, plan: "Enterprise", renewsAt: "2026-01-01" };

const deptQuotas = [
    { name: "Engineering", used: 1200, total: 1500, employees: 45 },
    { name: "Marketing", used: 600, total: 800, employees: 20 },
    { name: "Sales", used: 500, total: 700, employees: 25 },
    { name: "Finance", used: 400, total: 600, employees: 12 },
    { name: "HR", used: 200, total: 400, employees: 10 },
    { name: "Operations", used: 300, total: 1000, employees: 8 },
];

const pendingRequests = [
    { id: 1, department: "Engineering", requestedBy: "Sarah Johnson", amount: 500, reason: "Year-end sprint — need additional capacity", status: "PENDING" },
    { id: 2, department: "Marketing", requestedBy: "Emma Davis", amount: 200, reason: "Campaign content generation", status: "PENDING" },
];

export default function QuotaManagementPage() {
    const [loading, setLoading] = useState<number | null>(null);

    const handleApprove = async (id: number) => {
        setLoading(id);
        await new Promise((r) => setTimeout(r, 500));
        toast.success("Quota request approved!");
        setLoading(null);
    };

    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader
                title="Quota Management"
                subtitle="Allocate and manage AI request quotas across departments."
                breadcrumbs={[{ label: "Organization", href: "/oa/dashboard" }, { label: "Quota Management" }]}
            />

            {/* Org-level quota */}
            <Card className="mb-6">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <div>
                        <CardTitle className="text-base font-semibold">Organization Quota</CardTitle>
                        <CardDescription>{orgQuota.plan} plan · Renews {orgQuota.renewsAt}</CardDescription>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild><Button variant="outline"><ArrowUpRight className="mr-2 h-4 w-4" />Request Increase</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Request Quota Increase</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2"><Label>Additional Requests</Label><Input type="number" placeholder="1000" /></div>
                                <div className="space-y-2"><Label>Reason</Label><textarea className="w-full rounded-lg border border-border bg-transparent p-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" rows={3} placeholder="Explain why you need more quota..." /></div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                <Button className="bg-brand-700 hover:bg-brand-800" onClick={() => toast.success("Request submitted to platform admin!")}>Submit Request</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <QuotaBar used={orgQuota.used} total={orgQuota.total} label="Monthly AI Requests" />
                </CardContent>
            </Card>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
                <Card className="mb-6 border-warning/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            Pending Quota Requests
                            <Badge variant="secondary" className="bg-warning/10 text-warning">{pendingRequests.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {pendingRequests.map((req) => (
                                <div key={req.id} className="rounded-lg border border-border p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium">{req.department} — +{req.amount} requests</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Requested by {req.requestedBy}</p>
                                            <p className="text-sm text-muted-foreground mt-2">{req.reason}</p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => handleApprove(req.id)} disabled={loading === req.id}>
                                                {loading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
                                            </Button>
                                            <Button size="sm" variant="outline" className="text-danger hover:text-danger">Deny</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Department allocations */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Department Allocations</CardTitle>
                    <CardDescription>Distribute quota across departments. Total allocated must not exceed org quota.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Department</TableHead>
                                <TableHead>Employees</TableHead>
                                <TableHead>Allocated</TableHead>
                                <TableHead>Used</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead className="w-24" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deptQuotas.map((dept) => (
                                <TableRow key={dept.name}>
                                    <TableCell className="font-medium">{dept.name}</TableCell>
                                    <TableCell className="text-sm">{dept.employees}</TableCell>
                                    <TableCell className="text-sm">{dept.total.toLocaleString()}</TableCell>
                                    <TableCell className="text-sm">{dept.used.toLocaleString()}</TableCell>
                                    <TableCell className="w-40"><QuotaBar used={dept.used} total={dept.total} showLabel={false} size="sm" /></TableCell>
                                    <TableCell><Button variant="ghost" size="sm">Edit</Button></TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="bg-muted/30">
                                <TableCell className="font-semibold">Total</TableCell>
                                <TableCell className="text-sm font-semibold">{deptQuotas.reduce((a, d) => a + d.employees, 0)}</TableCell>
                                <TableCell className="text-sm font-semibold">{deptQuotas.reduce((a, d) => a + d.total, 0).toLocaleString()}</TableCell>
                                <TableCell className="text-sm font-semibold">{deptQuotas.reduce((a, d) => a + d.used, 0).toLocaleString()}</TableCell>
                                <TableCell colSpan={2} />
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
