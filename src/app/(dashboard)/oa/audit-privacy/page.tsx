"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    Play,
    Sparkles,
    Lock,
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

const PRESET_EXAMPLES = [
    { label: "HR Query", text: 'Please summarize the performance review for Sarah Connor. Her email is sarah.connor@acme.com and her SSN is 123-45-6789.' },
    { label: "Finance Support", text: 'Process refund of $500 for credit card 4532-1234-5678-9012. Customer phone is +44 7911 123456.' }
];

const SAMPLE_PII: { pattern: RegExp; label: string; color: string }[] = [
    { pattern: /\b[\w.-]+@[\w.-]+\.\w{2,}\b/g,               label: "EMAIL",         color: "#fbbf24" },
    { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,   label: "CARD",          color: "#f87171" },
    { pattern: /\b\+?\d[\d\s-]{8,}\d\b/g,                    label: "PHONE",         color: "#fb923c" },
    { pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,               label: "PERSON",        color: "#60a5fa" },
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/g,                   label: "SSN",          color: "#a78bfa" },
    { pattern: /\$\d+(?:,\d{3})*(?:\.\d{2})?/g,            label: "MONEY",        color: "#34d399" },
];

function highlight(text: string) {
    let result = text;
    for (const { pattern, label, color } of SAMPLE_PII) {
        result = result.replace(pattern, (match) =>
            `<mark style="background:${color}20;color:${color};border:1px solid ${color}40;border-radius:4px;padding:2px 4px;font-size:0.9em;display:inline-flex;align-items:center;line-height:1;margin:0 2px" title="${label}">${match} <span style="font-size:0.75em;margin-left:4px;opacity:0.8;font-weight:700">${label}</span></mark>`
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
        [/\b\d{3}-\d{2}-\d{4}\b/g,                   "[SSN]"],
        [/\$\d+(?:,\d{3})*(?:\.\d{2})?/g,            "[MONETARY_VALUE]"],
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
        setRan(false);
        await new Promise((r) => setTimeout(r, 1200));
        setRan(true);
        setLoading(false);
    };

    const aiResponse = `Based on the anonymized query provided, here is a detailed response. The references such as [PERSON_NAME], [CARD_NUMBER], and [SSN] have been successfully masked, ensuring data privacy before interacting with the LLM API.`;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="overflow-hidden border-border/80 shadow-md">
                <CardHeader className="flex-col items-start gap-4 border-b border-border/50 bg-slate-50/50 pb-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 shadow-sm">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-800">Privacy Engine Simulator</CardTitle>
                            <CardDescription className="mt-0.5 text-[13px] text-slate-500">
                                See how D-SecureAI intercepts and masks PII in real-time.
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {PRESET_EXAMPLES.map((ex, i) => (
                            <Button 
                                key={i} 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-3 text-xs font-semibold bg-white hover:bg-slate-50 border-slate-200 text-slate-600 transition-all hover:border-slate-300"
                                onClick={() => { setInput(ex.text); setRan(false); }}
                            >
                                Example: {ex.label}
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid divide-y md:grid-cols-2 md:divide-y-0 md:divide-x text-sm">
                        {/* Input Column */}
                        <div className="flex flex-col bg-white p-5 lg:p-6 pb-6 hover:bg-slate-50/50 transition-colors">
                            <div className="mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <User className="h-4 w-4" /> Employee Query
                                </span>
                            </div>
                            <textarea
                                className="min-h-[180px] w-full flex-1 resize-y rounded-xl border border-slate-200 bg-white p-4 text-[14px] leading-relaxed text-slate-700 shadow-sm transition-all placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                                placeholder='Type a prompt with sensitive information here...'
                                value={input}
                                onChange={(e) => { setInput(e.target.value); setRan(false); }}
                            />
                            <Button
                                className="mt-5 w-full bg-brand-700 py-6 text-[14px] font-semibold text-white shadow-md transition-all hover:bg-brand-800 hover:shadow-lg disabled:opacity-60"
                                onClick={handleSimulate}
                                disabled={loading || !input.trim()}
                            >
                                {loading ? (
                                    <><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Processing via Gateway…</>
                                ) : (
                                    <><Play className="mr-2 h-5 w-5 fill-current" /> Simulate Pipeline</>
                                )}
                            </Button>
                        </div>

                        {/* Output Column */}
                        <div className="relative flex flex-col bg-slate-950 p-5 lg:p-6 text-slate-300">
                            {/* Loading Overlay */}
                            <AnimatePresence>
                                {loading && (
                                    <motion.div 
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md"
                                    >
                                        <div className="relative flex h-20 w-20 items-center justify-center">
                                            <div className="absolute inset-0 animate-ping rounded-full bg-brand-500/40" />
                                            <div className="absolute inset-0 animate-pulse rounded-full bg-brand-600/30 blur-xl" />
                                            <Lock className="relative z-10 h-8 w-8 text-white" />
                                        </div>
                                        <div className="mt-8 flex flex-col items-center gap-1.5">
                                            <span className="text-sm font-bold uppercase tracking-widest text-white">Anonymizing Entities</span>
                                            <span className="text-xs text-brand-300/80">Running advanced NLP models...</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex h-full flex-col">
                                <span className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400">
                                    <Bot className="h-4 w-4" /> Payload Sent to LLM
                                </span>
                                <div className="min-h-[180px] flex-1 rounded-xl border border-brand-900/40 bg-[#0f172a] p-5 font-mono text-[13px] leading-relaxed shadow-inner overflow-hidden flex flex-col">
                                    <AnimatePresence mode="wait">
                                        {ran ? (
                                            <motion.div initial={{ opacity: 0, filter: "blur(4px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ duration: 0.4 }} className="space-y-6">
                                                {/* Original Highlights */}
                                                <div>
                                                    <span className="mb-2.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">1. Detection Layer</span>
                                                    <div dangerouslySetInnerHTML={{ __html: highlighted || '<span class="text-slate-600 italic">No input.</span>' }} className="text-slate-400 leading-loose" />
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <div className="h-px w-full bg-brand-900/30" />
                                                    <Zap className="h-3 w-3 shrink-0 text-brand-500 opacity-50" />
                                                    <div className="h-px w-full bg-brand-900/30" />
                                                </div>

                                                {/* Anonymized */}
                                                <div>
                                                    <span className="mb-2.5 block text-[10px] font-bold uppercase tracking-widest text-emerald-800">2. Sanitized Layer</span>
                                                    <div className="text-emerald-400 font-medium leading-loose">
                                                        {sanitized || <span className="text-slate-600 italic">No content.</span>}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <div className="flex h-full flex-1 items-center justify-center">
                                                <span className="text-brand-900/60 flex items-center gap-2.5 text-xs italic font-medium">
                                                    <Shield className="h-5 w-5 opacity-60" /> Awaiting simulation input...
                                                </span>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                
                                {/* AI Response Preview */}
                                <AnimatePresence>
                                    {ran && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 15 }} 
                                            animate={{ opacity: 1, y: 0 }} 
                                            transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
                                            className="mt-5 rounded-xl border border-brand-800/40 bg-gradient-to-r from-brand-950 to-brand-900/20 p-4 shadow-lg ring-1 ring-white/5"
                                        >
                                            <span className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-brand-300">
                                                <Sparkles className="h-3.5 w-3.5 fill-current opacity-80" /> Reconstructed AI Response
                                            </span>
                                            <p className="text-[13px] leading-relaxed text-slate-300/90">
                                                {aiResponse}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
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
