"use client";

import { useState, useEffect } from "react";
import { Check, X, Zap, CreditCard, Lock, Plus, Trash2, AlertCircle, Crown, Shield, Calendar } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import QuotaGauge from "@/components/shared/QuotaGauge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/auth.store";
import {
    getSubscriptionPlans, getPaymentMethods, upgradePlan, downgradePlan,
    getSubscriptionSummary,
    type SubscriptionPlanDisplay, type PaymentMethod, type BSub,
} from "@/services/subscription.service";

function formatCardNumber(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
}

function FieldError({ error }: { error: string | null }) {
    if (!error) return null;
    return (
        <p className="flex items-center gap-1 text-xs text-danger mt-1">
            <AlertCircle className="h-3 w-3 shrink-0" />{error}
        </p>
    );
}

function luhnCheck(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length !== 16) return false;
    let sum = 0;
    let isEven = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits.charAt(i), 10);
        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        isEven = !isEven;
    }
    return sum % 10 === 0;
}

const currentYear = new Date().getFullYear();
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const YEARS  = Array.from({ length: 11 }, (_, i) => String(currentYear + i));

const PLAN_ICON: Record<string, React.ElementType> = {
    free:       Zap,
    FREE:       Zap,
    pro:        Shield,
    PRO:        Shield,
    enterprise: Crown,
    max:        Crown,
    MAX:        Crown,
};

const PLAN_GRADIENT: Record<string, string> = {
    free:       "from-slate-500 to-slate-600",
    FREE:       "from-slate-500 to-slate-600",
    pro:        "from-brand-500 to-brand-700",
    PRO:        "from-brand-500 to-brand-700",
    enterprise: "from-brand-600 to-indigo-700",
    max:        "from-brand-600 to-indigo-700",
    MAX:        "from-brand-600 to-indigo-700",
};

