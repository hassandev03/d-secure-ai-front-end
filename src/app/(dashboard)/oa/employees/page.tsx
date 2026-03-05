"use client";

import { useState } from "react";
import { Search, Filter, Plus, Users, Download, MoreHorizontal, Mail } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const mockEmployees = [
    { id: "emp-001", name: "John Miller", email: "john@acme.com", department: "Engineering", role: "EMPLOYEE", status: "ACTIVE", requests: 180, lastActive: "2025-12-01" },
    { id: "emp-002", name: "Emma Davis", email: "emma@acme.com", department: "Marketing", role: "DEPT_ADMIN", status: "ACTIVE", requests: 95, lastActive: "2025-12-01" },
    { id: "emp-003", name: "Carlos Ruiz", email: "carlos@acme.com", department: "Sales", role: "EMPLOYEE", status: "PENDING", requests: 0, lastActive: "—" },
    { id: "emp-004", name: "Aisha Patel", email: "aisha@acme.com", department: "Finance", role: "DEPT_ADMIN", status: "ACTIVE", requests: 210, lastActive: "2025-11-30" },
    { id: "emp-005", name: "Mike Chen", email: "mike@acme.com", department: "Engineering", role: "EMPLOYEE", status: "INACTIVE", requests: 45, lastActive: "2025-11-15" },
    { id: "emp-006", name: "Sophie Laurent", email: "sophie@acme.com", department: "HR", role: "EMPLOYEE", status: "ACTIVE", requests: 60, lastActive: "2025-12-01" },
    { id: "emp-007", name: "Raj Patel", email: "raj@acme.com", department: "Engineering", role: "EMPLOYEE", status: "ACTIVE", requests: 320, lastActive: "2025-12-01" },
    { id: "emp-008", name: "Lisa Wang", email: "lisa@acme.com", department: "Operations", role: "EMPLOYEE", status: "ACTIVE", requests: 78, lastActive: "2025-11-29" },
];

const departments = ["All", "Engineering", "Marketing", "Sales", "Finance", "HR", "Operations"];

export default function EmployeesPage() {
    const [search, setSearch] = useState("");
    const [deptFilter, setDeptFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("all");

    const filtered = mockEmployees.filter((emp) => {
        const s = emp.name.toLowerCase().includes(search.toLowerCase()) || emp.email.toLowerCase().includes(search.toLowerCase());
        const d = deptFilter === "All" || emp.department === deptFilter;
        const st = statusFilter === "all" || emp.status.toLowerCase() === statusFilter;
        return s && d && st;
    });

    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title="Employees"
                subtitle={`${mockEmployees.length} team members`}
                breadcrumbs={[{ label: "Organization", href: "/oa/dashboard" }, { label: "Employees" }]}
                actions={
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-brand-700 hover:bg-brand-800"><Plus className="mr-2 h-4 w-4" />Invite Employee</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Invite Employee</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2"><Label>Full Name</Label><Input placeholder="John Doe" /></div>
                                <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="john@acme.com" /></div>
                                <div className="space-y-2">
                                    <Label>Department</Label>
                                    <Select>
                                        <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                                        <SelectContent>{departments.filter(d => d !== "All").map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select>
                                        <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                            <SelectItem value="DEPT_ADMIN">Department Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                <Button className="bg-brand-700 hover:bg-brand-800" onClick={() => toast.success("Invitation sent!")}><Mail className="mr-2 h-4 w-4" />Send Invitation</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                }
            />

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <Select value={deptFilter} onValueChange={setDeptFilter}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d === "All" ? "All Departments" : d}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32"><Filter className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon"><Download className="h-4 w-4" /></Button>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Requests</TableHead>
                                <TableHead>Last Active</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((emp) => (
                                <TableRow key={emp.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9"><AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">{emp.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                                            <div>
                                                <p className="font-medium text-foreground">{emp.name}</p>
                                                <p className="text-xs text-muted-foreground">{emp.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{emp.department}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={emp.role === "DEPT_ADMIN" ? "bg-brand-50 text-brand-700" : ""}>
                                            {emp.role === "DEPT_ADMIN" ? "Dept Admin" : "Employee"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell><StatusBadge status={emp.status} /></TableCell>
                                    <TableCell className="text-center text-sm">{emp.requests}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{emp.lastActive}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                                <DropdownMenuItem>Change Department</DropdownMenuItem>
                                                <DropdownMenuItem>Reset Password</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-danger">Deactivate</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow><TableCell colSpan={7} className="py-12 text-center"><Users className="mx-auto h-10 w-10 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No employees found</p></TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
