"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
    Search, Users, Download, MoreHorizontal, Briefcase,
    X, RefreshCw, ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getProfessionals, updateProfessionalStatus, resetProfessionalPassword } from "@/services/sa.service";
import type { SAProfessional, ProfessionalStatus } from "@/types/sa.types";

const planColors: Record<string, string> = {
    FREE: "bg-muted text-muted-foreground",
    PRO:  "bg-brand-100 text-brand-800 border-brand-200",
    MAX:  "bg-gradient-to-r from-brand-600 to-indigo-600 text-white border-transparent",
};

const PAGE_SIZE = 8;

export default function ProfessionalsPage() {
    const [pros, setPros] = useState<SAProfessional[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [planFilter, setPlanFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [industryFilter, setIndustryFilter] = useState("all");
    const [page, setPage] = useState(1);

    useEffect(() => {
        getProfessionals().then((data) => {
            setPros(data);
            setLoading(false);
        });
    }, []);

    const resetPage = () => setPage(1);

    const industries = useMemo(() => Array.from(new Set(pros.map((p) => p.industry))), [pros]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return pros.filter((p) => {
            const matchSearch = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
            const matchPlan = planFilter === "all" || p.plan === planFilter;
            const matchStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter.toLowerCase();
            const matchIndustry = industryFilter === "all" || p.industry === industryFilter;
            return matchSearch && matchPlan && matchStatus && matchIndustry;
        });
    }, [pros, search, planFilter, statusFilter, industryFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const hasActiveFilters = search || planFilter !== "all" || statusFilter !== "all" || industryFilter !== "all";
    const clearAll = () => { setSearch(""); setPlanFilter("all"); setStatusFilter("all"); setIndustryFilter("all"); resetPage(); };

    const activeCount = pros.filter((p) => p.status === "ACTIVE").length;
    const suspendedCount = pros.filter((p) => p.status === "SUSPENDED").length;
    const unverifiedCount = pros.filter((p) => p.status === "UNVERIFIED").length;

    const handleStatusChange = async (proId: string, proName: string, newStatus: ProfessionalStatus) => {
        const updated = await updateProfessionalStatus(proId, newStatus);
        if (updated) {
            setPros((prev) => prev.map((p) => p.id === proId ? { ...p, status: newStatus } : p));
            toast.success(`${proName} status changed to ${newStatus.toLowerCase()}.`);
        }
    };

    const handleResetPassword = async (proId: string, proEmail: string) => {
        const result = await resetProfessionalPassword(proId);
        if (result.success) {
            toast.success(`Password reset email sent to ${proEmail}.`);
        }
    };

    const handleExport = () => {
        const rows = [
            ["Name", "Email", "Job Title", "Industry", "Plan", "Status", "creditsUsed", "Joined"],
            ...filtered.map((p) => [p.name, p.email, p.jobTitle, p.industry, p.plan, p.status, p.creditsUsed, p.joinedAt]),
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "professionals.csv"; a.click();
        URL.revokeObjectURL(url);
        toast.success("Professionals list exported.");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <PageHeader
                title="Professionals Directory"
                subtitle={`${pros.length} independent professionals using the platform.`}
                breadcrumbs={[{ label: "Super Admin", href: "/sa/dashboard" }, { label: "Professionals" }]}
                actions={
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                }
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{pros.length}</p><p className="text-xs text-muted-foreground mt-0.5">Total</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-success">{activeCount}</p><p className="text-xs text-muted-foreground mt-0.5">Active</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-warning">{unverifiedCount}</p><p className="text-xs text-muted-foreground mt-0.5">Unverified</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-danger">{suspendedCount}</p><p className="text-xs text-muted-foreground mt-0.5">Suspended</p></CardContent></Card>
            </div>

            <Card>
                <CardContent className="p-4 space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email…"
                                className="pl-9"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); resetPage(); }}>
                                <SelectTrigger className="w-36"><SelectValue placeholder="Plan" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Plans</SelectItem>
                                    <SelectItem value="FREE">Free</SelectItem>
                                    <SelectItem value="PRO">Pro</SelectItem>
                                    <SelectItem value="MAX">Max</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
                                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="unverified">Unverified</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                    <SelectItem value="deactivated">Deactivated</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={industryFilter} onValueChange={(v) => { setIndustryFilter(v); resetPage(); }}>
                                <SelectTrigger className="w-40"><SelectValue placeholder="Industry" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Industries</SelectItem>
                                    {industries.map((ind) => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                            <span className="text-xs text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
                            {search && (
                                <Badge variant="secondary" className="text-xs cursor-pointer gap-1" onClick={() => { setSearch(""); resetPage(); }}>
                                    &ldquo;{search}&rdquo; <X className="h-3 w-3" />
                                </Badge>
                            )}
                            {planFilter !== "all" && (
                                <Badge variant="secondary" className="text-xs cursor-pointer gap-1" onClick={() => { setPlanFilter("all"); resetPage(); }}>
                                    {planFilter} <X className="h-3 w-3" />
                                </Badge>
                            )}
                            {statusFilter !== "all" && (
                                <Badge variant="secondary" className="text-xs cursor-pointer gap-1" onClick={() => { setStatusFilter("all"); resetPage(); }}>
                                    {statusFilter} <X className="h-3 w-3" />
                                </Badge>
                            )}
                            {industryFilter !== "all" && (
                                <Badge variant="secondary" className="text-xs cursor-pointer gap-1" onClick={() => { setIndustryFilter("all"); resetPage(); }}>
                                    {industryFilter} <X className="h-3 w-3" />
                                </Badge>
                            )}
                            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-1" onClick={clearAll}>
                                <RefreshCw className="h-3 w-3" /> Clear all
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Professional</TableHead>
                                <TableHead>Role &amp; Industry</TableHead>
                                <TableHead className="text-center">Plan</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-center">creditsUsed</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.map((p) => (
                                <TableRow key={p.id} className="group">
                                    <TableCell>
                                        <Link href={`/sa/professionals/${p.id}`} className="flex items-center gap-3 w-fit">
                                            <Avatar className="h-9 w-9 border border-border/50">
                                                <AvatarFallback className="bg-brand-50 text-xs font-bold text-brand-700">
                                                    {p.name.split(" ").map((n) => n[0]).join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-foreground group-hover:text-brand-600 transition-colors">{p.name}</p>
                                                <p className="text-xs text-muted-foreground">{p.email}</p>
                                            </div>
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium flex items-center gap-1.5">
                                                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />{p.jobTitle}
                                            </span>
                                            <span className="text-xs text-muted-foreground ml-5">{p.industry}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={`border ${planColors[p.plan]}`}>{p.plan}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center"><StatusBadge status={p.status} /></div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="text-sm font-medium">{p.creditsUsed.toLocaleString()}</span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(p.joinedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <Link href={`/sa/professionals/${p.id}`}>
                                                    <DropdownMenuItem className="cursor-pointer">View Full Profile</DropdownMenuItem>
                                                </Link>
                                                <DropdownMenuItem className="cursor-pointer" onClick={() => toast.info(`Email sent to ${p.email}`)}>Email Professional</DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleResetPassword(p.id, p.email)}>Reset Password</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {p.status !== "ACTIVE" && (
                                                    <DropdownMenuItem className="cursor-pointer text-success focus:text-success" onClick={() => handleStatusChange(p.id, p.name, "ACTIVE")}>
                                                        Activate
                                                    </DropdownMenuItem>
                                                )}
                                                {p.status !== "SUSPENDED" && p.status !== "DEACTIVATED" && (
                                                    <DropdownMenuItem className="text-warning cursor-pointer focus:text-warning" onClick={() => handleStatusChange(p.id, p.name, "SUSPENDED")}>
                                                        Suspend Account
                                                    </DropdownMenuItem>
                                                )}
                                                {p.status !== "DEACTIVATED" && (
                                                    <DropdownMenuItem className="text-danger cursor-pointer focus:bg-danger/10 focus:text-danger" onClick={() => handleStatusChange(p.id, p.name, "DEACTIVATED")}>
                                                        Deactivate Account
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {paginated.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-14 text-center">
                                        <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
                                        <p className="mt-2 text-sm font-medium">No professionals found</p>
                                        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters.</p>
                                        <Button variant="outline" size="sm" className="mt-4" onClick={clearAll}>Clear Filters</Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                            <Button
                                key={n}
                                variant={n === page ? "default" : "outline"}
                                size="sm"
                                className={n === page ? "bg-brand-700 text-white w-8" : "w-8"}
                                onClick={() => setPage(n)}
                            >{n}</Button>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
