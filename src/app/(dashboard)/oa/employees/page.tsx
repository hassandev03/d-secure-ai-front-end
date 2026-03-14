"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Search, Plus, Users, Download, MoreHorizontal,
    Activity, Shield, Trash2, ChevronLeft, ChevronRight,
    X, UserPlus, ArrowUpDown, RefreshCw, Building2,
} from "lucide-react";
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
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { getOAEmployees, getOADepartmentNames, type OAEmployee } from "@/services/oa.service";

// ── Types ────────────────────────────────────────────────────────────────────

type OrgEmployee    = OAEmployee;
type EmployeeStatus = OAEmployee["status"];
type EmployeeRole   = OAEmployee["role"];

const PAGE_SIZE = 8;

function initials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
    // ── Data ─────────────────────────────────────────────────────────────
    const [employees, setEmployees] = useState<OrgEmployee[]>([]);
    const [deptNames, setDeptNames] = useState<string[]>([]);

    useEffect(() => {
        getOAEmployees().then(setEmployees);
        getOADepartmentNames().then(setDeptNames);
    }, []);

    // ── Filters ──────────────────────────────────────────────────────────
    const [search,       setSearch]       = useState("");
    const [deptFilter,   setDeptFilter]   = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [roleFilter,   setRoleFilter]   = useState("all");
    const [sortBy,       setSortBy]       = useState<"requests" | "name">("requests");
    const [page,         setPage]         = useState(1);
    const resetPage = () => setPage(1);

    // ── Dialogs ───────────────────────────────────────────────────────────
    const [addOpen,        setAddOpen]        = useState(false);
    const [removeTarget,   setRemoveTarget]   = useState<OrgEmployee | null>(null);
    const [limitTarget,    setLimitTarget]    = useState<OrgEmployee | null>(null);
    const [activityTarget, setActivityTarget] = useState<OrgEmployee | null>(null);
    const [deptTarget,     setDeptTarget]     = useState<OrgEmployee | null>(null);

    // ── Add-employee form ────────────────────────────────────────────────
    const [newName,   setNewName]   = useState("");
    const [newEmail,  setNewEmail]  = useState("");
    const [newDept,   setNewDept]   = useState("");
    const [newRole,   setNewRole]   = useState<EmployeeRole | "">("");
    const [newLimit,  setNewLimit]  = useState("30");
    const [addSaving, setAddSaving] = useState(false);

    // ── Set-limit dialog ──────────────────────────────────────────────────
    const [editLimit,   setEditLimit]   = useState("");
    const [limitSaving, setLimitSaving] = useState(false);

    // ── Change-dept dialog ───────────────────────────────────────────────
    const [newDeptChange, setNewDeptChange] = useState("");

    // ── Derived counts ────────────────────────────────────────────────────
    const activeCount   = employees.filter((e) => e.status === "ACTIVE").length;
    const pendingCount  = employees.filter((e) => e.status === "PENDING").length;
    const inactiveCount = employees.filter((e) => e.status === "INACTIVE").length;
    const totalRequests = employees.reduce((s, e) => s + e.requests, 0);

    // ── Filtered + paginated ──────────────────────────────────────────────
    const filtered = useMemo(() => {
        let list = [...employees];
        const q = search.toLowerCase();
        if (q)                      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q));
        if (deptFilter   !== "all") list = list.filter((e) => e.department === deptFilter);
        if (statusFilter !== "all") list = list.filter((e) => e.status.toLowerCase() === statusFilter);
        if (roleFilter   !== "all") list = list.filter((e) => e.role.toLowerCase() === roleFilter);
        if (sortBy === "name")      list.sort((a, b) => a.name.localeCompare(b.name));
        else                        list.sort((a, b) => b.requests - a.requests);
        return list;
    }, [employees, search, deptFilter, statusFilter, roleFilter, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const hasActiveFilters = search || deptFilter !== "all" || statusFilter !== "all" || roleFilter !== "all";

    // ── Actions ───────────────────────────────────────────────────────────

    const handleAdd = async () => {
        if (!newName.trim() || !newEmail.trim()) {
            toast.error("Name and email are required."); return;
        }
        if (!newDept) { toast.error("Please select a department."); return; }
        if (!newRole) { toast.error("Please select a role."); return; }

        setAddSaving(true);
        await new Promise((r) => setTimeout(r, 600)); // simulate API
        const emp: OrgEmployee = {
            id:         `emp-${Date.now()}`,
            name:       newName.trim(),
            email:      newEmail.trim(),
            department: newDept,
            role:       newRole as EmployeeRole,
            status:     "PENDING",
            requests:   0,
            dailyLimit: parseInt(newLimit) || 30,
            lastActive: "—",
        };
        setEmployees((prev) => [emp, ...prev]);
        setNewName(""); setNewEmail(""); setNewDept(""); setNewRole(""); setNewLimit("30");
        setAddOpen(false);
        setAddSaving(false);
        toast.success(`${emp.name} added to the organisation.`);
    };

    const handleRemove = async () => {
        if (!removeTarget) return;
        await new Promise((r) => setTimeout(r, 400));
        setEmployees((prev) => prev.filter((e) => e.id !== removeTarget.id));
        toast.success(`${removeTarget.name} has been removed.`);
        setRemoveTarget(null);
    };

    const handleRestrictToggle = async (emp: OrgEmployee) => {
        const restricting = emp.dailyLimit !== 0;
        await new Promise((r) => setTimeout(r, 300));
        setEmployees((prev) => prev.map((e) =>
            e.id === emp.id ? { ...e, dailyLimit: restricting ? 0 : 30 } : e,
        ));
        toast.success(`${emp.name} has been ${restricting ? "restricted" : "unrestricted"}.`);
    };

    const handleSetLimit = async () => {
        if (!limitTarget) return;
        const val = parseInt(editLimit);
        if (isNaN(val) || val < 0) { toast.error("Enter a valid limit (0 or more)."); return; }
        setLimitSaving(true);
        await new Promise((r) => setTimeout(r, 400));
        setEmployees((prev) => prev.map((e) =>
            e.id === limitTarget.id ? { ...e, dailyLimit: val } : e,
        ));
        toast.success(`Daily limit for ${limitTarget.name} set to ${val}.`);
        setLimitSaving(false);
        setLimitTarget(null);
    };

    const handleChangeDept = async () => {
        if (!deptTarget || !newDeptChange) return;
        await new Promise((r) => setTimeout(r, 300));
        setEmployees((prev) => prev.map((e) =>
            e.id === deptTarget.id ? { ...e, department: newDeptChange } : e,
        ));
        toast.success(`${deptTarget.name} moved to ${newDeptChange}.`);
        setDeptTarget(null);
        setNewDeptChange("");
    };

    const handleDeactivate = async (emp: OrgEmployee) => {
        const next: EmployeeStatus = emp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        await new Promise((r) => setTimeout(r, 300));
        setEmployees((prev) => prev.map((e) => e.id === emp.id ? { ...e, status: next } : e));
        toast.success(`${emp.name} is now ${next.toLowerCase()}.`);
    };

    const handleResetPassword = (emp: OrgEmployee) => {
        toast.success(`Password reset email sent to ${emp.email}.`);
    };

    const handleDownload = () => {
        const rows = [
            ["Name", "Email", "Department", "Role", "Status", "Requests", "Daily Limit", "Last Active"],
            ...filtered.map((e) => [e.name, e.email, e.department, e.role, e.status, e.requests, e.dailyLimit, e.lastActive]),
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a"); a.href = url; a.download = "employees.csv"; a.click();
        URL.revokeObjectURL(url);
        toast.success("Employee list exported.");
    };

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <PageHeader
                title="Employees"
                subtitle={`${employees.length} team members · ${activeCount} active · ${pendingCount} pending`}
                breadcrumbs={[{ label: "Organisation", href: "/oa/dashboard" }, { label: "Employees" }]}
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                        <Button className="bg-brand-700 hover:bg-brand-800" onClick={() => setAddOpen(true)}>
                            <UserPlus className="mr-2 h-4 w-4" /> Add Employee
                        </Button>
                    </div>
                }
            />

            {/* ── Summary Stat Cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold">{employees.length}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Total Employees</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-success">{activeCount}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-brand-700">{totalRequests.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Total Requests</p>
                    </CardContent>
                </Card>
            </div>

            {/* ── Filters ─────────────────────────────────────────────────── */}
            <Card>
                <CardContent className="p-4 space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email…"
                                className="pl-9"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                            />
                        </div>

                        {/* Dropdowns */}
                        <div className="flex gap-2 flex-wrap">
                            {/* Department */}
                            <Select value={deptFilter} onValueChange={(v) => { setDeptFilter(v); resetPage(); }}>
                                <SelectTrigger className="w-40">
                                    <Building2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                    <SelectValue placeholder="Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {deptNames.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            {/* Status */}
                            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
                                <SelectTrigger className="w-36">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Role */}
                            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); resetPage(); }}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="employee">Employee</SelectItem>
                                    <SelectItem value="dept_admin">Dept Admin</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Sort */}
                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                                <SelectTrigger className="w-36">
                                    <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                    <SelectValue placeholder="Sort" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="requests">Most Active</SelectItem>
                                    <SelectItem value="name">Name A–Z</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Active-filter chips */}
                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                            <span className="text-xs text-muted-foreground">
                                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                            </span>
                            {search && (
                                <Badge variant="secondary" className="text-xs cursor-pointer gap-1"
                                    onClick={() => { setSearch(""); resetPage(); }}>
                                    &ldquo;{search}&rdquo; <X className="h-3 w-3" />
                                </Badge>
                            )}
                            {deptFilter !== "all" && (
                                <Badge variant="secondary" className="text-xs cursor-pointer gap-1"
                                    onClick={() => { setDeptFilter("all"); resetPage(); }}>
                                    {deptFilter} <X className="h-3 w-3" />
                                </Badge>
                            )}
                            {statusFilter !== "all" && (
                                <Badge variant="secondary" className="text-xs cursor-pointer gap-1"
                                    onClick={() => { setStatusFilter("all"); resetPage(); }}>
                                    {statusFilter} <X className="h-3 w-3" />
                                </Badge>
                            )}
                            {roleFilter !== "all" && (
                                <Badge variant="secondary" className="text-xs cursor-pointer gap-1"
                                    onClick={() => { setRoleFilter("all"); resetPage(); }}>
                                    {roleFilter.replace("_", " ")} <X className="h-3 w-3" />
                                </Badge>
                            )}
                            <button
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-1"
                                onClick={() => { setSearch(""); setDeptFilter("all"); setStatusFilter("all"); setRoleFilter("all"); resetPage(); }}
                            >
                                <RefreshCw className="h-3 w-3" /> Clear all
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Table ───────────────────────────────────────────────────── */}
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
                                <TableHead className="text-center">Daily Limit</TableHead>
                                <TableHead>Last Active</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.map((emp) => (
                                <TableRow key={emp.id}>
                                    {/* Employee */}
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">
                                                    {initials(emp.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-foreground">{emp.name}</p>
                                                <p className="text-xs text-muted-foreground">{emp.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Department */}
                                    <TableCell className="text-sm">{emp.department}</TableCell>

                                    {/* Role */}
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={emp.role === "DEPT_ADMIN" ? "bg-brand-50 text-brand-700" : ""}
                                        >
                                            {emp.role === "DEPT_ADMIN" ? "Dept Admin" : "Employee"}
                                        </Badge>
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell><StatusBadge status={emp.status} /></TableCell>

                                    {/* Requests */}
                                    <TableCell className="text-center">
                                        <span className="text-sm font-medium">{emp.requests.toLocaleString()}</span>
                                    </TableCell>

                                    {/* Daily Limit */}
                                    <TableCell className="text-center">
                                        {emp.dailyLimit === 0
                                            ? <Badge variant="outline" className="text-xs bg-danger/10 text-danger border-danger/20">Restricted</Badge>
                                            : <span className="text-sm">{emp.dailyLimit}/day</span>
                                        }
                                    </TableCell>

                                    {/* Last Active */}
                                    <TableCell className="text-sm text-muted-foreground">{emp.lastActive}</TableCell>

                                    {/* Actions */}
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setActivityTarget(emp)}>
                                                    <Activity className="mr-2 h-3.5 w-3.5" /> View Activity
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setLimitTarget(emp); setEditLimit(String(emp.dailyLimit)); }}>
                                                    <Shield className="mr-2 h-3.5 w-3.5" /> Set Daily Limit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleRestrictToggle(emp)}
                                                    className={emp.dailyLimit === 0 ? "text-success focus:text-success" : "text-warning focus:text-warning"}
                                                >
                                                    {emp.dailyLimit === 0 ? "Unrestrict Access" : "Restrict Access"}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => { setDeptTarget(emp); setNewDeptChange(emp.department); }}>
                                                    <Building2 className="mr-2 h-3.5 w-3.5" /> Change Department
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleResetPassword(emp)}>
                                                    <RefreshCw className="mr-2 h-3.5 w-3.5" /> Reset Password
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDeactivate(emp)}
                                                    className="text-warning focus:text-warning"
                                                >
                                                    {emp.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => setRemoveTarget(emp)}
                                                    className="text-danger focus:text-danger"
                                                >
                                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove Employee
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {paginated.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-14 text-center">
                                        <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
                                        <p className="mt-2 text-sm font-medium">No employees found</p>
                                        <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ── Pagination ──────────────────────────────────────────────── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                    </span>
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

            {/* ═══════════════════════════════════════════════════════════════
                Dialogs
            ════════════════════════════════════════════════════════════════ */}

            {/* ── Add Employee ─────────────────────────────────────────────── */}
            <Dialog open={addOpen} onOpenChange={(o) => {
                if (!o) { setNewName(""); setNewEmail(""); setNewDept(""); setNewRole(""); setNewLimit("30"); }
                setAddOpen(o);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-brand-700" /> Add Employee
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="space-y-2">
                            <Label>Full Name <span className="text-danger">*</span></Label>
                            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Jane Smith" />
                        </div>
                        <div className="space-y-2">
                            <Label>Email Address <span className="text-danger">*</span></Label>
                            <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="jane@acme.com" />
                        </div>
                        <div className="space-y-2">
                            <Label>Department <span className="text-danger">*</span></Label>
                            <Select value={newDept} onValueChange={setNewDept}>
                                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                                <SelectContent>
                                    {deptNames.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Role <span className="text-danger">*</span></Label>
                            <Select value={newRole} onValueChange={(v) => {
                                setNewRole(v as EmployeeRole);
                                setNewLimit(v === "DEPT_ADMIN" ? "100" : "30");
                            }}>
                                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                    <SelectItem value="DEPT_ADMIN">Department Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Daily Request Limit</Label>
                            <Input
                                type="number"
                                value={newLimit}
                                onChange={(e) => setNewLimit(e.target.value)}
                                min="0"
                                placeholder="30"
                            />
                            <p className="text-xs text-muted-foreground">Set 0 to start with restricted access.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline" disabled={addSaving}>Cancel</Button></DialogClose>
                        <Button className="bg-brand-700 hover:bg-brand-800" onClick={handleAdd} disabled={addSaving}>
                            {addSaving ? <><Plus className="mr-2 h-4 w-4 animate-spin" />Adding…</> : "Add Employee"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Remove Confirm ───────────────────────────────────────────── */}
            <Dialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Remove Employee</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground py-2">
                        Are you sure you want to remove <strong>{removeTarget?.name}</strong> from the organisation?
                        This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRemove}>Remove</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Set Daily Limit ──────────────────────────────────────────── */}
            <Dialog open={!!limitTarget} onOpenChange={(o) => !o && setLimitTarget(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Set Daily Limit</DialogTitle></DialogHeader>
                    <div className="py-2 space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Setting limit for <strong>{limitTarget?.name}</strong>.
                            Use <strong>0</strong> to restrict access entirely.
                        </p>
                        <div className="space-y-2">
                            <Label>Daily Request Limit</Label>
                            <Input
                                type="number"
                                value={editLimit}
                                onChange={(e) => setEditLimit(e.target.value)}
                                min="0"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLimitTarget(null)} disabled={limitSaving}>Cancel</Button>
                        <Button className="bg-brand-700 hover:bg-brand-800" onClick={handleSetLimit} disabled={limitSaving}>
                            {limitSaving ? "Saving…" : "Save Limit"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Change Department ────────────────────────────────────────── */}
            <Dialog open={!!deptTarget} onOpenChange={(o) => { if (!o) { setDeptTarget(null); setNewDeptChange(""); } }}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Change Department</DialogTitle></DialogHeader>
                    <div className="py-2 space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Move <strong>{deptTarget?.name}</strong> to a different department.
                        </p>
                        <div className="space-y-2">
                            <Label>New Department</Label>
                            <Select value={newDeptChange} onValueChange={setNewDeptChange}>
                                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                                <SelectContent>
                                    {deptNames.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setDeptTarget(null); setNewDeptChange(""); }}>Cancel</Button>
                        <Button
                            className="bg-brand-700 hover:bg-brand-800"
                            onClick={handleChangeDept}
                            disabled={!newDeptChange || newDeptChange === deptTarget?.department}
                        >
                            Move Employee
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Activity Viewer ──────────────────────────────────────────── */}
            <Dialog open={!!activityTarget} onOpenChange={(o) => !o && setActivityTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Activity — {activityTarget?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="py-2 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg border border-border p-4 text-center">
                                <p className="text-2xl font-bold">{activityTarget?.requests.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Total Requests</p>
                            </div>
                            <div className="rounded-lg border border-border p-4 text-center">
                                <p className="text-2xl font-bold">
                                    {activityTarget?.dailyLimit === 0 ? "—" : activityTarget?.dailyLimit}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">Daily Limit</p>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2.5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <StatusBadge status={activityTarget?.status ?? "ACTIVE"} />
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Role</span>
                                <span className="font-medium">
                                    {activityTarget?.role === "DEPT_ADMIN" ? "Dept Admin" : "Employee"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Department</span>
                                <span className="font-medium">{activityTarget?.department}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Email</span>
                                <span className="font-medium">{activityTarget?.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Active</span>
                                <span className="font-medium">{activityTarget?.lastActive}</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActivityTarget(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
