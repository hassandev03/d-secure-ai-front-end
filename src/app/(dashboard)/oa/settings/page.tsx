"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Save, Loader2, Building2, ShieldCheck, Lock, Globe,
    Bell, Clock, FileText, Mic, Check, Users, AlertTriangle,
    KeyRound, RotateCcw, ChevronDown, ChevronUp, Info, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MODELS } from "@/lib/constants";
import type { LLMModel } from "@/types/chat.types";
import {
    getOAOrgConfig, updateOAOrgConfig,
    getOAEmployeeDefaults, updateOAEmployeeDefaults,
    getOANotifications, updateOANotifications,
    getOASecurity, updateOASecurity,
    getOAOrgPolicy, updateOAOrgPolicy,
    getOADeptPolicies, updateOADeptPolicy, applyOAOrgPolicyToAllDepts,
    type OAOrgConfig, type OAEmployeeDefaults, type OANotificationSettings,
    type OASecuritySettings, type OAOrgPolicy, type OADeptPolicyState
} from "@/services/oa.service";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";

// ── Seed data ─────────────────────────────────────────────────────────────────

const DEPARTMENTS = ["Engineering", "Marketing", "Sales", "Finance", "HR", "Operations"];

const TIMEZONES = [
    "UTC-8 (Pacific)", "UTC-7 (Mountain)", "UTC-6 (Central)", "UTC-5 (Eastern)",
    "UTC+0 (London)", "UTC+1 (Paris)", "UTC+5 (Karachi)", "UTC+5:30 (Mumbai)",
    "UTC+8 (Singapore)", "UTC+9 (Tokyo)",
];

const INDUSTRIES = [
    "Healthcare", "Finance", "Legal", "Technology", "Education",
    "Government", "Manufacturing", "Retail", "Other",
];

const ALL_MODEL_IDS = MODELS.map((m) => m.id as LLMModel);

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

