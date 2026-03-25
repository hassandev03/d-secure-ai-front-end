"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Building2, Download, SlidersHorizontal } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import QuotaBar from "@/components/shared/QuotaBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const mockOrgs = [
    { id: "org-001", name: "Acme Corporation", industry: "Technology", domain: "acme.com", country: "USA", status: "ACTIVE", plan: "Enterprise", employees: 120, departments: 6, quota: { used: 3200, total: 5000 }, registeredAt: "2025-03-15" },
    { id: "org-002", name: "MediHealth Inc.", industry: "Healthcare", domain: "medihealth.com", country: "UK", status: "ACTIVE", plan: "Enterprise", employees: 85, departments: 4, quota: { used: 1800, total: 3000 }, registeredAt: "2025-04-22" },
    { id: "org-003", name: "LegalEase Partners", industry: "Legal", domain: "legalease.com", country: "Canada", status: "PENDING", plan: "Starter", employees: 20, departments: 2, quota: { used: 0, total: 1000 }, registeredAt: "2025-09-01" },
    { id: "org-004", name: "EduTech Global", industry: "Education", domain: "edutech.io", country: "Australia", status: "ACTIVE", plan: "Professional", employees: 45, departments: 3, quota: { used: 900, total: 2000 }, registeredAt: "2025-06-10" },
    { id: "org-005", name: "FinSecure Ltd.", industry: "Finance", domain: "finsecure.co", country: "Singapore", status: "INACTIVE", plan: "Enterprise", employees: 60, departments: 5, quota: { used: 200, total: 2000 }, registeredAt: "2025-01-20" },
    { id: "org-006", name: "GovShield Agency", industry: "Government", domain: "govshield.gov", country: "USA", status: "ACTIVE", plan: "Enterprise", employees: 200, departments: 8, quota: { used: 4100, total: 5000 }, registeredAt: "2025-02-05" },
    { id: "org-007", name: "RetailPro Stores", industry: "Retail", domain: "retailpro.com", country: "Germany", status: "SUSPENDED", plan: "Professional", employees: 30, departments: 2, quota: { used: 400, total: 1500 }, registeredAt: "2025-07-12" },
];

const industries = Array.from(new Set(mockOrgs.map((o) => o.industry)));
const countries = Array.from(new Set(mockOrgs.map((o) => o.country)));

export default function OrganizationsPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [industryFilter, setIndustryFilter] = useState("all");
    const [countryFilter, setCountryFilter] = useState("all");

    const filtered = mockOrgs.filter((org) => {
        const matchSearch = org.name.toLowerCase().includes(search.toLowerCase()) || org.domain.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || org.status.toLowerCase() === statusFilter.toLowerCase();
        const matchIndustry = industryFilter === "all" || org.industry === industryFilter;
        const matchCountry = countryFilter === "all" || org.country === countryFilter;
        return matchSearch && matchStatus && matchIndustry && matchCountry;
    });

    const handleExport = () => {
        alert("Exporting organizations data as CSV...");
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title="Organizations Directory"
                subtitle={`Manage and oversee ${mockOrgs.length} registered organizations across the platform.`}
                breadcrumbs={[
                    { label: "Super Admin", href: "/sa/dashboard" },
                    { label: "Organizations" },
                ]}
                actions={
                    <Link href="/sa/organizations/register">
                        <Button className="bg-brand-600 hover:bg-brand-700 text-white shadow-md transition-all hover:shadow-lg">
                            <Plus className="mr-2 h-4 w-4" />
                            Register Organization
                        </Button>
                    </Link>
                }
            />

            {/* Advanced Filters Card */}
            <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b border-border/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <SlidersHorizontal className="h-5 w-5 text-brand-500" />
                                Search & Filter
                            </CardTitle>
                            <CardDescription>Find organizations by name, domain, or specific criteria</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleExport} className="hidden sm:flex items-center gap-2 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-colors">
                            <Download className="h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative md:col-span-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or domain..."
                                className="pl-9 bg-background/50 focus:bg-background transition-colors"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="bg-background/50 focus:bg-background transition-colors">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="Status" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={industryFilter} onValueChange={setIndustryFilter}>
                            <SelectTrigger className="bg-background/50 focus:bg-background transition-colors">
                                <SelectValue placeholder="Industry" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Industries</SelectItem>
                                {industries.map((ind) => (
                                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={countryFilter} onValueChange={setCountryFilter}>
                            <SelectTrigger className="bg-background/50 focus:bg-background transition-colors">
                                <SelectValue placeholder="Country" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Countries</SelectItem>
                                {countries.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table Card */}
            <Card className="border-border/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold">Organization</TableHead>
                                <TableHead className="font-semibold">Industry & Location</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold text-center">Employees</TableHead>
                                <TableHead className="font-semibold">Quota Usage</TableHead>
                                <TableHead className="font-semibold">Plan</TableHead>
                                <TableHead className="font-semibold text-right pr-6">Registered</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((org) => (
                                <TableRow key={org.id} className="group transition-colors hover:bg-muted/30">
                                    <TableCell>
                                        <Link href={`/sa/organizations/${org.id}`} className="flex items-center gap-3 w-fit">
                                            <Avatar className="h-10 w-10 border border-border/50 shadow-sm group-hover:border-brand-200 transition-colors">
                                                <AvatarFallback className="bg-gradient-to-br from-brand-50 to-brand-100 text-sm font-bold text-brand-700">
                                                    {org.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-foreground group-hover:text-brand-600 transition-colors">{org.name}</p>
                                                <p className="text-xs text-muted-foreground font-medium">{org.domain}</p>
                                            </div>
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{org.industry}</span>
                                            <span className="text-xs text-muted-foreground">{org.country}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={org.status} />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center justify-center bg-secondary/50 text-secondary-foreground text-xs font-semibold px-2 py-1 rounded-full">
                                            {org.employees}
                                        </span>
                                    </TableCell>
                                    <TableCell className="w-48">
                                        <QuotaBar used={org.quota.used} total={org.quota.total} size="sm" />
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium text-foreground/80">{org.plan}</span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground text-right pr-6">
                                        {new Date(org.registeredAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                                                <Building2 className="h-6 w-6 text-muted-foreground/50" />
                                            </div>
                                            <p className="font-medium text-base">No organizations found</p>
                                            <p className="text-sm text-muted-foreground/80 max-w-sm">
                                                Try adjusting your search criteria or clear filters to see more results.
                                            </p>
                                            <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                                                setSearch("");
                                                setStatusFilter("all");
                                                setIndustryFilter("all");
                                                setCountryFilter("all");
                                            }}>
                                                Clear Filters
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
