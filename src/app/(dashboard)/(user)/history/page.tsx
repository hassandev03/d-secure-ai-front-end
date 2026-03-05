"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MessageSquare, Trash2, Calendar } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockSessions = [
    { id: "sess-1", title: "GDPR Compliance Query", model: "Claude 4.6 Sonnet", provider: "Anthropic", messages: 12, date: "2025-12-01", time: "10:30 AM" },
    { id: "sess-2", title: "Code Review — Auth Module", model: "GPT-5.1", provider: "OpenAI", messages: 8, date: "2025-12-01", time: "8:15 AM" },
    { id: "sess-3", title: "Market Research Analysis", model: "Gemini 3.1 Pro", provider: "Google", messages: 15, date: "2025-11-30", time: "3:45 PM" },
    { id: "sess-4", title: "SQL Optimization Help", model: "Claude 4.5 Haiku", provider: "Anthropic", messages: 6, date: "2025-11-30", time: "11:20 AM" },
    { id: "sess-5", title: "Technical Writing Draft", model: "GPT-4o", provider: "OpenAI", messages: 20, date: "2025-11-29", time: "2:00 PM" },
    { id: "sess-6", title: "API Design Review", model: "Claude 4.6 Sonnet", provider: "Anthropic", messages: 18, date: "2025-11-28", time: "4:30 PM" },
    { id: "sess-7", title: "Bug Triage Summary", model: "GPT-5.1", provider: "OpenAI", messages: 10, date: "2025-11-27", time: "9:00 AM" },
    { id: "sess-8", title: "Legal Document Drafting", model: "Claude 4.6 Opus", provider: "Anthropic", messages: 25, date: "2025-11-26", time: "1:15 PM" },
];

const providerColor: Record<string, string> = {
    OpenAI: "bg-emerald-50 text-emerald-700",
    Anthropic: "bg-orange-50 text-orange-700",
    Google: "bg-blue-50 text-blue-700",
};

export default function HistoryPage() {
    const [search, setSearch] = useState("");
    const [providerFilter, setProviderFilter] = useState("all");

    const filtered = mockSessions.filter((s) => {
        const matchSearch = s.title.toLowerCase().includes(search.toLowerCase());
        const matchProvider = providerFilter === "all" || s.provider === providerFilter;
        return matchSearch && matchProvider;
    });

    // Group by date
    const grouped: Record<string, typeof mockSessions> = {};
    filtered.forEach((s) => {
        if (!grouped[s.date]) grouped[s.date] = [];
        grouped[s.date].push(s);
    });

    return (
        <div className="mx-auto max-w-4xl">
            <PageHeader
                title="Chat History"
                subtitle={`${mockSessions.length} sessions total`}
                breadcrumbs={[{ label: "User", href: "/dashboard" }, { label: "History" }]}
            />

            <Card className="mb-6">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search sessions..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <Select value={providerFilter} onValueChange={setProviderFilter}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Providers</SelectItem>
                            <SelectItem value="OpenAI">OpenAI</SelectItem>
                            <SelectItem value="Anthropic">Anthropic</SelectItem>
                            <SelectItem value="Google">Google</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {Object.entries(grouped).map(([date, sessions]) => (
                <div key={date} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-muted-foreground">{date}</h3>
                    </div>
                    <div className="space-y-2">
                        {sessions.map((s) => (
                            <Link key={s.id} href={`/chat/${s.id}`}>
                                <div className="group flex items-center gap-4 rounded-xl border border-border bg-white p-4 transition-all hover:shadow-sm hover:border-brand-200 cursor-pointer">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 shrink-0">
                                        <MessageSquare className="h-5 w-5 text-brand-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground group-hover:text-brand-600 truncate">{s.title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{s.messages} messages · {s.time}</p>
                                    </div>
                                    <Badge variant="secondary" className={providerColor[s.provider] || ""}>{s.model}</Badge>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger shrink-0" onClick={(e) => { e.preventDefault(); }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            ))}

            {filtered.length === 0 && (
                <div className="py-12 text-center">
                    <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">No sessions found</p>
                </div>
            )}
        </div>
    );
}
