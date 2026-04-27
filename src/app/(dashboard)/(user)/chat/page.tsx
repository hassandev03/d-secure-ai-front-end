"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Send, Plus, Paperclip, Mic, Bot, User, Shield, Sparkles,
    ChevronDown, Eye, ExternalLink, X, FileText, AlertTriangle, CreditCard, Lock, Loader2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MODELS, DEFAULT_MODEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import type { LLMModel } from "@/types/chat.types";
import {
    getChatSession, getChatMessages, sendMessage,
    QuotaExceededError, SubscriptionRequiredError, PolicyViolationError,
    type ChatMessage, type AnonymizedEntity,
} from "@/services/chat.service";

/* ── Entity type colours ────────────────────────────── */
const entityColors: Record<string, string> = {
    PERSON: "bg-violet-100 text-violet-700 border-violet-200",
    ORG: "bg-amber-100 text-amber-700 border-amber-200",
    PROJECT: "bg-cyan-100 text-cyan-700 border-cyan-200",
    LOCATION: "bg-emerald-100 text-emerald-700 border-emerald-200",
    DATE: "bg-rose-100 text-rose-700 border-rose-200",
    EMAIL: "bg-blue-100 text-blue-700 border-blue-200",
    PHONE: "bg-orange-100 text-orange-700 border-orange-200",
    CUSTOM: "bg-gray-100 text-gray-700 border-gray-200",
};

/* ── Local Message type (extends service ChatMessage for UI-only fields) ── */
interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    anonymizedContent?: string;
    entities?: AnonymizedEntity[];
    files?: string[];
    timestamp: Date;
}

const welcomeExamples = [
    "Analyze this contract for GDPR compliance risks",
    "Help me draft a privacy policy for my SaaS product",
    "Review this code for security vulnerabilities",
    "Summarize quarterly financial performance",
];

/* ══════════════════════════════════════════════════════
   Chat Page
   ══════════════════════════════════════════════════════ */
