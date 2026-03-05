"use client";

import { useState } from "react";
import { Save, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { INDUSTRIES } from "@/lib/constants";

export default function ProfilePage() {
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await new Promise((r) => setTimeout(r, 600));
        setSaving(false);
        toast.success("Profile updated!");
    };

    return (
        <div className="mx-auto max-w-3xl">
            <PageHeader
                title="Profile"
                subtitle="Manage your personal information and preferences."
                breadcrumbs={[{ label: "User", href: "/dashboard" }, { label: "Profile" }]}
            />

            {/* Avatar */}
            <Card className="mb-6">
                <CardContent className="flex items-center gap-6 p-6">
                    <div className="relative">
                        <Avatar className="h-20 w-20">
                            <AvatarFallback className="bg-brand-100 text-2xl font-bold text-brand-700">AT</AvatarFallback>
                        </Avatar>
                        <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white hover:bg-brand-700">
                            <Camera className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Alex Thompson</h3>
                        <p className="text-sm text-muted-foreground">alex@freelance.com</p>
                        <p className="text-xs text-muted-foreground mt-1">Professional Account · Pro Plan</p>
                    </div>
                </CardContent>
            </Card>

            {/* Personal info */}
            <Card className="mb-6">
                <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label>First Name</Label><Input defaultValue="Alex" /></div>
                    <div className="space-y-2"><Label>Last Name</Label><Input defaultValue="Thompson" /></div>
                    <div className="sm:col-span-2 space-y-2"><Label>Email</Label><Input defaultValue="alex@freelance.com" type="email" /></div>
                    <div className="space-y-2"><Label>Phone</Label><Input defaultValue="+1-555-0199" /></div>
                    <div className="space-y-2"><Label>Country</Label><Input defaultValue="United States" /></div>
                </CardContent>
            </Card>

            {/* Professional info */}
            <Card className="mb-6">
                <CardHeader><CardTitle className="text-base">Professional Details</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label>Job Title</Label><Input defaultValue="Data Scientist" /></div>
                    <div className="space-y-2">
                        <Label>Industry</Label>
                        <Select defaultValue="Technology">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{INDUSTRIES.map((ind) => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="sm:col-span-2 space-y-2"><Label>Bio</Label><textarea className="w-full rounded-lg border border-border bg-transparent p-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" rows={3} defaultValue="Experienced data scientist specializing in NLP and machine learning with a focus on healthcare applications." /></div>
                </CardContent>
            </Card>

            {/* Security */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-base">Security</CardTitle>
                    <CardDescription>Manage your password and two-factor authentication.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div><Label>Password</Label><p className="text-xs text-muted-foreground">Last changed 30 days ago</p></div>
                        <Button variant="outline" size="sm">Change Password</Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div><Label>Two-Factor Authentication</Label><p className="text-xs text-muted-foreground">Currently enabled via authenticator app</p></div>
                        <Button variant="outline" size="sm">Manage 2FA</Button>
                    </div>
                </CardContent>
            </Card>

            <Separator className="my-6" />
            <div className="flex justify-end">
                <Button onClick={handleSave} className="bg-brand-700 hover:bg-brand-800" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Profile
                </Button>
            </div>
        </div>
    );
}
