"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
    Plus, Layers, Users, Search, MoreHorizontal, Edit2, Trash2,
    Building2, TrendingUp, Database, X, ChevronRight, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import QuotaGauge from "@/components/shared/QuotaGauge";
import StatCard from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { getOADepartments, DEPT_COLORS, type OADepartment } from "@/services/oa.service";

/* ------------------------------------------------------------------ */
/* Types & constants                                                    */
/* ------------------------------------------------------------------ */
type Department  = OADepartment;
type QuotaFilter = "all" | "normal" | "warning" | "critical";
type SortField   = "name" | "employees" | "quota";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function quotaHealth(dept: Department): { label: string; className: string } {
    const pct = dept.percentageUsed;
    if (pct >= 90) return { label: "Critical", className: "bg-danger/10 text-danger border-danger/20" };
    if (pct >= 70) return { label: "Warning",  className: "bg-warning/10 text-warning border-warning/20" };
    return                { label: "Normal",   className: "bg-success/10 text-success border-success/20" };
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function DepartmentsPage() {
    /* ---- data ---- */
    const [departments, setDepartments] = useState<Department[]>([]);

    useEffect(() => {
        getOADepartments().then(setDepartments);
    }, []);

    /* ---- filters ---- */
    const [search,      setSearch]      = useState("");
    const [quotaFilter, setQuotaFilter] = useState<QuotaFilter>("all");
    const [sortBy,      setSortBy]      = useState<SortField>("name");

    /* ---- create dialog ---- */
    const [createOpen, setCreateOpen] = useState(false);
    const [newName,    setNewName]    = useState("");
    const [newHead,    setNewHead]    = useState("");
    const [newEmail,   setNewEmail]   = useState("");
    const [newQuota,   setNewQuota]   = useState("1000");
    const [creating,   setCreating]   = useState(false);

    /* ---- edit dialog ---- */
    const [editTarget, setEditTarget] = useState<Department | null>(null);
    const [editName,   setEditName]   = useState("");
    const [editHead,   setEditHead]   = useState("");
    const [editEmail,  setEditEmail]  = useState("");
    const [editQuota,  setEditQuota]  = useState("");
    const [editSaving, setEditSaving] = useState(false);

    /* ---- delete dialog ---- */
    const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
    const [deleting,     setDeleting]     = useState(false);

    /* ---- derived stats ---- */
    const totalEmployees = departments.reduce((s, d) => s + d.employees, 0);
    const totalQuotaUsed = departments.reduce((s, d) => s + (d.budget * (d.percentageUsed / 100)), 0);
    const totalQuotaMax  = departments.reduce((s, d) => s + d.budget, 0);
    const criticalCount  = departments.filter(d => d.percentageUsed >= 90).length;

    /* ---- filtered + sorted list ---- */
    const filtered = useMemo(() => {
        let list = [...departments];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(d =>
                d.name.toLowerCase().includes(q) || d.head.toLowerCase().includes(q)
            );
        }
        if (quotaFilter !== "all") {
            list = list.filter(d => {
                const pct = d.percentageUsed;
                if (quotaFilter === "critical") return pct >= 90;
                if (quotaFilter === "warning")  return pct >= 70 && pct < 90;
                return pct < 70; // normal
            });
        }
        if (sortBy === "employees") list.sort((a, b) => b.employees - a.employees);
        else if (sortBy === "quota") list.sort((a, b) => b.percentageUsed - a.percentageUsed);
        else list.sort((a, b) => a.name.localeCompare(b.name));
        return list;
    }, [departments, search, quotaFilter, sortBy]);

    /* ---- active filter chips ---- */
    const activeFilters: { key: string; label: string }[] = [];
    if (search.trim())        activeFilters.push({ key: "search", label: `"${search}"` });
    if (quotaFilter !== "all") activeFilters.push({ key: "quota",  label: `Quota: ${quotaFilter}` });
    if (sortBy !== "name")    activeFilters.push({ key: "sort",   label: `Sort: ${sortBy === "employees" ? "Most Employees" : "Highest Quota"}` });

    const clearFilter = (key: string) => {
        if (key === "search") setSearch("");
        if (key === "quota")  setQuotaFilter("all");
        if (key === "sort")   setSortBy("name");
    };

    /* ---- handlers ---- */
    const handleCreate = () => {
        if (!newName.trim() || !newHead.trim() || !newEmail.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }
        setCreating(true);
        setTimeout(() => {
            const color = DEPT_COLORS[departments.length % DEPT_COLORS.length];
            setDepartments(prev => [
                ...prev,
                {
                    id: `dept-${Date.now()}`,
                    name: newName.trim(),
                    head: newHead.trim(),
                    headEmail: newEmail.trim(),
                    employees: 0,
                    budget: parseInt(newQuota) || 1000,
                    percentageUsed: 0,
                    color,
                },
            ]);
            setNewName(""); setNewHead(""); setNewEmail(""); setNewQuota("1000");
            setCreating(false);
            setCreateOpen(false);
            toast.success(`Department "${newName.trim()}" created`);
        }, 600);
    };

    const openEdit = (dept: Department) => {
        setEditTarget(dept);
        setEditName(dept.name);
        setEditHead(dept.head);
        setEditEmail(dept.headEmail);
        setEditQuota(String(dept.budget));
    };

    const handleEdit = () => {
        if (!editTarget || !editName.trim() || !editHead.trim()) return;
        setEditSaving(true);
        setTimeout(() => {
            setDepartments(prev =>
                prev.map(d =>
                    d.id === editTarget.id
                        ? {
                            ...d,
                            name:      editName.trim(),
                            head:      editHead.trim(),
                            headEmail: editEmail.trim(),
                            budget:    parseInt(editQuota) || d.budget,
                        }
                        : d
                )
            );
            setEditTarget(null);
            setEditSaving(false);
            toast.success("Department updated");
        }, 500);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        setTimeout(() => {
            setDepartments(prev => prev.filter(d => d.id !== deleteTarget.id));
            const name = deleteTarget.name;
            setDeleteTarget(null);
            setDeleting(false);
            toast.success(`Department "${name}" removed`);
        }, 500);
    };

    /* ================================================================ */
    /* Render                                                             */
    /* ================================================================ */
    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <PageHeader
                title="Departments"
                subtitle={`${departments.length} departments · ${totalEmployees.toLocaleString()} employees`}
                breadcrumbs={[
                    { label: "Organization", href: "/oa/dashboard" },
                    { label: "Departments" },
                ]}
                actions={
                    <Button
                        onClick={() => setCreateOpen(true)}
                        className="bg-brand-700 hover:bg-brand-800"
                    >
                        <Plus className="mr-2 h-4 w-4" />Create Department
                    </Button>
                }
            />

            {/* ---- Stat cards ---- */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Departments"
                    value={departments.length}
                    icon={Layers}
                    iconColor="text-brand-600 bg-brand-50"
                />
                <StatCard
                    title="Total Employees"
                    value={totalEmployees}
                    icon={Users}
                    iconColor="text-success bg-success/10"
                />
                <StatCard
                    title="Budget Utilisation"
                    value={totalQuotaMax ? `${Math.round((totalQuotaUsed / totalQuotaMax) * 100)}%` : "0%"}
                    icon={Database}
                    iconColor="text-warning bg-warning/10"
                />
                <StatCard
                    title="Critical Budget"
                    value={criticalCount}
                    icon={TrendingUp}
                    iconColor={criticalCount > 0 ? "text-danger bg-danger/10" : "text-success bg-success/10"}
                />
            </div>

            {/* ---- Filters ---- */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-55 flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder="Search by name or head…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Select value={quotaFilter} onValueChange={v => setQuotaFilter(v as QuotaFilter)}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="Budget Health" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Budgets</SelectItem>
                        <SelectItem value="normal">Normal (&lt;70%)</SelectItem>
                        <SelectItem value="warning">Warning (70–89%)</SelectItem>
                        <SelectItem value="critical">Critical (≥90%)</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={v => setSortBy(v as SortField)}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="name">Name A–Z</SelectItem>
                        <SelectItem value="employees">Most Employees</SelectItem>
                        <SelectItem value="quota">Highest Budget Use</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* ---- Active filter chips ---- */}
            {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    {activeFilters.map(f => (
                        <Badge key={f.key} variant="secondary" className="gap-1 pr-1 text-xs">
                            {f.label}
                            <button
                                onClick={() => clearFilter(f.key)}
                                className="ml-1 rounded p-0.5 hover:bg-muted"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                    <button
                        onClick={() => { setSearch(""); setQuotaFilter("all"); setSortBy("name"); }}
                        className="ml-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                        Clear all
                    </button>
                </div>
            )}

            {/* ---- Department grid ---- */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
                    <Building2 className="mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-medium">No departments found</p>
                    <p className="mt-1 text-xs text-muted-foreground">Try adjusting your filters</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((dept) => {
                        const health = quotaHealth(dept);
                        return (
                            <Card
                                key={dept.id}
                                className="group relative cursor-pointer transition-all hover:border-brand-200 hover:shadow-md"
                            >
                                {/* Actions dropdown */}
                                <div className="absolute right-3 top-3 z-10">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={e => e.preventDefault()}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/oa/departments/${dept.id}`}>
                                                    <ChevronRight className="mr-2 h-4 w-4" />View Dashboard
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openEdit(dept)}>
                                                <Edit2 className="mr-2 h-4 w-4" />Edit Department
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-danger focus:text-danger"
                                                onClick={() => setDeleteTarget(dept)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />Delete Department
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <Link href={`/oa/departments/${dept.id}`}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                                                style={{ backgroundColor: dept.color + "15", color: dept.color }}
                                            >
                                                <Layers className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1 pr-6">
                                                <CardTitle className="truncate text-base transition-colors group-hover:text-brand-600">
                                                    {dept.name}
                                                </CardTitle>
                                                <Badge
                                                    className={`mt-1 border px-1.5 py-0 text-[10px] ${health.className}`}
                                                >
                                                    {health.label}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Head */}
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-7 w-7">
                                                <AvatarFallback className="bg-brand-50 text-[10px] font-semibold text-brand-700">
                                                    {dept.head.split(" ").map(n => n[0]).join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-medium">{dept.head}</p>
                                                <p className="text-[11px] text-muted-foreground">Department Head</p>
                                            </div>
                                        </div>

                                        {/* Stats row */}
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5" />
                                                <span>{dept.employees} members</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Database className="h-3.5 w-3.5" />
                                                <span>{dept.budget.toLocaleString()} credits</span>
                                            </div>
                                        </div>

                                        {/* Quota bar */}
                                        <div className="flex justify-center py-2">
                                            <QuotaGauge percentageUsed={dept.percentageUsed} size="sm" />
                                        </div>
                                    </CardContent>
                                </Link>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ================================================================ */}
            {/* Create Department Dialog                                          */}
            {/* ================================================================ */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Department</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Department Name <span className="text-danger">*</span></Label>
                            <Input
                                placeholder="e.g. Research & Development"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Department Head <span className="text-danger">*</span></Label>
                            <Input
                                placeholder="Full name"
                                value={newHead}
                                onChange={e => setNewHead(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Head Email <span className="text-danger">*</span></Label>
                            <Input
                                type="email"
                                placeholder="head@acme.com"
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Monthly AI Budget (credits)</Label>
                            <Input
                                type="number"
                                placeholder="1000"
                                value={newQuota}
                                onChange={e => setNewQuota(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            className="bg-brand-700 hover:bg-brand-800"
                            onClick={handleCreate}
                            disabled={creating}
                        >
                            {creating
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</>
                                : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ================================================================ */}
            {/* Edit Department Dialog                                            */}
            {/* ================================================================ */}
            <Dialog open={!!editTarget} onOpenChange={v => !v && setEditTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Department</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Department Name <span className="text-danger">*</span></Label>
                            <Input value={editName} onChange={e => setEditName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Department Head</Label>
                            <Input value={editHead} onChange={e => setEditHead(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Head Email</Label>
                            <Input
                                type="email"
                                value={editEmail}
                                onChange={e => setEditEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Monthly AI Budget (credits)</Label>
                            <Input
                                type="number"
                                value={editQuota}
                                onChange={e => setEditQuota(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            className="bg-brand-700 hover:bg-brand-800"
                            onClick={handleEdit}
                            disabled={editSaving}
                        >
                            {editSaving
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                                : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ================================================================ */}
            {/* Delete Confirm Dialog                                             */}
            {/* ================================================================ */}
            <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Department</DialogTitle>
                    </DialogHeader>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-foreground">{deleteTarget?.name}</span>?{" "}
                        This action cannot be undone and will remove all associated data.
                    </p>
                    <DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</>
                                : "Delete Department"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
