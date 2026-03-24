"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Shield,
    ShieldCheck,
    Bot,
    Search,
    Clock,
    User,
    Layers,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Zap,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getOAQueryLogs, type OAQueryLog } from "@/services/oa.service";

// ── PII category colour map ──────────────────────────────────────────────────

const PII_COLORS: Record<string, string> = {
    FINANCIAL_DATA:               "bg-emerald-100 text-emerald-700 border-emerald-200",
    PERSONALLY_IDENTIFIABLE_INFO: "bg-info/10 text-info border-info/20",
    PROTECTED_HEALTH_INFO:        "bg-danger/10 text-danger border-danger/20",
    INTELLECTUAL_PROPERTY:        "bg-purple-100 text-purple-700 border-purple-200",
    CORPORATE_SECRETS:            "bg-orange-100 text-orange-700 border-orange-200",
    CREDENTIALS:                  "bg-warning/10 text-warning border-warning/20",
    SYSTEM_AND_NETWORK_DATA:      "bg-slate-100 text-slate-700 border-slate-200",
};

function PiiBadge({ type }: { type: string }) {
    const cls = PII_COLORS[type] ?? "bg-muted text-muted-foreground border-border";
    return (
        <span className={cn(
            "inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide mr-1 mb-1",
            cls,
        )}>
            {type.replace(/_/g, " ")}
        </span>
    );
}

// ── Privacy Engine Simulator ─────────────────────────────────────────────────

const SAMPLE_PII: { pattern: RegExp; label: string; color: string }[] = [
    { pattern: /\b[\w.-]+@[\w.-]+\.\w{2,}\b/g,             label: "EMAIL",        color: "#f59e0b" },
    { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, label: "CARD",     color: "#ef4444" },
    { pattern: /\b\+?\d[\d\s-]{8,}\d\b/g,                  label: "PHONE",        color: "#f97316" },
    { pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,             label: "PERSON",       color: "#3b82f6" },
];

function highlight(text: string) {
    let result = text;
    for (const { pattern, label, color } of SAMPLE_PII) {
        result = result.replace(pattern, (match) =>
            `<mark style="background:${color}22;color:${color};border-radius:4px;padding:1px 4px" title="${label}">${match}</mark>`
        );
    }
    return result;
}

