"use client";

import { useState } from "react";
import { Check, X, Users, Building2, Zap, Shield, Crown } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const plans = [
    {
        key: "starter", name: "Starter", price: 499, annualPrice: 399, perUser: 4.99, type: "Enterprise", icon: Zap,
        features: ["Basic entity anonymization", "Up to 1,000 requests/month", "5 departments max", "Standard support", "30-day history"],
        excluded: ["No context-aware anonymization", "No file upload", "Limited models"],
        color: "from-blue-500/10 to-blue-500/5", borderColor: "border-blue-200"
    },
    {
        key: "professional", name: "Professional", price: 999, annualPrice: 799, perUser: 3.99, type: "Enterprise", popular: true, icon: Shield,
        features: ["Context-aware anonymization", "Up to 10,000 requests/month", "Unlimited departments", "All AI providers", "File upload support", "90-day history", "Priority support"],
        excluded: [],
        color: "from-brand-500/20 to-brand-500/5", borderColor: "border-brand-500 ring-1 ring-brand-500/30"
    },
    {
        key: "enterprise", name: "Enterprise", price: 2499, annualPrice: 1999, perUser: 2.99, type: "Enterprise", icon: Crown,
        features: ["Everything in Professional", "Up to 50,000 requests/month", "Custom anonymization rules", "API access", "Unlimited history", "Dedicated account manager", "Custom SLA"],
        excluded: [],
        color: "from-emerald-500/10 to-emerald-500/5", borderColor: "border-emerald-200"
    },
];

const individualPlans = [
    { key: "FREE", name: "Free", price: 0, annualPrice: 0, requests: 50, active: 180, icon: Zap },
    { key: "PRO", name: "Pro", price: 29, annualPrice: 24, requests: 1000, active: 54, icon: Shield, popular: true },
    { key: "MAX", name: "Max", price: 79, annualPrice: 69, requests: 5000, active: 33, icon: Crown },
];

