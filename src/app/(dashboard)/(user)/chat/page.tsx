"use client";

import { useState, useRef, useEffect } from "react";
import {
    Send, Plus, Paperclip, Mic, Bot, User, Shield, Sparkles,
    ChevronDown, Eye, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MODELS, DEFAULT_MODEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import type { LLMModel } from "@/types/chat.types";

/* ── Types ──────────────────────────────────────────── */
interface AnonymizedEntity {
    original: string;
    replacement: string;
    type: "PERSON" | "ORG" | "PROJECT" | "LOCATION" | "DATE" | "EMAIL" | "PHONE" | "CUSTOM";
}

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    anonymizedContent?: string;
    entities?: AnonymizedEntity[];
    timestamp: Date;
}

/* ── Mock PII detection ──────────────────────────────── */
function detectEntities(text: string): AnonymizedEntity[] {
    const patterns: { regex: RegExp; type: AnonymizedEntity["type"]; prefix: string }[] = [
        { regex: /\b(Ahmed|Khan|Sarah|John|Alex|Fatima|Carlos|Raj|Lisa)\b/gi, type: "PERSON", prefix: "PERSON" },
        { regex: /\b(Samsung|Google|Apple|Acme|Microsoft|Amazon|OpenAI)\b/gi, type: "ORG", prefix: "ORG" },
        { regex: /\b(Enigma|Falcon|Phoenix|Atlas|Titan|DataPipe)\b/gi, type: "PROJECT", prefix: "PROJECT" },
        { regex: /\b(New York|London|Berlin|Singapore|Karachi|Dubai)\b/gi, type: "LOCATION", prefix: "LOCATION" },
        { regex: /[\w.-]+@[\w.-]+\.\w+/g, type: "EMAIL", prefix: "EMAIL" },
        { regex: /\+?\d[\d\s-]{7,}/g, type: "PHONE", prefix: "PHONE" },
    ];
    const seen = new Set<string>();
    const entities: AnonymizedEntity[] = [];
    let counter = 1;

    patterns.forEach(({ regex, type, prefix }) => {
        let match;
        while ((match = regex.exec(text)) !== null) {
            const original = match[0];
            const key = `${type}:${original.toLowerCase()}`;
            if (!seen.has(key)) {
                seen.add(key);
                entities.push({ original, replacement: `[${prefix}_${counter++}]`, type });
            }
        }
    });
    return entities;
}

function anonymize(text: string, entities: AnonymizedEntity[]): string {
    let out = text;
    for (const e of entities) out = out.replaceAll(e.original, e.replacement);
    return out;
}

/* ── Entity type colours ────────────────────────────── */
const entityColors: Record<AnonymizedEntity["type"], string> = {
    PERSON: "bg-violet-100 text-violet-700 border-violet-200",
    ORG: "bg-amber-100 text-amber-700 border-amber-200",
    PROJECT: "bg-cyan-100 text-cyan-700 border-cyan-200",
    LOCATION: "bg-emerald-100 text-emerald-700 border-emerald-200",
    DATE: "bg-rose-100 text-rose-700 border-rose-200",
    EMAIL: "bg-blue-100 text-blue-700 border-blue-200",
    PHONE: "bg-orange-100 text-orange-700 border-orange-200",
    CUSTOM: "bg-gray-100 text-gray-700 border-gray-200",
};

const welcomeExamples = [
    "Analyze this contract for GDPR compliance risks",
    "Help me draft a privacy policy for my SaaS product",
    "Review this code for security vulnerabilities",
    "Summarize quarterly financial performance",
];

/* ══════════════════════════════════════════════════════
   Chat Page
   ══════════════════════════════════════════════════════ */
