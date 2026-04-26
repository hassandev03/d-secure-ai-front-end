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
    Eye,
    X,
    MessageSquare,
    Building2,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getOAQueryLogs, type OAQueryLog } from "@/services/oa.service";

// â”€â”€ PII category colour map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Mock chat messages for demo (real backend returns via session_id) â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MOCK_CHAT: Record<string, { role: "user" | "assistant"; content: string; anonymized?: string }[]> = {
    default: [
        { role: "user",      content: "Please summarize the performance review for Sarah Connor. Her email is sarah.connor@acme.com and her SSN is 123-45-6789.",
          anonymized: "Please summarize the performance review for [PERSON_NAME_1]. Her email is [EMAIL_1] and her SSN is [SSN_1]." },
        { role: "assistant", content: "Based on the anonymized query, here is a summary of [PERSON_NAME_1]'s performance review..." },
        { role: "user",      content: "Also pull their credit card on file: 4532-1234-5678-9012.",
          anonymized: "Also pull their credit card on file: [CARD_NUMBER_1]." },
        { role: "assistant", content: "The card ending in [CARD_NUMBER_1] has been located. All financial identifiers have been masked." },
    ],
};

// â”€â”€ Chat View Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ChatViewPanel({ log, onClose }: { log: OAQueryLog; onClose: () => void }) {
    const messages = MOCK_CHAT[log.id] ?? MOCK_CHAT.default;

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Slide-over panel */}
            <motion.div
                key="panel"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100">
                            <MessageSquare className="h-4 w-4 text-brand-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">{log.employeeEmail}</p>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                                <span className="font-mono">{log.employeeId}</span>
                                <span>Â·</span>
                                <Building2 className="h-3 w-3" />
                                <span>{log.department}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* PII detected summary */}
                <div className="border-b border-slate-100 bg-amber-50/60 px-5 py-3">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" /> Sensitive Data Detected
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {log.piiDetected.map((p) => <PiiBadge key={p} type={p} />)}
                    </div>
                </div>

                {/* Timestamp */}
                <div className="border-b border-slate-100 px-5 py-2">
                    <p className="text-[11px] font-mono text-slate-400">
                        <Clock className="mr-1 inline h-3 w-3" />{log.timestamp}
                    </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {messages.map((msg, i) => (
                        <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                            <div className={cn(
                                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                                msg.role === "user"
                                    ? "rounded-br-sm bg-brand-600 text-white"
                                    : "rounded-bl-sm bg-slate-100 text-slate-800",
                            )}>
                                {msg.role === "user" && msg.anonymized ? (
                                    <div className="space-y-2">
                                        <div>
                                            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-200">Original (visible to org admin)</p>
                                            <p className="text-white/90 line-through decoration-brand-300/60">{msg.content}</p>
                                        </div>
                                        <div className="rounded-lg border border-brand-400/30 bg-brand-700/40 px-3 py-2">
                                            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-200">Sent to LLM (anonymized)</p>
                                            <p className="font-mono text-[13px] text-emerald-300">{msg.anonymized}</p>

                                        </div>
                                    </div>
                                ) : (
                                    msg.content
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer note */}
                <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
                    <p className="text-center text-xs text-slate-400">
                        Showing read-only audit view. Employee cannot see this panel.
                    </p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// â”€â”€ Privacy Engine Simulator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PRESET_EXAMPLES = [
    { label: "HR Query", text: 'Please summarize the performance review for Sarah Connor. Her email is sarah.connor@acme.com and her SSN is 123-45-6789.' },
    { label: "Finance Support", text: 'Process refund of $500 for credit card 4532-1234-5678-9012. Customer phone is +44 7911 123456.' },
];

type SimStep = "input" | "anonymized" | "responded";

interface SimResult {
    anonymized_text: string;
    entities: { label: string; text: string; replacement: string; category: string }[];
    entity_count: number;
    categories_detected: string[];
}

function PrivacyEngineSim() {
    const [input, setInput] = useState("");
    const [step, setStep] = useState<SimStep>("input");
    const [anonymizing, setAnonymizing] = useState(false);
    const [sending, setSending] = useState(false);
    const [simResult, setSimResult] = useState<SimResult | null>(null);
    const [rawAIResponse, setRawAIResponse] = useState("");
    const [deanonResponse, setDeanonResponse] = useState("");

    const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

    const handleAnonymize = async () => {
        if (!input.trim()) return;
        setAnonymizing(true);
        setStep("input");
        try {
            const res = await fetch(`${API}/analytics/privacy/simulate`, {
                method: "POST", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: input }),
            });
            if (res.ok) {
                const data: SimResult = await res.json();
                setSimResult(data);
            } else {
                throw new Error("Backend not OK");
            }
            setStep("anonymized");
        } catch (e) {
            // Fallback mock when backend isn't connected or throws NetworkError
            const mockAnon = input
                .replace(/\b[\w.-]+@[\w.-]+\.\w{2,}\b/g, "[EMAIL_1]")
                .replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, "[CARD_1]")
                .replace(/\b\+?[\d\s-]{10,}\b/g, "[PHONE_1]")
                .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, "[PERSON_1]")
                .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN_1]");
            setSimResult({
                anonymized_text: mockAnon,
                entities: [],
                entity_count: 0,
                categories_detected: ["PERSONALLY_IDENTIFIABLE_INFO"],
            });
            setStep("anonymized");
        } finally {
            setAnonymizing(false);
        }
    };

    const handleSend = async () => {
        if (!simResult) return;
        setSending(true);
        try {
            // Simulate LLM response (replace with real endpoint once chat is wired for simulator)
            await new Promise((r) => setTimeout(r, 1400));

            const mockRaw = `Based on the anonymized query:\n\n"${simResult.anonymized_text}"\n\nHere is a detailed response addressing [PERSON_1]'s request. All references such as [EMAIL_1], [CARD_1], and [SSN_1] have been safely masked before this response was generated. The system processed ${simResult.entity_count} entity/entities across categories: ${simResult.categories_detected.join(", ")}.`;

            // De-anonymize: reverse-map tokens back to original values
            let restored = mockRaw;
            for (const ent of (simResult.entities ?? [])) {
                restored = restored.replace(new RegExp(escapeRe(ent.replacement), "g"), ent.text);
            }
            // If no entities (mock mode), do basic restore
            if (!simResult.entities.length) {
                restored = mockRaw
                    .replace(/\[EMAIL_1\]/g, input.match(/\b[\w.-]+@[\w.-]+\.\w{2,}\b/)?.[0] ?? "[EMAIL]")
                    .replace(/\[PERSON_1\]/g, input.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/)?.[0] ?? "[PERSON]")
                    .replace(/\[CARD_1\]/g,   input.match(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/)?.[0] ?? "[CARD]")
                    .replace(/\[SSN_1\]/g,    input.match(/\b\d{3}-\d{2}-\d{4}\b/)?.[0] ?? "[SSN]");
            }

            setRawAIResponse(mockRaw);
            setDeanonResponse(restored);
            setStep("responded");
        } finally {
            setSending(false);
        }
    };

    const reset = () => { setStep("input"); setSimResult(null); setRawAIResponse(""); setDeanonResponse(""); };

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
                                See how D-SecureAI intercepts, anonymizes, and de-anonymizes PII in real-time.
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {PRESET_EXAMPLES.map((ex, i) => (
                            <Button key={i} variant="outline" size="sm"
                                className="h-8 px-3 text-xs font-semibold bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                                onClick={() => { setInput(ex.text); reset(); }}
                            >
                                Example: {ex.label}
                            </Button>
                        ))}
                    </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6 bg-white/50">
                    {/* Row 1: Input | Anonymized */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left: Employee Query */}
                        <div className="flex flex-col space-y-2">
                            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                                <User className="h-4 w-4 text-brand-500" /> Employee Query
                            </span>
                            <textarea
                                className="min-h-[180px] w-full flex-1 resize-y rounded-xl border border-slate-200 bg-white p-4 text-[14px] leading-relaxed text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                                placeholder="Type a prompt with sensitive information here..."
                                value={input}
                                onChange={(e) => { setInput(e.target.value); reset(); }}
                            />
                        </div>

                        {/* Right: Anonymized Payload */}
                        <div className="flex flex-col space-y-2">
                            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Anonymized (Sent to LLM)
                            </span>
                            <div className="relative flex min-h-[180px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner">
                                <AnimatePresence mode="wait">
                                    {anonymizing ? (
                                        <motion.div key="anon-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
                                        >
                                            <div className="relative flex h-14 w-14 items-center justify-center">
                                                <div className="absolute inset-0 animate-ping rounded-full bg-brand-500/20" />
                                                <Bot className="relative z-10 h-7 w-7 text-brand-600" />
                                            </div>
                                            <span className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-700">Detecting PII...</span>
                                        </motion.div>
                                    ) : simResult ? (
                                        <motion.div key="anon-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 h-full flex flex-col gap-2">
                                            <p className="font-mono text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap flex-1">{simResult.anonymized_text}</p>
                                            {simResult.entity_count > 0 && (
                                                <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200 mt-1">
                                                    {simResult.categories_detected.map((c) => <PiiBadge key={c} type={c} />)}
                                                </div>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div key="anon-empty" className="flex h-full flex-1 items-center justify-center p-5">
                                            <div className="flex flex-col items-center gap-3 text-slate-400 text-center">
                                                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                                    <Lock className="h-5 w-5 text-slate-300" />
                                                </div>
                                                <span className="text-sm font-semibold text-slate-500">Awaiting anonymization</span>
                                                <span className="text-xs">Click Anonymize to mask PII</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button
                            className="min-w-[200px] bg-brand-600 py-5 px-8 text-[14px] font-semibold text-white shadow-md hover:bg-brand-700 disabled:opacity-60 rounded-xl"
                            onClick={handleAnonymize}
                            disabled={anonymizing || !input.trim()}
                        >
                            {anonymizing
                                ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Anonymizing...</>
                                : <><Sparkles className="mr-2 h-4 w-4" /> Anonymize</>
                            }
                        </Button>

                        <AnimatePresence>
                            {step === "anonymized" && (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                    <Button
                                        className="min-w-[200px] bg-emerald-600 py-5 px-8 text-[14px] font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60 rounded-xl"
                                        onClick={handleSend}
                                        disabled={sending}
                                    >
                                        {sending
                                            ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Sending to AI...</>
                                            : <><Play className="mr-2 h-4 w-4 fill-current" /> Send to AI</>
                                        }
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Row 2: Raw AI Response | De-anonymized Response */}
                    <AnimatePresence>
                        {step === "responded" && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 22 }}
                                className="overflow-hidden"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                    {/* Raw LLM response */}
                                    <div className="flex flex-col space-y-2">
                                        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                                            <Bot className="h-4 w-4 text-slate-400" /> Raw AI Response (tokens still masked)
                                        </span>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-inner min-h-[140px]">
                                            <p className="font-mono text-[13px] leading-relaxed text-slate-600 whitespace-pre-wrap">{rawAIResponse}</p>
                                        </div>
                                    </div>

                                    {/* De-anonymized response */}
                                    <div className="flex flex-col space-y-2">
                                        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                                            <Sparkles className="h-4 w-4 text-brand-500" /> De-anonymized Response (shown to employee)
                                        </span>
                                        <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 shadow-inner min-h-[140px] relative overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-400 rounded-l-xl" />
                                            <p className="text-[13px] leading-relaxed text-slate-700 pl-2 whitespace-pre-wrap">{deanonResponse}</p>
                                        </div>
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

function escapeRe(str: string) { return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }


const PAGE_SIZE = 8;


function QueryLogsTable({ logs, onView }: { logs: OAQueryLog[]; onView: (log: OAQueryLog) => void }) {
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
                        placeholder="Search logs..."
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
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
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
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => onView(log)}
                                                title="View chat"
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                                            >
                                                <Eye className="h-3.5 w-3.5" /> View Chat
                                            </button>
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
                        Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}â€“{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries
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

// â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function AuditPrivacyPage() {
    const [logs, setLogs] = useState<OAQueryLog[]>([]);
    const [selectedLog, setSelectedLog] = useState<OAQueryLog | null>(null);

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
            <QueryLogsTable logs={logs} onView={setSelectedLog} />

            {/* Chat View Panel */}
            {selectedLog && (
                <ChatViewPanel log={selectedLog} onClose={() => setSelectedLog(null)} />
            )}
        </div>
    );
}
