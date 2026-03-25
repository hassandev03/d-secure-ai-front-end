"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { INDUSTRIES } from "@/lib/constants";
import { registerOrganization } from "@/services/sa.service";
import type { RegisterOrgPayload } from "@/types/sa.types";

export default function RegisterOrganizationPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<RegisterOrgPayload>({
        name: "",
        industry: "",
        domain: "",
        country: "",
        sizeRange: "",
        adminName: "",
        adminEmail: "",
        adminPhone: "",
        subscriptionPlan: "",
        billingCycle: "MONTHLY",
        initialQuota: 5000,
        notes: "",
    });

    const updateField = <K extends keyof RegisterOrgPayload>(key: K, value: RegisterOrgPayload[K]) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await registerOrganization(formData);
            toast.success("Organization registered successfully!");
            router.push("/sa/organizations");
        } catch {
            toast.error("Failed to register organization. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl">
            <PageHeader
                title="Register Organization"
                subtitle="Add a new organization to the D-SecureAI platform."
                breadcrumbs={[
                    { label: "Super Admin", href: "/sa/dashboard" },
                    { label: "Organizations", href: "/sa/organizations" },
                    { label: "Register" },
                ]}
            />

            <form onSubmit={handleSubmit}>
                <Card className="mb-6">
                    <CardHeader><CardTitle className="text-base">Organization Information</CardTitle></CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2 space-y-2">
                            <Label htmlFor="orgName">Organization Name *</Label>
                            <Input id="orgName" placeholder="Acme Corporation" required value={formData.name} onChange={(e) => updateField("name", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="industry">Industry *</Label>
                            <Select required value={formData.industry} onValueChange={(v) => updateField("industry", v)}>
                                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                                <SelectContent>{INDUSTRIES.map((ind) => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="domain">Domain</Label>
                            <Input id="domain" placeholder="acme.com" value={formData.domain} onChange={(e) => updateField("domain", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">Country *</Label>
                            <Input id="country" placeholder="United States" required value={formData.country} onChange={(e) => updateField("country", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="size">Size Range</Label>
                            <Select value={formData.sizeRange} onValueChange={(v) => updateField("sizeRange", v)}>
                                <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                                <SelectContent>
                                    {["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"].map((s) => <SelectItem key={s} value={s}>{s} employees</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader><CardTitle className="text-base">Organization Admin</CardTitle></CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2 space-y-2">
                            <Label htmlFor="adminName">Admin Full Name *</Label>
                            <Input id="adminName" placeholder="Sarah Johnson" required value={formData.adminName} onChange={(e) => updateField("adminName", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="adminEmail">Admin Email *</Label>
                            <Input id="adminEmail" type="email" placeholder="admin@acme.com" required value={formData.adminEmail} onChange={(e) => updateField("adminEmail", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="adminPhone">Phone (optional)</Label>
                            <Input id="adminPhone" type="tel" placeholder="+1-555-0123" value={formData.adminPhone} onChange={(e) => updateField("adminPhone", e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader><CardTitle className="text-base">Subscription & Quota</CardTitle></CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Subscription Plan *</Label>
                            <Select value={formData.subscriptionPlan} onValueChange={(v) => updateField("subscriptionPlan", v)}>
                                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Starter">Starter</SelectItem>
                                    <SelectItem value="Professional">Professional</SelectItem>
                                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Billing Cycle</Label>
                            <Select value={formData.billingCycle} onValueChange={(v) => updateField("billingCycle", v as "MONTHLY" | "ANNUAL")}>
                                <SelectTrigger><SelectValue placeholder="Select cycle" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                                    <SelectItem value="ANNUAL">Annual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quota">Initial Monthly Quota *</Label>
                            <Input id="quota" type="number" placeholder="5000" min={100} required value={formData.initialQuota} onChange={(e) => updateField("initialQuota", parseInt(e.target.value) || 0)} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader><CardTitle className="text-base">Additional Notes</CardTitle></CardHeader>
                    <CardContent>
                        <textarea
                            className="w-full rounded-lg border border-border bg-transparent p-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            rows={3}
                            placeholder="Internal notes about this organization..."
                            value={formData.notes}
                            onChange={(e) => updateField("notes", e.target.value)}
                        />
                    </CardContent>
                </Card>

                <Separator className="my-6" />

                <div className="flex items-center justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" className="bg-brand-700 hover:bg-brand-800" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Register Organization
                    </Button>
                </div>
            </form>
        </div>
    );
}
