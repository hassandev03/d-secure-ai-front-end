"use client";

import { useState, useEffect } from "react";
import {
    Plus, BrainCircuit, Trash2, Edit2, Users,
    Loader2, Info, Lock, ChevronDown, ChevronUp,
    CheckSquare, Square, Shield, Clock, UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader,
    DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import {
    getDASystemPrompts, getOAPromptsForDept, createDASystemPrompt,
    updateDASystemPrompt, deleteDASystemPrompt, applyDASystemPromptToEmployees,
    getDeptEmployees,
    type DASystemPrompt, type DeptEmployee,
} from "@/services/da.service";

// ─────────────────────────────────────────────────────────────────────────────

function StatsCard({ icon: Icon, label, value, sub, color }: {
    icon: React.ElementType; label: string; value: string | number;
    sub?: string; color: string;
}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold">{value}</p>
                    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Shared prompt card ───────────────────────────────────────────────────────

interface PromptCardProps {
    prompt: DASystemPrompt;
    employees: DeptEmployee[];
    isExpanded: boolean;
    onToggleExpand: () => void;
    onEdit?: () => void;
    onApply?: () => void;
    onDelete?: () => void;
    readOnly?: boolean;
}

function PromptCard({ prompt, employees, isExpanded, onToggleExpand, onEdit, onApply, onDelete, readOnly }: PromptCardProps) {
    const empMap = Object.fromEntries(employees.map(e => [e.id, e]));
    const appliedEmployees = prompt.appliedToEmployees
        .map(id => empMap[id])
        .filter(Boolean);

    return (
        <Card className={`transition-shadow hover:shadow-md ${readOnly ? "border-orange-200 bg-orange-50/20" : ""}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${readOnly ? "bg-orange-100" : "bg-brand-100"}`}>
                            {readOnly
                                ? <Lock className="h-4 w-4 text-orange-600" />
                                : <BrainCircuit className="h-4 w-4 text-brand-700" />}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <CardTitle className="text-base">{prompt.name}</CardTitle>
                                {readOnly && (
                                    <Badge className="border-0 bg-orange-100 text-orange-700 text-[10px]">
                                        <Lock className="mr-1 h-2.5 w-2.5" />Org Enforced
                                    </Badge>
                                )}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Set {prompt.createdAt}
                            </div>
                        </div>
                    </div>

                    {/* Actions — hidden for org-enforced prompts */}
                    {!readOnly && (
                        <div className="flex shrink-0 items-center gap-1">
                            <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-brand-600"
                                onClick={onEdit}
                            >
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-danger"
                                onClick={onDelete}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Prompt content */}
                <div className={`rounded-lg border p-3 ${readOnly ? "border-orange-200 bg-orange-50/40" : "border-border bg-muted/30"}`}>
                    <p className={`text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap ${isExpanded ? "" : "line-clamp-2"}`}>
                        {prompt.content}
                    </p>
                    {prompt.content.length > 120 && (
                        <button
                            className={`mt-1.5 flex items-center gap-1 text-xs hover:underline ${readOnly ? "text-orange-600" : "text-brand-600"}`}
                            onClick={onToggleExpand}
                        >
                            {isExpanded
                                ? <><ChevronUp className="h-3 w-3" />Show less</>
                                : <><ChevronDown className="h-3 w-3" />Show more</>}
                        </button>
                    )}
                </div>

                {readOnly ? (
                    <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50/40 px-3 py-2">
                        <Lock className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                        <p className="text-xs text-orange-700">
                            This prompt is enforced by the organisation admin and applies to all employees in this department.
                        </p>
                    </div>
                ) : (
                    <>
                        <Separator />
                        {/* Applied employees row */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">Applied to:</span>
                                {appliedEmployees.length === 0 ? (
                                    <Badge variant="secondary" className="text-xs">Not applied</Badge>
                                ) : appliedEmployees.length === employees.length ? (
                                    <Badge className="border-0 bg-brand-100 text-brand-700 text-xs">All Employees</Badge>
                                ) : (
                                    <div className="flex flex-wrap gap-1">
                                        {appliedEmployees.slice(0, 3).map(e => (
                                            <Badge key={e.id} variant="outline" className="text-xs">{e.name}</Badge>
                                        ))}
                                        {appliedEmployees.length > 3 && (
                                            <Badge variant="secondary" className="text-xs">
                                                +{appliedEmployees.length - 3} more
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-brand-200 text-brand-700 hover:bg-brand-50"
                                onClick={onApply}
                            >
                                <Users className="mr-1.5 h-3.5 w-3.5" />
                                Apply to Employees
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function DASystemPromptsPage() {
    const [daPrompts, setDaPrompts]     = useState<DASystemPrompt[]>([]);
    const [oaPrompts, setOaPrompts]     = useState<DASystemPrompt[]>([]);
    const [employees, setEmployees]     = useState<DeptEmployee[]>([]);
    const [loading, setLoading]         = useState(true);

    // Create / Edit dialog
    const [promptDialog, setPromptDialog] = useState(false);
    const [editTarget, setEditTarget]     = useState<DASystemPrompt | null>(null);
    const [formName, setFormName]         = useState("");
    const [formContent, setFormContent]   = useState("");
    const [formSaving, setFormSaving]     = useState(false);

    // Apply dialog
    const [applyDialog, setApplyDialog]   = useState(false);
    const [applyTarget, setApplyTarget]   = useState<DASystemPrompt | null>(null);
    const [selectedEmps, setSelectedEmps] = useState<Set<string>>(new Set());
    const [applying, setApplying]         = useState(false);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<DASystemPrompt | null>(null);
    const [deleting, setDeleting]         = useState(false);

    // Expanded content cards
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    useEffect(() => {
        Promise.all([getDASystemPrompts(), getOAPromptsForDept(), getDeptEmployees()])
            .then(([da, oa, emp]) => { setDaPrompts(da); setOaPrompts(oa); setEmployees(emp); })
            .finally(() => setLoading(false));
    }, []);

    // ── Helpers ──────────────────────────────────────────────────────────────

    function openCreate() {
        setEditTarget(null);
        setFormName(""); setFormContent("");
        setPromptDialog(true);
    }

    function openEdit(prompt: DASystemPrompt) {
        setEditTarget(prompt);
        setFormName(prompt.name);
        setFormContent(prompt.content);
        setPromptDialog(true);
    }

    function openApply(prompt: DASystemPrompt) {
        setApplyTarget(prompt);
        setSelectedEmps(new Set(prompt.appliedToEmployees));
        setApplyDialog(true);
    }

    function closePromptDialog() {
        setPromptDialog(false);
        setFormName(""); setFormContent(""); setEditTarget(null);
    }

    function toggleExpand(id: string) {
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function toggleEmp(empId: string) {
        setSelectedEmps(prev => {
            const next = new Set(prev);
            next.has(empId) ? next.delete(empId) : next.add(empId);
            return next;
        });
    }

    // ── Handlers ─────────────────────────────────────────────────────────────

    async function handleSavePrompt() {
        if (!formName.trim()) { toast.error("Prompt name is required"); return; }
        if (!formContent.trim()) { toast.error("Prompt content is required"); return; }
        setFormSaving(true);
        try {
            if (editTarget) {
                const updated = await updateDASystemPrompt(editTarget.id, { name: formName, content: formContent });
                setDaPrompts(prev => prev.map(p => p.id === updated.id ? updated : p));
                toast.success(`Prompt "${updated.name}" updated`);
            } else {
                const created = await createDASystemPrompt(formName, formContent);
                setDaPrompts(prev => [...prev, created]);
                toast.success(`Prompt "${created.name}" created`);
            }
            closePromptDialog();
        } catch {
            toast.error("Failed to save prompt");
        } finally {
            setFormSaving(false);
        }
    }

    async function handleApply() {
        if (!applyTarget) return;
        setApplying(true);
        try {
            const updated = await applyDASystemPromptToEmployees(applyTarget.id, Array.from(selectedEmps));
            setDaPrompts(prev => prev.map(p => p.id === updated.id ? updated : p));
            const count = updated.appliedToEmployees.length;
            toast.success(
                count === 0
                    ? `"${updated.name}" removed from all employees`
                    : `"${updated.name}" applied to ${count} employee${count !== 1 ? "s" : ""}`
            );
            setApplyDialog(false);
        } catch {
            toast.error("Failed to apply prompt");
        } finally {
            setApplying(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteDASystemPrompt(deleteTarget.id);
            setDaPrompts(prev => prev.filter(p => p.id !== deleteTarget.id));
            toast.success(`Prompt "${deleteTarget.name}" deleted`);
            setDeleteTarget(null);
        } catch {
            toast.error("Failed to delete prompt");
        } finally {
            setDeleting(false);
        }
    }

    // ── Derived ──────────────────────────────────────────────────────────────

    const coveredEmpIds = new Set(daPrompts.flatMap(p => p.appliedToEmployees));
    const totalApplications = daPrompts.reduce((s, p) => s + p.appliedToEmployees.length, 0);
    const activeEmployees = employees.filter(e => e.status === "ACTIVE");

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <PageHeader
                title="System Prompts"
                subtitle="Manage prompts that shape LLM behaviour for your department's employees. Org-enforced prompts from the organisation admin are shown separately and cannot be changed."
                breadcrumbs={[
                    { label: "Department", href: "/da/dashboard" },
                    { label: "System Prompts" },
                ]}
                actions={
                    <Button
                        className="bg-brand-700 hover:bg-brand-800"
                        onClick={openCreate}
                    >
                        <Plus className="mr-2 h-4 w-4" />Create Prompt
                    </Button>
                }
            />

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <StatsCard
                    icon={Shield}
                    label="Org-Enforced Prompts"
                    value={oaPrompts.length}
                    sub="cannot be modified"
                    color="bg-orange-100 text-orange-700"
                />
                <StatsCard
                    icon={BrainCircuit}
                    label="Department Prompts"
                    value={daPrompts.length}
                    sub="created by you"
                    color="bg-brand-100 text-brand-700"
                />
                <StatsCard
                    icon={UserCheck}
                    label="Employees Covered"
                    value={coveredEmpIds.size}
                    sub={`of ${activeEmployees.length} active employees`}
                    color="bg-emerald-100 text-emerald-700"
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                </div>
            ) : (
                <div className="space-y-8">

                    {/* ── Section 1: OA-Enforced Prompts ───────────────────── */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Organisation-Enforced Prompts
                            </h2>
                            <Badge className="border-0 bg-orange-100 text-orange-700 text-[10px]">
                                {oaPrompts.length} active
                            </Badge>
                        </div>

                        {oaPrompts.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center py-10 text-center">
                                    <Shield className="h-9 w-9 text-muted-foreground/30" />
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        No org-enforced prompts for this department yet.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {oaPrompts.map(p => (
                                    <PromptCard
                                        key={p.id}
                                        prompt={p}
                                        employees={employees}
                                        isExpanded={expanded.has(p.id)}
                                        onToggleExpand={() => toggleExpand(p.id)}
                                        readOnly
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ── Section 2: DA Prompts ─────────────────────────────── */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Department Prompts
                                </h2>
                                <Badge variant="secondary" className="text-[10px]">
                                    {daPrompts.length} prompts
                                </Badge>
                            </div>
                        </div>

                        {/* Info banner */}
                        <Card className="border-brand-200 bg-brand-50/40">
                            <CardContent className="flex items-start gap-3 p-4">
                                <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                                <p className="text-sm text-brand-700">
                                    Prompts here stack <strong>on top of</strong> any org-enforced prompts. An employee can have multiple department prompts active at the same time. One prompt can be applied to many employees — including employees already covered by other prompts.
                                </p>
                            </CardContent>
                        </Card>

                        {daPrompts.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center py-12 text-center">
                                    <BrainCircuit className="h-11 w-11 text-muted-foreground/30" />
                                    <p className="mt-3 font-medium">No department prompts yet</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Create a prompt and apply it to specific employees to shape their LLM experience.
                                    </p>
                                    <Button className="mt-4 bg-brand-700 hover:bg-brand-800" onClick={openCreate}>
                                        <Plus className="mr-2 h-4 w-4" />Create Prompt
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {daPrompts.map(p => (
                                    <PromptCard
                                        key={p.id}
                                        prompt={p}
                                        employees={employees}
                                        isExpanded={expanded.has(p.id)}
                                        onToggleExpand={() => toggleExpand(p.id)}
                                        onEdit={() => openEdit(p)}
                                        onApply={() => openApply(p)}
                                        onDelete={() => setDeleteTarget(p)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}

            {/* ── Create / Edit dialog ──────────────────────────────────────── */}
            <Dialog open={promptDialog} onOpenChange={v => { if (!v) closePromptDialog(); }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? "Edit Prompt" : "Create Department Prompt"}</DialogTitle>
                        <DialogDescription>
                            {editTarget
                                ? "Update the name or content of this system prompt."
                                : "Define a prompt that will shape LLM behaviour for selected employees. Org-level prompts remain active alongside yours."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="space-y-2">
                            <Label>Prompt Name <span className="text-danger">*</span></Label>
                            <Input
                                placeholder="e.g. Code Review Assistant"
                                value={formName}
                                onChange={e => setFormName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Prompt Content <span className="text-danger">*</span></Label>
                            <Textarea
                                placeholder="Describe how the LLM should behave for the selected employees…"
                                value={formContent}
                                onChange={e => setFormContent(e.target.value)}
                                rows={6}
                                className="resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                This prompt will be active alongside any org-enforced prompts — they are additive, not exclusive.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            className="bg-brand-700 hover:bg-brand-800"
                            onClick={handleSavePrompt}
                            disabled={formSaving}
                        >
                            {formSaving
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{editTarget ? "Saving…" : "Creating…"}</>
                                : editTarget ? "Save Changes" : "Create Prompt"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Apply to Employees dialog ─────────────────────────────────── */}
            <Dialog open={applyDialog} onOpenChange={v => { if (!v) setApplyDialog(false); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Apply to Employees</DialogTitle>
                        <DialogDescription>
                            Select which employees this prompt is active for. Employees can have multiple prompts active simultaneously.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Select All shortcut */}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                            {selectedEmps.size === employees.length
                                ? <CheckSquare className="h-4 w-4 text-brand-700" />
                                : <Square className="h-4 w-4 text-muted-foreground" />}
                            <span className="text-sm font-medium">All Employees</span>
                        </div>
                        <Button
                            variant="ghost" size="sm"
                            className="h-7 text-xs text-brand-700 hover:bg-brand-50"
                            onClick={() => {
                                if (selectedEmps.size === employees.length) {
                                    setSelectedEmps(new Set());
                                } else {
                                    setSelectedEmps(new Set(employees.map(e => e.id)));
                                }
                            }}
                        >
                            {selectedEmps.size === employees.length ? "Deselect all" : "Select all"}
                        </Button>
                    </div>

                    <ScrollArea className="max-h-64">
                        <div className="space-y-1 pr-1">
                            {employees.map(emp => (
                                <label
                                    key={emp.id}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/40"
                                >
                                    <Checkbox
                                        checked={selectedEmps.has(emp.id)}
                                        onCheckedChange={() => toggleEmp(emp.id)}
                                        id={`emp-${emp.id}`}
                                    />
                                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{emp.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{emp.roleName}</p>
                                        </div>
                                        <Badge
                                            variant={emp.status === "ACTIVE" ? "default" : "secondary"}
                                            className={`shrink-0 text-[10px] ${emp.status === "ACTIVE" ? "border-0 bg-success/10 text-success" : ""}`}
                                        >
                                            {emp.status}
                                        </Badge>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </ScrollArea>

                    <p className="text-xs text-muted-foreground">
                        {selectedEmps.size === 0
                            ? "No employees selected — prompt will be removed from all."
                            : `${selectedEmps.size} of ${employees.length} employee${selectedEmps.size !== 1 ? "s" : ""} selected.`}
                    </p>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApplyDialog(false)}>Cancel</Button>
                        <Button
                            className="bg-brand-700 hover:bg-brand-800"
                            onClick={handleApply}
                            disabled={applying}
                        >
                            {applying
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Applying…</>
                                : "Apply"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete confirmation ───────────────────────────────────────── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this prompt?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong> will be permanently deleted and
                            removed from all employees it is currently applied to. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-danger hover:bg-danger/90"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
