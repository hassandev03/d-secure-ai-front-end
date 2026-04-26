"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, Briefcase, Calendar, Shield, Activity,
    Mail, BookOpen, Building2, UserCog, RefreshCw, Ban,
    CheckCircle2, XCircle, Loader2, Users,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getProfessionalById, updateProfessionalStatus, resetProfessionalPassword } from "@/services/sa.service";
import type { SAProfessional, ProfessionalStatus } from "@/types/sa.types";

const planColors: Record<string, string> = {
    FREE: "bg-muted text-muted-foreground border-border",
    PRO:  "bg-brand-50 text-brand-700 border-brand-200",
    MAX:  "bg-gradient-to-r from-brand-600 to-indigo-600 text-white border-transparent",
};

export default function ProfessionalProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [profile, setProfile] = useState<SAProfessional | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getProfessionalById(id).then((data) => {
            setProfile(data);
            setLoading(false);
        });
    }, [id]);

    const handleStatusChange = async (newStatus: ProfessionalStatus) => {
        if (!profile) return;
        const updated = await updateProfessionalStatus(profile.id, newStatus);
        if (updated) {
            setProfile({ ...profile, status: newStatus });
            toast.success(`${profile.name} status changed to ${newStatus.toLowerCase()}.`);
        }
    };

    const handleResetPassword = async () => {
        if (!profile) return;
        const result = await resetProfessionalPassword(profile.id);
        if (result.success) {
            toast.success(`Password reset email sent to ${profile.email}.`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
                <Users className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-lg font-medium">Professional not found</p>
                <p className="text-sm text-muted-foreground">The professional with ID &ldquo;{id}&rdquo; does not exist.</p>
            </div>
        );
    }

    const initials = profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex items-start gap-4 mb-2">
                <Link href="/sa/professionals" className="mt-1">
                    <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-full shadow-sm">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <PageHeader
                        title="Professional Profile"
                        subtitle="Detailed view of the professional's account, usage, and information."
                        breadcrumbs={[
                            { label: "Super Admin", href: "/sa/dashboard" },
                            { label: "Professionals", href: "/sa/professionals" },
                            { label: profile.name },
                        ]}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 overflow-hidden flex flex-col">
                    <div className="h-24 bg-gradient-to-br from-brand-600 to-indigo-600 relative shrink-0">
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                            <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                                <AvatarFallback className="bg-brand-100 text-2xl font-bold text-brand-700">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>

                    <div className="pt-12 pb-6 px-6 flex flex-col items-center text-center space-y-3 flex-1">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold">{profile.name}</h2>
                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                                <Briefcase className="h-3.5 w-3.5" />{profile.jobTitle}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center">
                            <StatusBadge status={profile.status} />
                            <Badge variant="outline" className={`border text-xs ${planColors[profile.plan]}`}>
                                {profile.plan} Plan
                            </Badge>
                        </div>

                        <Separator />

                        <div className="w-full text-left space-y-2.5">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                <a href={`mailto:${profile.email}`} className="text-foreground hover:text-brand-600 transition-colors font-medium truncate">
                                    {profile.email}
                                </a>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="font-medium text-foreground">{profile.industry}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground">Joined {new Date(profile.joinedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                                <Activity className="h-5 w-5 text-brand-500 mb-1" />
                                <span className="text-2xl font-bold">{profile.creditsUsed.toLocaleString()}</span>
                                <span className="text-xs text-muted-foreground">Credits Used</span>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                                <Shield className="h-5 w-5 text-success mb-1" />
                                <span className="text-lg font-bold">{profile.plan}</span>
                                <span className="text-xs text-muted-foreground">Current Plan</span>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                                <Activity className="h-5 w-5 text-info mb-1" />
                                <span className="text-sm font-bold">{profile.lastActive}</span>
                                <span className="text-xs text-muted-foreground">Last Active</span>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="pb-3 border-b border-border">
                            <CardTitle className="text-base flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-brand-500" />
                                Professional Biography
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3 border-b border-border">
                            <CardTitle className="text-base flex items-center gap-2">
                                <UserCog className="h-4 w-4 text-brand-500" />
                                Account Administration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    className="bg-brand-700 hover:bg-brand-800"
                                    onClick={() => toast.success(`Message sent to ${profile.name}.`)}
                                >
                                    <Mail className="mr-2 h-4 w-4" /> Send Message
                                </Button>
                                <Button variant="outline" onClick={handleResetPassword}>
                                    <RefreshCw className="mr-2 h-4 w-4" /> Reset Password
                                </Button>
                                {profile.status !== "ACTIVE" && (
                                    <Button
                                        variant="outline"
                                        className="text-success hover:bg-success/10 hover:text-success border-success/20"
                                        onClick={() => handleStatusChange("ACTIVE")}
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Activate
                                    </Button>
                                )}
                                {profile.status !== "SUSPENDED" && profile.status !== "DEACTIVATED" && (
                                    <Button
                                        variant="outline"
                                        className="text-warning hover:bg-warning/10 hover:text-warning border-warning/20"
                                        onClick={() => handleStatusChange("SUSPENDED")}
                                    >
                                        <Ban className="mr-2 h-4 w-4" /> Suspend Account
                                    </Button>
                                )}
                                {profile.status !== "DEACTIVATED" && (
                                    <Button
                                        variant="outline"
                                        className="text-danger hover:bg-danger/10 hover:text-danger border-danger/20"
                                        onClick={() => handleStatusChange("DEACTIVATED")}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" /> Deactivate
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