/** Model checkbox grid grouped by provider */
function ModelCheckboxGrid({
    selected,
    onChange,
}: {
    selected: LLMModel[];
    onChange: (v: LLMModel[]) => void;
}) {
    const toggle = (id: LLMModel) =>
        onChange(selected.includes(id) ? selected.filter((m) => m !== id) : [...selected, id]);

    const byProvider = useMemo(() => {
        const grouped: Record<string, typeof MODELS> = {};
        for (const m of MODELS) {
            if (!grouped[m.provider]) grouped[m.provider] = [];
            grouped[m.provider].push(m);
        }
        return Object.values(grouped);
    }, []);

    return (
        <div className="space-y-3">
            {byProvider.map((group) => (
                <div key={group[0].provider}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {group[0].providerName}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                        {group.map((m) => {
                            const checked = selected.includes(m.id as LLMModel);
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => toggle(m.id as LLMModel)}
                                    className={cn(
                                        "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors",
                                        checked
                                            ? "border-brand-700/50 bg-brand-50 text-brand-700"
                                            : "border-border hover:bg-muted/60",
                                    )}
                                >
                                    <div className={cn(
                                        "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border",
                                        checked ? "border-brand-700 bg-brand-700" : "border-muted-foreground/40",
                                    )}>
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

/** Toggle row used in security tab */
function SettingToggle({
    label,
    description,
    checked,
    onChange,
    icon: Icon,
    variant,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    icon?: React.ElementType;
    variant?: "default" | "warning" | "danger";
}) {
    const borderClass = variant === "warning" && !checked
        ? "border-warning/40 bg-warning/5"
        : variant === "danger" && checked
            ? "border-danger/40 bg-danger/5"
            : "border-border";
    return (
        <div className={cn("flex items-center justify-between rounded-lg border p-3.5 transition-colors", borderClass)}>
            <div className="flex items-center gap-3">
                {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
                <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </div>
            <Switch checked={checked} onCheckedChange={onChange} />
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrgSettingsPage() {
    // Tab state
    const [activeTab, setActiveTab] = useState("general");
    const [loading, setLoading] = useState(true);

    // General
    const [profile, setProfile] = useState<OAOrgConfig>({} as OAOrgConfig);
    const [empDefaults, setEmpDefaults] = useState<OAEmployeeDefaults>({} as OAEmployeeDefaults);
    const [notifications, setNotifications] = useState<OANotificationSettings>({} as OANotificationSettings);

    // Security
    const [security, setSecurity] = useState<OASecuritySettings>({} as OASecuritySettings);

    // Org Policies
    const [orgPolicy, setOrgPolicy] = useState<OAOrgPolicy>({} as OAOrgPolicy);
    const [deptPolicies, setDeptPolicies] = useState<OADeptPolicyState[]>([]);
    const [expandedDept, setExpandedDept] = useState<string | null>(null);
    const [editDept, setEditDept] = useState<OADeptPolicyState | null>(null);
    const [editDeptModels, setEditDeptModels] = useState<LLMModel[]>([]);

    // Saving states
    const [saving, setSaving] = useState(false);
    const [pushing, setPushing] = useState(false);
    const [savingDept, setSavingDept] = useState(false);

    // ── Derived ─────────────────────────────────────────────────────────────

    const totalEmployeesAcrossDepts = deptPolicies.reduce((s, d) => s + d.employees, 0);
    const syncedCount = deptPolicies.filter((d) => d.synced).length;
    const outOfSyncCount = deptPolicies.length - syncedCount;

    // ── Initial Data Load ───────────────────────────────────────────────────

    useEffect(() => {
        let active = true;
        Promise.all([
            getOAOrgConfig(), getOAEmployeeDefaults(), getOANotifications(),
            getOASecurity(), getOAOrgPolicy(), getOADeptPolicies()
        ]).then(([cfg, emp, notif, sec, pol, depts]) => {
            if (!active) return;
            setProfile(cfg);
            setEmpDefaults(emp);
            setNotifications(notif);
            setSecurity(sec);
            setOrgPolicy(pol);
            setDeptPolicies(depts);
            setLoading(false);
        }).catch(() => {
            toast.error("Failed to load settings data.");
            setLoading(false);
        });
        return () => { active = false; };
    }, []);

    // ── Handlers ────────────────────────────────────────────────────────────

    const handleSave = async () => {
        if (!profile.name || !empDefaults.defaultRole || !security.minPasswordLength || !orgPolicy.defaultCreditLimit) return;
        setSaving(true);
        try {
            await Promise.all([
                updateOAOrgConfig(profile),
                updateOAEmployeeDefaults(empDefaults),
                updateOANotifications(notifications),
                updateOASecurity(security),
                updateOAOrgPolicy(orgPolicy)
            ]);
            toast.success("Settings saved successfully.");
        } catch {
            toast.error("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    const handlePushToAll = async () => {
        if (!orgPolicy.defaultCreditLimit) return;
        setPushing(true);
        try {
            await applyOAOrgPolicyToAllDepts();
            const updated = await getOADeptPolicies();
            setDeptPolicies(updated);
            toast.success(`Organisation policy pushed to all ${updated.length} departments.`);
        } catch {
            toast.error("Failed to push policies.");
        } finally {
            setPushing(false);
        }
    };

    const handleResetDept = async (deptId: string) => {
        if (!orgPolicy.defaultCreditLimit) return;
        const dept = deptPolicies.find((d) => d.id === deptId);
        if (!dept) return;
        
        try {
            const updatedPolicy = {
                fileUpload: orgPolicy.fileUpload,
                speechToText: orgPolicy.speechToText,
                allModels: orgPolicy.allModels,
                permittedModels: orgPolicy.allModels ? [...ALL_MODEL_IDS] : [...orgPolicy.permittedModels],
                creditLimit: orgPolicy.defaultCreditLimit,
                synced: true,
            };
            await updateOADeptPolicy(deptId, updatedPolicy);
            setDeptPolicies((prev) => prev.map((d) => (d.id === deptId ? { ...d, ...updatedPolicy } : d)));
            toast.success(`${dept.name} policy reset to organisation defaults.`);
        } catch {
            toast.error("Failed to reset department policy.");
        }
    };

    const openEditDept = (dept: OADeptPolicyState) => {
        setEditDept({ ...dept });
        setEditDeptModels([...dept.permittedModels]);
    };

    const handleSaveEditDept = async () => {
        if (!editDept) return;
        setSavingDept(true);
        try {
            const updatedPolicy = {
                ...editDept,
                permittedModels: editDept.allModels ? [...ALL_MODEL_IDS] : editDeptModels,
                synced: false,
            };
            await updateOADeptPolicy(editDept.id, updatedPolicy);
            setDeptPolicies((prev) => prev.map((d) => (d.id === editDept.id ? updatedPolicy : d)));
            setEditDept(null);
            toast.success(`${editDept.name} policy updated.`);
        } catch {
            toast.error("Failed to update department policy.");
        } finally {
            setSavingDept(false);
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────

    if (loading || !profile.name || !empDefaults.defaultRole || !security.minPasswordLength || !orgPolicy.defaultCreditLimit) {
        return (
            <div className="mx-auto max-w-5xl">
                <PageHeader
                    title="Organization Settings"
                    subtitle="Configure organisation profile, security, AI models, and access policies."
                    breadcrumbs={[{ label: "Organization", href: "/oa/dashboard" }, { label: "Settings" }]}
                />
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl">
            <PageHeader
                title="Organization Settings"
                subtitle="Configure organisation profile, security, AI models, and access policies for Acme Corporation."
                breadcrumbs={[{ label: "Organization", href: "/oa/dashboard" }, { label: "Settings" }]}
                actions={
                    <Button
                        onClick={handleSave}
                        className="bg-brand-700 hover:bg-brand-800"
                        disabled={saving}
                    >
                        {saving
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            : <Save className="mr-2 h-4 w-4" />
                        }
                        Save Settings
                    </Button>
                }
            />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="policies">
                        Org Policies
                        {outOfSyncCount > 0 && (
                            <Badge className="ml-1.5 border border-warning/30 bg-warning/15 text-[10px] text-warning px-1.5 py-0">
                                {outOfSyncCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* ════════════════════════════════════════════════════════════════
                    GENERAL TAB
                    ════════════════════════════════════════════════════════════════ */}
                <TabsContent value="general" className="mt-6 space-y-6">
                    {/* Organisation Profile */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-brand-700" />
                                <CardTitle className="text-base">Organisation Profile</CardTitle>
                            </div>
                            <CardDescription>Core information about your organisation.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2 sm:col-span-2">
                                <Label>Organisation Name</Label>
                                <Input
                                    value={profile.name}
                                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Industry</Label>
                                <Select
                                    value={profile.industry}
                                    onValueChange={(v) => setProfile((p) => ({ ...p, industry: v }))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {INDUSTRIES.map((i) => (
                                            <SelectItem key={i} value={i}>{i}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Domain</Label>
                                <Input
                                    value={profile.domain}
                                    onChange={(e) => setProfile((p) => ({ ...p, domain: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Country</Label>
                                <Input
                                    value={profile.country}
                                    onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Timezone</Label>
                                <Select
                                    value={profile.timezone}
                                    onValueChange={(v) => setProfile((p) => ({ ...p, timezone: v }))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TIMEZONES.map((tz) => (
                                            <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Support Email</Label>
                                <Input
                                    type="email"
                                    value={profile.supportEmail}
                                    onChange={(e) => setProfile((p) => ({ ...p, supportEmail: e.target.value }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employee Defaults */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-brand-700" />
                                <CardTitle className="text-base">Employee Onboarding Defaults</CardTitle>
                            </div>
                            <CardDescription>Default settings applied when new employees join the organisation.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Default Department</Label>
                                <Select
                                    value={empDefaults.defaultDepartment}
                                    onValueChange={(v) => setEmpDefaults((p) => ({ ...p, defaultDepartment: v }))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (assign manually)</SelectItem>
                                        {DEPARTMENTS.map((d) => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Default Role</Label>
                                <Select
                                    value={empDefaults.defaultRole}
                                    onValueChange={(v) => setEmpDefaults((p) => ({ ...p, defaultRole: v }))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="employee">Employee</SelectItem>
                                        <SelectItem value="dept_admin">Department Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Per-User Monthly Limit</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={empDefaults.monthlyLimit}
                                    onChange={(e) => setEmpDefaults((p) => ({ ...p, monthlyLimit: parseInt(e.target.value) || 0 }))}
                                />
                                <p className="text-xs text-muted-foreground">Max AI creditBudget per month for new employees.</p>
                            </div>
                            <div className="flex items-end pb-1">
                                <SettingToggle
                                    label="Auto-Approve"
                                    description="Automatically activate new employees without manual approval"
                                    checked={empDefaults.autoApprove}
                                    onChange={(v) => setEmpDefaults((p) => ({ ...p, autoApprove: v }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notifications */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-brand-700" />
                                <CardTitle className="text-base">Notification Preferences</CardTitle>
                            </div>
                            <CardDescription>Configure how you receive alerts and reports.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <SettingToggle
                                    label="Email Notifications"
                                    description="Receive email alerts for important events"
                                    checked={notifications.emailNotifications}
                                    onChange={(v) => setNotifications((p) => ({ ...p, emailNotifications: v }))}
                                />
                                <SettingToggle
                                    label="Weekly Digest"
                                    description="Receive a weekly usage summary"
                                    checked={notifications.weeklyDigest}
                                    onChange={(v) => setNotifications((p) => ({ ...p, weeklyDigest: v }))}
                                />
                                <div className="flex items-center justify-between rounded-lg border border-border p-3.5">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="text-sm font-medium">Quota Alerts</p>
                                            <p className="text-xs text-muted-foreground">
                                                Alert at {notifications.quotaAlertThreshold}% usage
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={50}
                                            max={100}
                                            className="h-7 w-16 px-2 text-xs"
                                            value={notifications.quotaAlertThreshold}
                                            onChange={(e) => setNotifications((p) => ({ ...p, quotaAlertThreshold: parseInt(e.target.value) || 80 }))}
                                        />
                                        <span className="text-xs text-muted-foreground">%</span>
                                        <Switch
                                            checked={notifications.quotaAlerts}
                                            onCheckedChange={(v) => setNotifications((p) => ({ ...p, quotaAlerts: v }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ════════════════════════════════════════════════════════════════
                    SECURITY TAB
                    ════════════════════════════════════════════════════════════════ */}
                <TabsContent value="security" className="mt-6 space-y-6">
                    {/* Authentication & Sessions */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <KeyRound className="h-4 w-4 text-brand-700" />
                                <CardTitle className="text-base">Authentication & Sessions</CardTitle>
                            </div>
                            <CardDescription>Control how employees sign in and manage active sessions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <SettingToggle
                                    label="Enforce 2FA"
                                    description="Require two-factor authentication for all employees"
                                    checked={security.enforce2FA}
                                    onChange={(v) => setSecurity((p) => ({ ...p, enforce2FA: v }))}
                                    icon={ShieldCheck}
                                />
                                <SettingToggle
                                    label="Require Uppercase"
                                    description="Passwords must contain uppercase letters"
                                    checked={security.requireUppercase}
                                    onChange={(v) => setSecurity((p) => ({ ...p, requireUppercase: v }))}
                                    icon={Lock}
                                />
                                <SettingToggle
                                    label="Require Special Characters"
                                    description="Passwords must contain !@#$%^&* etc."
                                    checked={security.requireSpecialChar}
                                    onChange={(v) => setSecurity((p) => ({ ...p, requireSpecialChar: v }))}
                                    icon={Lock}
                                />
                            </div>
                            <Separator />
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Min Password Length</Label>
                                    <Input
                                        type="number"
                                        min={8}
                                        max={32}
                                        value={security.minPasswordLength}
                                        onChange={(e) => setSecurity((p) => ({ ...p, minPasswordLength: parseInt(e.target.value) || 8 }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Session Timeout (min)</Label>
                                    <Input
                                        type="number"
                                        min={5}
                                        value={security.sessionTimeout}
                                        onChange={(e) => setSecurity((p) => ({ ...p, sessionTimeout: parseInt(e.target.value) || 30 }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Concurrent Sessions</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={security.maxConcurrentSessions}
                                        onChange={(e) => setSecurity((p) => ({ ...p, maxConcurrentSessions: parseInt(e.target.value) || 3 }))}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Access Controls */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-brand-700" />
                                <CardTitle className="text-base">Access Controls</CardTitle>
                            </div>
                            <CardDescription>Manage what employees can do within the AI platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <SettingToggle
                                    label="File Uploads"
                                    description="Allow employees to upload documents to AI"
                                    checked={security.allowFileUploads}
                                    onChange={(v) => setSecurity((p) => ({ ...p, allowFileUploads: v }))}
                                    icon={FileText}
                                />
                                <SettingToggle
                                    label="Speech-to-Text"
                                    description="Enable voice input for AI prompts"
                                    checked={security.allowSpeechToText}
                                    onChange={(v) => setSecurity((p) => ({ ...p, allowSpeechToText: v }))}
                                    icon={Mic}
                                />
                                <SettingToggle
                                    label="API Access"
                                    description="Allow programmatic API access to AI services"
                                    checked={security.allowApiAccess}
                                    onChange={(v) => setSecurity((p) => ({ ...p, allowApiAccess: v }))}
                                    icon={Globe}
                                    variant="warning"
                                />
                                <SettingToggle
                                    label="IP Whitelist"
                                    description="Restrict access to specific IP addresses"
                                    checked={security.ipWhitelist}
                                    onChange={(v) => setSecurity((p) => ({ ...p, ipWhitelist: v }))}
                                    icon={ShieldCheck}
                                />
                            </div>
                            {security.ipWhitelist && (
                                <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                                    <Label>Allowed IP Addresses</Label>
                                    <Input
                                        placeholder="e.g. 192.168.1.0/24, 10.0.0.1"
                                        value={security.ipWhitelistValue}
                                        onChange={(e) => setSecurity((p) => ({ ...p, ipWhitelistValue: e.target.value }))}
                                    />
                                    <p className="text-xs text-muted-foreground">Comma-separated IPs or CIDR ranges.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </TabsContent>

                {/* ════════════════════════════════════════════════════════════════
                    ORG POLICIES TAB
                    ════════════════════════════════════════════════════════════════ */}
                <TabsContent value="policies" className="mt-6 space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <Card>
                            <CardContent className="p-4 text-center">
                                <p className="text-2xl font-bold">{deptPolicies.length}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">Departments</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <p className="text-2xl font-bold">{totalEmployeesAcrossDepts}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">Total Employees</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <p className="text-2xl font-bold text-success">{syncedCount}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">Synced with Org</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <p className="text-2xl font-bold text-warning">{outOfSyncCount}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">Custom Override</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Org-Wide Default Policy */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-brand-700" />
                                <CardTitle className="text-base">Organisation-Wide Default Policy</CardTitle>
                            </div>
                            <CardDescription>
                                Configure the baseline AI access policy. Push to departments to enforce this policy across the organisation.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Policy toggles */}
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="flex items-center justify-between rounded-lg border border-border p-3.5">
                                    <div>
                                        <p className="text-sm font-medium">File Uploads</p>
                                        <p className="text-xs text-muted-foreground">Upload documents to AI</p>
                                    </div>
                                    <Switch
                                        checked={orgPolicy.fileUpload}
                                        onCheckedChange={(v) => setOrgPolicy((p) => ({ ...p, fileUpload: v }))}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border border-border p-3.5">
                                    <div>
                                        <p className="text-sm font-medium">Speech-to-Text</p>
                                        <p className="text-xs text-muted-foreground">Voice input for prompts</p>
                                    </div>
                                    <Switch
                                        checked={orgPolicy.speechToText}
                                        onCheckedChange={(v) => setOrgPolicy((p) => ({ ...p, speechToText: v }))}
                                    />
                                </div>
                                <div className={cn(
                                    "flex items-center justify-between rounded-lg border p-3.5 transition-colors",
                                    !orgPolicy.allModels ? "border-warning/40 bg-warning/5" : "border-border",
                                )}>
                                    <div>
                                        <p className="text-sm font-medium">All AI Models</p>
                                        <p className="text-xs text-muted-foreground">
                                            {orgPolicy.allModels
                                                ? "All providers & models"
                                                : <span className="font-medium text-warning">
                                                    {orgPolicy.permittedModels.length} model{orgPolicy.permittedModels.length !== 1 ? "s" : ""} permitted
                                                </span>
                                            }
                                        </p>
                                    </div>
                                    <Switch
                                        checked={orgPolicy.allModels}
                                        onCheckedChange={(v) => setOrgPolicy((p) => ({ ...p, allModels: v }))}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border border-border p-3.5">
                                    <div>
                                        <p className="text-sm font-medium">API Access</p>
                                        <p className="text-xs text-muted-foreground">Programmatic access</p>
                                    </div>
                                    <Switch
                                        checked={orgPolicy.allowApiAccess}
                                        onCheckedChange={(v) => setOrgPolicy((p) => ({ ...p, allowApiAccess: v }))}
                                    />
                                </div>
                            </div>

                            {/* Model picker when allModels is OFF */}
                            {!orgPolicy.allModels && (
                                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">Permitted Models</p>
                                            <p className="text-xs text-muted-foreground">
                                                Only selected models will be available across the organisation.
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 px-2 text-xs"
                                                onClick={() => setOrgPolicy((p) => ({ ...p, permittedModels: ALL_MODEL_IDS }))}
                                            >
                                                All
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 px-2 text-xs"
                                                onClick={() => setOrgPolicy((p) => ({ ...p, permittedModels: [] }))}
                                            >
                                                None
                                            </Button>
                                        </div>
                                    </div>
                                    <ModelCheckboxGrid
                                        selected={orgPolicy.permittedModels}
                                        onChange={(v) => setOrgPolicy((p) => ({ ...p, permittedModels: v }))}
                                    />
                                </div>
                            )}

                            {/* Limits + Push button */}
                            <Separator />
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-1.5">
                                    <Label>Default Daily Limit</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={orgPolicy.defaultCreditLimit}
                                        onChange={(e) => setOrgPolicy((p) => ({ ...p, defaultCreditLimit: parseInt(e.target.value) || 0 }))}
                                    />
                                    <p className="text-xs text-muted-foreground">creditBudget per employee per day.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Max Daily Limit</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={orgPolicy.maxDailyLimit}
                                        onChange={(e) => setOrgPolicy((p) => ({ ...p, maxDailyLimit: parseInt(e.target.value) || 0 }))}
                                    />
                                    <p className="text-xs text-muted-foreground">Upper cap — depts cannot exceed this.</p>
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        className="w-full bg-brand-700 hover:bg-brand-800"
                                        onClick={handlePushToAll}
                                        disabled={pushing}
                                    >
                                        {pushing
                                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Pushing…</>
                                            : <><Save className="mr-2 h-4 w-4" />Push to All Departments</>
                                        }
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Department Policy Overrides */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">Department Policy Status</CardTitle>
                                    <CardDescription>
                                        View and override each department&apos;s AI access policy.
                                        Departments marked <span className="font-medium text-warning">Custom</span> have diverged from the organisation default.
                                    </CardDescription>
                                </div>
                                {outOfSyncCount > 0 && (
                                    <Badge className="border border-warning/30 bg-warning/15 text-xs text-warning">
                                        {outOfSyncCount} custom
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {deptPolicies.map((dept) => {
                                    const modelCount = dept.allModels ? MODELS.length : dept.permittedModels.length;
                                    const isExpanded = expandedDept === dept.id;
                                    return (
                                        <div
                                            key={dept.id}
                                            className={cn(
                                                "rounded-xl border transition-colors",
                                                dept.synced
                                                    ? "border-success/20 bg-success/5"
                                                    : "border-warning/30 bg-warning/5",
                                            )}
                                        >
                                            {/* Row header */}
                                            <div className="flex items-center justify-between gap-4 p-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={cn(
                                                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                                        dept.color,
                                                    )}>
                                                        <Building2 className="h-4 w-4 text-white" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="text-sm font-semibold">{dept.name}</p>
                                                            <Badge variant="outline" className={cn(
                                                                "text-[10px]",
                                                                dept.synced
                                                                    ? "bg-success/10 text-success border-success/20"
                                                                    : "bg-warning/10 text-warning border-warning/20",
                                                            )}>
                                                                {dept.synced ? "Synced" : "Custom"}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {dept.head} · {dept.employees} employees
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Quick status pills */}
                                                <div className="hidden items-center gap-2 sm:flex">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px]",
                                                        dept.fileUpload ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground",
                                                    )}>
                                                        <FileText className="mr-1 h-3 w-3" />
                                                        {dept.fileUpload ? "Files" : "No Files"}
                                                    </Badge>
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px]",
                                                        dept.speechToText ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground",
                                                    )}>
                                                        <Mic className="mr-1 h-3 w-3" />
                                                        {dept.speechToText ? "Voice" : "No Voice"}
                                                    </Badge>
                                                    <Badge variant="outline" className="bg-brand-50 text-brand-700 border-brand-700/20 text-[10px]">
                                                        {modelCount}/{MODELS.length} models
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {dept.creditLimit}/day
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    {!dept.synced && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-brand-700"
                                                            title="Reset to org defaults"
                                                            onClick={() => handleResetDept(dept.id)}
                                                        >
                                                            <RotateCcw className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-brand-700"
                                                        title="Edit department policy"
                                                        onClick={() => openEditDept(dept)}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 w-7 p-0 text-muted-foreground"
                                                        onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
                                                    >
                                                        {isExpanded
                                                            ? <ChevronUp className="h-3.5 w-3.5" />
                                                            : <ChevronDown className="h-3.5 w-3.5" />
                                                        }
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Expanded detail */}
                                            {isExpanded && (
                                                <div className="border-t border-border/50 px-4 pb-4 pt-3">
                                                    {/* Mobile pills (visible below sm) */}
                                                    <div className="mb-3 flex flex-wrap gap-2 sm:hidden">
                                                        <Badge variant="outline" className={cn(
                                                            "text-[10px]",
                                                            dept.fileUpload ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground",
                                                        )}>
                                                            {dept.fileUpload ? "Files ON" : "Files OFF"}
                                                        </Badge>
                                                        <Badge variant="outline" className={cn(
                                                            "text-[10px]",
                                                            dept.speechToText ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground",
                                                        )}>
                                                            {dept.speechToText ? "Voice ON" : "Voice OFF"}
                                                        </Badge>
                                                        <Badge variant="outline" className="bg-brand-50 text-brand-700 border-brand-700/20 text-[10px]">
                                                            {modelCount}/{MODELS.length} models
                                                        </Badge>
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {dept.creditLimit}/day
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                        <div className="rounded-lg bg-background border border-border p-3">
                                                            <p className="text-xs text-muted-foreground">File Uploads</p>
                                                            <p className={cn(
                                                                "mt-1 text-sm font-medium",
                                                                dept.fileUpload ? "text-success" : "text-danger",
                                                            )}>
                                                                {dept.fileUpload ? "Enabled" : "Disabled"}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-lg bg-background border border-border p-3">
                                                            <p className="text-xs text-muted-foreground">Speech-to-Text</p>
                                                            <p className={cn(
                                                                "mt-1 text-sm font-medium",
                                                                dept.speechToText ? "text-success" : "text-danger",
                                                            )}>
                                                                {dept.speechToText ? "Enabled" : "Disabled"}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-lg bg-background border border-border p-3">
                                                            <p className="text-xs text-muted-foreground">AI Models</p>
                                                            <p className="mt-1 text-sm font-medium text-brand-700">
                                                                {dept.allModels ? "All" : `${modelCount} of ${MODELS.length}`}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-lg bg-background border border-border p-3">
                                                            <p className="text-xs text-muted-foreground">Credit Limit</p>
                                                            <p className="mt-1 text-sm font-medium">{dept.creditLimit} credits/mo</p>
                                                        </div>
                                                    </div>

                                                    {!dept.allModels && (
                                                        <div className="mt-3">
                                                            <p className="mb-1.5 text-xs text-muted-foreground">Permitted models:</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {dept.permittedModels.map((mid) => {
                                                                    const m = MODELS.find((x) => x.id === mid);
                                                                    return m ? (
                                                                        <Badge key={mid} variant="outline" className="bg-brand-50 text-brand-700 border-brand-700/20 text-[10px]">
                                                                            {m.name}
                                                                        </Badge>
                                                                    ) : null;
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {!dept.synced && (
                                                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2">
                                                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />
                                                            <p className="text-xs text-warning">
                                                                This department has a custom policy that differs from the organisation default.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ════════════════════════════════════════════════════════════════
                Edit Department Policy Dialog
                ════════════════════════════════════════════════════════════════ */}
            <Dialog
                open={editDept !== null}
                onOpenChange={(open) => { if (!open && !savingDept) setEditDept(null); }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Department Policy — {editDept?.name}</DialogTitle>
                    </DialogHeader>
                    {editDept && (
                        <div className="space-y-4 py-1">
                            {/* Context */}
                            <div className="space-y-1.5 rounded-lg border border-border bg-muted/50 p-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Department</span>
                                    <span className="font-medium">{editDept.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Head</span>
                                    <span className="font-medium">{editDept.head}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Employees</span>
                                    <span className="font-medium">{editDept.employees}</span>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                                    <span className="text-sm font-medium">File Uploads</span>
                                    <Switch
                                        checked={editDept.fileUpload}
                                        onCheckedChange={(v) => setEditDept((p) => p ? { ...p, fileUpload: v } : p)}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                                    <span className="text-sm font-medium">Speech-to-Text</span>
                                    <Switch
                                        checked={editDept.speechToText}
                                        onCheckedChange={(v) => setEditDept((p) => p ? { ...p, speechToText: v } : p)}
                                    />
                                </div>
                                <div className={cn(
                                    "flex items-center justify-between rounded-lg border p-3 transition-colors",
                                    !editDept.allModels ? "border-warning/40 bg-warning/5" : "border-border",
                                )}>
                                    <div>
                                        <span className="text-sm font-medium">All Models</span>
                                        {!editDept.allModels && (
                                            <p className="text-[10px] text-warning font-medium">
                                                {editDeptModels.length} selected
                                            </p>
                                        )}
                                    </div>
                                    <Switch
                                        checked={editDept.allModels}
                                        onCheckedChange={(v) => setEditDept((p) => p ? { ...p, allModels: v } : p)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                                    <span className="flex-1 text-sm font-medium">Credit Limit</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        className="h-7 w-20 px-2 text-xs"
                                        value={editDept.creditLimit}
                                        onChange={(e) =>
                                            setEditDept((p) => p ? { ...p, creditLimit: parseInt(e.target.value) || 0 } : p)
                                        }
                                    />
                                </div>
                            </div>

                            {/* Model picker */}
                            {!editDept.allModels && (
                                <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
                                    <p className="mb-2 text-xs font-medium text-muted-foreground">Permitted Models</p>
                                    <ModelCheckboxGrid
                                        selected={editDeptModels}
                                        onChange={setEditDeptModels}
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                                <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                    Saving will mark this department as &ldquo;Custom&rdquo; since it will differ from the org default.
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={savingDept}>Cancel</Button>
                        </DialogClose>
                        <Button
                            className="bg-brand-700 hover:bg-brand-800"
                            onClick={handleSaveEditDept}
                            disabled={savingDept || (!editDept?.allModels && editDeptModels.length === 0)}
                        >
                            {savingDept && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Policy
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
