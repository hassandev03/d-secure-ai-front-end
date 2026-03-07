"use client";

import { useState, useRef } from "react";
import { Save, Loader2, Camera, ShieldCheck, KeyRound, AlertCircle } from "lucide-react";
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
import { useAuthStore } from "@/store/auth.store";

/* ── Validation helpers ── */
function validateEmail(email: string): string | null {
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
    return null;
}

function validateName(name: string, label: string): string | null {
    if (!name.trim()) return `${label} is required.`;
    if (name.trim().length < 2) return `${label} must be at least 2 characters.`;
    return null;
}

function validatePhone(phone: string): string | null {
    if (!phone.trim()) return "Phone is required.";
    if (!/^\+?[\d\s\-()]{7,20}$/.test(phone)) return "Enter a valid phone number.";
    return null;
}

function validateCountry(country: string): string | null {
    if (!country.trim()) return "Country is required.";
    if (country.trim().length < 2) return "Country must be at least 2 characters.";
    if (!/^[A-Za-z\s\-,.]+$/.test(country)) return "Enter a valid country name.";
    return null;
}

function validateJobTitle(title: string): string | null {
    if (!title.trim()) return "Job title is required.";
    if (title.trim().length < 2) return "Job title must be at least 2 characters.";
    if (!/^[A-Za-z0-9\s\-,.&]+$/.test(title)) return "Enter a valid job title.";
    return null;
}

function validatePassword(password: string): string | null {
    if (!password) return "Password is required.";
    if (password.length < 8) return "Must be at least 8 characters.";
    if (!/[A-Z]/.test(password)) return "Must contain an uppercase letter.";
    if (!/[0-9]/.test(password)) return "Must contain a number.";
    if (!/[^A-Za-z0-9]/.test(password)) return "Must contain a special character.";
    return null;
}

function FieldError({ error }: { error: string | null }) {
    if (!error) return null;
    return (
        <p className="flex items-center gap-1 text-xs text-danger mt-1">
            <AlertCircle className="h-3 w-3 shrink-0" />{error}
        </p>
    );
}