function ChatInterface() {
    const { user } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("id");

    const isPaidTier = user?.subscriptionTier === 'PRO' || user?.subscriptionTier === 'MAX';
    const showContextBadge = user?.role === 'PROFESSIONAL' && isPaidTier;
    const isOrgUser = user?.role === 'ORG_EMPLOYEE' || user?.role === 'ORG_ADMIN' || user?.role === 'DEPT_ADMIN';
    const hasContextAware = isPaidTier || isOrgUser;

    const [messages, setMessages] = useState<Message[]>([]);
    const [chatTitle, setChatTitle] = useState("AI Chat");
    const [input, setInput] = useState("");
    const [model, setModel] = useState<LLMModel>(DEFAULT_MODEL);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSession, setIsLoadingSession] = useState(false);
    const [expandedEntities, setExpandedEntities] = useState<string | null>(null);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

    // Error banner state — cleared on each new send attempt
    type ChatError =
        | { kind: 'quota';        message: string }
        | { kind: 'subscription'; message: string }
        | { kind: 'policy';       message: string }
        | { kind: 'generic';      message: string }
        | null;
    const [chatError, setChatError] = useState<ChatError>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ── Load existing chat session from URL param ── */
    useEffect(() => {
        if (!sessionId) {
            setChatTitle("AI Chat");
            setMessages([]);
            return;
        }

        setIsLoadingSession(true);
        Promise.all([getChatSession(sessionId), getChatMessages(sessionId)])
            .then(([session, chatMessages]) => {
                if (session) {
                    setChatTitle(session.title);
                    setModel(session.model);
                }
                // Convert service ChatMessage[] to local Message[]
                const mapped: Message[] = chatMessages.map((m: ChatMessage) => ({
                    id: m.id,
                    role: m.role === 'system' ? 'assistant' as const : m.role,
                    content: m.content,
                    anonymizedContent: m.anonymizedContent,
                    entities: m.entities,
                    files: m.files,
                    timestamp: new Date(m.createdAt),
                }));
                setMessages(mapped);
            })
            .finally(() => setIsLoadingSession(false));
    }, [sessionId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleNewChat = () => {
        router.push("/chat");
        setChatTitle("AI Chat");
        setMessages([]);
        setInput("");
        setAttachedFiles([]);
    };

    const handleSend = async () => {
        if ((!input.trim() && attachedFiles.length === 0) || isLoading) return;

        const currentInput = input;
        const currentFiles = attachedFiles;
        setInput("");
        setAttachedFiles([]);
        setChatError(null);   // clear previous error on every new attempt
        setIsLoading(true);

        // IMPORTANT: We do NOT render an optimistic user message here.
        // We only add messages AFTER the backend confirms the full round-trip
        // so the user never sees a message with no AI response (partial answer).
        // A typing indicator is shown via isLoading instead.

        try {
            // file_ids would come from a prior upload step (Module F).
            // currentFiles is preserved here for when that's wired up.
            void currentFiles;
            const { userMessage, assistantMessage } = await sendMessage(
                sessionId,
                currentInput,
                model,
            );

            const mapMsg = (m: ChatMessage): Message => ({
                id: m.id,
                role: m.role === 'system' ? 'assistant' : m.role,
                content: m.content,
                anonymizedContent: m.anonymizedContent,
                entities: m.entities,
                files: m.files,
                timestamp: new Date(m.createdAt as string),
            });

            setMessages(prev => [...prev, mapMsg(userMessage), mapMsg(assistantMessage)]);

        } catch (err: unknown) {
            // Classify the error and show the appropriate banner.
            // The message was never added to state, so there is no partial answer to clean up.
            if (err instanceof QuotaExceededError) {
                setChatError({ kind: 'quota', message: err.detail });
            } else if (err instanceof SubscriptionRequiredError) {
                setChatError({ kind: 'subscription', message: err.detail });
            } else if (err instanceof PolicyViolationError) {
                setChatError({ kind: 'policy', message: err.detail });
            } else {
                const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
                setChatError({ kind: 'generic', message: msg });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeAttachedFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
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
                        <h2 className="text-lg font-semibold">{chatTitle}</h2>
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

                    <Button variant="outline" size="icon" className="h-9 w-9" title="New chat" onClick={handleNewChat}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* ─── Messages ─── */}
            <div className="flex flex-1 flex-col overflow-y-auto space-y-4 pr-2">
                {isLoadingSession ? (
                    <div className="m-auto flex flex-col items-center justify-center gap-3">
                        <div className="h-8 w-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading conversation…</p>
                    </div>
                ) : messages.length === 0 ? (
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
                                {msg.files && msg.files.length > 0 && (
                                    <div className="mb-3 flex flex-wrap gap-2">
                                        {msg.files.map((file, i) => (
                                            <div key={i} className="flex items-center gap-1.5 rounded bg-brand-700 px-2.5 py-1.5 text-xs text-brand-50 shadow-sm border border-brand-500">
                                                <FileText className="h-3.5 w-3.5" />
                                                <span className="truncate max-w-[150px]">{file}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>

                                {/* ─── Anonymization entity viewer (universal) ─── */}
                                {msg.entities && msg.entities.length > 0 && (
                                    <div className={cn("mt-2 border-t pt-2", msg.role === 'user' ? 'border-white/20' : 'border-border')}>
                                        <button
                                            onClick={() => toggleEntities(msg.id)}
                                            className={cn("flex items-center gap-1.5 text-[11px] font-medium transition-colors",
                                                msg.role === 'user' ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"
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
                                                    variant={msg.role === 'user' ? "dark" : "light"}
                                                />
                                                {msg.anonymizedContent && (
                                                    <div className={cn("mt-2 rounded-lg p-2.5 text-[11px] font-mono leading-relaxed",
                                                        msg.role === 'user' ? "bg-black/20 text-white/80" : "bg-muted/50 border border-border text-foreground/80"
                                                    )}>
                                                        <p className={cn("mb-1 font-sans text-[10px]", msg.role === 'user' ? "text-white/50" : "text-muted-foreground")}>
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

            {/* ─── Error / Quota Banner ─── */}
            {chatError && (
                <div className={cn(
                    "mt-3 mb-1 rounded-xl border px-4 py-3 flex items-start gap-3 text-sm shrink-0",
                    chatError.kind === 'quota'        && "border-amber-200 bg-amber-50 text-amber-900",
                    chatError.kind === 'subscription' && "border-red-200 bg-red-50 text-red-900",
                    chatError.kind === 'policy'       && "border-purple-200 bg-purple-50 text-purple-900",
                    chatError.kind === 'generic'      && "border-red-200 bg-red-50 text-red-900",
                )}>
                    {chatError.kind === 'quota' && <CreditCard className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />}
                    {chatError.kind === 'subscription' && <CreditCard className="h-4 w-4 mt-0.5 shrink-0 text-red-600" />}
                    {chatError.kind === 'policy' && <Lock className="h-4 w-4 mt-0.5 shrink-0 text-purple-600" />}
                    {chatError.kind === 'generic' && <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-red-600" />}
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold">
                            {chatError.kind === 'quota'        && 'Credit Budget Exhausted'}
                            {chatError.kind === 'subscription' && 'Subscription Required'}
                            {chatError.kind === 'policy'       && 'Action Blocked by Policy'}
                            {chatError.kind === 'generic'      && 'Request Failed'}
                        </p>
                        <p className="text-[12px] mt-0.5 opacity-80">{chatError.message}</p>
                        {(chatError.kind === 'quota' || chatError.kind === 'subscription') && (
                            <Link
                                href="/subscription"
                                className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold underline underline-offset-2"
                            >
                                Upgrade plan <ExternalLink className="h-3 w-3" />
                            </Link>
                        )}
                    </div>
                    <button
                        onClick={() => setChatError(null)}
                        className="ml-auto shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* ─── Input area ─── */}
            <div className="mt-4 shrink-0">
                <div className="relative rounded-2xl border border-border bg-white shadow-sm focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100 p-2">
                    {attachedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 px-2 pb-2">
                            {attachedFiles.map((f, i) => (
                                <Badge key={i} variant="secondary" className="gap-1.5 py-1 px-2.5 bg-muted text-muted-foreground hover:bg-muted font-medium text-[11px] border-border">
                                    <FileText className="h-3 w-3" />
                                    {f.name}
                                    <button onClick={() => removeAttachedFile(i)} className="ml-0.5 rounded-full hover:bg-border p-0.5 transition-colors">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message… Your data will be anonymized automatically."
                        rows={1}
                        className="w-full resize-none bg-transparent px-2 pt-1.5 pb-10 text-sm placeholder:text-muted-foreground focus:outline-none"
                        style={{ minHeight: 44, maxHeight: 160 }}
                    />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <div className="flex gap-1">
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple accept=".pdf,.txt" />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Attach file" onClick={() => fileInputRef.current?.click()}>
                                <Paperclip className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Voice input">
                                <Mic className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] text-success border-success/30 bg-success/5">
                                <Shield className="mr-1 h-3 w-3" />{hasContextAware ? 'Context-Aware' : 'Basic'} Anonymization
                            </Badge>
                            <Button
                                onClick={handleSend}
                                disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
                                size="icon"
                                className="h-8 w-8 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-40"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    All prompts are processed through D-SecureAI&apos;s anonymization engine before reaching{" "}
                    {selectedModel?.name || "the AI model"}.
                </p>
            </div>
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
        }>
            <ChatInterface />
        </Suspense>
    );
}
