"use client";

import { useState, useEffect } from "react";
import { Loader2, Key, Database, ShieldCheck, Mail, Globe, CheckCircle2, XCircle, Zap, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ProviderConfig = {
    provider_key: string;
    display_name: string;
    has_key: boolean;
    base_url: string | null;
    is_enabled: boolean;
    enabled_models: string[] | null;
    updated_at: string | null;
};

type TestResult = "idle" | "loading" | "success" | "error";

function LLMGatewayTab() {
    const [providers, setProviders] = useState<ProviderConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

    const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

    useEffect(() => {
        fetch(`${API}/llm-gateway/providers`, { credentials: "include" })
            .then((r) => r.json())
            .then((data: ProviderConfig[]) => {
                setProviders(data);
            })
            .catch(() => toast.error("Failed to load provider configs"))
            .finally(() => setLoading(false));
    }, []);

    const testProvider = async (providerKey: string) => {
        setTestResults((r) => ({ ...r, [providerKey]: "loading" }));
        try {
            const res = await fetch(`${API}/llm-gateway/providers/${providerKey}/test`, { method: "POST", credentials: "include" });
            const data = await res.json();
            setTestResults((r) => ({ ...r, [providerKey]: data.success ? "success" : "error" }));
            if (data.success) toast.success(`Connected! Latency: ${data.latency_ms}ms`);
            else toast.error(`Connection failed: ${data.error}`);
        } catch {
            setTestResults((r) => ({ ...r, [providerKey]: "error" }));
            toast.error("Test request failed.");
        }
        setTimeout(() => setTestResults((r) => ({ ...r, [providerKey]: "idle" })), 5000);
    };

    const PROVIDER_META: Record<string, { color: string }> = {
        openai:    { color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
        anthropic: { color: "text-orange-600 bg-orange-50 border-orange-200" },
        google:    { color: "text-blue-600 bg-blue-50 border-blue-200" },
    };

    if (loading) return (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading provider configs…
        </div>
    );

    return (
        <Card className="border-brand-500/20 shadow-sm ring-1 ring-brand-500/10">
            <CardHeader className="bg-brand-50/50 border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-brand-600" />
                    <CardTitle className="text-lg">LLM API Credentials</CardTitle>
                </div>
                <CardDescription className="space-y-2">
                    <p>
                        API keys are configured exclusively via the <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">.env</code> file on the backend server.
                    </p>
                    <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                        <p className="text-xs text-amber-800">
                            To add or change API keys, edit the <code className="font-mono">.env</code> file and restart the backend server. Changes cannot be made through this UI.
                        </p>
                    </div>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                {providers.map((provider) => {
                    const meta = PROVIDER_META[provider.provider_key] ?? { color: "" };
                    const testResult = testResults[provider.provider_key] ?? "idle";
                    return (
                        <div key={provider.provider_key} className={cn(
                            "rounded-xl border p-4 space-y-3 transition-all",
                            provider.is_enabled ? "border-border/60" : "border-dashed border-border/40 opacity-60"
                        )}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={cn("rounded-md border px-2 py-0.5 text-xs font-bold", meta.color)}>
                                        {provider.display_name}
                                    </span>
                                    {provider.has_key
                                        ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> Key configured</span>
                                        : <span className="text-xs text-muted-foreground">No key configured</span>
                                    }
                                </div>
                                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs"
                                    disabled={!provider.has_key || testResult === "loading"}
                                    onClick={() => testProvider(provider.provider_key)}
                                >
                                    {testResult === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                                     testResult === "success" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> :
                                     testResult === "error"   ? <XCircle className="h-3.5 w-3.5 text-red-500" /> :
                                     <Zap className="h-3.5 w-3.5" />}
                                    Test Connection
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

export default function SettingsPage() {
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await new Promise((r) => setTimeout(r, 800));
        setSaving(false);
        toast.success("Settings saved successfully!", { description: "Your platform configurations have been updated." });
    };

    const MotionWrapper = ({ children }: { children: React.ReactNode }) => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="space-y-6">
            {children}
        </motion.div>
    );

    return (
        <div className="mx-auto max-w-5xl">
            <PageHeader title="System Settings" subtitle="Configure platform-wide settings, security policies, and AI integrations."
                breadcrumbs={[{ label: "Super Admin", href: "/sa/dashboard" }, { label: "Settings" }]}
            />
            <Tabs defaultValue="general" className="mt-6">
                <TabsList className="mb-6 bg-muted/50 p-1">
                    <TabsTrigger value="general"       className="gap-2 px-6"><Globe className="w-4 h-4" /> General</TabsTrigger>
                    <TabsTrigger value="security"      className="gap-2 px-6"><ShieldCheck className="w-4 h-4" /> Security</TabsTrigger>
                    <TabsTrigger value="llm"           className="gap-2 px-6"><Database className="w-4 h-4" /> LLM Gateway</TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2 px-6"><Mail className="w-4 h-4" /> Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-0">
                    <MotionWrapper>
                        <Card className="border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Platform Information</CardTitle>
                                <CardDescription>Basic configuration for the D-SecureAI platform.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2"><Label>Platform Name</Label><Input defaultValue="D-SecureAI" className="h-11" /></div>
                                <div className="space-y-2"><Label>Support Email</Label><Input defaultValue="support@dsecureai.com" className="h-11" /></div>
                                <div className="space-y-2">
                                    <Label>Default Timezone</Label>
                                    <Select defaultValue="UTC"><SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="UTC">UTC</SelectItem><SelectItem value="EST">EST (UTC-5)</SelectItem><SelectItem value="PST">PST (UTC-8)</SelectItem><SelectItem value="IST">IST (UTC+5:30)</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Default Language</Label>
                                    <Select defaultValue="en"><SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="es">Spanish</SelectItem><SelectItem value="fr">French</SelectItem><SelectItem value="de">German</SelectItem></SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </MotionWrapper>
                </TabsContent>

                <TabsContent value="security" className="mt-0">
                    <MotionWrapper>
                        <Card className="border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Authentication Policies</CardTitle>
                                <CardDescription>Security settings for user authentication and session management.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {[
                                    { label: "Mandatory 2FA for All Users", desc: "Require two-factor authentication for all accounts on the platform", checked: true },
                                    { label: "Mandatory 2FA for Admins Only", desc: "Only require 2FA for admin-level accounts (if global 2FA is off)", checked: false },
                                ].map((item) => (
                                    <div key={item.label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border/50 bg-muted/20">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">{item.label}</Label>
                                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                                        </div>
                                        <Switch defaultChecked={item.checked} />
                                    </div>
                                ))}
                                <Separator />
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="space-y-2"><Label>Minimum Password Length</Label><Input type="number" defaultValue={12} className="h-11" /></div>
                                    <div className="space-y-2"><Label>Session Timeout (minutes)</Label><Input type="number" defaultValue={60} className="h-11" /></div>
                                    <div className="space-y-2"><Label>Login Attempts Before Lock</Label><Input type="number" defaultValue={5} className="h-11" /></div>
                                    <div className="space-y-2"><Label>Password Reset Expiry (minutes)</Label><Input type="number" defaultValue={30} className="h-11" /></div>
                                </div>
                            </CardContent>
                        </Card>
                    </MotionWrapper>
                </TabsContent>

                <TabsContent value="llm" className="mt-0">
                    <MotionWrapper><LLMGatewayTab /></MotionWrapper>
                </TabsContent>

                <TabsContent value="notifications" className="mt-0">
                    <MotionWrapper>
                        <Card className="border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Email &amp; System Alerts</CardTitle>
                                <CardDescription>Configure platform-wide notification triggers for administrators.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { label: "New Organization Registration", description: "Email when a new org signs up on the platform." },
                                    { label: "Storage & Quota Thresholds", description: "Alert when platform-wide API costs reach 80% of budget limit." },
                                    { label: "Security & Suspensions", description: "Notify super admins when an organization or user is suspended." },
                                    { label: "Subscription Changes", description: "Alert on plan upgrades, downgrades, or cancellations." },
                                    { label: "System Health Alerts", description: "Critical system alerts, LLM Gateway downtime, and errors." },
                                ].map((n) => (
                                    <div key={n.label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border/40">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">{n.label}</Label>
                                            <p className="text-sm text-muted-foreground">{n.description}</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </MotionWrapper>
                </TabsContent>
            </Tabs>

            <Separator className="my-8" />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex justify-end pb-8">
                <Button onClick={handleSave} className="bg-brand-600 hover:bg-brand-700 text-white px-8 h-11 text-base font-semibold shadow-sm" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                    {saving ? "Saving..." : "Save Settings"}
                </Button>
            </motion.div>
        </div>
    );
}
