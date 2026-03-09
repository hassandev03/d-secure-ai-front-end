"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Search, Users, MoreHorizontal, Trash2, Activity,
    Shield, ChevronLeft, ChevronRight, UserPlus, X, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
    getDeptEmployees,
    getOrgRoles,
    addDeptEmployee,
    removeDeptEmployee,
    updateEmployeeLimit,
    setEmployeeRestriction,
    type DeptEmployee,
    type OrgRole,
} from "@/services/da.service";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const PAGE_SIZE = 8;

function initials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function EmployeeManagementPage() {
    // ── Data from service ───────────────────────────────────────────────
    const [loading, setLoading]       = useState(true);
    const [employees, setEmployees]   = useState<DeptEmployee[]>([]);
    const [orgRoles, setOrgRoles]     = useState<OrgRole[]>([]);
    const [rolesLoading, setRolesLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await getDeptEmployees();
                if (!cancelled) setEmployees(data);
            } catch {
                toast.error("Failed to load employees.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Load org roles lazily when the Add dialog opens
    const loadOrgRoles = async () => {
        if (orgRoles.length > 0) return; // already loaded
        setRolesLoading(true);
        try {
            const roles = await getOrgRoles();
            setOrgRoles(roles);
            // Seed the default role selection with the first role
            if (roles.length > 0) {
                setNewRoleId(roles[0].id);
                setNewLimit(String(roles[0].defaultDailyLimit));
            }
        } catch {
            toast.error("Failed to load organisation roles.");
        } finally {
            setRolesLoading(false);
        }
    };

    // ── Filters ─────────────────────────────────────────────────────────
    const [search, setSearch]               = useState("");
    const [statusFilter, setStatusFilter]   = useState("all");
    const [roleFilter, setRoleFilter]       = useState("all");
    const [sortBy, setSortBy]               = useState<"requests" | "name">("requests");
    const [page, setPage]                   = useState(1);

    // ── Dialogs ──────────────────────────────────────────────────────────
    const [addOpen, setAddOpen]               = useState(false);
    const [removeTarget, setRemoveTarget]     = useState<DeptEmployee | null>(null);
    const [limitTarget, setLimitTarget]       = useState<DeptEmployee | null>(null);
    const [activityTarget, setActivityTarget] = useState<DeptEmployee | null>(null);

    // ── Add-employee form state ──────────────────────────────────────────
    const [newName,   setNewName]   = useState("");
    const [newEmail,  setNewEmail]  = useState("");
    const [newRoleId, setNewRoleId] = useState("");
    const [newLimit,  setNewLimit]  = useState("30");
    const [addSaving, setAddSaving] = useState(false);

    // ── Set-limit dialog ─────────────────────────────────────────────────
    const [editLimit,  setEditLimit]  = useState("");
    const [limitSaving, setLimitSaving] = useState(false);

    // Distinct role names for the filter dropdown (derived from loaded employees)
    const roleNames = useMemo(
        () => Array.from(new Set(employees.map((e) => e.roleName))).sort(),
        [employees],
    );

    // ── Derived ──────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        let list = [...employees];
        const q = search.toLowerCase();
        if (q) list = list.filter(
            (e) => e.name.toLowerCase().includes(q)
                || e.email.toLowerCase().includes(q)
                || e.roleName.toLowerCase().includes(q),
        );
        if (statusFilter !== "all") list = list.filter((e) => e.status.toLowerCase() === statusFilter);
        if (roleFilter   !== "all") list = list.filter((e) => e.roleName === roleFilter);
        if (sortBy === "name")     list.sort((a, b) => a.name.localeCompare(b.name));
        else                       list.sort((a, b) => b.requests - a.requests);
        return list;
    }, [employees, search, statusFilter, roleFilter, sortBy]);

    const totalPages    = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated     = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const activeCount   = employees.filter((e) => e.status === "ACTIVE").length;
    const inactiveCount = employees.filter((e) => e.status === "INACTIVE").length;
    const totalRequests = employees.reduce((s, e) => s + e.requests, 0);
    const resetPage     = () => setPage(1);

    // ── Actions ──────────────────────────────────────────────────────────
    const handleAdd = async () => {
        if (!newName.trim() || !newEmail.trim()) {
            toast.error("Name and email are required.");
            return;
        }
        if (!newRoleId) {
            toast.error("Please select a role.");
            return;
        }
        const role = orgRoles.find((r) => r.id === newRoleId);
        if (!role) return;

        setAddSaving(true);
        try {
            const emp = await addDeptEmployee({
                name:      newName.trim(),
                email:     newEmail.trim(),
                roleId:    role.id,
                roleName:  role.name,
                status:    "ACTIVE",
                dailyLimit: parseInt(newLimit) || role.defaultDailyLimit,
            });
            setEmployees((prev) => [emp, ...prev]);
            setNewName(""); setNewEmail(""); setNewLimit("30");
            setAddOpen(false);
            toast.success(`${emp.name} added to the department.`);
        } catch {
            toast.error("Failed to add employee.");
        } finally {
            setAddSaving(false);
        }
    };

    const handleRemove = async () => {
        if (!removeTarget) return;
        try {
            await removeDeptEmployee(removeTarget.id);
            setEmployees((prev) => prev.filter((e) => e.id !== removeTarget.id));
            toast.success(`${removeTarget.name} removed from the department.`);
        } catch {
            toast.error("Failed to remove employee.");
        } finally {
            setRemoveTarget(null);
        }
    };

    const handleRestrictToggle = async (emp: DeptEmployee) => {
        const restricting = emp.dailyLimit !== 0;
        try {
            const updated = await setEmployeeRestriction(emp.id, restricting);
            setEmployees((prev) => prev.map((e) => e.id === emp.id ? updated : e));
            toast.success(`${emp.name} has been ${restricting ? "restricted" : "unrestricted"}.`);
        } catch {
            toast.error(`Failed to ${restricting ? "restrict" : "unrestrict"} ${emp.name}.`);
        }
    };

    const handleSetLimit = async () => {
        if (!limitTarget) return;
        const val = parseInt(editLimit);
        if (isNaN(val) || val < 0) { toast.error("Enter a valid limit (0 or more)."); return; }
        setLimitSaving(true);
        try {
            const updated = await updateEmployeeLimit(limitTarget.id, val);
            setEmployees((prev) => prev.map((e) => e.id === limitTarget.id ? updated : e));
            toast.success(`Daily limit for ${limitTarget.name} set to ${val}.`);
        } catch {
            toast.error("Failed to update limit.");
        } finally {
            setLimitSaving(false);
            setLimitTarget(null);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="mx-auto max-w-7xl">
                <PageHeader
                    title="Employee Management"
                    subtitle="Loading…"
                    breadcrumbs={[{ label: "Dept Admin", href: "/da/dashboard" }, { label: "Employee Management" }]}
                />
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title="Employee Management"
                subtitle={`${employees.length} team members · ${activeCount} active · ${inactiveCount} inactive`}
                breadcrumbs={[{ label: "Dept Admin", href: "/da/dashboard" }, { label: "Employee Management" }]}
                actions={
                    <Button className="bg-brand-700 hover:bg-brand-800" onClick={() => { setAddOpen(true); loadOrgRoles(); }}>
                        <UserPlus className="mr-2 h-4 w-4" /> Add Employee
                    </Button>
                }
            />

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <Card><CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{employees.length}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Total Employees</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-success">{activeCount}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Active</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-danger">{inactiveCount}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Inactive</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-brand-700">{totalRequests.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Total Requests</p>
                </CardContent></Card>
            </div>

            {/* Search + Filters */}
            <Card className="mb-5">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email or role…"
                                className="pl-9"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
                                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); resetPage(); }}>
                                <SelectTrigger className="w-44"><SelectValue placeholder="All Roles" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    {roleNames.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                                <SelectTrigger className="w-36"><SelectValue placeholder="Sort" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="requests">Most Active</SelectItem>
                                    <SelectItem value="name">Name A–Z</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {(search || statusFilter !== "all" || roleFilter !== "all") && (
                        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">{filtered.length} result{filtered.length !== 1 && "s"}</span>
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
                            {roleFilter !== "all" && (
                                <Badge variant="secondary" className="text-xs cursor-pointer gap-1" onClick={() => { setRoleFilter("all"); resetPage(); }}>
                                    {roleFilter} <X className="h-3 w-3" />
                                </Badge>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Requests</TableHead>
                                <TableHead className="text-center">Daily Limit</TableHead>
                                <TableHead>Last Active</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">
                                                    {initials(m.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">{m.name}</p>
                                                <p className="text-xs text-muted-foreground">{m.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell><span className="text-sm text-muted-foreground">{m.roleName}</span></TableCell>
                                    <TableCell><StatusBadge status={m.status} /></TableCell>
                                    <TableCell className="text-center">
                                        <span className="text-sm font-medium">{m.requests.toLocaleString()}</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {m.dailyLimit === 0
                                            ? <Badge variant="outline" className="text-xs bg-danger/10 text-danger border-danger/20">Restricted</Badge>
                                            : <span className="text-sm">{m.dailyLimit}/day</span>
                                        }
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{m.lastActive}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setActivityTarget(m)}>
                                                    <Activity className="mr-2 h-3.5 w-3.5" /> View Activity
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setLimitTarget(m); setEditLimit(String(m.dailyLimit)); }}>
                                                    <Shield className="mr-2 h-3.5 w-3.5" /> Set Daily Limit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleRestrictToggle(m)}
                                                    className={m.dailyLimit === 0 ? "text-success focus:text-success" : "text-warning focus:text-warning"}
                                                >
                                                    {m.dailyLimit === 0 ? "Unrestrict Access" : "Restrict Access"}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => setRemoveTarget(m)}
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
                                    <TableCell colSpan={7} className="py-14 text-center">
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
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

            {/* ── Add Employee Dialog ─────────────────────────────────────── */}
            <Dialog open={addOpen} onOpenChange={(o) => { if (!o) { setNewName(""); setNewEmail(""); setNewLimit("30"); } setAddOpen(o); }}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader>
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
                            <Label>Role <span className="text-danger">*</span></Label>
                            {rolesLoading ? (
                                <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input text-sm text-muted-foreground">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading roles…
                                </div>
                            ) : (
                                <Select
                                    value={newRoleId}
                                    onValueChange={(v) => {
                                        setNewRoleId(v);
                                        const role = orgRoles.find((r) => r.id === v);
                                        if (role) setNewLimit(String(role.defaultDailyLimit));
                                    }}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select role…" /></SelectTrigger>
                                    <SelectContent>
                                        {orgRoles.map((r) => (
                                            <SelectItem key={r.id} value={r.id}>
                                                <div>
                                                    <span>{r.name}</span>
                                                    <span className="ml-2 text-xs text-muted-foreground">{r.description}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Daily Request Limit</Label>
                            <Input
                                type="number"
                                value={newLimit}
                                onChange={(e) => setNewLimit(e.target.value)}
                                min="0"
                                placeholder="Auto-filled from role"
                            />
                            <p className="text-xs text-muted-foreground">Default is filled from the role's standard limit.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline" disabled={addSaving}>Cancel</Button></DialogClose>
                        <Button className="bg-brand-700 hover:bg-brand-800" onClick={handleAdd} disabled={addSaving}>
                            {addSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding…</> : "Add Employee"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Remove Confirm Dialog ───────────────────────────────────── */}
            <Dialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Remove Employee</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground py-2">
                        Are you sure you want to remove <strong>{removeTarget?.name}</strong> from the
                        department? This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRemove}>Remove</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Set Limit Dialog ────────────────────────────────────────── */}
            <Dialog open={!!limitTarget} onOpenChange={(o) => !o && setLimitTarget(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Set Daily Limit</DialogTitle></DialogHeader>
                    <div className="py-2 space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Setting limit for <strong>{limitTarget?.name}</strong>. Use&nbsp;<strong>0</strong> to restrict access entirely.
                        </p>
                        <div className="space-y-2">
                            <Label>Daily Request Limit</Label>
                            <Input type="number" value={editLimit} onChange={(e) => setEditLimit(e.target.value)} min="0" autoFocus />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLimitTarget(null)} disabled={limitSaving}>Cancel</Button>
                        <Button className="bg-brand-700 hover:bg-brand-800" onClick={handleSetLimit} disabled={limitSaving}>
                            {limitSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save Limit"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Activity Dialog ──────────────────────────────────────────── */}
            <Dialog open={!!activityTarget} onOpenChange={(o) => !o && setActivityTarget(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Activity — {activityTarget?.name}</DialogTitle></DialogHeader>
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
                                <StatusBadge status={activityTarget?.status || "ACTIVE"} />
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Role</span>
                                <span className="font-medium">{activityTarget?.roleName}</span>
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
