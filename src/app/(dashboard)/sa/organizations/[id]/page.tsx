"use client";

import { use } from "react";
import { Building2, Users, Layers, CreditCard, Calendar, Globe, Mail, Phone } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import QuotaBar from "@/components/shared/QuotaBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const mockOrgDetail = {
    id: "org-001",
    name: "Acme Corporation",
    industry: "Technology",
    domain: "acme.com",
    country: "USA",
    sizeRange: "51-200",
    status: "ACTIVE",
    plan: "Enterprise",
    billingCycle: "ANNUAL",
    registeredAt: "2025-03-15",
    adminName: "Sarah Johnson",
    adminEmail: "sarah@acmecorp.com",
    adminPhone: "+1-555-0123",
    employees: 120,
    departments: 6,
    quota: { used: 3200, total: 5000 },
    notes: "Premium enterprise client. Priority support enabled.",
    departmentList: [
        { name: "Engineering", employees: 45, quota: { used: 1200, total: 1500 } },
        { name: "Marketing", employees: 20, quota: { used: 600, total: 800 } },
        { name: "Sales", employees: 25, quota: { used: 500, total: 700 } },
        { name: "HR", employees: 10, quota: { used: 200, total: 400 } },
        { name: "Finance", employees: 12, quota: { used: 400, total: 600 } },
        { name: "Operations", employees: 8, quota: { used: 300, total: 1000 } },
    ],
};

export default function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const org = mockOrgDetail;

    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title={org.name}
                subtitle={`${org.industry} · ${org.domain}`}
                breadcrumbs={[
                    { label: "Super Admin", href: "/sa/dashboard" },
                    { label: "Organizations", href: "/sa/organizations" },
                    { label: org.name },
                ]}
                actions={
                    <div className="flex items-center gap-2">
                        <StatusBadge status={org.status} />
                        <Button variant="outline">Edit</Button>
                        <Button variant="outline" className="text-danger hover:text-danger">Suspend</Button>
                    </div>
                }
            />

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Employees" value={org.employees} icon={Users} />
                <StatCard title="Departments" value={org.departments} icon={Layers} iconColor="text-info bg-info/10" />
                <StatCard title="Plan" value={org.plan} icon={CreditCard} iconColor="text-success bg-success/10" />
                <StatCard title="Billing" value={org.billingCycle === "ANNUAL" ? "Annual" : "Monthly"} icon={Calendar} iconColor="text-warning bg-warning/10" />
            </div>

            {/* Quota + Admin info */}
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                {/* Quota */}
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle className="text-base font-semibold">Quota Usage</CardTitle></CardHeader>
                    <CardContent>
                        <QuotaBar used={org.quota.used} total={org.quota.total} label="Organization Total" />
                        <Separator className="my-6" />
                        <h4 className="mb-4 text-sm font-semibold text-foreground">Department Breakdown</h4>
                        <div className="space-y-4">
                            {org.departmentList.map((dept) => (
                                <div key={dept.name} className="flex items-center gap-4">
                                    <p className="w-28 text-sm font-medium text-foreground truncate">{dept.name}</p>
                                    <div className="flex-1">
                                        <QuotaBar used={dept.quota.used} total={dept.quota.total} showLabel={false} size="sm" />
                                    </div>
                                    <p className="w-20 text-right text-xs text-muted-foreground">{dept.employees} users</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Admin + Details */}
                <Card>
                    <CardHeader><CardTitle className="text-base font-semibold">Organization Details</CardTitle></CardHeader>
                    <CardContent className="space-y-5">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Admin Contact</p>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-brand-100 text-sm font-semibold text-brand-700">
                                        {org.adminName.split(" ").map(n => n[0]).join("")}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">{org.adminName}</p>
                                    <p className="text-xs text-muted-foreground">{org.adminEmail}</p>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Domain:</span>
                                <span className="font-medium">{org.domain}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Country:</span>
                                <span className="font-medium">{org.country}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Size:</span>
                                <span className="font-medium">{org.sizeRange} employees</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Email:</span>
                                <span className="font-medium">{org.adminEmail}</span>
                            </div>
                            {org.adminPhone && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Phone:</span>
                                    <span className="font-medium">{org.adminPhone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Registered:</span>
                                <span className="font-medium">{org.registeredAt}</span>
                            </div>
                        </div>
                        {org.notes && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                                    <p className="text-sm text-foreground">{org.notes}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
