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

export default function OrgSettingsPage() {
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await new Promise((r) => setTimeout(r, 600));
        setSaving(false);
        toast.success("Settings saved!");
    };

    return (
        <div className="mx-auto max-w-4xl">
            <PageHeader
                title="Organization Settings"
                subtitle="Configure settings for Acme Corporation."
                breadcrumbs={[{ label: "Organization", href: "/oa/dashboard" }, { label: "Settings" }]}
            />

            <Tabs defaultValue="general">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="models">AI Models</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Organization Profile</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2 space-y-2"><Label>Organization Name</Label><Input defaultValue="Acme Corporation" /></div>
                            <div className="space-y-2"><Label>Industry</Label><Input defaultValue="Technology" readOnly className="bg-muted" /></div>
                            <div className="space-y-2"><Label>Domain</Label><Input defaultValue="acme.com" /></div>
                            <div className="space-y-2"><Label>Country</Label><Input defaultValue="USA" /></div>
                            <div className="space-y-2"><Label>Support Email</Label><Input defaultValue="it@acme.com" /></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Employee Defaults</CardTitle>
                            <CardDescription>Default settings for new employees.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Default Department</Label>
                                <Select defaultValue="none">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (assign manually)</SelectItem>
                                        <SelectItem value="Engineering">Engineering</SelectItem>
                                        <SelectItem value="Marketing">Marketing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2"><Label>Per-User Monthly Limit</Label><Input type="number" defaultValue={100} /></div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Security Policies</CardTitle>
                            <CardDescription>Organization-wide security settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div><Label>Enforce 2FA for All Employees</Label><p className="text-xs text-muted-foreground mt-0.5">Require two-factor authentication</p></div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div><Label>Allow File Uploads</Label><p className="text-xs text-muted-foreground mt-0.5">Let employees upload documents to AI</p></div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div><Label>Allow Speech-to-Text</Label><p className="text-xs text-muted-foreground mt-0.5">Enable voice input for AI prompts</p></div>
                                <Switch />
                            </div>
                            <Separator />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2"><Label>Session Timeout (minutes)</Label><Input type="number" defaultValue={30} /></div>
                                <div className="space-y-2"><Label>Max File Size (MB)</Label><Input type="number" defaultValue={10} /></div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="models" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Allowed Models</CardTitle>
                            <CardDescription>Choose which AI models employees can access.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { name: "GPT-5.1", provider: "OpenAI", enabled: true },
                                { name: "GPT-4o", provider: "OpenAI", enabled: true },
                                { name: "Claude 4.6 Sonnet", provider: "Anthropic", enabled: true },
                                { name: "Claude 4.5 Haiku", provider: "Anthropic", enabled: false },
                                { name: "Claude 4.6 Opus", provider: "Anthropic", enabled: false },
                                { name: "Gemini 3.1 Pro", provider: "Google", enabled: true },
                                { name: "Gemini 3.1 Flash", provider: "Google", enabled: true },
                            ].map((model) => (
                                <div key={model.name} className="flex items-center justify-between rounded-lg border border-border p-4">
                                    <div><p className="text-sm font-medium">{model.name}</p><p className="text-xs text-muted-foreground">{model.provider}</p></div>
                                    <Switch defaultChecked={model.enabled} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Separator className="my-6" />
            <div className="flex justify-end">
                <Button onClick={handleSave} className="bg-brand-700 hover:bg-brand-800" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Settings
                </Button>
            </div>
        </div>
    );
}
