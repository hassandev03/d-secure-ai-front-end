"use client";

import { useState, useMemo } from "react";
import {
    Search, Users, MoreHorizontal, Trash2, Activity,
    Shield, ChevronLeft, ChevronRight, UserPlus, X,
} from "lucide-react";
import { toast } from "sonner";
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

type Employee = {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    requests: number;
    dailyLimit: number;
    lastActive: string;
};

const initialEmployees: Employee[] = [
    { id: "1",  name: "Raj Patel",        email: "raj@acme.com",       role: "Senior Developer",  status: "ACTIVE",   requests: 320, dailyLimit: 50, lastActive: "Today"        },
    { id: "2",  name: "John Miller",       email: "john@acme.com",      role: "Developer",         status: "ACTIVE",   requests: 180, dailyLimit: 30, lastActive: "Today"        },
    { id: "3",  name: "Alice Brown",       email: "alice@acme.com",     role: "QA Engineer",       status: "ACTIVE",   requests: 150, dailyLimit: 30, lastActive: "Yesterday"    },
    { id: "4",  name: "Bob Wilson",        email: "bob@acme.com",       role: "DevOps Engineer",   status: "ACTIVE",   requests: 120, dailyLimit: 40, lastActive: "Yesterday"    },
    { id: "5",  name: "Mike Chen",         email: "mike@acme.com",      role: "Developer",         status: "INACTIVE", requests:  45, dailyLimit:  0, lastActive: "3 days ago"   },
    { id: "6",  name: "Emily Zhao",        email: "emily@acme.com",     role: "Senior Developer",  status: "ACTIVE",   requests:  88, dailyLimit: 50, lastActive: "Today"        },
    { id: "7",  name: "Tom Baker",         email: "tom@acme.com",       role: "Tech Lead",         status: "ACTIVE",   requests: 210, dailyLimit: 60, lastActive: "Today"        },
    { id: "8",  name: "Sara Kim",          email: "sara@acme.com",      role: "Developer",         status: "ACTIVE",   requests:  95, dailyLimit: 30, lastActive: "Today"        },
    { id: "9",  name: "David Lee",         email: "david@acme.com",     role: "QA Engineer",       status: "ACTIVE",   requests:  67, dailyLimit: 25, lastActive: "2 days ago"   },
    { id: "10", name: "Priya Singh",       email: "priya@acme.com",     role: "Developer",         status: "ACTIVE",   requests: 143, dailyLimit: 30, lastActive: "Today"        },
    { id: "11", name: "Liam Turner",       email: "liam@acme.com",      role: "DevOps Engineer",   status: "ACTIVE",   requests:  78, dailyLimit: 35, lastActive: "Yesterday"    },
    { id: "12", name: "Olivia Martin",     email: "olivia@acme.com",    role: "Developer",         status: "INACTIVE", requests:  12, dailyLimit:  0, lastActive: "1 week ago"   },
    { id: "13", name: "James Anderson",    email: "james@acme.com",     role: "Senior Developer",  status: "ACTIVE",   requests: 198, dailyLimit: 50, lastActive: "Today"        },
    { id: "14", name: "Mia Thompson",      email: "mia@acme.com",       role: "QA Engineer",       status: "ACTIVE",   requests:  56, dailyLimit: 25, lastActive: "Today"        },
    { id: "15", name: "Noah Garcia",       email: "noah@acme.com",      role: "Developer",         status: "ACTIVE",   requests: 167, dailyLimit: 30, lastActive: "Today"        },
    { id: "16", name: "Ava Martinez",      email: "ava@acme.com",       role: "Tech Lead",         status: "ACTIVE",   requests: 245, dailyLimit: 60, lastActive: "Yesterday"    },
    { id: "17", name: "William Jackson",   email: "william@acme.com",   role: "Developer",         status: "ACTIVE",   requests:  89, dailyLimit: 30, lastActive: "Today"        },
    { id: "18", name: "Isabella White",    email: "isabella@acme.com",  role: "Senior Developer",  status: "ACTIVE",   requests: 134, dailyLimit: 50, lastActive: "Today"        },
    { id: "19", name: "Ethan Harris",      email: "ethan@acme.com",     role: "Developer",         status: "INACTIVE", requests:  23, dailyLimit:  0, lastActive: "5 days ago"   },
    { id: "20", name: "Sophia Clark",      email: "sophia@acme.com",    role: "DevOps Engineer",   status: "ACTIVE",   requests: 102, dailyLimit: 40, lastActive: "Today"        },
];

const ROLES = Array.from(new Set(initialEmployees.map((e) => e.role)));
const PAGE_SIZE = 8;

