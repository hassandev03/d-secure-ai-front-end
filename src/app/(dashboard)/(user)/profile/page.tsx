"use client";

import { useState, useRef } from "react";
import { Save, Loader2, Camera, ShieldCheck, KeyRound, AlertCircle, Briefcase, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { INDUSTRIES } from "@/lib/constants";
import { useAuthStore } from "@/store/auth.store";
import { updateUserProfile, changePassword } from "@/services/profile.service";

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

const PLAN_BADGE: Record<string, string> = {
    FREE:         "bg-muted text-muted-foreground",
    PRO:          "bg-brand-100 text-brand-700",
    MAX:          "bg-gradient-to-r from-brand-600 to-indigo-600 text-white",
    PROFESSIONAL: "bg-gradient-to-r from-brand-600 to-indigo-600 text-white",
    ENTERPRISE:   "bg-emerald-100 text-emerald-800",
};

export default function ProfilePage() {
    const { user, updateUser } = useAuthStore();
    const [saving, setSaving] = useState(false);

    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const nameParts = (user?.name || "User").split(" ");
    const [firstName, setFirstName] = useState(nameParts[0] || "");
    const [lastName,  setLastName]  = useState(nameParts.slice(1).join(" ") || "");
    const [email,     setEmail]     = useState(user?.email || "");
    const [phone,     setPhone]     = useState(user?.phone || "");
    const [country,   setCountry]   = useState(user?.country || "");
    const [jobTitle,  setJobTitle]  = useState(user?.jobTitle || "");
    const [industry,  setIndustry]  = useState(user?.industry || "");
    const [bio,       setBio]       = useState("");

    const [errors, setErrors] = useState<Record<string, string | null>>({});

    const [passwordOpen, setPasswordOpen] = useState(false);
    const [twoFAOpen,    setTwoFAOpen]    = useState(false);

    const [currentPassword,  setCurrentPassword]  = useState("");
    const [newPassword,      setNewPassword]      = useState("");
    const [confirmPassword,  setConfirmPassword]  = useState("");
    const [pwErrors,         setPwErrors]         = useState<Record<string, string | null>>({});

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarUrl(URL.createObjectURL(file));
            toast.success("Avatar updated locally.");
        }
    };

    const handleSave = async () => {
        const newErrors: Record<string, string | null> = {
            firstName: validateName(firstName, "First Name"),
            lastName:  validateName(lastName, "Last Name"),
            email:     validateEmail(email),
            phone:     validatePhone(phone),
            country:   validateCountry(country),
            jobTitle:  validateJobTitle(jobTitle),
        };
        setErrors(newErrors);
        if (Object.values(newErrors).some((e) => e !== null)) {
            toast.error("Please fix the validation errors.");
            return;
        }
        setSaving(true);
        try {
            const result = await updateUserProfile({ name: `${firstName.trim()} ${lastName.trim()}`, phone, country, jobTitle, industry });
            if (result.success && result.user) updateUser(result.user);
            toast.success("Profile saved successfully.");
        } catch {
            toast.error("Failed to save profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const [pwLoading, setPwLoading] = useState(false);

    const handlePasswordChange = async () => {
        const newPwErrors: Record<string, string | null> = {
            currentPassword: !currentPassword ? "Current password is required." : null,
            newPassword:     validatePassword(newPassword),
            confirmPassword: !confirmPassword ? "Please confirm your new password." : confirmPassword !== newPassword ? "Passwords do not match." : null,
        };
        setPwErrors(newPwErrors);
        if (Object.values(newPwErrors).some((e) => e !== null)) return;
        setPwLoading(true);
        try {
            await changePassword(currentPassword, newPassword);
            setPasswordOpen(false);
            setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPwErrors({});
            toast.success("Password updated successfully.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update password.");
        } finally {
            setPwLoading(false);
        }
    };

    const planKey = user?.subscriptionTier || "FREE";
    const planBadgeClass = PLAN_BADGE[planKey] ?? PLAN_BADGE.FREE;

    return (
        <div className="mx-auto max-w-3xl">
            <PageHeader
                title="Profile"
                subtitle="Manage your personal information and preferences."
                breadcrumbs={[{ label: "User", href: "/dashboard" }, { label: "Profile" }]}
            />

            {/* Hero avatar card */}
            <Card className="mb-6 overflow-hidden">
                <div className="h-28 bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-700" />
                <CardContent className="relative px-6 pb-6 pt-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />}
                                <AvatarFallback className="bg-brand-100 text-3xl font-bold text-brand-700">
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
                                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white hover:bg-brand-700 transition shadow-sm"
                            >
                                <Camera className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {/* Name + info */}
                        <div className="flex-1 min-w-0 sm:pb-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-xl font-bold">{firstName} {lastName}</h3>
                                <Badge className={`text-xs border-0 ${planBadgeClass}`}>{planKey} Plan</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{email}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {user?.role === "PROFESSIONAL" ? "Independent Professional" : user?.orgName || "Organization Employee"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Personal info */}
            <Card className="mb-6">
                <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>First Name <span className="text-danger">*</span></Label>
                        <Input value={firstName} onChange={(e) => { setFirstName(e.target.value); setErrors((p) => ({ ...p, firstName: null })); }} className={errors.firstName ? "border-danger" : ""} />
                        <FieldError error={errors.firstName ?? null} />
                    </div>
                    <div className="space-y-2">
                        <Label>Last Name <span className="text-danger">*</span></Label>
                        <Input value={lastName} onChange={(e) => { setLastName(e.target.value); setErrors((p) => ({ ...p, lastName: null })); }} className={errors.lastName ? "border-danger" : ""} />
                        <FieldError error={errors.lastName ?? null} />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                        <Label>Email <span className="text-danger">*</span></Label>
                        <Input value={email} onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: null })); }} type="email" className={errors.email ? "border-danger" : ""} />
                        <FieldError error={errors.email ?? null} />
                    </div>
                    <div className="space-y-2">
                        <Label>Phone <span className="text-danger">*</span></Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input value={phone} onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: null })); }} placeholder="+1 234 567 8900" className={`pl-9 ${errors.phone ? "border-danger" : ""}`} />
                        </div>
                        <FieldError error={errors.phone ?? null} />
                    </div>
                    <div className="space-y-2">
                        <Label>Country <span className="text-danger">*</span></Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input value={country} onChange={(e) => { setCountry(e.target.value); setErrors((p) => ({ ...p, country: null })); }} className={`pl-9 ${errors.country ? "border-danger" : ""}`} />
                        </div>
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
                        <Input value={jobTitle} onChange={(e) => { setJobTitle(e.target.value); setErrors((p) => ({ ...p, jobTitle: null })); }} className={errors.jobTitle ? "border-danger" : ""} />
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
                        <Textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us a bit about yourself…"
                            className="resize-none"
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
                                        <Input type="password" value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); setPwErrors((p) => ({ ...p, currentPassword: null })); }} className={pwErrors.currentPassword ? "border-danger" : ""} />
                                        <FieldError error={pwErrors.currentPassword ?? null} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>New Password <span className="text-danger">*</span></Label>
                                        <Input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPwErrors((p) => ({ ...p, newPassword: null })); }} className={pwErrors.newPassword ? "border-danger" : ""} />
                                        <FieldError error={pwErrors.newPassword ?? null} />
                                        <p className="text-[10px] text-muted-foreground">Min 8 chars, uppercase, number, and special character required.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Confirm New Password <span className="text-danger">*</span></Label>
                                        <Input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPwErrors((p) => ({ ...p, confirmPassword: null })); }} className={pwErrors.confirmPassword ? "border-danger" : ""} />
                                        <FieldError error={pwErrors.confirmPassword ?? null} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handlePasswordChange} className="bg-brand-600 hover:bg-brand-700" disabled={pwLoading}>{pwLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save changes"}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Separator />

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
                                        <Button variant="outline" size="sm" onClick={() => toast.success("New backup codes generated.")}>Regenerate Codes</Button>
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
