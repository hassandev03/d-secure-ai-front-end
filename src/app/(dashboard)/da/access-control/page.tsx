"use client";

import { useState, useMemo } from "react";
import { Save, Loader2, ShieldCheck, Search, X } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type EmpAccess = {
    id: string;
    name: string;
    email: string;
    role: string;
    fileUpload: boolean;
    speechToText: boolean;
    allModels: boolean;
    limit: number;
};

const initialAccess: EmpAccess[] = [
    { id: "1",  name: "Raj Patel",       email: "raj@acme.com",      role: "Senior Developer", fileUpload: true,  speechToText: true,  allModels: true,  limit: 50 },
    { id: "2",  name: "John Miller",      email: "john@acme.com",     role: "Developer",        fileUpload: true,  speechToText: false, allModels: true,  limit: 30 },
    { id: "3",  name: "Alice Brown",      email: "alice@acme.com",    role: "QA Engineer",      fileUpload: false, speechToText: false, allModels: false, limit: 20 },
    { id: "4",  name: "Bob Wilson",       email: "bob@acme.com",      role: "DevOps Engineer",  fileUpload: true,  speechToText: true,  allModels: true,  limit: 40 },
    { id: "5",  name: "Mike Chen",        email: "mike@acme.com",     role: "Developer",        fileUpload: false, speechToText: false, allModels: false, limit: 0  },
    { id: "6",  name: "Emily Zhao",       email: "emily@acme.com",    role: "Senior Developer", fileUpload: true,  speechToText: true,  allModels: true,  limit: 50 },
    { id: "7",  name: "Tom Baker",        email: "tom@acme.com",      role: "Tech Lead",        fileUpload: true,  speechToText: true,  allModels: true,  limit: 60 },
    { id: "8",  name: "Sara Kim",         email: "sara@acme.com",     role: "Developer",        fileUpload: true,  speechToText: false, allModels: false, limit: 30 },
    { id: "9",  name: "David Lee",        email: "david@acme.com",    role: "QA Engineer",      fileUpload: false, speechToText: false, allModels: false, limit: 25 },
    { id: "10", name: "Priya Singh",      email: "priya@acme.com",    role: "Developer",        fileUpload: true,  speechToText: true,  allModels: false, limit: 30 },
    { id: "11", name: "Liam Turner",      email: "liam@acme.com",     role: "DevOps Engineer",  fileUpload: true,  speechToText: false, allModels: true,  limit: 35 },
    { id: "12", name: "Olivia Martin",    email: "olivia@acme.com",   role: "Developer",        fileUpload: false, speechToText: false, allModels: false, limit: 0  },
    { id: "13", name: "James Anderson",   email: "james@acme.com",    role: "Senior Developer", fileUpload: true,  speechToText: true,  allModels: true,  limit: 50 },
    { id: "14", name: "Mia Thompson",     email: "mia@acme.com",      role: "QA Engineer",      fileUpload: false, speechToText: false, allModels: false, limit: 25 },
    { id: "15", name: "Noah Garcia",      email: "noah@acme.com",     role: "Developer",        fileUpload: true,  speechToText: false, allModels: false, limit: 30 },
    { id: "16", name: "Ava Martinez",     email: "ava@acme.com",      role: "Tech Lead",        fileUpload: true,  speechToText: true,  allModels: true,  limit: 60 },
    { id: "17", name: "William Jackson",  email: "william@acme.com",  role: "Developer",        fileUpload: true,  speechToText: false, allModels: false, limit: 30 },
    { id: "18", name: "Isabella White",   email: "isabella@acme.com", role: "Senior Developer", fileUpload: true,  speechToText: true,  allModels: true,  limit: 50 },
    { id: "19", name: "Ethan Harris",     email: "ethan@acme.com",    role: "Developer",        fileUpload: false, speechToText: false, allModels: false, limit: 0  },
    { id: "20", name: "Sophia Clark",     email: "sophia@acme.com",   role: "DevOps Engineer",  fileUpload: true,  speechToText: false, allModels: true,  limit: 40 },
];

const PAGE_SIZE = 6;