function sanitize(text: string) {
    let result = text;
    const replacements: [RegExp, string][] = [
        [/\b[\w.-]+@[\w.-]+\.\w{2,}\b/g,             "[EMAIL_ADDRESS]"],
        [/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[CARD_NUMBER]"],
        [/\b\+?\d[\d\s-]{8,}\d\b/g,                  "[PHONE_NUMBER]"],
        [/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,             "[PERSON_NAME]"],
    ];
    for (const [pat, repl] of replacements) result = result.replace(pat, repl);
    return result;
}

function PrivacyEngineSim() {
    const [input, setInput] = useState("");
    const [ran, setRan] = useState(false);
    const [loading, setLoading] = useState(false);

    const sanitized = useMemo(() => sanitize(input), [input]);
    const highlighted = useMemo(() => highlight(input), [input]);

    const handleSimulate = async () => {
        if (!input.trim()) return;
        setLoading(true);
        await new Promise((r) => setTimeout(r, 900));
        setRan(true);
        setLoading(false);
    };

    const aiResponse = ran
        ? `Based on the anonymized query, here is a relevant AI-generated response. All references to [PERSON_NAME], [EMAIL_ADDRESS], [CARD_NUMBER], and [PHONE_NUMBER] have been preserved as tokens and will be restored in the final response delivered to the employee.`
        : "";

    return (
        <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0 pb-3">
                <Shield className="h-4 w-4 text-brand-700" />
                <div>
                    <CardTitle className="text-base font-semibold">Privacy Engine Simulator</CardTitle>
                    <CardDescription className="mt-0.5">
                        Test how D-SecureAI detects and anonymizes PII before queries reach the LLM.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Input */}
                    <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Test Input — Simulate Employee Query
                        </p>
                        <textarea
                            className="min-h-[140px] w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                            placeholder={`Try: "My credit card is 4532-1234-5678-9012. Email john.doe@example.com or call +44 7911 123456."`}
                            value={input}
                            onChange={(e) => { setInput(e.target.value); setRan(false); }}
                        />
                    </div>

                    {/* Sanitized output */}
                    <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Sanitized Output — Sent to LLM
                        </p>
                        <div className="min-h-[140px] flex-1 rounded-lg border border-border bg-slate-950 px-3 py-2.5 font-mono text-sm text-slate-300">
                            {ran
                                ? <span>{sanitized || <span className="text-slate-500">No PII detected.</span>}</span>
                                : <span className="text-slate-500 italic">// output will appear here…</span>
                            }
                        </div>
                    </div>
                </div>

                {/* Detected PII highlight */}
                {ran && input && (
                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm">
                        <p className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Detected PII Highlighted
                        </p>
                        <span dangerouslySetInnerHTML={{ __html: highlighted }} />
                    </div>
                )}

                <Button
                    className="w-full bg-brand-700 hover:bg-brand-800"
                    onClick={handleSimulate}
                    disabled={loading || !input.trim()}
                >
                    {loading ? (
                        <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Running…</>
                    ) : (
                        <><Zap className="mr-2 h-4 w-4" /> Simulate End-to-End AI Request</>
                    )}
                </Button>

                {/* AI response */}
                <div className="flex flex-col gap-1.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <Bot className="h-3.5 w-3.5 text-brand-600" />
                        AI Response — Generated from Sanitized Content
                    </p>
                    <div className="min-h-[80px] rounded-lg border border-brand-100 bg-brand-50/50 px-3 py-2.5 text-sm text-muted-foreground">
                        {aiResponse || <span className="italic">Click the button above to see how the AI responds to the masked data…</span>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ── Pagination constants ──────────────────────────────────────────────────────

const PAGE_SIZE = 8;

// ── Query Logs Table ─────────────────────────────────────────────────────────

function QueryLogsTable({ logs }: { logs: OAQueryLog[] }) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return logs;
        return logs.filter((l) =>
            l.employeeEmail.toLowerCase().includes(q) ||
            l.employeeId.toLowerCase().includes(q) ||
            l.department.toLowerCase().includes(q) ||
            l.piiDetected.some((p) => p.toLowerCase().includes(q)) ||
            l.timestamp.includes(q)
        );
    }, [logs, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // reset to page 1 when filter changes
    useEffect(() => setPage(1), [search]);

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-brand-700" />
                    <div>
                        <CardTitle className="text-base font-semibold">Recent Query Logs</CardTitle>
                        <CardDescription className="mt-0.5">
                            Employee AI queries where sensitive information was detected and anonymized.
                        </CardDescription>
                    </div>
                </div>
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search logs…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 rounded-md border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/30 w-48"
                    />
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/40">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Timestamp</span>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                    <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Employee Email / ID</span>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                    <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> Department</span>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                    <span className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Type of Sensitive Info Detected</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                                        No query logs match your search.
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((log) => (
                                    <tr key={log.id} className="transition-colors hover:bg-muted/30">
                                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                                            {log.timestamp}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-foreground">{log.employeeEmail}</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground font-mono">{log.employeeId}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className="text-xs font-medium">
                                                {log.department}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap">
                                                {log.piiDetected.map((p) => (
                                                    <PiiBadge key={p} type={p} />
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination footer */}
                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                        Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <Button
                                key={p}
                                variant={p === page ? "default" : "outline"}
                                size="sm"
                                className={cn("h-7 w-7 p-0 text-xs", p === page && "bg-brand-700 hover:bg-brand-800")}
                                onClick={() => setPage(p)}
                            >
                                {p}
                            </Button>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuditPrivacyPage() {
    const [logs, setLogs] = useState<OAQueryLog[]>([]);

    useEffect(() => {
        getOAQueryLogs().then(setLogs);
    }, []);

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <PageHeader
                title="Audit & Privacy"
                subtitle="Monitor employee queries and verify PII redaction systems."
                breadcrumbs={[
                    { label: "Organization", href: "/oa/dashboard" },
                    { label: "Audit & Privacy" },
                ]}
            />

            {/* Privacy Engine Simulator */}
            <PrivacyEngineSim />

            {/* Query Logs */}
            <QueryLogsTable logs={logs} />
        </div>
    );
}
