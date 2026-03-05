"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
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

    const handleSave = async () => {
        setSaving(true);
        await new Promise((r) => setTimeout(r, 600));
        setSaving(false);
        toast.success("Settings saved successfully!");
    };

    return (
        <div className="mx-auto max-w-4xl">
            <PageHeader
                title="System Settings"
                subtitle="Configure platform-wide settings for D-SecureAI."
                breadcrumbs={[{ label: "Super Admin", href: "/sa/dashboard" }, { label: "Settings" }]}
            />

            <Tabs defaultValue="general">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="models">AI Models</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>

                {/* General */}
                <TabsContent value="general" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Platform Information</CardTitle>
                            <CardDescription>Basic configuration for the D-SecureAI platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Platform Name</Label>
                                <Input defaultValue="D-SecureAI" />
                            </div>
                            <div className="space-y-2">
                                <Label>Support Email</Label>
                                <Input defaultValue="support@dsecureai.com" />
                            </div>
                            <div className="space-y-2">
                                <Label>Default Timezone</Label>
                                <Select defaultValue="UTC">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                                    <SelectTrigger><SelectValue /></SelectTrigger>
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

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Default Quotas</CardTitle>
                            <CardDescription>Default quota limits for new organizations and users.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Org Default Quota (monthly)</Label>
                                <Input type="number" defaultValue={5000} />
                            </div>
                            <div className="space-y-2">
                                <Label>Free User Quota (monthly)</Label>
                                <Input type="number" defaultValue={50} />
                            </div>
                            <div className="space-y-2">
                                <Label>Max File Size (MB)</Label>
                                <Input type="number" defaultValue={10} />
                            </div>
                            <div className="space-y-2">
                                <Label>Session History Limit (days)</Label>
                                <Input type="number" defaultValue={90} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security */}
                <TabsContent value="security" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Authentication</CardTitle>
                            <CardDescription>Security settings for user authentication.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div><Label>Mandatory 2FA for All Users</Label><p className="text-xs text-muted-foreground mt-0.5">Require two-factor authentication for all accounts</p></div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div><Label>Mandatory 2FA for Admins Only</Label><p className="text-xs text-muted-foreground mt-0.5">Only require 2FA for admin-level accounts</p></div>
                                <Switch />
                            </div>
                            <Separator />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Min Password Length</Label>
                                    <Input type="number" defaultValue={8} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Session Timeout (minutes)</Label>
                                    <Input type="number" defaultValue={60} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Login Attempts Before Lock</Label>
                                    <Input type="number" defaultValue={5} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Password Reset Link Expiry (min)</Label>
                                    <Input type="number" defaultValue={30} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* AI Models */}
                <TabsContent value="models" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Model Availability</CardTitle>
                            <CardDescription>Toggle which AI models are available on the platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { name: "GPT-5.1", provider: "OpenAI", enabled: true },
                                { name: "GPT-4o", provider: "OpenAI", enabled: true },
                                { name: "Claude 4.6 Sonnet", provider: "Anthropic", enabled: true },
                                { name: "Claude 4.5 Haiku", provider: "Anthropic", enabled: true },
                                { name: "Claude 4.6 Opus", provider: "Anthropic", enabled: true },
                                { name: "Gemini 3.1 Pro", provider: "Google", enabled: true },
                                { name: "Gemini 3.1 Flash", provider: "Google", enabled: true },
                            ].map((model) => (
                                <div key={model.name} className="flex items-center justify-between rounded-lg border border-border p-4">
                                    <div>
                                        <p className="text-sm font-medium">{model.name}</p>
                                        <p className="text-xs text-muted-foreground">{model.provider}</p>
                                    </div>
                                    <Switch defaultChecked={model.enabled} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications */}
                <TabsContent value="notifications" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Email Notifications</CardTitle>
                            <CardDescription>Configure platform-wide notification triggers.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { label: "New Organization Registration", description: "Email when a new org is registered" },
                                { label: "Quota Threshold Alert", description: "Alert when an org reaches 80% quota" },
                                { label: "User Suspension", description: "Notify admin when a user is suspended" },
                                { label: "Subscription Changes", description: "Alert on plan upgrades/downgrades" },
                                { label: "System Health Alerts", description: "Critical system alerts and errors" },
                            ].map((n) => (
                                <div key={n.label} className="flex items-center justify-between">
                                    <div><Label>{n.label}</Label><p className="text-xs text-muted-foreground mt-0.5">{n.description}</p></div>
                                    <Switch defaultChecked />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Separator className="my-6" />
            <div className="flex justify-end">
                <Button onClick={handleSave} className="bg-brand-700 hover:bg-brand-800" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Settings
                </Button>
            </div>
        </div>
    );
}
