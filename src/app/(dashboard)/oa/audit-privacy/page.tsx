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
                <CardContent className="p-6 space-y-6 bg-white/50">
                    {/* Grid for Input and Intercepted Payload */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left: Input */}
                        <div className="flex flex-col space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                                    <User className="h-4 w-4 text-brand-500" /> Employee Query
                                </span>
                            </div>
                            <textarea
                                className="min-h-[220px] w-full flex-1 resize-y rounded-xl border border-slate-200 bg-white p-4 text-[14px] leading-relaxed text-slate-700 shadow-sm transition-all placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                                placeholder='Type a prompt with sensitive information here...'
                                value={input}
                                onChange={(e) => { setInput(e.target.value); setRan(false); }}
                            />
                        </div>

                        {/* Right: Intercepted & Sanitized Payload */}
                        <div className="flex flex-col space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> Intercepted Payload (Sent to LLM)
                                </span>
                            </div>
                            
                            <div className="relative flex min-h-[220px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner">
                                <AnimatePresence mode="wait">
                                    {loading ? (
                                        <motion.div 
                                            key="loading"
                                            initial={{ opacity: 0 }} 
                                            animate={{ opacity: 1 }} 
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
                                        >
                                            <div className="relative flex h-16 w-16 items-center justify-center">
                                                <div className="absolute inset-0 animate-ping rounded-full bg-brand-500/20" />
                                                <div className="absolute inset-0 animate-pulse rounded-full bg-brand-400/20" />
                                                <Bot className="relative z-10 h-8 w-8 text-brand-600" />
                                            </div>
                                            <div className="mt-4 flex flex-col items-center gap-1">
                                                <span className="text-xs font-bold uppercase tracking-widest text-slate-700">Sanitizing Input</span>
                                            </div>
                                        </motion.div>
                                    ) : ran ? (
                                        <motion.div 
                                            key="content"
                                            initial={{ opacity: 0 }} 
                                            animate={{ opacity: 1 }} 
                                            transition={{ duration: 0.3 }} 
                                            className="flex flex-col p-5 h-full"
                                        >
                                            <div className="text-[14px] font-mono leading-relaxed text-slate-700 h-full overflow-y-auto whitespace-pre-wrap">
                                                {sanitized || <span className="text-slate-400 italic">No content.</span>}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div 
                                            key="empty"
                                            className="flex h-full flex-1 items-center justify-center p-5"
                                        >
                                            <div className="flex flex-col items-center gap-3 text-slate-400 text-center">
                                                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                                    <Lock className="h-5 w-5 text-slate-300" /> 
                                                </div>
                                                <div>
                                                    <span className="block text-sm font-semibold text-slate-500">Awaiting simulation</span>
                                                    <span className="block text-xs mt-0.5">Click simulate to view the sanitized payload</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Simulate Button Container */}
                    <div className="flex justify-center pt-2 pb-2">
                        <Button
                            className="w-full md:w-auto min-w-[320px] bg-brand-600 py-6 px-8 text-[15px] font-semibold text-white shadow-md transition-all hover:bg-brand-700 hover:shadow-lg disabled:opacity-60 rounded-xl"
                            onClick={handleSimulate}
                            disabled={loading || !input.trim()}
                        >
                            {loading ? (
                                <><RefreshCw className="mr-2.5 h-5 w-5 animate-spin" /> Simulating Pipeline…</>
                            ) : (
                                <><Play className="mr-2.5 h-5 w-5 fill-current" /> Simulate End-to-End AI Request</>
                            )}
                        </Button>
                    </div>

                    {/* AI Response Section */}
                    <AnimatePresence>
                        {ran && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: "auto" }} 
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-2 rounded-xl border border-brand-200 bg-brand-50/50 p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="h-4 w-4 text-brand-600" />
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-800">Reconstructed AI Response</h3>
                                    </div>
                                    <div className="rounded-lg bg-white p-5 border border-brand-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-400" />
                                        <p className="text-[14px] leading-relaxed text-slate-700 pl-2">
                                            {aiResponse}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
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
