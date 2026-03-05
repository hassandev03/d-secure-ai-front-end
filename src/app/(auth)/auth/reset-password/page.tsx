"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, Loader2, CheckCircle, Eye, EyeOff, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { resetPassword } from "@/services/auth.service";
import Link from "next/link";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const portal = searchParams.get("portal") || "user";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const portalConfig = {
        "super-admin": { color: "bg-brand-950", loginPath: "/auth/super-admin/login" },
        organization: { color: "bg-brand-800", loginPath: "/auth/organization/login" },
        user: { color: "bg-brand-600", loginPath: "/auth/user/login" },
    }[portal] || { color: "bg-brand-600", loginPath: "/auth/user/login" };

    const getPasswordStrength = (pwd: string) => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return ["Weak", "Fair", "Strong", "Very Strong"][score - 1] || "";
    };

    const strengthLabel = getPasswordStrength(newPassword);
    const strengthColor = { Weak: "text-danger", Fair: "text-warning", Strong: "text-info", "Very Strong": "text-success" }[strengthLabel] || "";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) return;
        setIsLoading(true);
        try {
            await resetPassword(token || "", newPassword);
            setIsSuccess(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <AuthLayout portalName="Reset Password" portalDescription="Create a new password." portalIcon={Shield} panelColor={portalConfig.color}>
                <div className="text-center space-y-4">
                    <AlertTriangle className="mx-auto h-12 w-12 text-warning" />
                    <h1 className="text-2xl font-bold text-foreground">Invalid Reset Link</h1>
                    <p className="text-sm text-muted-foreground">This reset link has expired or is invalid.</p>
                    <Link href={portalConfig.loginPath}><Button variant="outline">Request a new one →</Button></Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout portalName="Reset Password" portalDescription="Create a new password." portalIcon={Shield} panelColor={portalConfig.color}>
            <div className="space-y-6">
                {isSuccess ? (
                    <div className="text-center space-y-4">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10"><CheckCircle className="h-8 w-8 text-success" /></div>
                        <h1 className="text-2xl font-bold text-foreground">Password Updated</h1>
                        <p className="text-sm text-muted-foreground">Your password has been successfully updated.</p>
                        <Link href={portalConfig.loginPath}><Button className="mt-4">Sign In →</Button></Link>
                    </div>
                ) : (
                    <>
                        <div><h1 className="text-2xl font-bold text-foreground">Create New Password</h1></div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <div className="relative">
                                    <Input id="new-password" type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password visibility">
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {newPassword && <p className={`text-xs font-medium ${strengthColor}`}>Strength: {strengthLabel}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                {confirmPassword && newPassword !== confirmPassword && <p className="text-xs text-danger">Passwords do not match</p>}
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading || newPassword !== confirmPassword || !newPassword}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Update Password
                            </Button>
                        </form>
                    </>
                )}
            </div>
        </AuthLayout>
    );
}

function ResetPasswordFallback() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="space-y-4 w-full max-w-md px-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<ResetPasswordFallback />}>
            <ResetPasswordForm />
        </Suspense>
    );
}
