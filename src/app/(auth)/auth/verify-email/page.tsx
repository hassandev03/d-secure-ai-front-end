"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Loader2, CheckCircle2, XCircle } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import { verifyEmail } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const setCredentials = useAuthStore((state) => state.setUser);

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifying your email address...");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid verification link.");
            return;
        }

        let isMounted = true;

        const verify = async () => {
            try {
                // Wait briefly for UI to render loading state nicely
                await new Promise((r) => setTimeout(r, 1000));
                
                // token is passed directly as a string, not as an object wrapped in { token }
                const response = await verifyEmail(token);
                if (isMounted) {
                    setStatus("success");
                    setMessage("Your email has been successfully verified.");
                    toast.success("Email verified!");
                    
                    // We update the user object in store manually since their email is verified now
                    // Note: Auth token is preserved
                    const currentToken = useAuthStore.getState().token;
                    const currentUser = useAuthStore.getState().user;
                    if (currentToken && currentUser) {
                        setCredentials({ ...currentUser, emailVerifiedAt: new Date().toISOString() }, currentToken);
                        
                        // Automatically redirect to the dashboard or registration step
                        setTimeout(() => {
                            router.push("/dashboard");
                        }, 2000);
                    } else {
                        // If there is no active session, send to login
                        setTimeout(() => {
                            router.push("/auth/user/login");
                        }, 2000);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setStatus("error");
                    setMessage(err instanceof Error ? err.message : "Failed to verify email. The link might be expired.");
                }
            }
        };

        verify();

        return () => {
            isMounted = false;
        };
    }, [token, router, setCredentials]);

    return (
        <div className="flex flex-col items-center justify-center space-y-6 py-10 text-center">
            {status === "loading" && (
                <>
                    <Loader2 className="h-16 w-16 animate-spin text-brand-600" />
                    <h2 className="text-xl font-semibold text-foreground">Verifying...</h2>
                    <p className="text-sm text-muted-foreground">{message}</p>
                </>
            )}
            
            {status === "success" && (
                <>
                    <div className="rounded-full bg-success/10 p-3">
                        <CheckCircle2 className="h-12 w-12 text-success" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Success!</h2>
                    <p className="text-sm text-muted-foreground">{message}</p>
                    <p className="text-sm text-muted-foreground">Redirecting you in a moment...</p>
                    <Button onClick={() => router.push("/dashboard")} className="mt-4 bg-brand-600 hover:bg-brand-700">
                        Go to Dashboard
                    </Button>
                </>
            )}

            {status === "error" && (
                <>
                    <div className="rounded-full bg-danger/10 p-3">
                        <XCircle className="h-12 w-12 text-danger" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Verification Failed</h2>
                    <p className="text-sm text-muted-foreground">{message}</p>
                    <Link href="/auth/user/login" className="mt-4">
                        <Button variant="outline">Back to Login</Button>
                    </Link>
                </>
            )}
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <AuthLayout
            portalName="Email Verification"
            portalDescription="Secure your D-SecureAI account."
            portalIcon={Sparkles}
            panelColor="bg-brand-500"
        >
            <Suspense fallback={<div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>}>
                <VerifyEmailContent />
            </Suspense>
        </AuthLayout>
    );
}