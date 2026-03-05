"use client";

import { Check, X, Zap } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import QuotaBar from "@/components/shared/QuotaBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const currentPlan = {
    name: "Pro",
    price: 29,
    quota: { used: 320, total: 1000 },
    renewsAt: "2026-01-01",
};

const plans = [
    {
        key: "FREE",
        name: "Free",
        price: 0,
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
        current: true,
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
                        <CardTitle className="text-base font-semibold">Current Plan: {currentPlan.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">${currentPlan.price}/month · Renews {currentPlan.renewsAt}</p>
                    </div>
                    <Badge className="bg-brand-600">Active</Badge>
                </CardHeader>
                <CardContent>
                    <QuotaBar used={currentPlan.quota.used} total={currentPlan.quota.total} label="Monthly AI Requests" />
                </CardContent>
            </Card>

            {/* Plans */}
            <div className="grid gap-6 lg:grid-cols-3">
                {plans.map((plan) => (
                    <Card key={plan.key} className={plan.current ? "border-brand-500 ring-1 ring-brand-500/20 relative" : ""}>
                        {plan.current && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600">Current Plan</Badge>}
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
                            {plan.current ? (
                                <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                            ) : plan.price > currentPlan.price ? (
                                <Button className="w-full bg-brand-700 hover:bg-brand-800"><Zap className="mr-2 h-4 w-4" />Upgrade</Button>
                            ) : (
                                <Button variant="outline" className="w-full">Downgrade</Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Separator className="my-8" />

            <Card>
                <CardHeader><CardTitle className="text-base">Billing Information</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Payment Method</span>
                        <span className="font-medium">Visa •••• 4242</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Next Billing Date</span>
                        <span className="font-medium">{currentPlan.renewsAt}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Billing Email</span>
                        <span className="font-medium">alex@freelance.com</span>
                    </div>
                    <div className="pt-2"><Button variant="outline" size="sm">Update Payment Method</Button></div>
                </CardContent>
            </Card>
        </div>
    );
}
