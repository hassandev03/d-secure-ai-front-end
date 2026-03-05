"use client";

import { useState } from "react";
import { Search, Filter, Users, Download, MoreHorizontal } from "lucide-react";
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
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mockProfessionals = [
    { id: "pro-001", name: "Alex Thompson", email: "alex@freelance.com", jobTitle: "Data Scientist", industry: "Technology", plan: "PRO", status: "ACTIVE", requests: 320, joinedAt: "2025-06-01" },
    { id: "pro-002", name: "Maria Santos", email: "maria@consulting.io", jobTitle: "Legal Consultant", industry: "Legal", plan: "MAX", status: "ACTIVE", requests: 890, joinedAt: "2025-04-15" },
    { id: "pro-003", name: "David Chen", email: "david@design.co", jobTitle: "UX Researcher", industry: "Technology", plan: "FREE", status: "ACTIVE", requests: 15, joinedAt: "2025-08-20" },
    { id: "pro-004", name: "Fatima Al-Rashid", email: "fatima@health.org", jobTitle: "Clinical Researcher", industry: "Healthcare", plan: "PRO", status: "INACTIVE", requests: 0, joinedAt: "2025-05-10" },
    { id: "pro-005", name: "James Wilson", email: "james@finance.net", jobTitle: "Financial Analyst", industry: "Finance", plan: "PRO", status: "ACTIVE", requests: 540, joinedAt: "2025-07-03" },
    { id: "pro-006", name: "Priya Sharma", email: "priya@edu.academy", jobTitle: "Research Fellow", industry: "Education", plan: "FREE", status: "SUSPENDED", requests: 0, joinedAt: "2025-09-12" },
];

const planColors: Record<string, string> = {
    FREE: "bg-muted text-muted-foreground",
    PRO: "bg-brand-50 text-brand-700",
    MAX: "bg-brand-100 text-brand-800",
};

export default function ProfessionalsPage() {
    const [search, setSearch] = useState("");
    const [planFilter, setPlanFilter] = useState("all");

    const filtered = mockProfessionals.filter((p) => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
        const matchPlan = planFilter === "all" || p.plan === planFilter;
        return matchSearch && matchPlan;
    });

    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title="Professionals"
                subtitle={`${mockProfessionals.length} registered professionals`}
                breadcrumbs={[{ label: "Super Admin", href: "/sa/dashboard" }, { label: "Professionals" }]}
            />

            <Card className="mb-6">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <Select value={planFilter} onValueChange={setPlanFilter}>
                        <SelectTrigger className="w-36"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Plan" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Plans</SelectItem>
                            <SelectItem value="FREE">Free</SelectItem>
                            <SelectItem value="PRO">Pro</SelectItem>
                            <SelectItem value="MAX">Max</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon"><Download className="h-4 w-4" /></Button>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Professional</TableHead>
                                <TableHead>Job Title</TableHead>
                                <TableHead>Industry</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Requests</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">{p.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-foreground">{p.name}</p>
                                                <p className="text-xs text-muted-foreground">{p.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{p.jobTitle}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{p.industry}</TableCell>
                                    <TableCell><Badge variant="secondary" className={planColors[p.plan]}>{p.plan}</Badge></TableCell>
                                    <TableCell><StatusBadge status={p.status} /></TableCell>
                                    <TableCell className="text-center text-sm">{p.requests.toLocaleString()}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{p.joinedAt}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem>Reset Password</DropdownMenuItem>
                                                <DropdownMenuItem className="text-danger">Suspend</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow><TableCell colSpan={8} className="py-12 text-center"><Users className="mx-auto h-10 w-10 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No professionals found</p></TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