export default function SubscriptionPage() {
    const { user, updateUser } = useAuthStore();
    const [plansData,               setPlansData]               = useState<SubscriptionPlanDisplay[]>([]);
    // Always start from 'free' — we'll sync with the real DB value once loaded
    const [currentPlanKey,          setCurrentPlanKey]          = useState<string>('free');
    const [isPaymentModalOpen,      setIsPaymentModalOpen]      = useState(false);
    const [isAddCardModalOpen,      setIsAddCardModalOpen]      = useState(false);
    const [selectedPlanForUpgrade,  setSelectedPlanForUpgrade]  = useState<SubscriptionPlanDisplay | null>(null);
    const [isProcessing,            setIsProcessing]            = useState(false);

    const [isLoadingPlans, setIsLoadingPlans] = useState(true);
    const [savedCards, setSavedCards] = useState<PaymentMethod[]>([]);
    const [useNewCard, setUseNewCard] = useState(false);
    const [activeSub, setActiveSub] = useState<BSub | null>(null);
    const [quotaStats, setQuotaStats] = useState<{ percentageUsed: number; planName: string; periodEndsAt: string } | null>(null);

    const [cardName,      setCardName]      = useState(user?.name || "");
    const [newCardNumber, setNewCardNumber] = useState("");
    const [expiryMonth,   setExpiryMonth]   = useState("");
    const [expiryYear,    setExpiryYear]    = useState("");
    const [cvv,           setCvv]           = useState("");
    const [address,       setAddress]       = useState("");
    const [cardErrors,    setCardErrors]    = useState<Record<string, string | null>>({});

    useEffect(() => {
        const controller = new AbortController();
        setIsLoadingPlans(true);
        // Load plans and summary in parallel. getSubscriptionPlans() handles all
        // the plan-mapping and fallback logic — no need to duplicate it here.
        Promise.all([
            getSubscriptionSummary(controller.signal),
            getSubscriptionPlans(controller.signal),
            getPaymentMethods(),
        ]).then(([summary, plans, cards]) => {
            if (controller.signal.aborted) return;
            if (summary) {
                // Plans are already mapped correctly by the service layer.
                setPlansData(plans);
                setActiveSub(summary.subscription);

                // Derive plan key from subscription
                if (summary.subscription) {
                    let matchedPlan = summary.subscription.plan_key
                        ? plans.find((p) => p.key === summary.subscription!.plan_key)
                        : null;
                    if (!matchedPlan && summary.subscription.plan_id) {
                        matchedPlan = plans.find(
                            (p) => p.planId && p.planId.toLowerCase() === summary.subscription!.plan_id.toLowerCase()
                        ) ?? null;
                    }
                    if (!matchedPlan && summary.quota?.plan_name) {
                        const normalizedStatName = summary.quota.plan_name.toLowerCase().replace(/\s*\(default\)/i, '').trim();
                        matchedPlan = plans.find(
                            (p) => p.name.toLowerCase() === normalizedStatName || p.key.toLowerCase() === normalizedStatName
                        ) ?? null;
                    }
                    if (matchedPlan) {
                        setCurrentPlanKey(matchedPlan.key);
                        updateUser({ subscriptionTier: matchedPlan.key.toUpperCase() as any });
                    }
                } else {
                    setCurrentPlanKey('free');
                    updateUser({ subscriptionTier: 'FREE' });
                }

                // Feed quota info for the QuotaGauge
                if (summary.quota) {
                    setQuotaStats({
                        percentageUsed: summary.quota.percentage_used,
                        planName: summary.quota.plan_name,
                        periodEndsAt: summary.quota.period_ends_at,
                    });
                }
            } else {
                // summary failed — still show the plans
                setPlansData(plans);
            }
            setSavedCards(cards);
            setIsLoadingPlans(false);
        });
        return () => controller.abort();
    }, []);

    // Format next billing date from real subscription
    const nextBillingDate = activeSub?.current_period_end
        ? new Date(activeSub.current_period_end).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
        : null;

    const activePlan = plansData.find((p) => p.key === currentPlanKey) ?? plansData[0];

    // Show a loading skeleton while plans are being fetched
    if (isLoadingPlans) {
        return (
            <div className="mx-auto max-w-5xl space-y-6">
                <PageHeader
                    title="Subscription"
                    subtitle="Manage your plan and usage."
                    breadcrumbs={[{ label: "User", href: "/dashboard" }, { label: "Subscription" }]}
                />
                <div className="h-40 rounded-xl bg-muted animate-pulse" />
                <div className="grid gap-6 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />)}
                </div>
            </div>
        );
    }

    // Only individual (PROFESSIONAL) users and Super Admins manage their own subscriptions.
    // Org employees / dept admins are billed through their organization.
    const INDIVIDUAL_ROLES = ["PROFESSIONAL", "SUPER_ADMIN"];
    if (user?.role && !INDIVIDUAL_ROLES.includes(user.role)) {
        return (
            <div className="mx-auto max-w-5xl">
                <PageHeader
                    title="Subscription"
                    subtitle="Manage your plan and usage."
                    breadcrumbs={[{ label: "User", href: "/dashboard" }, { label: "Subscription" }]}
                />
                <Card className="mt-8 text-center p-12">
                    <CardHeader><CardTitle className="text-xl">Organization Billing</CardTitle></CardHeader>
                    <CardContent className="text-muted-foreground">
                        Your subscription and billing are managed centrally by your organization. Please contact your organization administrator for any upgrades or billing inquiries.
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!activePlan) return null;

    const resetCardForm = () => {
        setCardName(user?.name || "");
        setNewCardNumber(""); setExpiryMonth(""); setExpiryYear(""); setCvv(""); setAddress(""); setCardErrors({});
    };

    const validateCardForm = (): boolean => {
        const digits = newCardNumber.replace(/\D/g, "");
        const isCardValid = luhnCheck(newCardNumber);
        const errs: Record<string, string | null> = {
            cardName:    !cardName.trim()     ? "Name on card is required." : null,
            cardNumber:  !isCardValid ? "Invalid card number." : null,
            expiryMonth: !expiryMonth         ? "Select a month." : null,
            expiryYear:  !expiryYear          ? "Select a year." : null,
            cvv:         !/^\d{3,4}$/.test(cvv) ? "CVV must be 3 or 4 digits." : null,
            address:     !address.trim()      ? "Billing address is required." : null,
        };
        setCardErrors(errs);
        return !Object.values(errs).some((e) => e !== null);
    };

    const handleUpgradeClick = (plan: SubscriptionPlanDisplay) => {
        setSelectedPlanForUpgrade(plan);
        setUseNewCard(savedCards.length === 0);
        resetCardForm();
        setIsPaymentModalOpen(true);
    };

    const handleDowngradeClick = async (planKey: string) => {
        toast.info("Downgrade scheduled for end of billing cycle.");
        try {
            // Pass activeSub?.subscription_id to skip the redundant GET /subscriptions/me
            // inside downgradePlan — the page already holds it in state.
            await downgradePlan(planKey, activeSub?.subscription_id);
            setCurrentPlanKey(planKey);
            updateUser({ subscriptionTier: planKey.toUpperCase() as any });
            toast.success(`Successfully downgraded to the ${plansData.find((p) => p.key === planKey)?.name} plan.`);
        } catch (err: any) {
            const msg = err?.response?.data?.detail ?? "Failed to process downgrade. Please try again.";
            toast.error(msg);
        }
    };

    const handleDeleteCard = (id: string) => {
        setSavedCards((prev) => prev.filter((c) => c.id !== id));
        toast.success("Payment method removed.");
    };

    const createCardFromForm = (): PaymentMethod => {
        const digits = newCardNumber.replace(/\D/g, "");
        return { id: `card-${Date.now()}`, last4: digits.slice(-4), brand: "Mastercard", expiryMonth: parseInt(expiryMonth), expiryYear: parseInt(expiryYear), isDefault: true };
    };

    const handleAddCardSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateCardForm()) return;
        setSavedCards((prev) => [...prev.map((c) => ({ ...c, isDefault: false })), createCardFromForm()]);
        resetCardForm();
        setIsAddCardModalOpen(false);
        toast.success("Payment method added.");
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((useNewCard || savedCards.length === 0) && !validateCardForm()) return;
        setIsProcessing(true);
        try {
            // Pass activeSub?.subscription_id to avoid a redundant GET /subscriptions/me
            await upgradePlan(selectedPlanForUpgrade!.key, activeSub?.subscription_id);
            setIsPaymentModalOpen(false);
            if (useNewCard || savedCards.length === 0) {
                setSavedCards((prev) => [...prev.map((c) => ({ ...c, isDefault: false })), createCardFromForm()]);
                resetCardForm();
            }
            setCurrentPlanKey(selectedPlanForUpgrade!.key);
            updateUser({ subscriptionTier: selectedPlanForUpgrade!.key.toUpperCase() as any });
            toast.success(`Successfully upgraded to the ${selectedPlanForUpgrade!.name} Plan!`);
        } catch (err: any) {
            const msg = err?.response?.data?.detail ?? "Payment failed. Please try again.";
            toast.error(msg);
        } finally {
            setIsProcessing(false);
        }
    };

    const renderCardFormFields = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
                <Label htmlFor="card-name">Name on Card <span className="text-danger">*</span></Label>
                <Input id="card-name" value={cardName} onChange={(e) => { setCardName(e.target.value); setCardErrors((p) => ({ ...p, cardName: null })); }} className={cardErrors.cardName ? "border-danger" : ""} />
                <FieldError error={cardErrors.cardName ?? null} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="card-number">Card Number <span className="text-danger">*</span></Label>
                <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="card-number" placeholder="0000 0000 0000 0000" className={`pl-9 ${cardErrors.cardNumber ? "border-danger" : ""}`} value={newCardNumber} onChange={(e) => { setNewCardNumber(formatCardNumber(e.target.value)); setCardErrors((p) => ({ ...p, cardNumber: null })); }} maxLength={19} inputMode="numeric" />
                </div>
                <FieldError error={cardErrors.cardNumber ?? null} />
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                    <Label>Month <span className="text-danger">*</span></Label>
                    <Select value={expiryMonth} onValueChange={(v) => { setExpiryMonth(v); setCardErrors((p) => ({ ...p, expiryMonth: null })); }}>
                        <SelectTrigger className={cardErrors.expiryMonth ? "border-danger" : ""}><SelectValue placeholder="MM" /></SelectTrigger>
                        <SelectContent>{MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                    <FieldError error={cardErrors.expiryMonth ?? null} />
                </div>
                <div className="space-y-2">
                    <Label>Year <span className="text-danger">*</span></Label>
                    <Select value={expiryYear} onValueChange={(v) => { setExpiryYear(v); setCardErrors((p) => ({ ...p, expiryYear: null })); }}>
                        <SelectTrigger className={cardErrors.expiryYear ? "border-danger" : ""}><SelectValue placeholder="YYYY" /></SelectTrigger>
                        <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                    <FieldError error={cardErrors.expiryYear ?? null} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="cvv-input">CVV <span className="text-danger">*</span></Label>
                    <Input
                        id="cvv-input"
                        placeholder="123"
                        type="text"
                        inputMode="numeric"
                        value={cvv}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setCvv(val);
                            setCardErrors((p) => ({ ...p, cvv: null }));
                        }}
                        maxLength={4}
                        autoComplete="cc-csc"
                        className={cardErrors.cvv ? "border-danger" : ""}
                    />
                    <FieldError error={cardErrors.cvv ?? null} />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Billing Address <span className="text-danger">*</span></Label>
                <Input placeholder="123 Main St, City, Country" value={address} onChange={(e) => { setAddress(e.target.value); setCardErrors((p) => ({ ...p, address: null })); }} className={cardErrors.address ? "border-danger" : ""} />
                <FieldError error={cardErrors.address ?? null} />
            </div>
        </div>
    );

    const PlanIcon = PLAN_ICON[currentPlanKey] ?? Zap;
    const planGradient = PLAN_GRADIENT[currentPlanKey] ?? PLAN_GRADIENT.FREE;

    return (
        <div className="mx-auto max-w-5xl">
            <PageHeader
                title="Subscription"
                subtitle="Manage your plan and usage."
                breadcrumbs={[{ label: "User", href: "/dashboard" }, { label: "Subscription" }]}
            />

            {/* Current plan hero card */}
            <Card className="mb-6 overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${planGradient}`} />
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${planGradient} text-white shadow-md`}>
                            <PlanIcon className="h-7 w-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold">Current Plan: {activePlan.name}</h3>
                                <Badge className="bg-brand-600">Active</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">${activePlan.price}/month · renews automatically</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-2xl font-extrabold">${activePlan.price}</p>
                            <p className="text-xs text-muted-foreground">/month</p>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-center py-2">
                        <QuotaGauge
                            percentageUsed={quotaStats?.percentageUsed ?? 0}
                            planName={activePlan.name}
                            renewsAt={quotaStats?.periodEndsAt || nextBillingDate || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()}
                            size="md"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Plans */}
            <div className="grid gap-6 lg:grid-cols-3 mb-8">
                {plansData.map((plan) => {
                    const isCurrent = plan.key === currentPlanKey;
                    const isUpgrade = plan.price > (activePlan?.price || 0);
                    const PIcon = PLAN_ICON[plan.key] ?? Zap;
                    const pg = PLAN_GRADIENT[plan.key] ?? PLAN_GRADIENT.FREE;

                    return (
                        <Card key={plan.key} className={`relative overflow-hidden flex flex-col transition-shadow hover:shadow-md ${isCurrent ? "border-brand-500 ring-1 ring-brand-500/20" : ""}`}>
                            {isCurrent && <div className={`h-1.5 bg-gradient-to-r ${pg} absolute top-0 inset-x-0`} />}
                            {isCurrent && <Badge className="absolute top-4 left-1/2 -translate-x-1/2 bg-brand-600 whitespace-nowrap">Current Plan</Badge>}
                            <CardHeader className="pt-8 pb-2">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${pg} text-white mb-3`}>
                                    <PIcon className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-xl">{plan.name}</CardTitle>
                                <div className="mt-2">
                                    <span className="text-3xl font-extrabold">${plan.price}</span>
                                    <span className="text-muted-foreground">/mo</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-2.5 mb-6">
                                    {plan.features.map((f) => (
                                        <li key={f.text} className={`flex items-start gap-2 text-sm ${!f.included ? "text-muted-foreground" : ""}`}>
                                            {f.included ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <X className="mt-0.5 h-4 w-4 shrink-0" />}
                                            {f.text}
                                        </li>
                                    ))}
                                </ul>
                                {isCurrent ? (
                                    <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                                ) : isUpgrade ? (
                                    <Button className={`w-full bg-gradient-to-r ${pg} hover:opacity-90 text-white border-0`} onClick={() => handleUpgradeClick(plan)}>
                                        <Zap className="mr-2 h-4 w-4" />Upgrade
                                    </Button>
                                ) : (
                                    <Button variant="outline" className="w-full" onClick={() => handleDowngradeClick(plan.key)}>Downgrade</Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Separator className="my-2" />

            {/* Payment Methods */}
            <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Payment Methods</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => { resetCardForm(); setIsAddCardModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Add Card
                    </Button>
                </CardHeader>
                <CardContent>
                    {savedCards.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No payment methods saved.</p>
                    ) : (
                        <div className="space-y-3">
                            {savedCards.map((card) => (
                                <div key={card.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border">
                                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium flex items-center gap-2">
                                                {card.brand} •••• {card.last4}
                                                {card.isDefault && <Badge variant="secondary" className="font-normal text-[10px] py-0 border-transparent bg-brand-100 text-brand-700">Default</Badge>}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Expires {String(card.expiryMonth).padStart(2, "0")}/{card.expiryYear}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger hover:bg-danger/10" onClick={() => handleDeleteCard(card.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-border">
                        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> Next Billing Date</span>
                                <Badge variant="outline" className="font-semibold">
                                    {nextBillingDate ?? "—"}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Billing Email</span>
                                <span className="font-medium">{user?.email || "—"}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Payment modal */}
            <Dialog open={isPaymentModalOpen} onOpenChange={(open) => { setIsPaymentModalOpen(open); if (!open) resetCardForm(); }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Upgrade to {selectedPlanForUpgrade?.name}</DialogTitle>
                        <DialogDescription>You will be charged ${selectedPlanForUpgrade?.price}/month starting today.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePaymentSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="rounded-lg bg-muted/50 p-3 flex justify-between items-center border border-border">
                                <span className="font-semibold text-sm">Total Due Today</span>
                                <span className="font-bold text-lg">${selectedPlanForUpgrade?.price}.00</span>
                            </div>

                            {savedCards.length > 0 && (
                                <div className="space-y-3 mb-4">
                                    <Label>Payment Method</Label>
                                    <div className="grid gap-2">
                                        <div className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-colors ${!useNewCard ? "border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/20" : "border-border hover:bg-muted/50"}`} onClick={() => setUseNewCard(false)}>
                                            <div className="flex items-center gap-3">
                                                <CreditCard className={`h-5 w-5 ${!useNewCard ? "text-brand-600" : "text-muted-foreground"}`} />
                                                <div className="text-sm">
                                                    <p className="font-medium">{savedCards.find((c) => c.isDefault)?.brand || savedCards[0].brand} •••• {savedCards.find((c) => c.isDefault)?.last4 || savedCards[0].last4}</p>
                                                    <p className="text-xs text-muted-foreground">Default Card</p>
                                                </div>
                                            </div>
                                            {!useNewCard && <Check className="h-4 w-4 text-brand-600" />}
                                        </div>
                                        <div className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-colors ${useNewCard ? "border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/20" : "border-border hover:bg-muted/50"}`} onClick={() => setUseNewCard(true)}>
                                            <div className="flex items-center gap-3">
                                                <Plus className={`h-5 w-5 ${useNewCard ? "text-brand-600" : "text-muted-foreground"}`} />
                                                <span className="text-sm font-medium">Use a new payment method</span>
                                            </div>
                                            {useNewCard && <Check className="h-4 w-4 text-brand-600" />}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(useNewCard || savedCards.length === 0) && renderCardFormFields()}
                        </div>
                        <DialogFooter className="flex-col gap-2 sm:flex-col sm:gap-2">
                            <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 h-10" disabled={isProcessing}>
                                {isProcessing ? "Processing…" : `Pay $${selectedPlanForUpgrade?.price}.00 & Subscribe`}
                            </Button>
                            <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center pt-2">
                                <Lock className="h-3 w-3 mr-1" /> Payments are secure and encrypted.
                            </p>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Card modal */}
            <Dialog open={isAddCardModalOpen} onOpenChange={(open) => { setIsAddCardModalOpen(open); if (!open) resetCardForm(); }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Payment Method</DialogTitle>
                        <DialogDescription>Enter your new card details. This will become your default payment method.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddCardSubmit}>
                        <div className="py-4">{renderCardFormFields()}</div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddCardModalOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-brand-600 hover:bg-brand-700">Save Payment Method</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
