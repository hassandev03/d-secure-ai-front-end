"use client";

import { useState } from "react";
import { Plus, BookText, Upload, Trash2, FileText, Globe, Info, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ── Mock data ─────────────────────────── */
const initialTerms = [
    { id: 1, term: "Project Enigma", definition: "Internal codename for new ML pipeline", category: "Project" },
    { id: 2, term: "DataPipe v3", definition: "Legacy ETL framework being phased out", category: "Technical" },
    { id: 3, term: "CTRL Protocol", definition: "Internal data handling standard v2.3", category: "Compliance" },
    { id: 4, term: "NeuroSense", definition: "Proprietary NLP model for medical text classification", category: "Product" },
];

const initialDocs = [
    { id: 1, name: "NDA_Template.pdf", size: "1.2 MB", uploadedAt: "2025-11-20" },
    { id: 2, name: "Domain_Glossary.docx", size: "340 KB", uploadedAt: "2025-11-15" },
    { id: 3, name: "Research_Notes_Q4.pdf", size: "2.8 MB", uploadedAt: "2025-12-01" },
];

const initialPatterns = [
    { id: 1, label: "Client ID", pattern: "CLT-[0-9]{5}", example: "CLT-00421", active: true },
    { id: 2, label: "Internal Doc Ref", pattern: "DOC-[A-Z]{3}-[0-9]+", example: "DOC-FIN-42", active: true },
];

export default function MyContextPage() {
    const [terms, setTerms] = useState(initialTerms);
    const [docs, setDocs] = useState(initialDocs);
    const [newTerm, setNewTerm] = useState("");
    const [newDef, setNewDef] = useState("");
    const [newCat, setNewCat] = useState("");

    const handleAddTerm = () => {
        if (!newTerm || !newDef) return;
        setTerms((prev) => [...prev, { id: Date.now(), term: newTerm, definition: newDef, category: newCat || "General" }]);
        setNewTerm(""); setNewDef(""); setNewCat("");
        toast.success(`Term "${newTerm}" added!`);
    };

    const handleRemoveTerm = (id: number) => setTerms((prev) => prev.filter((t) => t.id !== id));
    const handleRemoveDoc = (id: number) => setDocs((prev) => prev.filter((d) => d.id !== id));

    return (
        <div className="mx-auto max-w-5xl">
            <PageHeader
                title="My Context"
                subtitle="Teach the AI about your work, domain, and projects for better accuracy across all chats."
                breadcrumbs={[{ label: "User", href: "/dashboard" }, { label: "My Context" }]}
            />

            {/* Info banner */}
            <Card className="mb-6 border-brand-200 bg-brand-50/50">
                <CardContent className="flex items-start gap-3 p-4">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <div>
                        <p className="text-sm font-medium text-brand-800">How Your Context Works</p>
                        <p className="text-sm text-brand-700 mt-1">
                            Define terms, upload documents, and set custom patterns so D-SecureAI can better understand your specific work domain.
                            Your context is <strong>applied to every chat session</strong> automatically — improving anonymization accuracy by recognizing
                            your project names, proprietary terms, client codes, and jargon that standard detection might miss.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="glossary">
                <TabsList>
                    <TabsTrigger value="glossary" className="gap-2"><BookText className="h-4 w-4" />Glossary</TabsTrigger>
                    <TabsTrigger value="documents" className="gap-2"><FileText className="h-4 w-4" />Documents</TabsTrigger>
                    <TabsTrigger value="patterns" className="gap-2"><Globe className="h-4 w-4" />Custom Patterns</TabsTrigger>
                </TabsList>

                {/* ─── Glossary Tab ─── */}
                <TabsContent value="glossary" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Add Term</CardTitle></CardHeader>
                        <CardContent className="flex flex-col gap-3 sm:flex-row">
                            <Input placeholder="Term" value={newTerm} onChange={(e) => setNewTerm(e.target.value)} className="sm:w-44" />
                            <Input placeholder="Definition" value={newDef} onChange={(e) => setNewDef(e.target.value)} className="flex-1" />
                            <Input placeholder="Category" value={newCat} onChange={(e) => setNewCat(e.target.value)} className="sm:w-32" />
                            <Button onClick={handleAddTerm} className="bg-brand-700 hover:bg-brand-800"><Plus className="mr-2 h-4 w-4" />Add</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Your Glossary</CardTitle>
                            <CardDescription>{terms.length} terms — applied to all chats automatically</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {terms.map((entry) => (
                                    <div key={entry.id} className="flex items-start justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-foreground">{entry.term}</p>
                                                <Badge variant="outline" className="text-[10px]">{entry.category}</Badge>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">{entry.definition}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger shrink-0" onClick={() => handleRemoveTerm(entry.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {terms.length === 0 && (
                                    <div className="py-8 text-center"><FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No terms added yet</p></div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── Documents Tab ─── */}
                <TabsContent value="documents" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Upload Document</CardTitle>
                            <CardDescription>Upload work documents to enrich the AI&apos;s understanding of your domain across all conversations.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:border-brand-300 cursor-pointer">
                                <div className="text-center">
                                    <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                                    <p className="mt-2 text-sm font-medium">Drop files here or click to upload</p>
                                    <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT — up to 10 MB</p>
                                    <Button variant="outline" size="sm" className="mt-3">Browse Files</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Uploaded Documents</CardTitle>
                            <CardDescription>{docs.length} documents — used for context enrichment in all chats</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {docs.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50"><FileText className="h-5 w-5 text-brand-600" /></div>
                                            <div>
                                                <p className="text-sm font-medium">{doc.name}</p>
                                                <p className="text-xs text-muted-foreground">{doc.size} · Uploaded {doc.uploadedAt}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger" onClick={() => handleRemoveDoc(doc.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {docs.length === 0 && (
                                    <div className="py-8 text-center"><FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No documents uploaded yet</p></div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── Custom Patterns Tab ─── */}
                <TabsContent value="patterns" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Custom Anonymization Patterns</CardTitle>
                            <CardDescription>Define regex patterns to detect your domain-specific sensitive data (client IDs, project codes, etc.).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {initialPatterns.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                                        <div>
                                            <p className="text-sm font-medium">{p.label}</p>
                                            <code className="mt-1 inline-block text-xs bg-muted px-2 py-0.5 rounded font-mono">{p.pattern}</code>
                                            <p className="text-xs text-muted-foreground mt-1">Example: {p.example}</p>
                                        </div>
                                        <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Active" : "Disabled"}</Badge>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" className="mt-4"><Plus className="mr-2 h-4 w-4" />Add Pattern</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