export default function ChatPage() {
    const { user } = useAuthStore();
    const showContextBadge = user?.role === 'PROFESSIONAL' && (user?.subscriptionTier === 'PRO' || user?.subscriptionTier === 'MAX');

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [model, setModel] = useState<LLMModel>(DEFAULT_MODEL);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedEntities, setExpandedEntities] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const entities = detectEntities(input);
        const anonymizedContent = anonymize(input, entities);

        const userMsg: Message = {
            id: `msg-${Date.now()}`,
            role: "user",
            content: input,
            anonymizedContent,
            entities,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        await new Promise((r) => setTimeout(r, 1500));

        const assistantMsg: Message = {
            id: `msg-${Date.now() + 1}`,
            role: "assistant",
            content: "I've analyzed your request. Here's a detailed response with all sensitive information properly handled through D-SecureAI's anonymization pipeline.\n\nThe data has been processed through our PII detection engine, ensuring that personal identifiers, organization names, and project references are properly masked before reaching the AI model.\n\n**Key findings:**\n1. All PII entities were successfully detected and anonymized\n2. Context-aware mapping ensured referential consistency\n3. The response has been de-anonymized for your viewing",
            entities: entities.length > 0 ? entities : [],
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const toggleEntities = (id: string) =>
        setExpandedEntities((prev) => (prev === id ? null : id));

    const selectedModel = MODELS.find((m) => m.id === model);

    /* ── Entity badge row component ─── */
    const EntityBadges = ({
        entities,
        variant,
    }: {
        entities: AnonymizedEntity[];
        variant: "light" | "dark";
    }) => (
        <div className="flex flex-wrap gap-1.5 mt-2">
            {entities.map((e, i) => (
                <span
                    key={i}
                    className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                        variant === "dark"
                            ? "border-white/20 bg-white/10 text-white/90"
                            : entityColors[e.type]
                    )}
                >
                    <span className="font-mono">{e.replacement}</span>
                    <span className="opacity-50">←</span>
                    <span>{e.original}</span>
                </span>
            ))}
        </div>
    );

    return (
        <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col">
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                        <Sparkles className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">AI Chat</h2>
                        <p className="text-xs text-muted-foreground">Your data is anonymized before reaching the AI</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Context shortcut — professionals with PRO/MAX subscriptions only */}
                    {showContextBadge && (
                        <Link href="/context">
                            <Badge
                                variant="outline"
                                className="cursor-pointer gap-1.5 border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors text-[11px] py-1"
                            >
                                <Shield className="h-3 w-3" />
                                My Context Active
                                <ExternalLink className="h-3 w-3 opacity-60" />
                            </Badge>
                        </Link>
                    )}

                    <Select value={model} onValueChange={(v) => setModel(v as LLMModel)}>
                        <SelectTrigger className="w-48 h-9">
                            <SelectValue>{selectedModel?.name || model}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {MODELS.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                    <div className="flex items-center gap-2">
                                        <span>{m.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{m.providerName}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon" className="h-9 w-9" title="New chat">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* ─── Messages ─── */}
            <div className="flex flex-1 flex-col overflow-y-auto space-y-4 pr-2">
                {messages.length === 0 ? (
                    <div className="m-auto flex w-full max-w-lg flex-col items-center justify-center text-center py-8">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-50 mb-4">
                            <Shield className="h-8 w-8 text-brand-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">Privacy-First AI Assistant</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Your prompts are automatically anonymized before being sent to the AI model.
                            Personal data never leaves your device in plaintext.
                        </p>
                        <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
                            {welcomeExamples.map((ex) => (
                                <button
                                    key={ex}
                                    onClick={() => { setInput(ex); textareaRef.current?.focus(); }}
                                    className="rounded-xl border border-border p-3 text-left text-sm text-muted-foreground transition-all hover:border-brand-300 hover:bg-brand-50/50 hover:text-foreground"
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "")}>
                            {msg.role === "assistant" && (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 mt-1">
                                    <Bot className="h-4 w-4 text-brand-600" />
                                </div>
                            )}

                            <div className={cn(
                                "max-w-[75%] rounded-2xl px-4 py-3",
                                msg.role === "user" ? "bg-brand-600 text-white" : "bg-muted"
                            )}>
                                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>

                                {/* ─── Anonymization entity viewer ─── */}
                                {msg.entities && msg.entities.length > 0 && (
                                    <div className={cn(
                                        "mt-2 border-t pt-2",
                                        msg.role === "user" ? "border-white/20" : "border-border"
                                    )}>
                                        <button
                                            onClick={() => toggleEntities(msg.id)}
                                            className={cn(
                                                "flex items-center gap-1.5 text-[11px] font-medium transition-colors",
                                                msg.role === "user"
                                                    ? "text-white/70 hover:text-white"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <Eye className="h-3 w-3" />
                                            {expandedEntities === msg.id ? "Hide" : "View"}{" "}
                                            {msg.entities.length} anonymized {msg.entities.length === 1 ? "entity" : "entities"}
                                            <ChevronDown className={cn(
                                                "h-3 w-3 transition-transform",
                                                expandedEntities === msg.id && "rotate-180"
                                            )} />
                                        </button>

                                        {expandedEntities === msg.id && (
                                            <>
                                                <EntityBadges
                                                    entities={msg.entities}
                                                    variant={msg.role === "user" ? "dark" : "light"}
                                                />
                                                {/* Show the anonymized prompt only on user messages */}
                                                {msg.role === "user" && msg.anonymizedContent && (
                                                    <div className="mt-2 rounded-lg bg-black/20 p-2.5 text-[11px] font-mono leading-relaxed text-white/80">
                                                        <p className="mb-1 font-sans text-[10px] text-white/50">
                                                            Anonymized prompt sent to AI:
                                                        </p>
                                                        {msg.anonymizedContent}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                <p className={cn(
                                    "mt-1 text-[10px]",
                                    msg.role === "user" ? "text-white/50" : "text-muted-foreground"
                                )}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                            </div>

                            {msg.role === "user" && (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/10 mt-1">
                                    <User className="h-4 w-4 text-foreground" />
                                </div>
                            )}
                        </div>
                    ))
                )}

                {/* Typing indicator */}
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 mt-1">
                            <Bot className="h-4 w-4 text-brand-600" />
                        </div>
                        <div className="rounded-2xl bg-muted px-4 py-3">
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* ─── Input area ─── */}
            <div className="mt-4 shrink-0">
                <div className="relative rounded-2xl border border-border bg-white shadow-sm focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message… Your data will be anonymized automatically."
                        rows={1}
                        className="w-full resize-none bg-transparent px-4 pt-3.5 pb-12 text-sm placeholder:text-muted-foreground focus:outline-none"
                        style={{ minHeight: 52, maxHeight: 160 }}
                    />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Attach file">
                                <Paperclip className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Voice input">
                                <Mic className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] text-success border-success/30 bg-success/5">
                                <Shield className="mr-1 h-3 w-3" />Anonymization Active
                            </Badge>
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                size="icon"
                                className="h-8 w-8 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-40"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    All prompts are processed through D-SecureAI&apos;s PII anonymization engine before reaching{" "}
                    {selectedModel?.name || "the AI model"}.
                </p>
            </div>
        </div>
    );
}
