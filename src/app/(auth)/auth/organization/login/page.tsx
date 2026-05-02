"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { login } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { getDashboardPath } from "@/lib/utils";

export default function OrganizationLoginPage() {
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
            if (result.refreshToken && typeof window !== 'undefined') {
                localStorage.setItem('refresh_token', result.refreshToken);
            }
            if (result.requires2FA) {
                setPendingUser(result.user, result.token);
                router.push("/auth/organization/verify-2fa");
            } else {
                // Guard: only allow ORG_ADMIN, DEPT_ADMIN, and ORG_EMPLOYEE into this portal
                const orgRoles = ['ORG_ADMIN', 'DEPT_ADMIN', 'ORG_EMPLOYEE'];
                if (!orgRoles.includes(result.user.role)) {
                    toast.error(
                        `Access denied. This portal is for Organization users only. Your role (${result.user.role?.replace(/_/g, ' ')}) should log in from a different portal.`,
                        { duration: 6000 }
                    );
                    setIsLoading(false);
                    return;
                }
                setUser(result.user, result.token);
                router.push(getDashboardPath(result.user.role));
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            portalName="Organization Portal"
            portalDescription="Manage your team's secure AI access."
            portalIcon={Building2}
            panelColor="bg-brand-800"
        >
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Organization Sign In
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        For Organization Admins and Department Admins
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="admin@yourcompany.com"
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
                                Remember me
                            </Label>
                        </div>
                        <Link
                            href="/auth/organization/forgot-password"
                            className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                            Forgot Password?
                        </Link>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-brand-700 hover:bg-brand-800"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Sign In
                    </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                    Your organization must be registered by a Super Admin.{" "}
                    <a
                        href="mailto:admin@dsecureai.com"
                        className="font-medium text-brand-600 hover:text-brand-700"
                    >
                        Contact us →
                    </a>
                </p>
            </div>
        </AuthLayout>
    );
}
