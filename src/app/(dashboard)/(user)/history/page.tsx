"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MessageSquare, Trash2, Calendar, Paperclip } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subDays, format } from "date-fns";

const today = new Date();
const d0 = format(today, "yyyy-MM-dd");
const d1 = format(subDays(today, 1), "yyyy-MM-dd");
const d2 = format(subDays(today, 2), "yyyy-MM-dd");
const d3 = format(subDays(today, 5), "yyyy-MM-dd");
const d4 = format(subDays(today, 10), "yyyy-MM-dd");

const mockSessions = [
    { id: "sess-1", title: "GDPR Compliance Query", model: "Claude 4.6 Sonnet", provider: "Anthropic", messages: 12, date: d0, time: "10:30 AM", hasFile: true },
    { id: "sess-2", title: "Code Review — Auth Module", model: "GPT-5.1", provider: "OpenAI", messages: 8, date: d0, time: "8:15 AM", hasFile: false },
    { id: "sess-3", title: "Market Research Analysis", model: "Gemini 3.1 Pro", provider: "Google", messages: 15, date: d1, time: "3:45 PM", hasFile: true },
    { id: "sess-4", title: "SQL Optimization Help", model: "Claude 4.5 Haiku", provider: "Anthropic", messages: 6, date: d1, time: "11:20 AM", hasFile: false },
    { id: "sess-5", title: "Technical Writing Draft", model: "GPT-4o", provider: "OpenAI", messages: 20, date: d2, time: "2:00 PM", hasFile: false },
    { id: "sess-6", title: "API Design Review", model: "Claude 4.6 Sonnet", provider: "Anthropic", messages: 18, date: d3, time: "4:30 PM", hasFile: true },
    { id: "sess-7", title: "Bug Triage Summary", model: "GPT-5.1", provider: "OpenAI", messages: 10, date: d4, time: "9:00 AM", hasFile: false },
    { id: "sess-8", title: "Legal Document Drafting", model: "Claude 4.6 Opus", provider: "Anthropic", messages: 25, date: d4, time: "1:15 PM", hasFile: true },
];

const providerColor: Record<string, string> = {
    OpenAI: "bg-emerald-50 text-emerald-700",
    Anthropic: "bg-orange-50 text-orange-700",
    Google: "bg-blue-50 text-blue-700",
};

export default function HistoryPage() {
    const [search, setSearch] = useState("");
    const [providerFilter, setProviderFilter] = useState("all");
    const [dateRange, setDateRange] = useState("all");
    const [hasFile, setHasFile] = useState("all");

    const filtered = mockSessions.filter((s) => {
        const matchSearch = s.title.toLowerCase().includes(search.toLowerCase());
        const matchProvider = providerFilter === "all" || s.provider === providerFilter;
        const matchFile = hasFile === "all" || (hasFile === "yes" ? s.hasFile : !s.hasFile);

        let matchDate = true;
        if (dateRange === "today") matchDate = s.date === d0;
        if (dateRange === "7days") matchDate = new Date(s.date) >= subDays(today, 7);
        if (dateRange === "30days") matchDate = new Date(s.date) >= subDays(today, 30);

        return matchSearch && matchProvider && matchDate && matchFile;
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

            <div className="mb-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search sessions..."
                        className="pl-9 bg-white shadow-sm w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="bg-white shadow-sm">
                        <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Any Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="7days">Last 7 Days</SelectItem>
                        <SelectItem value="30days">Last 30 Days</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={providerFilter} onValueChange={setProviderFilter}>
                    <SelectTrigger className="bg-white shadow-sm">
                        <SelectValue placeholder="Provider" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Providers</SelectItem>
                        <SelectItem value="OpenAI">OpenAI</SelectItem>
                        <SelectItem value="Anthropic">Anthropic</SelectItem>
                        <SelectItem value="Google">Google</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={hasFile} onValueChange={setHasFile}>
                    <SelectTrigger className="bg-white shadow-sm">
                        <SelectValue placeholder="Files" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Sessions</SelectItem>
                        <SelectItem value="yes">With Files</SelectItem>
                        <SelectItem value="no">Without Files</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {Object.entries(grouped).map(([date, sessions]) => (
                <div key={date} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-muted-foreground">
                            {date === d0 ? "Today" : date === d1 ? "Yesterday" : format(new Date(date), "MMM d, yyyy")}
                        </h3>
                    </div>
                    <div className="space-y-2">
                        {sessions.map((s) => (
                            <Link key={s.id} href={`/chat/${s.id}`}>
                                <div className="group flex items-center gap-4 rounded-xl border border-border bg-white p-4 transition-all hover:shadow-sm hover:border-brand-200 cursor-pointer">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 shrink-0 relative">
                                        <MessageSquare className="h-5 w-5 text-brand-600" />
                                        {s.hasFile && (
                                            <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 border border-border">
                                                <Paperclip className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        )}
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