function initials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function EmployeeManagementPage() {
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees);

    // Filters
    const [search, setSearch]           = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [roleFilter, setRoleFilter]   = useState("all");
    const [sortBy, setSortBy]           = useState<"requests" | "name">("requests");
    const [page, setPage]               = useState(1);

    // Dialogs
    const [addOpen, setAddOpen]             = useState(false);
    const [removeTarget, setRemoveTarget]   = useState<Employee | null>(null);
    const [limitTarget, setLimitTarget]     = useState<Employee | null>(null);
    const [activityTarget, setActivityTarget] = useState<Employee | null>(null);

    // Add-employee form state
    const [newName,  setNewName]   = useState("");
    const [newEmail, setNewEmail]  = useState("");
    const [newRole,  setNewRole]   = useState("Developer");
    const [newLimit, setNewLimit]  = useState("30");

    // Set-limit dialog
    const [editLimit, setEditLimit] = useState("");

    // ── Derived ──────────────────────────────────────────────
    const filtered = useMemo(() => {
        let list = [...employees];
        const q = search.toLowerCase();
        if (q) list = list.filter(
            (e) => e.name.toLowerCase().includes(q)
                || e.email.toLowerCase().includes(q)
                || e.role.toLowerCase().includes(q),
        );
        if (statusFilter !== "all") list = list.filter((e) => e.status.toLowerCase() === statusFilter);
        if (roleFilter   !== "all") list = list.filter((e) => e.role === roleFilter);
        if (sortBy === "name")     list.sort((a, b) => a.name.localeCompare(b.name));
        else                       list.sort((a, b) => b.requests - a.requests);
        return list;
    }, [employees, search, statusFilter, roleFilter, sortBy]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const activeCount   = employees.filter((e) => e.status === "ACTIVE").length;
    const inactiveCount = employees.filter((e) => e.status === "INACTIVE").length;
    const totalRequests = employees.reduce((s, e) => s + e.requests, 0);

    const resetPage = () => setPage(1);

    // ── Actions ──────────────────────────────────────────────
    const handleAdd = () => {
        if (!newName.trim() || !newEmail.trim()) {
            toast.error("Name and email are required.");
            return;
        }
        const emp: Employee = {
            id: Date.now().toString(),
            name: newName.trim(),
            email: newEmail.trim(),
            role: newRole,
            status: "ACTIVE",
            requests: 0,
            dailyLimit: parseInt(newLimit) || 30,
            lastActive: "Never",
        };
        setEmployees((prev) => [emp, ...prev]);
        setNewName(""); setNewEmail(""); setNewRole("Developer"); setNewLimit("30");
        setAddOpen(false);
        toast.success(`${emp.name} added to the department.`);
    };

    const handleRemove = () => {
        if (!removeTarget) return;
        setEmployees((prev) => prev.filter((e) => e.id !== removeTarget.id));
        toast.success(`${removeTarget.name} removed from the department.`);
        setRemoveTarget(null);
    };

    const handleRestrictToggle = (emp: Employee) => {
        const restricting = emp.dailyLimit !== 0;
        setEmployees((prev) =>
            prev.map((e) =>
                e.id === emp.id
                    ? { ...e, dailyLimit: restricting ? 0 : 30, status: restricting ? "INACTIVE" : "ACTIVE" }
                    : e,
            ),
        );
        toast.success(`${emp.name} has been ${restricting ? "restricted" : "unrestricted"}.`);
    };

    const handleSetLimit = () => {
        if (!limitTarget) return;
        const val = parseInt(editLimit);
        if (isNaN(val) || val < 0) { toast.error("Enter a valid limit (0 or more)."); return; }
        setEmployees((prev) => prev.map((e) => e.id === limitTarget.id ? { ...e, dailyLimit: val } : e));
        toast.success(`Daily limit for ${limitTarget.name} set to ${val}.`);
        setLimitTarget(null);
    };

    // ── Render ───────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title="Employee Management"
                subtitle={`${employees.length} team members · ${activeCount} active · ${inactiveCount} inactive`}
                breadcrumbs={[{ label: "Dept Admin", href: "/da/dashboard" }, { label: "Employee Management" }]}
                actions={
                    <Button className="bg-brand-700 hover:bg-brand-800" onClick={() => setAddOpen(true)}>
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
                                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
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

                    {/* Active filter chips */}
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
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">{m.role}</span>
                                    </TableCell>
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
                            >
                                {n}
                            </Button>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Add Employee Dialog ─────────────────────────────── */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
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
                            <Label>Role</Label>
                            <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Daily Request Limit</Label>
                            <Input type="number" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} min="0" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button className="bg-brand-700 hover:bg-brand-800" onClick={handleAdd}>Add Employee</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Remove Confirm Dialog ───────────────────────────── */}
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

            {/* ── Set Limit Dialog ────────────────────────────────── */}
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
                        <Button variant="outline" onClick={() => setLimitTarget(null)}>Cancel</Button>
                        <Button className="bg-brand-700 hover:bg-brand-800" onClick={handleSetLimit}>Save Limit</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Activity Dialog ─────────────────────────────────── */}
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
                                <span className="font-medium">{activityTarget?.role}</span>
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
