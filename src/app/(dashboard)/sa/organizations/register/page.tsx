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

export default function RegisterOrganizationPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        await new Promise((r) => setTimeout(r, 800));
        setIsLoading(false);
        toast.success("Organization registered successfully!");
        router.push("/sa/organizations");
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
                {/* Organization Info */}
                <Card className="mb-6">
                    <CardHeader><CardTitle className="text-base">Organization Information</CardTitle></CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2 space-y-2">
                            <Label htmlFor="orgName">Organization Name *</Label>
                            <Input id="orgName" placeholder="Acme Corporation" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="industry">Industry *</Label>
                            <Select required>
                                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                                <SelectContent>{INDUSTRIES.map((ind) => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="domain">Domain</Label>
                            <Input id="domain" placeholder="acme.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">Country *</Label>
                            <Input id="country" placeholder="United States" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="size">Size Range</Label>
                            <Select>
                                <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                                <SelectContent>
                                    {["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"].map((s) => <SelectItem key={s} value={s}>{s} employees</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Admin Info */}
                <Card className="mb-6">
                    <CardHeader><CardTitle className="text-base">Organization Admin</CardTitle></CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2 space-y-2">
                            <Label htmlFor="adminName">Admin Full Name *</Label>
                            <Input id="adminName" placeholder="Sarah Johnson" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="adminEmail">Admin Email *</Label>
                            <Input id="adminEmail" type="email" placeholder="admin@acme.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="adminPhone">Phone (optional)</Label>
                            <Input id="adminPhone" type="tel" placeholder="+1-555-0123" />
                        </div>
                    </CardContent>
                </Card>

                {/* Subscription */}
                <Card className="mb-6">
                    <CardHeader><CardTitle className="text-base">Subscription & Quota</CardTitle></CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Subscription Plan *</Label>
                            <Select>
                                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="starter">Starter</SelectItem>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Billing Cycle</Label>
                            <Select>
                                <SelectTrigger><SelectValue placeholder="Select cycle" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                                    <SelectItem value="ANNUAL">Annual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quota">Initial Monthly Quota *</Label>
                            <Input id="quota" type="number" placeholder="5000" min={100} required />
                        </div>
                    </CardContent>
                </Card>

                {/* Notes */}
                <Card className="mb-6">
                    <CardHeader><CardTitle className="text-base">Additional Notes</CardTitle></CardHeader>
                    <CardContent>
                        <textarea className="w-full rounded-lg border border-border bg-transparent p-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" rows={3} placeholder="Internal notes about this organization..." />
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
