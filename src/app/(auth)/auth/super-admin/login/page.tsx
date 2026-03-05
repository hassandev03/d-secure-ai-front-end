"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { login } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

export default function SuperAdminLoginPage() {
    const router = useRouter();
    const { setPendingUser, setUser } = useAuthStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await login({ email, password, rememberMe });
            if (result.requires2FA) {
                setPendingUser(result.user, result.token);
                router.push("/auth/super-admin/verify-2fa");
            } else {
                setUser(result.user, result.token);
                router.push("/sa/dashboard");
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            portalName="Super Admin Portal"
            portalDescription="Full platform control."
            portalIcon={Crown}
            panelColor="bg-brand-950"
        >
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Super Admin Sign In
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Enter your credentials to access platform management.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="admin@dsecureai.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            aria-label="Email address"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                aria-label="Password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="remember"
                                checked={rememberMe}
                                onCheckedChange={(checked) => setRememberMe(checked === true)}
                            />
                            <Label htmlFor="remember" className="text-sm font-normal">
                                Remember this device
                            </Label>
                        </div>
                        <Link
                            href="/auth/super-admin/forgot-password"
                            className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                            Forgot Password?
                        </Link>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-brand-950 hover:bg-brand-900"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Sign In
                    </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                    Not a super admin?{" "}
                    <Link
                        href="/"
                        className="font-medium text-brand-600 hover:text-brand-700"
                    >
                        Return to portal selection →
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
