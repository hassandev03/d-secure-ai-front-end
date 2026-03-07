"use client";

import { Check, X, Users, Building2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const plans = [
    {
        key: "starter", name: "Starter", price: 499, annualPrice: 4990, perUser: 4.99, type: "Enterprise",
        features: ["Basic entity anonymization", "Up to 1,000 requests/month", "5 departments max", "Standard support", "30-day history"],
        excluded: ["No context-aware anonymization", "No file upload", "Limited models"],
    },
    {
        key: "professional", name: "Professional", price: 999, annualPrice: 9990, perUser: 3.99, type: "Enterprise", popular: true,
        features: ["Context-aware anonymization", "Up to 10,000 requests/month", "Unlimited departments", "All AI providers", "File upload support", "90-day history", "Priority support"],
        excluded: [],
    },
    {
        key: "enterprise", name: "Enterprise", price: 2499, annualPrice: 24990, perUser: 2.99, type: "Enterprise",
        features: ["Everything in Professional", "Up to 50,000 requests/month", "Custom anonymization rules", "API access", "Unlimited history", "Dedicated account manager", "Custom SLA"],
        excluded: [],
    },
];

const individualPlans = [
    { key: "FREE", name: "Free", price: 0, requests: 50, active: 180 },
    { key: "PRO", name: "Pro", price: 29, requests: 1000, active: 54 },
    { key: "MAX", name: "Max", price: 79, requests: 5000, active: 33 },
];

export default function SubscriptionsPage() {
    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title="Subscriptions & Plans"
                subtitle="Manage subscription tiers for organizations and professionals."
                breadcrumbs={[{ label: "Super Admin", href: "/sa/dashboard" }, { label: "Subscriptions" }]}
            />

            <Tabs defaultValue="enterprise">
                <TabsList>
                    <TabsTrigger value="enterprise" className="gap-2"><Building2 className="h-4 w-4" />Enterprise Plans</TabsTrigger>
                    <TabsTrigger value="individual" className="gap-2"><Users className="h-4 w-4" />Individual Plans</TabsTrigger>
                </TabsList>

                <TabsContent value="enterprise" className="mt-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {plans.map((plan) => (
                            <Card key={plan.key} className={plan.popular ? "border-brand-500 ring-1 ring-brand-500/20 relative" : ""}>
                                {plan.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600">Most Popular</Badge>}
                                <CardHeader>
                                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                                    <div className="mt-2">
                                        <span className="text-3xl font-extrabold">${plan.price.toLocaleString()}</span>
                                        <span className="text-muted-foreground">/mo</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">~${plan.perUser}/user · Annual: ${plan.annualPrice.toLocaleString()}/yr</p>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2.5">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{f}</li>
                                        ))}
                                        {plan.excluded.map((f) => (
                                            <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground"><X className="mt-0.5 h-4 w-4 shrink-0" />{f}</li>
                                        ))}
                                    </ul>
                                    <Button variant="outline" className="mt-6 w-full">Edit Plan</Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="individual" className="mt-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {individualPlans.map((plan) => (
                            <Card key={plan.key}>
                                <CardHeader>
                                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                                    <div className="mt-2">
                                        <span className="text-3xl font-extrabold">${plan.price}</span>
                                        <span className="text-muted-foreground">/mo</span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between text-sm mb-3">
                                        <span className="text-muted-foreground">Monthly Requests</span>
                                        <span className="font-semibold">{plan.requests.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm mb-6">
                                        <span className="text-muted-foreground">Active Subscribers</span>
                                        <Badge variant="secondary">{plan.active}</Badge>
                                    </div>
                                    <Button variant="outline" className="w-full">Edit Plan</Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