function initials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function AccessControlPage() {
    const [saving, setSaving]       = useState(false);
    const [employees, setEmployees] = useState<EmpAccess[]>(initialAccess);
    const [search, setSearch]       = useState("");
    const [accessFilter, setAccessFilter] = useState("all");
    const [page, setPage]           = useState(1);

    // Department policy (controlled)
    const [policy, setPolicy] = useState({
        fileUpload:     true,
        speechToText:   false,
        allModels:      true,
        dailyLimit:     30,
        maxPromptLen:   5000,
    });

    const update = (id: string, key: keyof EmpAccess, value: boolean | number) =>
        setEmployees((prev) => prev.map((e) => e.id === id ? { ...e, [key]: value } : e));

    const filtered = useMemo(() => {
        let list = [...employees];
        const q = search.toLowerCase();
        if (q) list = list.filter(
            (e) => e.name.toLowerCase().includes(q)
                || e.email.toLowerCase().includes(q)
                || e.role.toLowerCase().includes(q),
        );
        if (accessFilter === "restricted") list = list.filter((e) => e.limit === 0);
        else if (accessFilter === "full")  list = list.filter((e) => e.fileUpload && e.speechToText && e.allModels && e.limit > 0);
        else if (accessFilter === "custom") list = list.filter((e) => e.limit > 0 && !(e.fileUpload && e.speechToText && e.allModels));
        return list;
    }, [employees, search, accessFilter]);

    const totalPages    = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated     = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const restrictedCount = employees.filter((e) => e.limit === 0).length;
    const fullCount       = employees.filter((e) => e.fileUpload && e.speechToText && e.allModels && e.limit > 0).length;
    const customCount     = employees.length - restrictedCount - fullCount;

    const handleSave = async () => {
        setSaving(true);
        await new Promise((r) => setTimeout(r, 700));
        setSaving(false);
        toast.success("Access policies saved successfully!");
    };

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

            {/* Summary */}
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
                    <CardDescription>Default settings applied to all employees unless overridden below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
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
                        <div className="flex items-center justify-between rounded-lg border border-border p-3.5">
                            <div>
                                <p className="text-sm font-medium">All AI Models</p>
                                <p className="text-xs text-muted-foreground">Access to all models</p>
                            </div>
                            <Switch checked={policy.allModels} onCheckedChange={(v) => setPolicy((p) => ({ ...p, allModels: v }))} />
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Default Daily Limit (requests)</Label>
                            <Input type="number" value={policy.dailyLimit} min="0"
                                onChange={(e) => setPolicy((p) => ({ ...p, dailyLimit: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Prompt Length (characters)</Label>
                            <Input type="number" value={policy.maxPromptLen} min="0"
                                onChange={(e) => setPolicy((p) => ({ ...p, maxPromptLen: parseInt(e.target.value) || 0 }))} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Employee Overrides */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Employee Access Overrides</CardTitle>
                    <CardDescription>Customise access for individual employees. These override department defaults.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Search + filter bar */}
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

                    {/* Active chips */}
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
                                return (
                                    <div
                                        key={emp.id}
                                        className={`rounded-xl border p-4 transition-colors ${
                                            isRestricted ? "border-danger/30 bg-danger/5"
                                            : isFullAccess ? "border-success/20 bg-success/5"
                                            : "border-border hover:bg-muted/30"
                                        }`}
                                    >
                                        {/* Header row */}
                                        <div className="flex items-center justify-between mb-3.5">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">
                                                        {initials(emp.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-semibold">{emp.name}</p>
                                                    <p className="text-xs text-muted-foreground">{emp.email} · {emp.role}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isRestricted  && <Badge variant="outline" className="bg-danger/10 text-danger border-danger/20 text-xs">Restricted</Badge>}
                                                {isFullAccess  && <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">Full Access</Badge>}
                                                {!isRestricted && !isFullAccess && <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">Custom</Badge>}
                                            </div>
                                        </div>

                                        {/* Controls */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                                                <span className="text-xs text-muted-foreground">File Uploads</span>
                                                <Switch
                                                    checked={emp.fileUpload}
                                                    onCheckedChange={(v) => update(emp.id, "fileUpload", v)}
                                                    className="scale-90"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                                                <span className="text-xs text-muted-foreground">Speech</span>
                                                <Switch
                                                    checked={emp.speechToText}
                                                    onCheckedChange={(v) => update(emp.id, "speechToText", v)}
                                                    className="scale-90"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                                                <span className="text-xs text-muted-foreground">All Models</span>
                                                <Switch
                                                    checked={emp.allModels}
                                                    onCheckedChange={(v) => update(emp.id, "allModels", v)}
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
                                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                                    Prev
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
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
