"use client";

import { useState } from "react";
import { Save, Loader2, Eye, EyeOff, Key, Database, ShieldCheck, Mail, Globe } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
    const [saving, setSaving] = useState(false);
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    const handleSave = async () => {
        setSaving(true);
        await new Promise((r) => setTimeout(r, 800));
        setSaving(false);
        toast.success("Settings saved successfully!", {
            description: "Your platform configurations have been updated."
        });
    };

    const toggleKeyVisibility = (provider: string) => {
        setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
    };

    const MotionWrapper = ({ children }: { children: React.ReactNode }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-6"
        >
            {children}
        </motion.div>
    );

    return (
        <div className="mx-auto max-w-5xl">
            <PageHeader
                title="System Settings"
                subtitle="Configure platform-wide settings, security policies, and AI integrations."
                breadcrumbs={[{ label: "Super Admin", href: "/sa/dashboard" }, { label: "Settings" }]}
            />

            <Tabs defaultValue="general" className="mt-6">
                <TabsList className="mb-6 bg-muted/50 p-1">
                    <TabsTrigger value="general" className="gap-2 px-6"><Globe className="w-4 h-4" /> General</TabsTrigger>
                    <TabsTrigger value="security" className="gap-2 px-6"><ShieldCheck className="w-4 h-4" /> Security</TabsTrigger>
                    <TabsTrigger value="llm" className="gap-2 px-6"><Database className="w-4 h-4" /> LLM Gateway</TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2 px-6"><Mail className="w-4 h-4" /> Notifications</TabsTrigger>
                </TabsList>

                {/* General */}
                <TabsContent value="general" className="mt-0">
                    <MotionWrapper>
                        <Card className="border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Platform Information</CardTitle>
                                <CardDescription>Basic configuration for the D-SecureAI platform.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Platform Name</Label>
                                    <Input defaultValue="D-SecureAI" className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Support Email</Label>
                                    <Input defaultValue="support@dsecureai.com" className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Default Timezone</Label>
                                    <Select defaultValue="UTC">
                                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="UTC">UTC</SelectItem>
                                            <SelectItem value="EST">EST (UTC-5)</SelectItem>
                                            <SelectItem value="PST">PST (UTC-8)</SelectItem>
                                            <SelectItem value="IST">IST (UTC+5:30)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Default Language</Label>
                                    <Select defaultValue="en">
                                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="es">Spanish</SelectItem>
                                            <SelectItem value="fr">French</SelectItem>
                                            <SelectItem value="de">German</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Data Retention Defaults</CardTitle>
                                <CardDescription>Configure how long data is kept by default across the platform.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Session History Limit (days)</Label>
                                    <Input type="number" defaultValue={90} className="h-11" />
                                    <p className="text-xs text-muted-foreground mt-1">Chat history retention period before auto-deletion.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Audit Log Retention (days)</Label>
                                    <Input type="number" defaultValue={365} className="h-11" />
                                    <p className="text-xs text-muted-foreground mt-1">Administrative audit logs retention period.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </MotionWrapper>
                </TabsContent>

                {/* Security */}
                <TabsContent value="security" className="mt-0">
                    <MotionWrapper>
                        <Card className="border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Authentication Policies</CardTitle>
                                <CardDescription>Security settings for user authentication and session management.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border/50 bg-muted/20">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Mandatory 2FA for All Users</Label>
                                        <p className="text-sm text-muted-foreground">Require two-factor authentication for all accounts on the platform</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border/50 bg-muted/20">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Mandatory 2FA for Admins Only</Label>
                                        <p className="text-sm text-muted-foreground">Only require 2FA for admin-level accounts (if global 2FA is off)</p>
                                    </div>
                                    <Switch />
                                </div>

                                <Separator />

                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Minimum Password Length</Label>
                                        <Input type="number" defaultValue={12} className="h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Session Timeout (minutes)</Label>
                                        <Input type="number" defaultValue={60} className="h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Login Attempts Before Lock</Label>
                                        <Input type="number" defaultValue={5} className="h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Password Reset Expiry (minutes)</Label>
                                        <Input type="number" defaultValue={30} className="h-11" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </MotionWrapper>
                </TabsContent>

                {/* LLM Gateway */}
                <TabsContent value="llm" className="mt-0">
                    <MotionWrapper>
                        <Card className="border-brand-500/20 shadow-sm ring-1 ring-brand-500/10">
                            <CardHeader className="bg-brand-50/50 border-b border-border/50 pb-4">
                                <div className="flex items-center gap-2">
                                    <Key className="w-5 h-5 text-brand-600" />
                                    <CardTitle className="text-lg">LLM API Credentials</CardTitle>
                                </div>
                                <CardDescription>Securely manage API keys for commercial AI providers. These keys are used globally.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                {[
                                    { id: 'openai', name: 'OpenAI API Key', placeholder: 'sk-proj-...' },
                                    { id: 'anthropic', name: 'Anthropic API Key', placeholder: 'sk-ant-...' },
                                    { id: 'google', name: 'Google Gemini API Key', placeholder: 'AIzaSy...' }
                                ].map((provider) => (
                                    <div key={provider.id} className="space-y-2">
                                        <Label>{provider.name}</Label>
                                        <div className="relative">
                                            <Input 
                                                type={showKeys[provider.id] ? "text" : "password"} 
                                                placeholder={provider.placeholder} 
                                                defaultValue={`mock-key-${provider.id}-8f92j394`}
                                                className="h-11 pr-10 font-mono text-sm" 
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-1 top-1.5 h-8 w-8 text-muted-foreground hover:text-foreground"
                                                onClick={() => toggleKeyVisibility(provider.id)}
                                            >
                                                {showKeys[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Model Availability</CardTitle>
                                <CardDescription>Toggle which AI models are available to users across the platform.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                {[
                                    { name: "GPT-4o", provider: "OpenAI", enabled: true },
                                    { name: "GPT-4o mini", provider: "OpenAI", enabled: true },
                                    { name: "Claude 3.5 Sonnet", provider: "Anthropic", enabled: true },
                                    { name: "Claude 3 Haiku", provider: "Anthropic", enabled: true },
                                    { name: "Gemini 1.5 Pro", provider: "Google", enabled: true },
                                    { name: "Gemini 1.5 Flash", provider: "Google", enabled: true },
                                    { name: "Llama 3 70B", provider: "Meta (via API)", enabled: false },
                                ].map((model) => (
                                    <div key={model.name} className="flex items-center justify-between rounded-lg border border-border/60 p-4 transition-colors hover:bg-muted/20">
                                        <div>
                                            <p className="text-sm font-semibold">{model.name}</p>
                                            <p className="text-xs text-muted-foreground">{model.provider}</p>
                                        </div>
                                        <Switch defaultChecked={model.enabled} />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </MotionWrapper>
                </TabsContent>

                {/* Notifications */}
                <TabsContent value="notifications" className="mt-0">
                    <MotionWrapper>
                        <Card className="border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Email & System Alerts</CardTitle>
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
            
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.1 }}
                className="flex justify-end pb-8"
            >
                <Button onClick={handleSave} className="bg-brand-600 hover:bg-brand-700 text-white px-8 h-11 text-base font-semibold shadow-sm transition-all" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                    {saving ? "Saving..." : "Save Settings"}
                </Button>
            </motion.div>
        </div>
    );
}
