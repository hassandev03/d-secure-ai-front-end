"use client";

import { use } from "react";
import { Bot, User, Shield, ChevronLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const mockSession = {
    id: "sess-1",
    title: "GDPR Compliance Query",
    model: "Claude 4.6 Sonnet",
    createdAt: "2025-12-01 10:30 AM",
    messages: [
        { id: "1", role: "user" as const, content: "Can you review our data processing agreement with Samsung and check if it complies with GDPR Article 28?", time: "10:30 AM" },
        { id: "2", role: "assistant" as const, content: "I'd be happy to review the data processing agreement. Based on GDPR Article 28, here are the key requirements I'll check for:\n\n**Required clauses:**\n1. Subject matter and duration of processing\n2. Nature and purpose of processing\n3. Types of personal data\n4. Categories of data subjects\n5. Obligations and rights of the controller\n\n**Assessment:**\nThe agreement appears to cover most requirements. However, I noticed the following gaps:\n\n- **Missing:** Explicit provisions for sub-processor management\n- **Incomplete:** Data breach notification timeline (should be 72 hours)\n- **Good:** Data deletion clauses are well-defined\n\nWould you like me to draft the missing clauses?", time: "10:31 AM" },
        { id: "3", role: "user" as const, content: "Yes, please draft the sub-processor clause and the data breach notification clause.", time: "10:32 AM" },
        { id: "4", role: "assistant" as const, content: "Here are the drafted clauses:\n\n**Sub-Processor Clause:**\n\n> The Processor shall not engage another processor without prior specific or general written authorization of the Controller. In the case of general written authorization, the Processor shall inform the Controller of any intended changes concerning the addition or replacement of other processors, thereby giving the Controller the opportunity to object to such changes.\n\n**Data Breach Notification Clause:**\n\n> The Processor shall notify the Controller without undue delay after becoming aware of a personal data breach. Such notification shall be made no later than 72 hours after awareness, and shall include:\n> - The nature of the personal data breach\n> - Contact details of the data protection officer\n> - Likely consequences of the breach\n> - Measures taken or proposed to address the breach\n\nShall I refine any of these clauses?", time: "10:33 AM" },
    ],
};

export default function ChatSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = use(params);

    return (
        <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <div className="flex items-center gap-3">
                    <Link href="/history">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h2 className="text-lg font-semibold">{mockSession.title}</h2>
                        <p className="text-xs text-muted-foreground">{mockSession.model} · {mockSession.createdAt}</p>
                    </div>
                </div>
                <Badge variant="outline" className="text-success border-success/30 bg-success/5"><Shield className="mr-1 h-3 w-3" />Anonymized</Badge>
            </div>

            {/* Messages */}
            <div className="space-y-4">
                {mockSession.messages.map((msg) => (
                    <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "")}>
                        {msg.role === "assistant" && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 mt-1"><Bot className="h-4 w-4 text-brand-600" /></div>
                        )}
                        <div className={cn("max-w-[75%] rounded-2xl px-4 py-3", msg.role === "user" ? "bg-brand-600 text-white" : "bg-muted")}>
                            <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                            <p className={cn("mt-1 text-[10px]", msg.role === "user" ? "text-white/50" : "text-muted-foreground")}>{msg.time}</p>
                        </div>
                        {msg.role === "user" && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/10 mt-1"><User className="h-4 w-4 text-foreground" /></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
