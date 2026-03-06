"use client";

import { useState, useRef } from "react";
import { Save, Loader2, Camera, ShieldCheck, KeyRound } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { INDUSTRIES } from "@/lib/constants";

export default function ProfilePage() {
    const [saving, setSaving] = useState(false);

    // Avatar State
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile States
    const [firstName, setFirstName] = useState("Alex");
    const [lastName, setLastName] = useState("Thompson");
    const [email, setEmail] = useState("alex@freelance.com");
    const [phone, setPhone] = useState("+1-555-0199");
    const [country, setCountry] = useState("United States");
    const [jobTitle, setJobTitle] = useState("Data Scientist");
    const [industry, setIndustry] = useState("Technology");
    const [bio, setBio] = useState("Experienced data scientist specializing in NLP and machine learning with a focus on healthcare applications.");

    // Dialog States
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [twoFAOpen, setTwoFAOpen] = useState(false);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setAvatarUrl(url);
            toast.success("Avatar updated locally.");
        }
    };

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise((r) => setTimeout(r, 800));
        setSaving(false);
        toast.success("Profile saved effectively.");
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
                            {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />}
                            <AvatarFallback className="bg-brand-100 text-2xl font-bold text-brand-700">
                                {firstName[0]}{lastName[0]}
                            </AvatarFallback>
                        </Avatar>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleAvatarChange}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white hover:bg-brand-700 transition"
                        >
                            <Camera className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">{firstName} {lastName}</h3>
                        <p className="text-sm text-muted-foreground">{email}</p>
                        <p className="text-xs text-muted-foreground mt-1">Professional Account · Pro Plan</p>
                    </div>
                </CardContent>
            </Card>

            {/* Personal info */}
            <Card className="mb-6">
                <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label>First Name</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Last Name</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
                    <div className="sm:col-span-2 space-y-2"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></div>
                    <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Country</Label><Input value={country} onChange={(e) => setCountry(e.target.value)} /></div>
                </CardContent>
            </Card>

            {/* Professional info */}
            <Card className="mb-6">
                <CardHeader><CardTitle className="text-base">Professional Details</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label>Job Title</Label><Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} /></div>
                    <div className="space-y-2">
                        <Label>Industry</Label>
                        <Select value={industry} onValueChange={setIndustry}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{INDUSTRIES.map((ind) => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                        <Label>Bio</Label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full rounded-lg border border-border bg-transparent p-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Security */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-base">Security</CardTitle>
                    <CardDescription>Manage your password and two-factor authentication.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Password Dialog */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Password</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">Last changed 30 days ago</p>
                        </div>
                        <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
                            <DialogTrigger asChild><Button variant="outline" size="sm">Change Password</Button></DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-brand-600" /> Update Password</DialogTitle>
                                    <DialogDescription>Ensure your account is using a long, random password to stay secure.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2"><Label>Current Password</Label><Input type="password" /></div>
                                    <div className="space-y-2"><Label>New Password</Label><Input type="password" /></div>
                                    <div className="space-y-2"><Label>Confirm New Password</Label><Input type="password" /></div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={() => { setPasswordOpen(false); toast.success("Password updated successfully."); }} className="bg-brand-600 hover:bg-brand-700">Save changes</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Separator />

                    {/* 2FA Dialog */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="flex items-center gap-2">Two-Factor Authentication <Badge variant="outline" className="bg-success/10 text-success text-[10px] h-5">Enabled</Badge></Label>
                            <p className="text-xs text-muted-foreground mt-0.5">Currently enabled via authenticator app</p>
                        </div>
                        <Dialog open={twoFAOpen} onOpenChange={setTwoFAOpen}>
                            <DialogTrigger asChild><Button variant="outline" size="sm">Manage 2FA</Button></DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-success" /> Manage 2FA</DialogTitle>
                                    <DialogDescription>Your account is currently protected by Two-Factor Authentication.</DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="rounded-lg border border-border p-4 bg-muted/30">
                                        <p className="text-sm font-medium">Authenticator App</p>
                                        <p className="text-xs text-muted-foreground mt-1 mb-3">You are using Google Authenticator or a similar TOTP app to generate codes.</p>
                                        <Button variant="destructive" size="sm" onClick={() => { setTwoFAOpen(false); toast.info("2FA Disabled (Simulated)."); }}>Disable 2FA</Button>
                                    </div>
                                    <div className="rounded-lg border border-border p-4 bg-muted/30">
                                        <p className="text-sm font-medium">Backup Codes</p>
                                        <p className="text-xs text-muted-foreground mt-1 mb-3">Generate new backup codes if you lose access to your device.</p>
                                        <Button variant="outline" size="sm">Regenerate Codes</Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>

            <Separator className="my-6" />
            <div className="flex justify-end">
                <Button onClick={handleSave} className="bg-brand-700 hover:bg-brand-800" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Profile
                </Button>
            </div>
        </div>
    );
}
