"use client";

import { use, useState, useEffect } from "react";
import { Building2, Users, Layers, CreditCard, Calendar, Globe, Mail, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import QuotaBar from "@/components/shared/QuotaBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getOrganizationById, updateOrganizationStatus } from "@/services/sa.service";
import type { SAOrganization, OrgStatus } from "@/types/sa.types";

export default function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [org, setOrg] = useState<SAOrganization | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getOrganizationById(id).then((data) => {
            setOrg(data);
            setLoading(false);
        });
    }, [id]);

    const handleStatusChange = async (newStatus: OrgStatus) => {
        if (!org) return;
        const updated = await updateOrganizationStatus(org.id, newStatus);
        if (updated) {
            setOrg({ ...org, status: newStatus });
            toast.success(`${org.name} status changed to ${newStatus.toLowerCase()}.`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
        );
    }

    if (!org) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
                <Building2 className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-lg font-medium">Organization not found</p>
                <p className="text-sm text-muted-foreground">The organization with ID &ldquo;{id}&rdquo; does not exist.</p>
            </div>
        );
    }

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
                        {org.status !== "ACTIVE" && (
                            <Button variant="outline" className="text-success hover:text-success" onClick={() => handleStatusChange("ACTIVE")}>Activate</Button>
                        )}
                        {org.status === "ACTIVE" && (
                            <Button variant="outline" className="text-warning hover:text-warning" onClick={() => handleStatusChange("SUSPENDED")}>Suspend</Button>
                        )}
                        {org.status !== "DEACTIVATED" && (
                            <Button variant="outline" className="text-danger hover:text-danger" onClick={() => handleStatusChange("DEACTIVATED")}>Deactivate</Button>
                        )}
                    </div>
                }
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Employees" value={org.employees} icon={Users} />
                <StatCard title="Departments" value={org.departments} icon={Layers} iconColor="text-info bg-info/10" />
                <StatCard title="Plan" value={org.plan} icon={CreditCard} iconColor="text-success bg-success/10" />
                <StatCard title="Billing" value={org.billingCycle === "ANNUAL" ? "Annual" : "Monthly"} icon={Calendar} iconColor="text-warning bg-warning/10" />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle className="text-base font-semibold">Quota Usage</CardTitle></CardHeader>
                    <CardContent>
                        <QuotaBar used={org.quota.used} total={org.quota.total} label="Organization Total" />
                        <Separator className="my-6" />
                        <h4 className="mb-4 text-sm font-semibold text-foreground">Department Breakdown</h4>
                        <div className="space-y-4">
                            {(org.departmentList ?? []).map((dept) => (
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
                                <span className="font-medium">{new Date(org.registeredAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
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
