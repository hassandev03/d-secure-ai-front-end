"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";
import OTPInput from "@/components/auth/OTPInput";
import { Button } from "@/components/ui/button";
import { verify2FA } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { getDashboardPath } from "@/lib/utils";
import Link from "next/link";

export default function SuperAdminVerify2FAPage() {
    const router = useRouter();
    const { pendingUser, confirmAuth } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    const handleComplete = async (code: string) => {
        setIsLoading(true);
        try {
            await verify2FA({ code });
            confirmAuth();
            toast.success("Authentication successful!");
            router.push(pendingUser ? getDashboardPath(pendingUser.role) : "/sa/dashboard");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Invalid code");
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
            <div className="space-y-6 text-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Two-Factor Authentication
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Enter the 6-digit code from your authenticator app.
                    </p>
                </div>

                <OTPInput onComplete={handleComplete} disabled={isLoading} />

                {isLoading && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying...
                    </div>
                )}

                <div className="space-y-2 text-sm">
                    <button className="text-brand-600 hover:text-brand-700 font-medium">
                        Use a backup code instead
                    </button>
                    <div>
                        <Link href="/auth/super-admin/login" className="text-muted-foreground hover:text-foreground">
                            ← Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
