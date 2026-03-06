"use client";

import { useState } from "react";
import { Check, X, Zap, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import QuotaBar from "@/components/shared/QuotaBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const plansData = [
    {
        key: "FREE",
        name: "Free",
        price: 0,
        quotaTotal: 50,
        features: [
            { text: "50 AI requests/month", included: true },
            { text: "Basic PII anonymization", included: true },
            { text: "2 AI models", included: true },
            { text: "File uploads", included: false },
            { text: "Speech-to-text", included: false },
            { text: "Chat history (7 days)", included: true },
        ],
    },
    {
        key: "PRO",
        name: "Pro",
        price: 29,
        quotaTotal: 1000,
        features: [
            { text: "1,000 AI requests/month", included: true },
            { text: "Full context-aware anonymization", included: true },
            { text: "All AI providers", included: true },
            { text: "PDF + file upload support", included: true },
            { text: "Speech-to-text input", included: true },
            { text: "90-day chat history", included: true },
        ],
    },
    {
        key: "MAX",
        name: "Max",
        price: 79,
        quotaTotal: 5000,
        features: [
            { text: "5,000 AI requests/month", included: true },
            { text: "Everything in Pro", included: true },
            { text: "Extended context window", included: true },
            { text: "API access", included: true },
            { text: "Higher chat history limit", included: true },
            { text: "Early access to new features", included: true },
            { text: "Dedicated support", included: true },
        ],
    },
];

export default function SubscriptionPage() {
    const [currentPlanKey, setCurrentPlanKey] = useState("PRO");
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<typeof plansData[0] | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const activePlan = plansData.find(p => p.key === currentPlanKey)!;

    const handleUpgradeClick = (plan: typeof plansData[0]) => {
        setSelectedPlanForUpgrade(plan);
        setIsPaymentModalOpen(true);
    };

    const handleDowngradeClick = async (planKey: string) => {
        toast.info("Downgrade scheduled for the end of the billing cycle.");
        // We'll instantly change it here just to demonstrate interactivity for the mock
        setTimeout(() => {
            setCurrentPlanKey(planKey);
            toast.success(`Successfully downgraded to the ${plansData.find(p => p.key === planKey)?.name} plan.`);
        }, 800);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        // Simulate payment gateway delay
        await new Promise((r) => setTimeout(r, 1500));
        setIsProcessing(false);
        setIsPaymentModalOpen(false);
        setCurrentPlanKey(selectedPlanForUpgrade!.key);
        toast.success(`Successfully upgraded to the ${selectedPlanForUpgrade!.name} Plan!`);
    };

    return (
        <div className="mx-auto max-w-5xl">
            <PageHeader
                title="Subscription"
                subtitle="Manage your plan and usage."
                breadcrumbs={[{ label: "User", href: "/dashboard" }, { label: "Subscription" }]}
            />

            {/* Current plan */}
            <Card className="mb-6">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <div>
                        <CardTitle className="text-base font-semibold">Current Plan: {activePlan.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">${activePlan.price}/month · Renews 2026-04-01</p>
                    </div>
                    <Badge className="bg-brand-600">Active</Badge>
                </CardHeader>
                <CardContent>
                    <QuotaBar used={activePlan.key === "FREE" ? 15 : 320} total={activePlan.quotaTotal} label="Monthly AI Requests" />
                </CardContent>
            </Card>

            {/* Plans */}
            <div className="grid gap-6 lg:grid-cols-3">
                {plansData.map((plan) => {
                    const isCurrent = plan.key === currentPlanKey;
                    const isUpgrade = plan.price > activePlan.price;

                    return (
                        <Card key={plan.key} className={isCurrent ? "border-brand-500 ring-1 ring-brand-500/20 relative" : ""}>
                            {isCurrent && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600">Current Plan</Badge>}
                            <CardHeader>
                                <CardTitle className="text-xl">{plan.name}</CardTitle>
                                <div className="mt-2">
                                    <span className="text-3xl font-extrabold">${plan.price}</span>
                                    <span className="text-muted-foreground">/mo</span>
                                </div>
                            </CardHeader>
                            <CardContent>
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
                                    <Button className="w-full bg-brand-700 hover:bg-brand-800" onClick={() => handleUpgradeClick(plan)}>
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

            <Separator className="my-8" />

            <Card>
                <CardHeader><CardTitle className="text-base">Billing Information</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Payment Method</span>
                        <span className="font-medium flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" /> Visa •••• 4242</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Next Billing Date</span>
                        <span className="font-medium">2026-04-01</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Billing Email</span>
                        <span className="font-medium">alex@freelance.com</span>
                    </div>
                    <div className="pt-2"><Button variant="outline" size="sm">Update Payment Method</Button></div>
                </CardContent>
            </Card>

            {/* Payment Modal */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Upgrade to {selectedPlanForUpgrade?.name}</DialogTitle>
                        <DialogDescription>
                            You will be charged ${selectedPlanForUpgrade?.price}/month starting today.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePaymentSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="rounded-lg bg-muted/50 p-3 flex justify-between items-center border border-border">
                                <span className="font-semibold text-sm">Total Due Today</span>
                                <span className="font-bold text-lg">${selectedPlanForUpgrade?.price}.00</span>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Name on Card</Label>
                                <Input id="name" defaultValue="Alex Thompson" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="card">Card Information</Label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input id="card" placeholder="0000 0000 0000 0000" className="pl-9" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                                    <Input id="expiry" placeholder="12/28" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cvc">CVC</Label>
                                    <Input id="cvc" placeholder="123" required type="password" />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="flex-col gap-2 sm:flex-col sm:gap-2">
                            <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 h-10" disabled={isProcessing}>
                                {isProcessing ? "Processing..." : `Pay $${selectedPlanForUpgrade?.price}.00 & Subscribe`}
                            </Button>
                            <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center pt-2">
                                <Lock className="h-3 w-3 mr-1" /> Payments are secure and encrypted.
                            </p>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
