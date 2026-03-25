"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CreditCard, Loader2, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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

    const validateForm = () => {
        if (!formData.name.trim()) return "Organization Name is required.";
        if (!formData.industry) return "Industry is required.";
        if (!formData.country.trim()) return "Country is required.";
        if (!formData.adminName.trim()) return "Admin Name is required.";
        if (!formData.adminEmail.trim()) return "Admin Email is required.";
        if (!formData.subscriptionPlan) return "Subscription Plan is required.";
        if (formData.initialQuota < 100) return "Initial Quota must be at least 100.";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const error = validateForm();
        if (error) {
            toast.error(error);
            return;
        }

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
        <div className="mx-auto max-w-5xl">
            <PageHeader
                title="Register Organization"
                subtitle="Add a new organization to the D-SecureAI platform and configure their initial workspace."
                breadcrumbs={[
                    { label: "Super Admin", href: "/sa/dashboard" },
                    { label: "Organizations", href: "/sa/organizations" },
                    { label: "Register" },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} id="register-org-form" className="space-y-6">
                        {/* Company Details */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-brand-500/10 rounded-md">
                                        <Building2 className="w-5 h-5 text-brand-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Company Details</CardTitle>
                                        <CardDescription>Basic information about the organization.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-5 sm:grid-cols-2">
                                <div className="sm:col-span-2 space-y-2">
                                    <Label htmlFor="orgName">Organization Name <span className="text-destructive">*</span></Label>
                                    <Input id="orgName" placeholder="e.g. Acme Corporation" required value={formData.name} onChange={(e) => updateField("name", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="industry">Industry <span className="text-destructive">*</span></Label>
                                    <Select required value={formData.industry} onValueChange={(v) => updateField("industry", v)}>
                                        <SelectTrigger id="industry"><SelectValue placeholder="Select industry" /></SelectTrigger>
                                        <SelectContent>{INDUSTRIES.map((ind) => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="domain">Domain</Label>
                                    <Input id="domain" placeholder="e.g. acme.com" value={formData.domain} onChange={(e) => updateField("domain", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
                                    <Input id="country" placeholder="e.g. United States" required value={formData.country} onChange={(e) => updateField("country", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="size">Size Range</Label>
                                    <Select value={formData.sizeRange} onValueChange={(v) => updateField("sizeRange", v)}>
                                        <SelectTrigger id="size"><SelectValue placeholder="Select size" /></SelectTrigger>
                                        <SelectContent>
                                            {["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"].map((s) => <SelectItem key={s} value={s}>{s} employees</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Primary Administrator */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-500/10 rounded-md">
                                        <User className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Primary Administrator</CardTitle>
                                        <CardDescription>The main point of contact who will manage this organization.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-5 sm:grid-cols-2">
                                <div className="sm:col-span-2 space-y-2">
                                    <Label htmlFor="adminName">Full Name <span className="text-destructive">*</span></Label>
                                    <Input id="adminName" placeholder="e.g. Sarah Johnson" required value={formData.adminName} onChange={(e) => updateField("adminName", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="adminEmail">Email Address <span className="text-destructive">*</span></Label>
                                    <Input id="adminEmail" type="email" placeholder="e.g. admin@acme.com" required value={formData.adminEmail} onChange={(e) => updateField("adminEmail", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="adminPhone">Phone Number</Label>
                                    <Input id="adminPhone" type="tel" placeholder="e.g. +1-555-0123" value={formData.adminPhone} onChange={(e) => updateField("adminPhone", e.target.value)} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Subscription & Quota */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-emerald-500/10 rounded-md">
                                        <CreditCard className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Subscription & Quota</CardTitle>
                                        <CardDescription>Select the billing plan and AI usage limits.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-5 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="plan">Subscription Plan <span className="text-destructive">*</span></Label>
                                    <Select value={formData.subscriptionPlan} onValueChange={(v) => updateField("subscriptionPlan", v)}>
                                        <SelectTrigger id="plan"><SelectValue placeholder="Select plan" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Starter">Starter</SelectItem>
                                            <SelectItem value="Professional">Professional</SelectItem>
                                            <SelectItem value="Enterprise">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="billingCycle">Billing Cycle</Label>
                                    <Select value={formData.billingCycle} onValueChange={(v) => updateField("billingCycle", v as "MONTHLY" | "ANNUAL")}>
                                        <SelectTrigger id="billingCycle"><SelectValue placeholder="Select cycle" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                                            <SelectItem value="ANNUAL">Annual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="sm:col-span-2 space-y-2">
                                    <Label htmlFor="quota">Monthly AI Request Quota <span className="text-destructive">*</span></Label>
                                    <Input id="quota" type="number" placeholder="5000" min={100} required value={formData.initialQuota || ""} onChange={(e) => updateField("initialQuota", parseInt(e.target.value) || 0)} />
                                    <p className="text-xs text-muted-foreground">This limits the total number of AI interactions the organization can perform per month.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Additional Notes</CardTitle>
                                <CardDescription>Internal notes or special requirements for this organization.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    rows={4}
                                    placeholder="Add any internal context about this client..."
                                    value={formData.notes || ""}
                                    onChange={(e) => updateField("notes", e.target.value)}
                                    className="resize-y"
                                />
                            </CardContent>
                        </Card>

                    </form>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-6">
                    <Card className="bg-muted/30 border-dashed">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-brand-600" />
                                <CardTitle className="text-base">Onboarding Process</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm space-y-4 text-muted-foreground">
                            <p>
                                <strong>1. Registration:</strong> By creating this organization, you setup their isolated tenant in the platform.
                            </p>
                            <p>
                                <strong>2. Welcome Email:</strong> The specified Primary Administrator will receive an email to set their password and log in.
                            </p>
                            <p>
                                <strong>3. Configuration:</strong> Once logged in, the Organization Admin can begin creating departments and setting internal quotas.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/30 border-dashed">
                        <CardHeader>
                            <CardTitle className="text-base">Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-4">
                            <div className="flex justify-between items-center py-1 border-b">
                                <span className="text-muted-foreground">Plan:</span>
                                <span className="font-medium">{formData.subscriptionPlan || "Not Selected"}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                                <span className="text-muted-foreground">Billing:</span>
                                <span className="font-medium capitalize">{formData.billingCycle.toLowerCase()}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                                <span className="text-muted-foreground">Quota:</span>
                                <span className="font-medium">{formData.initialQuota.toLocaleString()} Req/mo</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-muted-foreground">Admin:</span>
                                <span className="font-medium truncate max-w-[120px]">{formData.adminName || "Not Set"}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Separator className="my-8" />

            <div className="flex items-center justify-end gap-3 pb-8">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    form="register-org-form" 
                    className="bg-brand-600 hover:bg-brand-700 text-white min-w-[150px]" 
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? "Registering..." : "Register Organization"}
                </Button>
            </div>
        </div>
    );
}
