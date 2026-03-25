"use client";

import { useState, useEffect } from "react";
import { Check, X, Users, Building2, Zap, Shield, Crown, CreditCard, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { getEnterprisePlans, getIndividualPlans } from "@/services/sa.service";
import type { SAEnterprisePlan, SAIndividualPlan } from "@/types/sa.types";
import { PlanEditModal } from "./PlanEditModal";

const tierIcons: Record<string, React.ElementType> = {
    starter: Zap,
    professional: Shield,
    enterprise: Crown,
    FREE: Zap,
    PRO: Shield,
    MAX: Crown,
};

export default function SubscriptionsPage() {
    const [isAnnual, setIsAnnual] = useState(false);
    const [entPlans, setEntPlans] = useState<SAEnterprisePlan[]>([]);
    const [indPlans, setIndPlans] = useState<SAIndividualPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    useEffect(() => {
        Promise.all([getEnterprisePlans(), getIndividualPlans()]).then(([e, i]) => {
            setEntPlans(e);
            setIndPlans(i);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
        );
    }

    const totalSubscribers = indPlans.reduce((s, p) => s + p.active, 0);
    const monthlyRevenue = indPlans.reduce((s, p) => s + p.price * p.active, 0);

    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title="Subscriptions & Plans"
                subtitle="Manage and configure subscription tiers for organizations and professionals."
                breadcrumbs={[{ label: "Super Admin", href: "/sa/dashboard" }, { label: "Subscriptions" }]}
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalSubscribers}</p>
                            <p className="text-xs text-muted-foreground">Active Subscribers</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">${monthlyRevenue.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Est. Monthly Revenue</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-2 sm:col-span-1">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{entPlans.length}</p>
                            <p className="text-xs text-muted-foreground">Plan Tiers Available</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="enterprise" className="w-full">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <TabsList className="bg-muted/50 p-1 w-full sm:w-auto h-auto">
                        <TabsTrigger value="enterprise" className="gap-2 py-2.5 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Building2 className="h-4 w-4" /> Enterprise Plans
                        </TabsTrigger>
                        <TabsTrigger value="individual" className="gap-2 py-2.5 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Users className="h-4 w-4" /> Individual Plans
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center p-1 bg-muted/60 rounded-full border border-border">
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 ${!isAnnual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`px-5 py-2.5 text-sm font-semibold rounded-full flex items-center gap-2 transition-all duration-200 ${isAnnual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            Annually <Badge className="bg-success text-white hover:bg-success h-5 px-1.5 text-[10px] font-bold tracking-wide border-0 rounded-sm shadow-none">SAVE 20%</Badge>
                        </button>
                    </div>
                </div>

                <TabsContent value="enterprise" className="mt-0">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {entPlans.map((plan) => {
                            const PlanIcon = tierIcons[plan.key] || Zap;
                            return (
                                <Card key={plan.key} className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col ${plan.borderColor} ${plan.popular ? "scale-[1.02] shadow-md z-10" : ""}`}>
                                    {plan.popular && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-400 to-indigo-500" />}
                                    <div className={`absolute inset-0 bg-gradient-to-b ${plan.color} opacity-40`} />
                                    {plan.popular && (
                                        <Badge className="absolute top-4 right-4 bg-gradient-to-r from-brand-600 to-indigo-600 shadow-sm border-0">Most Popular</Badge>
                                    )}
                                    <CardHeader className="relative pb-4 pt-8">
                                        <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${plan.popular ? "bg-brand-100 text-brand-600" : "bg-muted text-muted-foreground"}`}>
                                            <PlanIcon className="h-6 w-6" />
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
                                        {plan.excluded.length > 0 && (
                                            <>
                                                <div className="font-semibold mb-3 text-xs text-muted-foreground uppercase tracking-wide">Not included</div>
                                                <ul className="space-y-2.5 mb-5">
                                                    {plan.excluded.map((f) => (
                                                        <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground/70">
                                                            <X className="h-4 w-4 shrink-0 mt-0.5" /><span>{f}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}
                                        <div className="font-semibold mb-3 text-xs text-muted-foreground uppercase tracking-wide">Included</div>
                                        <ul className="space-y-2.5">
                                            {plan.features.map((f) => (
                                                <li key={f} className="flex items-start gap-3 text-sm font-medium">
                                                    <div className={`mt-0.5 rounded-full p-0.5 ${plan.popular ? "bg-brand-100 text-brand-600" : "bg-success/20 text-success"}`}>
                                                        <Check className="h-3 w-3 shrink-0" />
                                                    </div>
                                                    <span>{f}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>

                                    <CardFooter className="relative pt-6">
                                        <Button
                                            className={`w-full py-5 text-sm font-semibold ${plan.popular ? "bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white" : ""}`}
                                            variant={plan.popular ? "default" : "outline"}
                                            onClick={() => {
                                                setEditingPlan(plan);
                                                setIsSheetOpen(true);
                                            }}
                                        >
                                            Manage {plan.name} Plan
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="individual" className="mt-0">
                    <div className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
                        {indPlans.map((plan) => {
                            const PlanIcon = tierIcons[plan.key] || Zap;
                            return (
                                <Card key={plan.key} className={`relative overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col ${plan.popular ? "border-brand-500 ring-1 ring-brand-500/20 shadow-md" : "border-border/60"}`}>
                                    {plan.popular && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-400 to-indigo-500" />}
                                    {plan.popular && (
                                        <Badge className="absolute top-4 right-4 bg-brand-600 border-0">Recommended</Badge>
                                    )}

                                    <CardHeader className="pb-4 pt-8 text-center">
                                        <div className={`mx-auto w-12 h-12 rounded-xl mb-3 flex items-center justify-center ${plan.popular ? "bg-brand-100 text-brand-600" : "bg-muted text-muted-foreground"}`}>
                                            <PlanIcon className="h-6 w-6" />
                                        </div>
                                        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                        <div className="mt-4 flex items-center justify-center text-5xl font-extrabold">
                                            ${isAnnual ? plan.annualPrice : plan.price}
                                            <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
                                        </div>
                                        {isAnnual && plan.price > 0 && (
                                            <p className="text-xs text-success mt-1">Billed annually — save ${(plan.price - plan.annualPrice) * 12}/yr</p>
                                        )}
                                    </CardHeader>

                                    <CardContent className="flex-1 px-6">
                                        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 mb-6">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground font-medium">Monthly Requests</span>
                                                <span className="font-bold">{plan.requests.toLocaleString()}</span>
                                            </div>
                                            <div className="h-px bg-border w-full" />
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground font-medium">Active Subscribers</span>
                                                <Badge variant="secondary" className="font-bold">{plan.active}</Badge>
                                            </div>
                                            <div className="h-px bg-border w-full" />
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground font-medium">Est. Monthly Revenue</span>
                                                <span className="font-bold text-success">${(plan.price * plan.active).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {plan.excluded && plan.excluded.length > 0 && (
                                            <>
                                                <div className="font-semibold mb-3 text-xs text-muted-foreground uppercase tracking-wide">Not included</div>
                                                <ul className="space-y-2.5 mb-5">
                                                    {plan.excluded.map((f: string) => (
                                                        <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground/70">
                                                            <X className="h-4 w-4 shrink-0 mt-0.5" /><span>{f}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}
                                        {plan.features && plan.features.length > 0 && (
                                            <>
                                                <div className="font-semibold mb-3 text-xs text-muted-foreground uppercase tracking-wide">Included</div>
                                                <ul className="space-y-2.5">
                                                    {plan.features.map((f: string) => (
                                                        <li key={f} className="flex items-start gap-3 text-sm font-medium">
                                                            <div className={`mt-0.5 rounded-full p-0.5 ${plan.popular ? "bg-brand-100 text-brand-600" : "bg-success/20 text-success"}`}>
                                                                <Check className="h-3 w-3 shrink-0" />
                                                            </div>
                                                            <span>{f}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}
                                    </CardContent>

                                    <CardFooter className="pt-4">
                                        <Button
                                            className={`w-full ${plan.popular ? "bg-brand-600 hover:bg-brand-700 text-white" : ""}`}
                                            variant={plan.popular ? "default" : "outline"}
                                            onClick={() => {
                                                setEditingPlan(plan);
                                                setIsSheetOpen(true);
                                            }}
                                        >
                                            Configure Tier
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>
            </Tabs>

            <PlanEditModal
                plan={editingPlan}
                isOpen={isSheetOpen}
                onClose={() => {
                    setIsSheetOpen(false);
                    setTimeout(() => setEditingPlan(null), 300);
                }}
                onSave={(updatedPlan) => {
                    if ('perUser' in updatedPlan) {
                        setEntPlans(prev => prev.map(p => p.key === updatedPlan.key ? updatedPlan : p));
                    } else {
                        setIndPlans(prev => prev.map(p => p.key === updatedPlan.key ? updatedPlan : p));
                    }
                    toast.success(`${updatedPlan.name} plan updated successfully.`);
                }}
            />
        </div>
    );
}
