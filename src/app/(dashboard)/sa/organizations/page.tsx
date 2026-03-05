"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Building2, Download } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import QuotaBar from "@/components/shared/QuotaBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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

export default function OrganizationsPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const filtered = mockOrgs.filter((org) => {
        const matchSearch = org.name.toLowerCase().includes(search.toLowerCase()) || org.domain.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || org.status.toLowerCase() === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title="Organizations"
                subtitle={`${mockOrgs.length} registered organizations`}
                breadcrumbs={[
                    { label: "Super Admin", href: "/sa/dashboard" },
                    { label: "Organizations" },
                ]}
                actions={
                    <Link href="/sa/organizations/register">
                        <Button className="bg-brand-700 hover:bg-brand-800">
                            <Plus className="mr-2 h-4 w-4" />
                            Register Organization
                        </Button>
                    </Link>
                }
            />

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or domain..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organization</TableHead>
                                <TableHead>Industry</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Employees</TableHead>
                                <TableHead>Quota Usage</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Registered</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((org) => (
                                <TableRow key={org.id} className="group">
                                    <TableCell>
                                        <Link href={`/sa/organizations/${org.id}`} className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">{org.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-foreground group-hover:text-brand-600">{org.name}</p>
                                                <p className="text-xs text-muted-foreground">{org.domain}</p>
                                            </div>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{org.industry}</TableCell>
                                    <TableCell><StatusBadge status={org.status} /></TableCell>
                                    <TableCell className="text-center text-sm">{org.employees}</TableCell>
                                    <TableCell className="w-40">
                                        <QuotaBar used={org.quota.used} total={org.quota.total} size="sm" />
                                    </TableCell>
                                    <TableCell className="text-sm">{org.plan}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{org.registeredAt}</TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-12 text-center">
                                        <Building2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
                                        <p className="mt-2 text-sm text-muted-foreground">No organizations found</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
