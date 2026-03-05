"use client";

import { useState } from "react";
import { Save, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const employeeAccess = [
    { name: "Raj Patel", email: "raj@acme.com", fileUpload: true, speechToText: true, allModels: true, limit: 50 },
    { name: "John Miller", email: "john@acme.com", fileUpload: true, speechToText: false, allModels: true, limit: 30 },
    { name: "Alice Brown", email: "alice@acme.com", fileUpload: false, speechToText: false, allModels: false, limit: 20 },
    { name: "Bob Wilson", email: "bob@acme.com", fileUpload: true, speechToText: true, allModels: true, limit: 40 },
    { name: "Mike Chen", email: "mike@acme.com", fileUpload: false, speechToText: false, allModels: false, limit: 0 },
];

export default function AccessControlPage() {
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await new Promise((r) => setTimeout(r, 600));
        setSaving(false);
        toast.success("Access policies saved!");
    };

    return (
        <div className="mx-auto max-w-5xl">
            <PageHeader
                title="Access Control"
                subtitle="Manage employee permissions and usage limits."
                breadcrumbs={[{ label: "Dept Admin", href: "/da/dashboard" }, { label: "Access Control" }]}
            />

            {/* Department-level policies */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-base">Department Policies</CardTitle>
                    <CardDescription>Default access settings for all employees in this department.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="flex items-center justify-between">
                        <div><Label>Allow File Uploads</Label><p className="text-xs text-muted-foreground mt-0.5">Employees can upload documents to AI</p></div>
                        <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div><Label>Allow Speech-to-Text</Label><p className="text-xs text-muted-foreground mt-0.5">Enable voice input for prompts</p></div>
                        <Switch />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div><Label>Access All Models</Label><p className="text-xs text-muted-foreground mt-0.5">Allow all available AI models</p></div>
                        <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2"><Label>Default Per-User Daily Limit</Label><Input type="number" defaultValue={30} /></div>
                        <div className="space-y-2"><Label>Max Prompt Length (chars)</Label><Input type="number" defaultValue={5000} /></div>
                    </div>
                </CardContent>
            </Card>

            {/* Per-employee overrides */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Employee Overrides</CardTitle>
                    <CardDescription>Customize access for specific employees. Overrides department defaults.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {employeeAccess.map((emp) => (
                            <div key={emp.email} className="rounded-lg border border-border p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8"><AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">{emp.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                                        <div><p className="text-sm font-medium">{emp.name}</p><p className="text-xs text-muted-foreground">{emp.email}</p></div>
                                    </div>
                                    {emp.limit === 0 && <Badge variant="outline" className="bg-danger/10 text-danger border-danger/20">Restricted</Badge>}
                                </div>
                                <div className="flex flex-wrap gap-4 items-center text-sm">
                                    <div className="flex items-center gap-2"><Label className="text-xs">Uploads</Label><Switch defaultChecked={emp.fileUpload} /></div>
                                    <div className="flex items-center gap-2"><Label className="text-xs">Voice</Label><Switch defaultChecked={emp.speechToText} /></div>
                                    <div className="flex items-center gap-2"><Label className="text-xs">All Models</Label><Switch defaultChecked={emp.allModels} /></div>
                                    <div className="flex items-center gap-2 ml-auto"><Label className="text-xs">Daily Limit</Label><Input type="number" defaultValue={emp.limit} className="w-20 h-8 text-sm" /></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Separator className="my-6" />
            <div className="flex justify-end">
                <Button onClick={handleSave} className="bg-brand-700 hover:bg-brand-800" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Policies
                </Button>
            </div>
        </div>
    );
}
