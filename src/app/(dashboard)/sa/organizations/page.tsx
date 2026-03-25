"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Building2, Download, X, RefreshCw, ChevronLeft, ChevronRight, MoreHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import QuotaBar from "@/components/shared/QuotaBar";
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
import { getOrganizations, updateOrganizationStatus } from "@/services/sa.service";
import type { SAOrganization, OrgStatus } from "@/types/sa.types";

const PAGE_SIZE = 8;

export default function OrganizationsPage() {
    const [orgs, setOrgs] = useState<SAOrganization[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [industryFilter, setIndustryFilter] = useState("all");
    const [countryFilter, setCountryFilter] = useState("all");
    const [page, setPage] = useState(1);

    useEffect(() => {
        getOrganizations().then((data) => {
            setOrgs(data);
            setLoading(false);
        });
    }, []);

    const resetPage = () => setPage(1);

    const industries = useMemo(() => Array.from(new Set(orgs.map((o) => o.industry))), [orgs]);
    const countries = useMemo(() => Array.from(new Set(orgs.map((o) => o.country))), [orgs]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return orgs.filter((org) => {
            const matchSearch = !q || org.name.toLowerCase().includes(q) || org.domain.toLowerCase().includes(q);
            const matchStatus = statusFilter === "all" || org.status.toLowerCase() === statusFilter.toLowerCase();
            const matchIndustry = industryFilter === "all" || org.industry === industryFilter;
            const matchCountry = countryFilter === "all" || org.country === countryFilter;
            return matchSearch && matchStatus && matchIndustry && matchCountry;
        });
    }, [orgs, search, statusFilter, industryFilter, countryFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const hasActiveFilters = search || statusFilter !== "all" || industryFilter !== "all" || countryFilter !== "all";
    const clearAll = () => { setSearch(""); setStatusFilter("all"); setIndustryFilter("all"); setCountryFilter("all"); resetPage(); };

    const activeCount = orgs.filter((o) => o.status === "ACTIVE").length;
    const onboardingCount = orgs.filter((o) => o.status === "ONBOARDING").length;
    const suspendedCount = orgs.filter((o) => o.status === "SUSPENDED").length;

    const handleStatusChange = async (orgId: string, orgName: string, newStatus: OrgStatus) => {
        const updated = await updateOrganizationStatus(orgId, newStatus);
        if (updated) {
            setOrgs((prev) => prev.map((o) => o.id === orgId ? { ...o, status: newStatus } : o));
            toast.success(`${orgName} status changed to ${newStatus.toLowerCase()}.`);
        }
    };

    const handleExport = () => {
        const rows = [
            ["Name", "Domain", "Industry", "Country", "Status", "Plan", "Employees", "Quota Used", "Quota Total", "Registered"],
            ...filtered.map((o) => [o.name, o.domain, o.industry, o.country, o.status, o.plan, o.employees, o.quota.used, o.quota.total, o.registeredAt]),
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "organizations.csv"; a.click();
        URL.revokeObjectURL(url);
        toast.success("Organizations list exported.");
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
                title="Organizations Directory"
                subtitle={`${orgs.length} registered organizations across the platform.`}
                breadcrumbs={[{ label: "Super Admin", href: "/sa/dashboard" }, { label: "Organizations" }]}
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                        <Link href="/sa/organizations/register">
                            <Button className="bg-brand-600 hover:bg-brand-700 text-white">
                                <Plus className="mr-2 h-4 w-4" /> Register Organization
                            </Button>
                        </Link>
                    </div>
                }
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{orgs.length}</p><p className="text-xs text-muted-foreground mt-0.5">Total</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-success">{activeCount}</p><p className="text-xs text-muted-foreground mt-0.5">Active</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-info">{onboardingCount}</p><p className="text-xs text-muted-foreground mt-0.5">Onboarding</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-danger">{suspendedCount}</p><p className="text-xs text-muted-foreground mt-0.5">Suspended</p></CardContent></Card>
            </div>

            <Card>
                <CardContent className="p-4 space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or domain…"
                                className="pl-9"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
                                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="onboarding">Onboarding</SelectItem>
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
                            <Select value={countryFilter} onValueChange={(v) => { setCountryFilter(v); resetPage(); }}>
                                <SelectTrigger className="w-36"><SelectValue placeholder="Country" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Countries</SelectItem>
                                    {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                            {countryFilter !== "all" && (
                                <Badge variant="secondary" className="text-xs cursor-pointer gap-1" onClick={() => { setCountryFilter("all"); resetPage(); }}>
                                    {countryFilter} <X className="h-3 w-3" />
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
                                <TableHead>Organization</TableHead>
                                <TableHead>Industry &amp; Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Employees</TableHead>
                                <TableHead>Quota Usage</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead className="text-right">Registered</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.map((org) => (
                                <TableRow key={org.id} className="group hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <Link href={`/sa/organizations/${org.id}`} className="flex items-center gap-3 w-fit">
                                            <Avatar className="h-9 w-9 border border-border/50">
                                                <AvatarFallback className="bg-brand-50 text-xs font-bold text-brand-700">
                                                    {org.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-foreground group-hover:text-brand-600 transition-colors">{org.name}</p>
                                                <p className="text-xs text-muted-foreground">{org.domain}</p>
                                            </div>
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm font-medium">{org.industry}</p>
                                        <p className="text-xs text-muted-foreground">{org.country}</p>
                                    </TableCell>
                                    <TableCell><StatusBadge status={org.status} /></TableCell>
                                    <TableCell className="text-center">
                                        <span className="text-sm font-medium">{org.employees}</span>
                                    </TableCell>
                                    <TableCell className="w-44">
                                        <QuotaBar used={org.quota.used} total={org.quota.total} size="sm" />
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium text-foreground/80">{org.plan}</span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground text-right">
                                        {new Date(org.registeredAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <Link href={`/sa/organizations/${org.id}`}>
                                                    <DropdownMenuItem className="cursor-pointer">View Details</DropdownMenuItem>
                                                </Link>
                                                <DropdownMenuSeparator />
                                                {org.status !== "ACTIVE" && (
                                                    <DropdownMenuItem className="cursor-pointer text-success focus:text-success" onClick={() => handleStatusChange(org.id, org.name, "ACTIVE")}>
                                                        Activate
                                                    </DropdownMenuItem>
                                                )}
                                                {org.status !== "SUSPENDED" && org.status !== "DEACTIVATED" && (
                                                    <DropdownMenuItem className="cursor-pointer text-warning focus:text-warning" onClick={() => handleStatusChange(org.id, org.name, "SUSPENDED")}>
                                                        Suspend
                                                    </DropdownMenuItem>
                                                )}
                                                {org.status !== "DEACTIVATED" && (
                                                    <DropdownMenuItem className="cursor-pointer text-danger focus:text-danger focus:bg-danger/10" onClick={() => handleStatusChange(org.id, org.name, "DEACTIVATED")}>
                                                        Deactivate
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {paginated.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-14 text-center">
                                        <Building2 className="mx-auto h-10 w-10 text-muted-foreground/40" />
                                        <p className="mt-2 text-sm font-medium">No organizations found</p>
                                        <p className="text-xs text-muted-foreground mt-1">Try adjusting your search criteria.</p>
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
