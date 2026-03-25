"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, Users, Download, MoreHorizontal, SlidersHorizontal, Briefcase } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
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
    PRO: "bg-brand-100 text-brand-800 border-brand-200",
    MAX: "bg-gradient-to-r from-brand-600 to-indigo-600 text-white border-transparent",
};

const industries = Array.from(new Set(mockProfessionals.map((p) => p.industry)));

export default function ProfessionalsPage() {
    const [search, setSearch] = useState("");
    const [planFilter, setPlanFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [industryFilter, setIndustryFilter] = useState("all");

    const filtered = mockProfessionals.filter((p) => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
        const matchPlan = planFilter === "all" || p.plan === planFilter;
        const matchStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter.toLowerCase();
        const matchIndustry = industryFilter === "all" || p.industry === industryFilter;
        return matchSearch && matchPlan && matchStatus && matchIndustry;
    });

    const handleExport = () => {
        alert("Exporting professionals data as CSV...");
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title="Professionals Directory"
                subtitle={`Manage and monitor ${mockProfessionals.length} independent professionals using the platform.`}
                breadcrumbs={[{ label: "Super Admin", href: "/sa/dashboard" }, { label: "Professionals" }]}
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
                            <CardDescription>Find professionals by specific criteria like industry, plan, or status</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleExport} className="hidden sm:flex items-center gap-2 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                            <Download className="h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative md:col-span-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name or email..." 
                            className="pl-9 bg-background/50 focus:bg-background transition-colors" 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)} 
                        />
                    </div>
                    
                    <Select value={planFilter} onValueChange={setPlanFilter}>
                        <SelectTrigger className="bg-background/50 focus:bg-background transition-colors">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Plan Tier" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Plans</SelectItem>
                            <SelectItem value="FREE">Free</SelectItem>
                            <SelectItem value="PRO">Pro</SelectItem>
                            <SelectItem value="MAX">Max</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="bg-background/50 focus:bg-background transition-colors">
                            <SelectValue placeholder="Account Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={industryFilter} onValueChange={setIndustryFilter}>
                        <SelectTrigger className="bg-background/50 focus:bg-background transition-colors">
                            <SelectValue placeholder="Industry" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Industries</SelectItem>
                            {industries.map(ind => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Table Card */}
            <Card className="border-border/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold">Professional Profile</TableHead>
                                <TableHead className="font-semibold">Role & Industry</TableHead>
                                <TableHead className="font-semibold text-center">Plan Tier</TableHead>
                                <TableHead className="font-semibold text-center">Status</TableHead>
                                <TableHead className="font-semibold text-center">Requests</TableHead>
                                <TableHead className="font-semibold text-right">Joined Date</TableHead>
                                <TableHead className="w-12 text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((p) => (
                                <TableRow key={p.id} className="group transition-colors hover:bg-muted/30">
                                    <TableCell>
                                        <Link href={`/sa/professionals/${p.id}`} className="flex items-center gap-3 w-fit">
                                            <Avatar className="h-10 w-10 border border-border/50 shadow-sm group-hover:border-brand-200 transition-colors">
                                                <AvatarFallback className="bg-gradient-to-br from-brand-50 to-brand-100 text-sm font-bold text-brand-700">
                                                    {p.name.split(" ").map(n => n[0]).join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-foreground group-hover:text-brand-600 transition-colors">{p.name}</p>
                                                <p className="text-xs text-muted-foreground font-medium">{p.email}</p>
                                            </div>
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium flex items-center gap-1.5 text-foreground/90">
                                                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                                                {p.jobTitle}
                                            </span>
                                            <span className="text-xs text-muted-foreground ml-5">{p.industry}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={`border ${planColors[p.plan]}`}>
                                            {p.plan}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center">
                                            <StatusBadge status={p.status} />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center justify-center bg-secondary/50 text-secondary-foreground text-xs font-semibold px-2 py-1 rounded-full">
                                            {p.requests.toLocaleString()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground text-right">
                                        {new Date(p.joinedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted transition-colors">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <Link href={`/sa/professionals/${p.id}`}>
                                                    <DropdownMenuItem className="cursor-pointer">View Full Profile</DropdownMenuItem>
                                                </Link>
                                                <DropdownMenuItem className="cursor-pointer">Email Professional</DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer">Reset Password</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-danger cursor-pointer focus:bg-danger/10 focus:text-danger">
                                                    Suspend Account
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                                                <Users className="h-6 w-6 text-muted-foreground/50" />
                                            </div>
                                            <p className="font-medium text-base">No professionals found</p>
                                            <p className="text-sm text-muted-foreground/80 max-w-sm">
                                                Try adjusting your search filters to find what you are looking for.
                                            </p>
                                            <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                                                setSearch("");
                                                setPlanFilter("all");
                                                setStatusFilter("all");
                                                setIndustryFilter("all");
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