export default function ProfilePage() {
    const { user } = useAuthStore();
    const [saving, setSaving] = useState(false);

    // Avatar State
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile States — initialize from auth store
    const nameParts = (user?.name || 'User').split(' ');
    const [firstName, setFirstName] = useState(nameParts[0] || '');
    const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [country, setCountry] = useState(user?.country || '');
    const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
    const [industry, setIndustry] = useState(user?.industry || '');
    const [bio, setBio] = useState("");

    // Validation errors
    const [errors, setErrors] = useState<Record<string, string | null>>({});

    // Dialog States
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [twoFAOpen, setTwoFAOpen] = useState(false);

    // Password form
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pwErrors, setPwErrors] = useState<Record<string, string | null>>({});

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setAvatarUrl(url);
            toast.success("Avatar updated locally.");
        }
    };

    const handleSave = async () => {
        // Validate all fields
        const newErrors: Record<string, string | null> = {
            firstName: validateName(firstName, "First Name"),
            lastName: validateName(lastName, "Last Name"),
            email: validateEmail(email),
            phone: validatePhone(phone),
            country: validateCountry(country),
            jobTitle: validateJobTitle(jobTitle),
        };
        setErrors(newErrors);

        const hasErrors = Object.values(newErrors).some(e => e !== null);
        if (hasErrors) {
            toast.error("Please fix the validation errors.");
            return;
        }

        setSaving(true);
        await new Promise((r) => setTimeout(r, 800));
        setSaving(false);
        toast.success("Profile saved successfully.");
    };

    const handlePasswordChange = async () => {
        const newPwErrors: Record<string, string | null> = {
            currentPassword: !currentPassword ? "Current password is required." : null,
            newPassword: validatePassword(newPassword),
            confirmPassword: !confirmPassword
                ? "Please confirm your new password."
                : confirmPassword !== newPassword
                    ? "Passwords do not match."
                    : null,
        };
        setPwErrors(newPwErrors);

        const hasErrors = Object.values(newPwErrors).some(e => e !== null);
        if (hasErrors) return;

        setPasswordOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPwErrors({});
        toast.success("Password updated successfully.");
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
                        <p className="text-xs text-muted-foreground mt-1">
                            {user?.role === 'PROFESSIONAL' ? (
                                <>Professional Account{user?.subscriptionTier ? ` · ${user.subscriptionTier} Plan` : ''}</>
                            ) : user?.orgName ? (
                                <>{user.orgName}{user?.subscriptionTier ? ` · ${user.subscriptionTier} Plan` : ''}</>
                            ) : (
                                "Organization Employee Account"
                            )}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Personal info */}
            <Card className="mb-6">
                <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>First Name <span className="text-danger">*</span></Label>
                        <Input value={firstName} onChange={(e) => { setFirstName(e.target.value); setErrors(prev => ({ ...prev, firstName: null })); }} className={errors.firstName ? "border-danger" : ""} />
                        <FieldError error={errors.firstName ?? null} />
                    </div>
                    <div className="space-y-2">
                        <Label>Last Name <span className="text-danger">*</span></Label>
                        <Input value={lastName} onChange={(e) => { setLastName(e.target.value); setErrors(prev => ({ ...prev, lastName: null })); }} className={errors.lastName ? "border-danger" : ""} />
                        <FieldError error={errors.lastName ?? null} />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                        <Label>Email <span className="text-danger">*</span></Label>
                        <Input value={email} onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: null })); }} type="email" className={errors.email ? "border-danger" : ""} />
                        <FieldError error={errors.email ?? null} />
                    </div>
                    <div className="space-y-2">
                        <Label>Phone <span className="text-danger">*</span></Label>
                        <Input value={phone} onChange={(e) => { setPhone(e.target.value); setErrors(prev => ({ ...prev, phone: null })); }} placeholder="+1 234 567 8900" className={errors.phone ? "border-danger" : ""} />
                        <FieldError error={errors.phone ?? null} />
                    </div>
                    <div className="space-y-2">
                        <Label>Country <span className="text-danger">*</span></Label>
                        <Input value={country} onChange={(e) => { setCountry(e.target.value); setErrors(prev => ({ ...prev, country: null })); }} className={errors.country ? "border-danger" : ""} />
                        <FieldError error={errors.country ?? null} />
                    </div>
                </CardContent>
            </Card>

            {/* Professional info */}
            <Card className="mb-6">
                <CardHeader><CardTitle className="text-base">Professional Details</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Job Title <span className="text-danger">*</span></Label>
                        <Input value={jobTitle} onChange={(e) => { setJobTitle(e.target.value); setErrors(prev => ({ ...prev, jobTitle: null })); }} className={errors.jobTitle ? "border-danger" : ""} />
                        <FieldError error={errors.jobTitle ?? null} />
                    </div>
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
                        <Dialog open={passwordOpen} onOpenChange={(open) => { setPasswordOpen(open); if (!open) { setPwErrors({}); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); } }}>
                            <DialogTrigger asChild><Button variant="outline" size="sm">Change Password</Button></DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-brand-600" /> Update Password</DialogTitle>
                                    <DialogDescription>Ensure your account is using a long, random password to stay secure.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Current Password <span className="text-danger">*</span></Label>
                                        <Input type="password" value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); setPwErrors(prev => ({ ...prev, currentPassword: null })); }} className={pwErrors.currentPassword ? "border-danger" : ""} />
                                        <FieldError error={pwErrors.currentPassword ?? null} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>New Password <span className="text-danger">*</span></Label>
                                        <Input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPwErrors(prev => ({ ...prev, newPassword: null })); }} className={pwErrors.newPassword ? "border-danger" : ""} />
                                        <FieldError error={pwErrors.newPassword ?? null} />
                                        <p className="text-[10px] text-muted-foreground">Min 8 chars, uppercase, number, and special character required.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Confirm New Password <span className="text-danger">*</span></Label>
                                        <Input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPwErrors(prev => ({ ...prev, confirmPassword: null })); }} className={pwErrors.confirmPassword ? "border-danger" : ""} />
                                        <FieldError error={pwErrors.confirmPassword ?? null} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handlePasswordChange} className="bg-brand-600 hover:bg-brand-700">Save changes</Button>
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
