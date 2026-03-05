"use client";

import { useState } from "react";
import { Search, Users, MoreHorizontal } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const mockMembers = [
    { id: "1", name: "Raj Patel", email: "raj@acme.com", status: "ACTIVE", requests: 320, lastActive: "Today" },
    { id: "2", name: "John Miller", email: "john@acme.com", status: "ACTIVE", requests: 180, lastActive: "Today" },
    { id: "3", name: "Alice Brown", email: "alice@acme.com", status: "ACTIVE", requests: 150, lastActive: "Yesterday" },
    { id: "4", name: "Bob Wilson", email: "bob@acme.com", status: "ACTIVE", requests: 120, lastActive: "Yesterday" },
    { id: "5", name: "Mike Chen", email: "mike@acme.com", status: "INACTIVE", requests: 45, lastActive: "3 days ago" },
    { id: "6", name: "Emily Zhao", email: "emily@acme.com", status: "ACTIVE", requests: 88, lastActive: "Today" },
    { id: "7", name: "Tom Baker", email: "tom@acme.com", status: "ACTIVE", requests: 210, lastActive: "Today" },
];

export default function DeptEmployeesPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const filtered = mockMembers.filter((m) => {
        const s = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
        const st = statusFilter === "all" || m.status.toLowerCase() === statusFilter;
        return s && st;
    });

    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader
                title="Department Employees"
                subtitle={`${mockMembers.length} team members in Engineering`}
                breadcrumbs={[{ label: "Dept Admin", href: "/da/dashboard" }, { label: "Employees" }]}
            />

            <Card className="mb-6">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search employees..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Requests</TableHead>
                                <TableHead>Last Active</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8"><AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">{m.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                                            <div><p className="text-sm font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.email}</p></div>
                                        </div>
                                    </TableCell>
                                    <TableCell><StatusBadge status={m.status} /></TableCell>
                                    <TableCell className="text-center text-sm">{m.requests}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{m.lastActive}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>View Activity</DropdownMenuItem>
                                                <DropdownMenuItem>Set Limit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-danger">Restrict Access</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="py-12 text-center"><Users className="mx-auto h-10 w-10 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No employees found</p></TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