export default function SubscriptionsPage() {
    const [isAnnual, setIsAnnual] = useState(false);

    return (
        <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                <PageHeader
                    title="Subscriptions & Plans"
                    subtitle="Manage and configure subscription tiers for organizations and professionals."
                    breadcrumbs={[{ label: "Super Admin", href: "/sa/dashboard" }, { label: "Subscriptions" }]}
                />
            </div>

            <Tabs defaultValue="enterprise" className="w-full">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <TabsList className="bg-muted/50 p-1 w-full sm:w-auto h-auto">
                        <TabsTrigger value="enterprise" className="gap-2 py-2.5 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Building2 className="h-4 w-4" />
                            Enterprise Plans
                        </TabsTrigger>
                        <TabsTrigger value="individual" className="gap-2 py-2.5 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Users className="h-4 w-4" />
                            Individual Plans
                        </TabsTrigger>
                    </TabsList>

                    {/* Pricing Toggle */}
                    <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-full border border-border shadow-sm">
                        <Label htmlFor="billing-toggle" className={`text-sm font-semibold cursor-pointer ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</Label>
                        <Switch 
                            id="billing-toggle" 
                            checked={isAnnual} 
                            onCheckedChange={setIsAnnual}
                            className="data-[state=checked]:bg-brand-600"
                        />
                        <Label htmlFor="billing-toggle" className={`text-sm font-semibold cursor-pointer flex items-center gap-1.5 ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                            Annually <Badge className="bg-success text-success-foreground hover:bg-success h-5 px-1.5 text-[10px] rounded-sm">SAVE 20%</Badge>
                        </Label>
                    </div>
                </div>

                <TabsContent value="enterprise" className="mt-0">
                    <div className="grid gap-8 lg:grid-cols-3">
                        {plans.map((plan) => (
                            <Card key={plan.key} className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col ${plan.borderColor} ${plan.popular ? 'scale-[1.02] shadow-md z-10' : ''}`}>
                                {plan.popular && (
                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-400 to-indigo-500" />
                                )}
                                <div className={`absolute inset-0 bg-gradient-to-b ${plan.color} opacity-40`} />
                                
                                {plan.popular && (
                                    <Badge className="absolute top-4 right-4 bg-gradient-to-r from-brand-600 to-indigo-600 shadow-sm border-0">
                                        Most Popular
                                    </Badge>
                                )}
                                
                                <CardHeader className="relative pb-4 pt-8">
                                    <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${plan.popular ? 'bg-brand-100 text-brand-600' : 'bg-muted text-muted-foreground'}`}>
                                        <plan.icon className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                    <div className="mt-4 flex items-baseline text-5xl font-extrabold">
                                        ${isAnnual ? plan.annualPrice.toLocaleString() : plan.price.toLocaleString()}
                                        <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground font-medium flex justify-between">
                                        <span>~${plan.perUser}/user</span>
                                        {isAnnual && <span className="text-success">Billed annually</span>}
                                    </p>
                                </CardHeader>
                                
                                <CardContent className="relative flex-1">
                                    <div className="font-semibold mb-4 text-sm text-foreground/80">FEATURES EXCLUDED IN THIS PLAN</div>
                                    <ul className="space-y-3 mb-6">
                                        {plan.excluded.map((f) => (
                                            <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground/70">
                                                <X className="h-5 w-5 shrink-0" />
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="font-semibold mb-4 text-sm text-foreground/80">INCLUDED FEATURES</div>
                                    <ul className="space-y-3">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-start gap-3 text-sm font-medium">
                                                <div className={`mt-0.5 rounded-full p-0.5 ${plan.popular ? 'bg-brand-100 text-brand-600' : 'bg-success/20 text-success'}`}>
                                                    <Check className="h-3 w-3 shrink-0" />
                                                </div>
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                
                                <CardFooter className="relative pt-6">
                                    <Button className={`w-full py-6 text-sm font-semibold shadow-sm ${plan.popular ? 'bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'}`}>
                                        Manage {plan.name} Plan
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="individual" className="mt-0">
                    <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
                        {individualPlans.map((plan) => (
                            <Card key={plan.key} className={`relative overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col ${plan.popular ? 'border-brand-500 ring-1 ring-brand-500/20' : 'border-border/50'}`}>
                                {plan.popular && (
                                    <Badge className="absolute top-4 right-4 bg-brand-600 border-0">
                                        Recommended
                                    </Badge>
                                )}
                                
                                <CardHeader className="relative pb-4 pt-6 text-center">
                                    <div className="mx-auto w-10 h-10 rounded-full mb-3 flex items-center justify-center bg-muted">
                                        <plan.icon className={`h-5 w-5 ${plan.popular ? 'text-brand-600' : 'text-muted-foreground'}`} />
                                    </div>
                                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                                    <div className="mt-4 flex items-center justify-center baseline text-4xl font-extrabold">
                                        ${isAnnual ? plan.annualPrice : plan.price}
                                        <span className="ml-1 text-lg font-medium text-muted-foreground">/mo</span>
                                    </div>
                                </CardHeader>
                                
                                <CardContent className="relative flex-1 px-6">
                                    <div className="bg-muted/40 rounded-lg p-4 space-y-4 shadow-sm border border-border/50">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground font-medium">Monthly Requests</span>
                                            <span className="font-bold">{plan.requests.toLocaleString()}</span>
                                        </div>
                                        <div className="h-px bg-border/50 w-full" />
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground font-medium">Active Subscribers</span>
                                            <Badge variant="secondary" className="font-bold bg-background">{plan.active}</Badge>
                                        </div>
                                    </div>
                                    
                                    <Button className={`w-full mt-6 mb-2 ${plan.popular ? 'bg-brand-600 hover:bg-brand-700 text-white' : ''}`} variant={plan.popular ? "default" : "outline"}>
                                        Configure Tier
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
