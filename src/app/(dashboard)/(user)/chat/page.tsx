"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Plus, Paperclip, Mic, Bot, User, Shield, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MODELS, DEFAULT_MODEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { LLMModel } from "@/types/chat.types";

interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    anonymized?: string;
    timestamp: Date;
}

const welcomeExamples = [
    "Analyze this contract for GDPR compliance risks",
    "Help me draft a privacy policy for my SaaS product",
    "Review this code for security vulnerabilities",
    "Summarize quarterly financial performance",
];

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [model, setModel] = useState<LLMModel>(DEFAULT_MODEL);
    const [isLoading, setIsLoading] = useState(false);
    const [showAnonymized, setShowAnonymized] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const userMsg: Message = {
            id: `msg-${Date.now()}`,
            role: "user",
            content: input,
            anonymized: input.replace(/John|Ahmed|Samsung|Enigma/gi, (m) => `[${m.toUpperCase()}_REDACTED]`),
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");

        setIsLoading(true);
        // Simulated AI response
        await new Promise((r) => setTimeout(r, 1500));
        const assistantMsg: Message = {
            id: `msg-${Date.now() + 1}`,
            role: "assistant",
            content: "I've analyzed your request. Here's a detailed response with all sensitive information properly handled through D-SecureAI's anonymization pipeline.\n\nThe data has been processed through our PII detection engine, ensuring that personal identifiers, organization names, and project references are properly masked before reaching the AI model.\n\n**Key findings:**\n1. All PII entities were successfully detected and anonymized\n2. Context-aware mapping ensured referential consistency\n3. The response has been de-anonymized for your viewing",
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleExampleClick = (example: string) => {
        setInput(example);
        textareaRef.current?.focus();
    };

    const selectedModel = MODELS.find((m) => m.id === model);

    return (
        <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col">
            {/* Header */}
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

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 mb-4">
                            <Shield className="h-8 w-8 text-brand-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">Privacy-First AI Assistant</h3>
                        <p className="mt-2 max-w-md text-sm text-muted-foreground">
                            Your prompts are automatically anonymized before being sent to the AI model. Personal data never leaves your organization.
                        </p>
                        <div className="mt-8 grid gap-2 sm:grid-cols-2 max-w-lg w-full">
                            {welcomeExamples.map((ex) => (
                                <button
                                    key={ex}
                                    onClick={() => handleExampleClick(ex)}
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
                                msg.role === "user"
                                    ? "bg-brand-600 text-white"
                                    : "bg-muted"
                            )}>
                                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                {msg.role === "user" && msg.anonymized && (
                                    <div className="mt-2 border-t border-white/20 pt-2">
                                        <button
                                            onClick={() => setShowAnonymized(showAnonymized === msg.id ? null : msg.id)}
                                            className="flex items-center gap-1 text-[11px] text-white/70 hover:text-white"
                                        >
                                            <Shield className="h-3 w-3" />
                                            {showAnonymized === msg.id ? "Hide" : "View"} anonymized version
                                            <ChevronDown className={cn("h-3 w-3 transition-transform", showAnonymized === msg.id && "rotate-180")} />
                                        </button>
                                        {showAnonymized === msg.id && (
                                            <p className="mt-1.5 rounded bg-black/20 p-2 text-[11px] font-mono text-white/80">{msg.anonymized}</p>
                                        )}
                                    </div>
                                )}
                                <p className={cn("mt-1 text-[10px]", msg.role === "user" ? "text-white/50" : "text-muted-foreground")}>
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

            {/* Input area */}
            <div className="mt-4 shrink-0">
                <div className="relative rounded-2xl border border-border bg-white shadow-sm focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message... Your data will be anonymized automatically."
                        rows={1}
                        className="w-full resize-none bg-transparent px-4 pt-3.5 pb-12 text-sm placeholder:text-muted-foreground focus:outline-none"
                        style={{ minHeight: 52, maxHeight: 160 }}
                    />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Attach file"><Paperclip className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Voice input"><Mic className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] text-success border-success/30 bg-success/5"><Shield className="mr-1 h-3 w-3" />Anonymization Active</Badge>
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
                    All prompts are processed through D-SecureAI&apos;s PII anonymization engine before reaching {selectedModel?.name || "the AI model"}.
                </p>
            </div>
        </div>
    );
}
