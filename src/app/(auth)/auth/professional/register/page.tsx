"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Sparkles, Eye, EyeOff, Loader2, Mail, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";
import OTPInput from "@/components/auth/OTPInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { register, resendVerificationEmail, setup2FA, verify2FA, getCurrentUser } from "@/services/auth.service";



import { useAuthStore } from "@/store/auth.store";
import { INDUSTRIES, SUBSCRIPTION_PLANS } from "@/lib/constants";
import Link from "next/link";

const STEPS = ["Account Setup", "Your Profile", "Email Verification", "Set Up 2FA", "Choose Plan"];

export default function ProfessionalRegisterPage() {
    const router = useRouter();
    const { setUser } = useAuthStore();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // 2FA state
    const [qrUri, setQrUri] = useState("");
    const [isVerifying2FA, setIsVerifying2FA] = useState(false);

    useEffect(() => {
        if (step === 4) {
            setup2FA().then(data => {
                setQrUri(data.provisioningUri);
            }).catch(() => {
                toast.error("Failed to initialize 2FA setup");
            });
        }
    }, [step]);


    // Step 1 fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Step 2 fields
    const [jobTitle, setJobTitle] = useState("");
    const [industry, setIndustry] = useState("");
    const [country, setCountry] = useState("");

    const getPasswordStrength = (pwd: string) => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return ["Weak", "Fair", "Strong", "Very Strong"][score - 1] || "";
    };
    const strengthLabel = getPasswordStrength(password);
    const strengthColor: Record<string, string> = { Weak: "bg-danger", Fair: "bg-warning", Strong: "bg-info", "Very Strong": "bg-success" };
    const strengthWidth: Record<string, string> = { Weak: "w-1/4", Fair: "w-2/4", Strong: "w-3/4", "Very Strong": "w-full" };

    const handleRegister = async () => {
        setIsLoading(true);
        try {
            const result = await register({ name, email, password, jobTitle, industry, country });
            setUser(result.user, result.token);
            toast.success("Account created! Please verify your email.");
            setStep(3);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlanSelection = async (planKey: string) => {
        // Here you would typically link to a Stripe checkout or create a subscription
        toast.success("Welcome to D-SecureAI!");
        router.push("/dashboard");
    };

    return (
        <AuthLayout
            portalName="Join D-SecureAI"
            portalDescription="Private AI access starts here."
            portalIcon={Sparkles}
            panelColor="bg-brand-500"
        >
            <div className="space-y-6">
                {/* Step indicator */}
                <div className="flex items-center justify-between mb-2">
                    {STEPS.map((label, i) => (
                        <div key={label} className="flex items-center">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i + 1 < step ? "bg-success text-white" : i + 1 === step ? "bg-brand-600 text-white" : "bg-muted text-muted-foreground"
                                }`}>
                                {i + 1 < step ? <Check className="h-4 w-4" /> : i + 1}
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`hidden sm:block h-0.5 w-6 mx-1 ${i + 1 < step ? "bg-success" : "bg-muted"}`} />
                            )}
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">Step {step} of {STEPS.length} — {STEPS[step - 1]}</p>

                {/* Step 1: Account Setup */}
                {step === 1 && (
                    <div className="space-y-4">
                        <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {password && (
                                <div className="space-y-1">
                                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full transition-all ${strengthColor[strengthLabel] || ""} ${strengthWidth[strengthLabel] || ""}`} /></div>
                                    <p className="text-xs text-muted-foreground">Strength: {strengthLabel}</p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm">Confirm Password</Label>
                            <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                            {confirmPassword && password !== confirmPassword && <p className="text-xs text-danger">Passwords do not match</p>}
                        </div>
                        <p className="text-xs text-muted-foreground">By creating an account, you agree to our <a href="#" className="text-brand-600 hover:underline">Terms of Service</a> and <a href="#" className="text-brand-600 hover:underline">Privacy Policy</a>.</p>
                        <Button className="w-full bg-brand-600 hover:bg-brand-700" onClick={() => setStep(2)} disabled={!name || !email || !password || password !== confirmPassword}>
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Step 2: Profile */}
                {step === 2 && (
                    <div className="space-y-4">
                        <h1 className="text-2xl font-bold text-foreground">Your Profile</h1>
                        <div className="space-y-2">
                            <Label htmlFor="job">Job Title / Profession</Label>
                            <Input id="job" placeholder="Data Scientist" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="industry">Industry</Label>
                            <Select value={industry} onValueChange={setIndustry}>
                                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                                <SelectContent>{INDUSTRIES.map((ind) => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input id="country" placeholder="United States" value={country} onChange={(e) => setCountry(e.target.value)} />
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep(1)} className="flex-1"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                            <Button className="flex-1 bg-brand-600 hover:bg-brand-700" onClick={handleRegister} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Continue <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Email Verification */}
                {step === 3 && (
                    <div className="space-y-6 text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
                            <Mail className="h-10 w-10 text-brand-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Verify your email</h1>
                        <p className="text-sm text-muted-foreground">We&apos;ve sent a verification link to <strong>{email}</strong>.</p>
                        <Button variant="outline" size="sm" onClick={async () => {
                            try { await resendVerificationEmail(email); toast.success("Verification email resent."); }
                            catch { toast.error("Could not resend. Please try again."); }
                        }}>Resend email</Button>
                        <button onClick={() => setStep(2)} className="block mx-auto text-sm text-muted-foreground hover:text-foreground">Change email address</button>
                        <Button className="w-full bg-brand-600 hover:bg-brand-700" onClick={async () => {
                            const user = await getCurrentUser();
                            if (user?.emailVerifiedAt) {
                                setStep(4);
                            } else {
                                toast.error("Email not verified yet. Please check your inbox and click the link.");
                            }
                        }}>
                            I&apos;ve verified my email <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )}


                {/* Step 4: 2FA Setup */}
                {step === 4 && (
                    <div className="space-y-6">
                        <h1 className="text-2xl font-bold text-foreground text-center">Secure your account</h1>
                        <p className="text-sm text-muted-foreground text-center">Set up two-factor authentication with your authenticator app.</p>
                        <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/50 overflow-hidden bg-white">
                            {qrUri ? (
                                <QRCodeSVG value={qrUri} size={160} />
                            ) : (
                                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground text-center">Enter the 6-digit code to confirm setup:</p>
                        <OTPInput onComplete={async (code) => {
                            setIsVerifying2FA(true);
                            try {
                                await verify2FA({ code });
                                toast.success("2FA verified and enabled!");
                                setStep(5);
                            } catch {
                                toast.error("Invalid verification code. Please try again.");
                            } finally {
                                setIsVerifying2FA(false);
                            }
                        }} disabled={isVerifying2FA} />
                        {isVerifying2FA && <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-3 w-3 animate-spin"/> Verifying...</p>}
                        <button onClick={() => setStep(5)} className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">Skip for now</button>
                    </div>
                )}


                {/* Step 5: Choose Plan */}
                {step === 5 && (
                    <div className="space-y-6">
                        <h1 className="text-2xl font-bold text-foreground text-center">Pick a plan to get started</h1>
                        <div className="space-y-4">
                            {(Object.entries(SUBSCRIPTION_PLANS) as [string, typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS]][]).map(([key, plan]) => (
                                <div key={key} className={`rounded-xl border p-5 cursor-pointer transition-all hover:border-brand-300 ${key === "PRO" ? "border-brand-500 ring-1 ring-brand-500/20" : "border-border"}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-foreground">{plan.name}</h3>
                                            <p className="text-sm text-muted-foreground">{plan.creditBudget} budget</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-foreground">${plan.price}</span>
                                            <span className="text-sm text-muted-foreground">/mo</span>
                                        </div>
                                    </div>
                                    <Button
                                        className={`mt-3 w-full ${key === "FREE" ? "" : "bg-brand-600 hover:bg-brand-700"}`}
                                        variant={key === "FREE" ? "outline" : "default"}
                                        onClick={() => handlePlanSelection(key)}
                                        disabled={isLoading}
                                    >
                                        {key === "FREE" ? "Continue with Free" : `Start ${plan.name}`}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/auth/user/login" className="font-medium text-brand-600 hover:text-brand-700">Sign in →</Link>
                    </p>
                )}
            </div>
        </AuthLayout>
    );
}
