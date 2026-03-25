"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, User, Briefcase, Calendar, Shield, Activity, Mail, BookOpen } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function ProfessionalProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    // Mock data fallback for demonstration
    const profile = { 
        id, 
        name: id === "pro-001" ? "Alex Thompson" : "Maria Santos", 
        email: id === "pro-001" ? "alex@freelance.com" : "maria@consulting.io", 
        jobTitle: id === "pro-001" ? "Data Scientist" : "Legal Consultant", 
        industry: id === "pro-001" ? "Technology" : "Legal", 
        plan: id === "pro-001" ? "PRO" : "MAX", 
        status: "ACTIVE", 
        requests: id === "pro-001" ? 320 : 890, 
        joinedAt: id === "pro-001" ? "2025-06-01" : "2025-04-15",
        lastActive: "2 hours ago",
        bio: "Experienced professional utilizing secure AI for productivity and analysis."
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6 animate-in fade-in duration-500">
            <div className="flex items-start gap-4 mb-2">
                <Link href="/sa/professionals" className="mt-1">
                    <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-full shadow-sm hover:bg-muted transition-colors">
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
                            { label: profile.name }
                        ]}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Info Card */}
                <Card className="lg:col-span-1 border-border/50 shadow-sm overflow-hidden flex flex-col items-center p-6 text-center space-y-4">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                        <AvatarFallback className="bg-gradient-to-br from-brand-100 to-brand-200 text-3xl font-bold text-brand-700">
                            {profile.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold">{profile.name}</h2>
                        <p className="text-muted-foreground font-medium flex items-center justify-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            {profile.jobTitle}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center">
                        <StatusBadge status={profile.status} />
                        <Badge variant="outline" className="border-brand-200 text-brand-700 bg-brand-50">{profile.plan} Plan</Badge>
                    </div>

                    <div className="w-full pt-4 border-t border-border mt-2 text-left space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${profile.email}`} className="text-foreground hover:text-brand-600 transition-colors font-medium">
                                {profile.email}
                            </a>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Building2Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{profile.industry}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Joined {new Date(profile.joinedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </Card>

                {/* Right Column: Key Details & Activity */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Card className="border-border/50 shadow-sm bg-card/60">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                                <Activity className="h-6 w-6 text-brand-500 mb-1" />
                                <span className="text-2xl font-bold">{profile.requests.toLocaleString()}</span>
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Total Requests</span>
                            </CardContent>
                        </Card>
                        <Card className="border-border/50 shadow-sm bg-card/60">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                                <Shield className="h-6 w-6 text-success mb-1" />
                                <span className="text-lg font-bold">{profile.plan} Tier</span>
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Current Plan</span>
                            </CardContent>
                        </Card>
                        <Card className="border-border/50 shadow-sm bg-card/60 col-span-2 md:col-span-1">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                                <User className="h-6 w-6 text-muted-foreground mb-1" />
                                <span className="text-lg font-bold">{profile.lastActive}</span>
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Last Active</span>
                            </CardContent>
                        </Card>
                    </div>

                    {/* About Section */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <CardTitle className="text-base flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-brand-500" />
                                Professional Biography
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {profile.bio}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Shield className="h-5 w-5 text-brand-500" />
                                Account Administration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 flex flex-wrap gap-3">
                            <Button>Send Message</Button>
                            <Button variant="outline">Reset Password</Button>
                            <Button variant="outline" className="text-danger hover:bg-danger/10 hover:text-danger border-danger/20">Suspend Account</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function Building2Icon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01" />
            <path d="M16 6h.01" />
            <path d="M12 6h.01" />
            <path d="M12 10h.01" />
            <path d="M12 14h.01" />
            <path d="M16 10h.01" />
            <path d="M16 14h.01" />
            <path d="M8 10h.01" />
            <path d="M8 14h.01" />
        </svg>
    )
}
