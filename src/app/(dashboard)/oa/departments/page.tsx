"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Layers, Users } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import QuotaBar from "@/components/shared/QuotaBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const mockDepartments = [
    { id: "dept-001", name: "Engineering", head: "Sarah Johnson", headEmail: "sarah@acme.com", employees: 45, quota: { used: 1200, total: 1500 }, color: "#3B82F6" },
    { id: "dept-002", name: "Marketing", head: "Emma Davis", headEmail: "emma@acme.com", employees: 20, quota: { used: 600, total: 800 }, color: "#10B981" },
    { id: "dept-003", name: "Sales", head: "David Kim", headEmail: "david@acme.com", employees: 25, quota: { used: 500, total: 700 }, color: "#F59E0B" },
    { id: "dept-004", name: "Finance", head: "Aisha Patel", headEmail: "aisha@acme.com", employees: 12, quota: { used: 400, total: 600 }, color: "#8B5CF6" },
    { id: "dept-005", name: "HR", head: "Lisa Chen", headEmail: "lisa@acme.com", employees: 10, quota: { used: 200, total: 400 }, color: "#EF4444" },
    { id: "dept-006", name: "Operations", head: "James Wilson", headEmail: "james@acme.com", employees: 8, quota: { used: 300, total: 1000 }, color: "#06B6D4" },
];

export default function DepartmentsPage() {
    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title="Departments"
                subtitle={`${mockDepartments.length} departments`}
                breadcrumbs={[{ label: "Organization", href: "/oa/dashboard" }, { label: "Departments" }]}
                actions={
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-brand-700 hover:bg-brand-800"><Plus className="mr-2 h-4 w-4" />Create Department</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Create Department</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2"><Label>Department Name</Label><Input placeholder="e.g. Research & Development" /></div>
                                <div className="space-y-2"><Label>Department Head Email</Label><Input type="email" placeholder="head@acme.com" /></div>
                                <div className="space-y-2"><Label>Monthly Quota</Label><Input type="number" placeholder="1000" /></div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                <Button className="bg-brand-700 hover:bg-brand-800" onClick={() => toast.success("Department created!")}>Create</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                }
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mockDepartments.map((dept) => (
                    <Link key={dept.id} href={`/oa/departments/${dept.id}`}>
                        <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-brand-200">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: dept.color + "15", color: dept.color }}>
                                        <Layers className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base group-hover:text-brand-600 transition-colors">{dept.name}</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Head */}
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-7 w-7">
                                        <AvatarFallback className="bg-brand-50 text-[10px] font-semibold text-brand-700">{dept.head.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-xs font-medium">{dept.head}</p>
                                        <p className="text-[11px] text-muted-foreground">Department Head</p>
                                    </div>
                                </div>
                                {/* Stats */}
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Users className="h-3.5 w-3.5" />
                                        <span>{dept.employees} members</span>
                                    </div>
                                </div>
                                {/* Quota */}
                                <QuotaBar used={dept.quota.used} total={dept.quota.total} label="Quota Usage" size="sm" />
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
