"use client";

import { useState, useMemo, useEffect } from "react";
import { Save, Loader2, ShieldCheck, Search, X, Check } from "lucide-react";
import { toast } from "sonner";
import { MODELS } from "@/lib/constants";
import type { LLMModel } from "@/types/chat.types";
import {
    getDeptAccessData,
    getDeptPolicy,
    saveDeptPolicy,
    applyPolicyToSelected,
    type EmpAccessData,
    type DeptPolicy,
} from "@/services/da.service";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZE = 6;

function initials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Inline model checkbox grid grouped by provider ────────────────────────
function ModelCheckboxGrid({
    available,
    selected,
    onChange,
}: {
    available: typeof MODELS;
    selected: LLMModel[];
    onChange: (v: LLMModel[]) => void;
}) {
    const toggle = (id: LLMModel) =>
        onChange(selected.includes(id) ? selected.filter((m) => m !== id) : [...selected, id]);

    const byProvider = Object.values(
        available.reduce<Record<string, typeof MODELS>>((acc, m) => {
            if (!acc[m.provider]) acc[m.provider] = [];
            acc[m.provider].push(m);
            return acc;
        }, {}),
    );

    return (
        <div className="space-y-3">
            {byProvider.map((group) => (
                <div key={group[0].provider}>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                        {group[0].providerName}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {group.map((m) => {
                            const checked = selected.includes(m.id as LLMModel);
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => toggle(m.id as LLMModel)}
                                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors text-left ${
                                        checked
                                            ? "border-brand-700/50 bg-brand-50 text-brand-700"
                                            : "border-border hover:bg-muted/60"
                                    }`}
                                >
                                    <div className={`h-3.5 w-3.5 shrink-0 rounded-sm border flex items-center justify-center ${
                                        checked ? "bg-brand-700 border-brand-700" : "border-muted-foreground/40"
                                    }`}>
                                        {checked && <Check className="h-2.5 w-2.5 text-white" />}
                                    </div>
                                    {m.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Compact per-employee model selector ──────────────────────────────────────
function EmpModelSelect({
    available,
    selected,
    onChange,
}: {
    available: typeof MODELS;
    selected: LLMModel[];
    onChange: (v: LLMModel[]) => void;
}) {
    const toggle = (id: LLMModel) =>
        onChange(selected.includes(id) ? selected.filter((m) => m !== id) : [...selected, id]);

    return (
        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-border">
            <span className="text-xs text-muted-foreground self-center mr-1">Models:</span>
            {available.map((m) => {
                const active = selected.includes(m.id as LLMModel);
                return (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => toggle(m.id as LLMModel)}
                        className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                            active
                                ? "bg-brand-700 border-brand-700 text-white"
                                : "border-border text-muted-foreground hover:border-brand-700/50"
                        }`}
                    >
                        {active && <Check className="h-2.5 w-2.5" />}
                        {m.name}
                    </button>
                );
            })}
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AccessControlPage() {
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [applying, setApplying]   = useState(false);
    const [employees, setEmployees] = useState<EmpAccessData[]>([]);
    const [policy, setPolicy]       = useState<DeptPolicy>({
        fileUpload:      false,
        speechToText:    false,
        allModels:       false,
        permittedModels: [],
        dailyLimit:      0,
    });

    const [search, setSearch]             = useState("");
    const [accessFilter, setAccessFilter] = useState("all");
    const [page, setPage]                 = useState(1);
    const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());

    // Load data from service (simulates API call)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [empData, policyData] = await Promise.all([getDeptAccessData(), getDeptPolicy()]);
                if (!cancelled) {
                    setEmployees(empData);
                    setPolicy(policyData);
                }
            } catch {
                toast.error("Failed to load access data.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const update = <K extends keyof EmpAccessData>(id: string, key: K, value: EmpAccessData[K]) =>
        setEmployees((prev) => prev.map((e) => e.id === id ? { ...e, [key]: value } : e));

    // ── Selection helpers ──────────────────────────────────────────────────────
    const toggleSelect = (id: string) =>
        setSelectedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    const selectAll  = () => setSelectedIds(new Set(employees.map((e) => e.id)));
    const selectNone = () => setSelectedIds(new Set());
    const allSelected = employees.length > 0 && selectedIds.size === employees.length;

    // Seed models when turning off "All Models" for an employee:
    // pre-select the dept-permitted set so they inherit policy, then admin can adjust individually.
    const policyModelSeed: LLMModel[] = policy.allModels
        ? (MODELS.map((m) => m.id) as LLMModel[])
        : policy.permittedModels;

    const filtered = useMemo(() => {
        let list = [...employees];
        const q = search.toLowerCase();
        if (q) list = list.filter(
            (e) => e.name.toLowerCase().includes(q)
                || e.email.toLowerCase().includes(q)
                || e.roleName.toLowerCase().includes(q),
        );
        if (accessFilter === "restricted") list = list.filter((e) => e.limit === 0);
        else if (accessFilter === "full")  list = list.filter((e) => e.fileUpload && e.speechToText && e.allModels && e.limit > 0);
        else if (accessFilter === "custom") list = list.filter((e) => e.limit > 0 && !(e.fileUpload && e.speechToText && e.allModels));
        return list;
    }, [employees, search, accessFilter]);

    // selects only the currently visible (filtered) employees
    const selectFiltered = () => setSelectedIds((prev) => new Set([...prev, ...filtered.map((e) => e.id)]));

    const totalPages      = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated       = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const restrictedCount = employees.filter((e) => e.limit === 0).length;
    const fullCount       = employees.filter((e) => e.fileUpload && e.speechToText && e.allModels && e.limit > 0).length;
    const customCount     = employees.length - restrictedCount - fullCount;

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveDeptPolicy(policy);
            toast.success("Access policies saved.");
        } catch {
            toast.error("Failed to save policies.");
        } finally { setSaving(false); }
    };

    const handleApplyPolicy = async () => {
        if (selectedIds.size === 0) return;
        setApplying(true);
        try {
            const ids     = [...selectedIds];
            const updated = await applyPolicyToSelected(policy, ids);
            setEmployees(updated);
            const isAll      = ids.length === employees.length;
            const modelNote  = !policy.allModels
                ? ` · ${policy.permittedModels.length} model${policy.permittedModels.length !== 1 ? "s" : ""} permitted`
                : "";
            toast.success(
                isAll
                    ? `Policy applied to all ${ids.length} employees${modelNote}.`
                    : `Policy applied to ${ids.length} employee${ids.length !== 1 ? "s" : ""}${modelNote}.`,
            );
        } catch {
            toast.error("Failed to apply policy.");
        } finally { setApplying(false); }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-6xl">
                <PageHeader
                    title="Access Control"
                    subtitle="Manage employee permissions and AI access policies."
                    breadcrumbs={[{ label: "Dept Admin", href: "/da/dashboard" }, { label: "Access Control" }]}
                />
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader
                title="Access Control"
                subtitle="Manage employee permissions and AI access policies."
                breadcrumbs={[{ label: "Dept Admin", href: "/da/dashboard" }, { label: "Access Control" }]}
                actions={
                    <Button onClick={handleSave} className="bg-brand-700 hover:bg-brand-800" disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save All Policies
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
                    <p className="text-2xl font-bold text-danger">{restrictedCount}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Restricted</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-success">{fullCount}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Full Access</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-warning">{customCount}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Custom Access</p>
                </CardContent></Card>
            </div>

            {/* Department-level policies */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-brand-700" />
                        <CardTitle className="text-base">Department-Level Policies</CardTitle>
                    </div>
                    <CardDescription>
                        Configure default access settings. Select employees below, then click{" "}
                        <span className="font-medium text-foreground">Apply</span>{" "}
                        to enforce this policy on the chosen team members only.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* 4 policy toggles */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="flex items-center justify-between rounded-lg border border-border p-3.5">
                            <div>
                                <p className="text-sm font-medium">File Uploads</p>
                                <p className="text-xs text-muted-foreground">Upload documents to AI</p>
                            </div>
                            <Switch checked={policy.fileUpload} onCheckedChange={(v) => setPolicy((p) => ({ ...p, fileUpload: v }))} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-border p-3.5">
                            <div>
                                <p className="text-sm font-medium">Speech-to-Text</p>
                                <p className="text-xs text-muted-foreground">Voice input for prompts</p>
                            </div>
                            <Switch checked={policy.speechToText} onCheckedChange={(v) => setPolicy((p) => ({ ...p, speechToText: v }))} />
                        </div>
                        <div className={`flex items-center justify-between rounded-lg border p-3.5 transition-colors ${
                            policy.allModels ? "border-border" : "border-warning/40 bg-warning/5"
                        }`}>
                            <div>
                                <p className="text-sm font-medium">All AI Models</p>
                                <p className="text-xs text-muted-foreground">
                                    {policy.allModels
                                        ? "All providers & models"
                                        : <span className="text-warning font-medium">{policy.permittedModels.length} model{policy.permittedModels.length !== 1 ? "s" : ""} permitted</span>
                                    }
                                </p>
                            </div>
                            <Switch checked={policy.allModels} onCheckedChange={(v) => setPolicy((p) => ({ ...p, allModels: v }))} />
                        </div>
                    </div>

                    {/* Model picker — visible only when allModels is OFF */}
                    {!policy.allModels && (
                        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm font-medium">Permitted Models</p>
                                    <p className="text-xs text-muted-foreground">
                                        Employees will only be able to use the selected models.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="text-xs h-7 px-2"
                                        onClick={() => setPolicy((p) => ({ ...p, permittedModels: MODELS.map((m) => m.id) as LLMModel[] }))}>
                                        All
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-xs h-7 px-2"
                                        onClick={() => setPolicy((p) => ({ ...p, permittedModels: [] }))}>
                                        None
                                    </Button>
                                </div>
                            </div>
                            <ModelCheckboxGrid
                                available={MODELS}
                                selected={policy.permittedModels}
                                onChange={(v) => setPolicy((p) => ({ ...p, permittedModels: v }))}
                            />
                        </div>
                    )}

                    {/* Daily limit + Apply button */}
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                        <div className="space-y-1.5 flex-1 max-w-xs">
                            <Label>Default Daily Limit (requests)</Label>
                            <Input
                                type="number"
                                value={policy.dailyLimit}
                                min="0"
                                onChange={(e) => setPolicy((p) => ({ ...p, dailyLimit: parseInt(e.target.value) || 0 }))}
                            />
                        </div>
                        <Button
                            onClick={handleApplyPolicy}
                            disabled={applying || selectedIds.size === 0 || (!policy.allModels && policy.permittedModels.length === 0)}
                            className="bg-brand-700 hover:bg-brand-800 shrink-0 self-end"
                        >
                            {applying ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Applying…</>
                            ) : selectedIds.size === 0 ? (
                                <><Save className="mr-2 h-4 w-4" />Apply Policy</>
                            ) : selectedIds.size === employees.length ? (
                                <><Save className="mr-2 h-4 w-4" />Apply to All ({employees.length})</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" />Apply to Selected ({selectedIds.size})</>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Employee Overrides */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Employee Access Overrides</CardTitle>
                    <CardDescription>
                        Select employees to apply the department policy, or tweak individual settings directly.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Search + filter */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email or role…"
                                className="pl-9"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <Select value={accessFilter} onValueChange={(v) => { setAccessFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Employees</SelectItem>
                                <SelectItem value="restricted">Restricted Only</SelectItem>
                                <SelectItem value="full">Full Access Only</SelectItem>
                                <SelectItem value="custom">Custom Access</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filter chips */}
                    {(search || accessFilter !== "all") && (
                        <div className="mb-3 flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">{filtered.length} result{filtered.length !== 1 && "s"}</span>
                            {search && (
                                <Badge variant="secondary" className="text-xs cursor-pointer gap-1" onClick={() => { setSearch(""); setPage(1); }}>
                                    &ldquo;{search}&rdquo; <X className="h-3 w-3" />
                                </Badge>
                            )}
                            {accessFilter !== "all" && (
                                <Badge variant="secondary" className="text-xs cursor-pointer gap-1" onClick={() => { setAccessFilter("all"); setPage(1); }}>
                                    {accessFilter} <X className="h-3 w-3" />
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Selection toolbar */}
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/40 border border-border mb-3">
                        <div className="flex items-center gap-0.5">
                            <Button
                                variant="ghost" size="sm"
                                className="h-7 text-xs px-2.5 gap-1.5"
                                onClick={selectAll}
                            >
                                <div className={`h-3.5 w-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors ${
                                    allSelected ? "bg-brand-700 border-brand-700" : "border-muted-foreground/40"
                                }`}>
                                    {allSelected && <Check className="h-2.5 w-2.5 text-white" />}
                                </div>
                                All ({employees.length})
                            </Button>
                            <span className="text-muted-foreground/30 select-none">|</span>
                            <Button
                                variant="ghost" size="sm"
                                className="h-7 text-xs px-2.5"
                                onClick={selectFiltered}
                                disabled={filtered.length === 0 || filtered.every((e) => selectedIds.has(e.id))}
                            >
                                Visible ({filtered.length})
                            </Button>
                            <span className="text-muted-foreground/30 select-none">|</span>
                            <Button
                                variant="ghost" size="sm"
                                className="h-7 text-xs px-2.5 text-muted-foreground"
                                onClick={selectNone}
                                disabled={selectedIds.size === 0}
                            >
                                None
                            </Button>
                        </div>
                        <span className="text-xs">
                            {selectedIds.size > 0 ? (
                                <span className="font-medium text-brand-700">{selectedIds.size} of {employees.length} selected</span>
                            ) : (
                                <span className="text-muted-foreground">No selection</span>
                            )}
                        </span>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="py-12 text-center">
                            <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">No employees match your search.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {paginated.map((emp) => {
                                const isRestricted  = emp.limit === 0;
                                const isFullAccess  = emp.fileUpload && emp.speechToText && emp.allModels && emp.limit > 0;
                                const allowedCount  = emp.allModels
                                    ? MODELS.length
                                    : emp.allowedModels.length;

                                return (
                                    <div
                                        key={emp.id}
                                        className={`rounded-xl border p-4 transition-all ${
                                            selectedIds.has(emp.id)
                                                ? "border-brand-700/50 bg-brand-50/40 ring-1 ring-brand-700/20"
                                                : isRestricted  ? "border-danger/30 bg-danger/5"
                                                : isFullAccess  ? "border-success/20 bg-success/5"
                                                : "border-border hover:bg-muted/30"
                                        }`}
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-3.5">
                                            <div className="flex items-center gap-3">
                                                {/* Selection checkbox */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSelect(emp.id)}
                                                    className={`h-4 w-4 shrink-0 rounded-sm border-2 flex items-center justify-center transition-colors ${
                                                        selectedIds.has(emp.id)
                                                            ? "bg-brand-700 border-brand-700"
                                                            : "border-muted-foreground/30 hover:border-brand-700/60"
                                                    }`}
                                                >
                                                    {selectedIds.has(emp.id) && <Check className="h-2.5 w-2.5 text-white" />}
                                                </button>
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">
                                                        {initials(emp.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-semibold">{emp.name}</p>
                                                    <p className="text-xs text-muted-foreground">{emp.email} · {emp.roleName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                                {!emp.allModels && (
                                                    <Badge variant="outline" className="bg-brand-50 text-brand-700 border-brand-700/20 text-xs">
                                                        {allowedCount} / {MODELS.length} model{allowedCount !== 1 ? "s" : ""}
                                                    </Badge>
                                                )}
                                                {isRestricted  && <Badge variant="outline" className="bg-danger/10 text-danger border-danger/20 text-xs">Restricted</Badge>}
                                                {isFullAccess  && <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">Full Access</Badge>}
                                                {!isRestricted && !isFullAccess && <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">Custom</Badge>}
                                            </div>
                                        </div>

                                        {/* Controls row */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                                                <span className="text-xs text-muted-foreground">File Uploads</span>
                                                <Switch checked={emp.fileUpload} onCheckedChange={(v) => update(emp.id, "fileUpload", v)} className="scale-90" />
                                            </div>
                                            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                                                <span className="text-xs text-muted-foreground">Speech</span>
                                                <Switch checked={emp.speechToText} onCheckedChange={(v) => update(emp.id, "speechToText", v)} className="scale-90" />
                                            </div>
                                            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                                                <span className="text-xs text-muted-foreground">All Models</span>
                                                <Switch
                                                    checked={emp.allModels}
                                                    onCheckedChange={(v) => {
                                                        // When turning off, seed with dept-level permitted models
                                                        if (!v) update(emp.id, "allowedModels", policyModelSeed);
                                                        update(emp.id, "allModels", v);
                                                    }}
                                                    className="scale-90"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
                                                <span className="text-xs text-muted-foreground flex-1">Daily Limit</span>
                                                <Input
                                                    type="number"
                                                    value={emp.limit}
                                                    onChange={(e) => update(emp.id, "limit", parseInt(e.target.value) || 0)}
                                                    className="h-7 w-16 text-xs px-2 bg-background"
                                                    min="0"
                                                />
                                            </div>
                                        </div>

                                        {/* Per-employee model selector — shown when allModels is OFF; shows all models */}
                                        {!emp.allModels && (
                                            <EmpModelSelect
                                                available={MODELS}
                                                selected={emp.allowedModels}
                                                onChange={(v) => update(emp.id, "allowedModels", v)}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-5 flex items-center justify-between text-sm border-t border-border pt-4">
                            <span className="text-muted-foreground">
                                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                                    <Button
                                        key={n}
                                        variant={n === page ? "default" : "outline"}
                                        size="sm"
                                        className={n === page ? "bg-brand-700 text-white w-8" : "w-8"}
                                        onClick={() => setPage(n)}
                                    >{n}</Button>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
