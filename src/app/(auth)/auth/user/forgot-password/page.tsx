"use client";

import { useState } from "react";
import { User as UserIcon, Loader2, CheckCircle, Mail } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/services/auth.service";
import Link from "next/link";

export default function UserForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try { await requestPasswordReset(email); setIsSuccess(true); } finally { setIsLoading(false); }
    };

    return (
        <AuthLayout portalName="Professional & Employee Portal" portalDescription="Secure AI, built around your privacy." portalIcon={UserIcon} panelColor="bg-brand-600">
            <div className="space-y-6">
                {isSuccess ? (
                    <div className="text-center space-y-4">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10"><CheckCircle className="h-8 w-8 text-success" /></div>
                        <h1 className="text-2xl font-bold text-foreground">Check your inbox</h1>
                        <p className="text-sm text-muted-foreground">If an account exists for <strong>{email}</strong>, a reset link has been sent. The link expires in 30 minutes.</p>
                        <Link href="/auth/user/login"><Button variant="outline" className="mt-4">← Back to Sign In</Button></Link>
                    </div>
                ) : (
                    <>
                        <div><h1 className="text-2xl font-bold text-foreground">Reset Your Password</h1><p className="mt-1 text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset link.</p></div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                            <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}Send Reset Link</Button>
                        </form>
                        <Link href="/auth/user/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">← Back to Sign In</Link>
                    </>
                )}
            </div>
        </AuthLayout>
    );
}
