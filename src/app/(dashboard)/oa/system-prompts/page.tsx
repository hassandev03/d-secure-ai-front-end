"use client";

import { useState, useEffect } from "react";
import {
    Plus, BrainCircuit, Trash2, Edit2, Building2,
    Loader2, Info, Layers, ChevronDown, ChevronUp,
    CheckSquare, Square, Shield, Clock,
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
    getOASystemPrompts, createOASystemPrompt, updateOASystemPrompt,
    deleteOASystemPrompt, applyOASystemPromptToDepts, getOADepartments,
    type OASystemPrompt, type OADepartment,
} from "@/services/oa.service";

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

// ─────────────────────────────────────────────────────────────────────────────

export default function OASystemPromptsPage() {
    const [prompts, setPrompts]       = useState<OASystemPrompt[]>([]);
    const [depts, setDepts]           = useState<OADepartment[]>([]);
    const [loading, setLoading]       = useState(true);

    // Create / Edit dialog
    const [promptDialog, setPromptDialog] = useState(false);
    const [editTarget, setEditTarget]     = useState<OASystemPrompt | null>(null);
    const [formName, setFormName]         = useState("");
    const [formContent, setFormContent]   = useState("");
    const [formSaving, setFormSaving]     = useState(false);

    // Apply dialog
    const [applyDialog, setApplyDialog]   = useState(false);
    const [applyTarget, setApplyTarget]   = useState<OASystemPrompt | null>(null);
    const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set());
    const [applying, setApplying]         = useState(false);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<OASystemPrompt | null>(null);
    const [deleting, setDeleting]         = useState(false);

    // Expanded content cards
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    useEffect(() => {
        Promise.all([getOASystemPrompts(), getOADepartments()])
            .then(([p, d]) => { setPrompts(p); setDepts(d); })
            .finally(() => setLoading(false));
    }, []);

    // ── Helpers ──────────────────────────────────────────────────────────────

    function openCreate() {
        setEditTarget(null);
        setFormName(""); setFormContent("");
        setPromptDialog(true);
    }

    function openEdit(prompt: OASystemPrompt) {
        setEditTarget(prompt);
        setFormName(prompt.name);
        setFormContent(prompt.content);
        setPromptDialog(true);
    }

    function openApply(prompt: OASystemPrompt) {
        setApplyTarget(prompt);
        setSelectedDepts(new Set(prompt.appliedToDepts));
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

    function toggleDept(deptId: string) {
        setSelectedDepts(prev => {
            const next = new Set(prev);
            next.has(deptId) ? next.delete(deptId) : next.add(deptId);
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
                const updated = await updateOASystemPrompt(editTarget.id, { name: formName, content: formContent });
                setPrompts(prev => prev.map(p => p.id === updated.id ? updated : p));
                toast.success(`Prompt "${updated.name}" updated`);
            } else {
                const created = await createOASystemPrompt(formName, formContent);
                setPrompts(prev => [...prev, created]);
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
            const updated = await applyOASystemPromptToDepts(applyTarget.id, Array.from(selectedDepts));
            setPrompts(prev => prev.map(p => p.id === updated.id ? updated : p));
            const count = updated.appliedToDepts.length;
            toast.success(
                count === 0
                    ? `"${updated.name}" removed from all departments`
                    : `"${updated.name}" applied to ${count} department${count !== 1 ? "s" : ""}`
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
            await deleteOASystemPrompt(deleteTarget.id);
            setPrompts(prev => prev.filter(p => p.id !== deleteTarget.id));
            toast.success(`Prompt "${deleteTarget.name}" deleted`);
            setDeleteTarget(null);
        } catch {
            toast.error("Failed to delete prompt");
        } finally {
            setDeleting(false);
        }
    }

    // ── Derived ──────────────────────────────────────────────────────────────

    const deptMap = Object.fromEntries(depts.map(d => [d.id, d]));
    const coveredDeptIds = new Set(prompts.flatMap(p => p.appliedToDepts));
    const totalApplications = prompts.reduce((s, p) => s + p.appliedToDepts.length, 0);

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <PageHeader
                title="System Prompts"
                subtitle="Create prompts that shape LLM behavior and apply them to departments. Applied prompts are enforced — dept admins cannot remove or override them."
                breadcrumbs={[
                    { label: "Organization", href: "/oa/dashboard" },
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

            {/* Info banner */}
            <Card className="border-brand-200 bg-brand-50/50">
                <CardContent className="flex items-start gap-3 p-4">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <div>
                        <p className="text-sm font-medium text-brand-800">How System Prompts Work</p>
                        <p className="mt-1 text-sm text-brand-700">
                            Prompts you create here can be applied to one or more departments.
                            Once applied, they are <strong>forcefully active</strong> for every employee in those departments —
                            department admins see them but cannot remove or modify them. Department admins can
                            add their own additional prompts on top.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <StatsCard
                    icon={BrainCircuit}
                    label="Total Prompts"
                    value={prompts.length}
                    sub="organisation-wide"
                    color="bg-brand-100 text-brand-700"
                />
                <StatsCard
                    icon={Layers}
                    label="Departments Covered"
                    value={coveredDeptIds.size}
                    sub={`of ${depts.length} departments`}
                    color="bg-purple-100 text-purple-700"
                />
                <StatsCard
                    icon={Shield}
                    label="Active Applications"
                    value={totalApplications}
                    sub="prompt → dept assignments"
                    color="bg-emerald-100 text-emerald-700"
                />
            </div>

            {/* Prompts list */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                </div>
            ) : prompts.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center py-16 text-center">
                        <BrainCircuit className="h-12 w-12 text-muted-foreground/30" />
                        <p className="mt-3 font-medium">No system prompts yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Create your first prompt to start shaping LLM behaviour across departments.
                        </p>
                        <Button className="mt-4 bg-brand-700 hover:bg-brand-800" onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" />Create Prompt
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {prompts.map(prompt => {
                        const isExpanded = expanded.has(prompt.id);
                        const appliedDepts = prompt.appliedToDepts
                            .map(id => deptMap[id])
                            .filter(Boolean);

                        return (
                            <Card key={prompt.id} className="transition-shadow hover:shadow-md">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                                                <BrainCircuit className="h-4.5 w-4.5 text-brand-700" />
                                            </div>
                                            <div className="min-w-0">
                                                <CardTitle className="text-base">{prompt.name}</CardTitle>
                                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    Created {prompt.createdAt}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Actions */}
                                        <div className="flex shrink-0 items-center gap-1">
                                            <Button
                                                variant="ghost" size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-brand-600"
                                                onClick={() => openEdit(prompt)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost" size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-danger"
                                                onClick={() => setDeleteTarget(prompt)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {/* Prompt content */}
                                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                                        <p className={`text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap ${isExpanded ? "" : "line-clamp-2"}`}>
                                            {prompt.content}
                                        </p>
                                        {prompt.content.length > 120 && (
                                            <button
                                                className="mt-1.5 flex items-center gap-1 text-xs text-brand-600 hover:underline"
                                                onClick={() => toggleExpand(prompt.id)}
                                            >
                                                {isExpanded
                                                    ? <><ChevronUp className="h-3 w-3" />Show less</>
                                                    : <><ChevronDown className="h-3 w-3" />Show more</>}
                                            </button>
                                        )}
                                    </div>

                                    <Separator />

                                    {/* Applied departments row */}
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-medium text-muted-foreground">Applied to:</span>
                                            {appliedDepts.length === 0 ? (
                                                <Badge variant="secondary" className="text-xs">
                                                    Not applied
                                                </Badge>
                                            ) : appliedDepts.length === depts.length ? (
                                                <Badge className="border-0 bg-brand-100 text-brand-700 text-xs">
                                                    All Departments
                                                </Badge>
                                            ) : (
                                                appliedDepts.map(d => (
                                                    <Badge
                                                        key={d.id}
                                                        variant="outline"
                                                        className="text-xs"
                                                        style={{ borderColor: d.color + "66", color: d.color }}
                                                    >
                                                        {d.name}
                                                    </Badge>
                                                ))
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 border-brand-200 text-brand-700 hover:bg-brand-50"
                                            onClick={() => openApply(prompt)}
                                        >
                                            <Building2 className="mr-1.5 h-3.5 w-3.5" />
                                            Apply to Departments
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ── Create / Edit dialog ─────────────────────────────────────── */}
            <Dialog open={promptDialog} onOpenChange={v => { if (!v) closePromptDialog(); }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? "Edit Prompt" : "Create System Prompt"}</DialogTitle>
                        <DialogDescription>
                            {editTarget
                                ? "Update the name or content of this system prompt."
                                : "Define a prompt that will guide LLM behaviour. Apply it to departments after creation."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="space-y-2">
                            <Label>Prompt Name <span className="text-danger">*</span></Label>
                            <Input
                                placeholder="e.g. Professional Tone Policy"
                                value={formName}
                                onChange={e => setFormName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Prompt Content <span className="text-danger">*</span></Label>
                            <Textarea
                                placeholder="Describe how the LLM should behave, e.g. 'Always respond in a formal tone…'"
                                value={formContent}
                                onChange={e => setFormContent(e.target.value)}
                                rows={6}
                                className="resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                Be specific — this text is prepended to every LLM interaction for the selected departments.
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

            {/* ── Apply to Departments dialog ──────────────────────────────── */}
            <Dialog open={applyDialog} onOpenChange={v => { if (!v) setApplyDialog(false); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Apply to Departments</DialogTitle>
                        <DialogDescription>
                            Select which departments this prompt is enforced on.
                            Employees in selected departments will always have this prompt active.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Select All shortcut */}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                            {selectedDepts.size === depts.length
                                ? <CheckSquare className="h-4 w-4 text-brand-700" />
                                : <Square className="h-4 w-4 text-muted-foreground" />}
                            <span className="text-sm font-medium">All Departments</span>
                        </div>
                        <Button
                            variant="ghost" size="sm"
                            className="h-7 text-xs text-brand-700 hover:bg-brand-50"
                            onClick={() => {
                                if (selectedDepts.size === depts.length) {
                                    setSelectedDepts(new Set());
                                } else {
                                    setSelectedDepts(new Set(depts.map(d => d.id)));
                                }
                            }}
                        >
                            {selectedDepts.size === depts.length ? "Deselect all" : "Select all"}
                        </Button>
                    </div>

                    <ScrollArea className="max-h-64">
                        <div className="space-y-1 pr-1">
                            {depts.map(dept => (
                                <label
                                    key={dept.id}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40"
                                >
                                    <Checkbox
                                        checked={selectedDepts.has(dept.id)}
                                        onCheckedChange={() => toggleDept(dept.id)}
                                        id={`dept-${dept.id}`}
                                    />
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div
                                            className="h-2.5 w-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: dept.color }}
                                        />
                                        <span className="text-sm font-medium truncate">{dept.name}</span>
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            {dept.employees} employees
                                        </span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </ScrollArea>

                    <p className="text-xs text-muted-foreground">
                        {selectedDepts.size === 0
                            ? "No departments selected — prompt will be un-applied from all."
                            : `${selectedDepts.size} of ${depts.length} department${selectedDepts.size !== 1 ? "s" : ""} selected.`}
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

            {/* ── Delete confirmation ──────────────────────────────────────── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this prompt?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong> will be permanently deleted and
                            removed from all departments it is currently applied to. This action cannot be undone.
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
