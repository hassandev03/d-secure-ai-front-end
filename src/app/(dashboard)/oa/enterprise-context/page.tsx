"use client";

import { useState } from "react";
import { Plus, BookText, Upload, Trash2, FileText, Globe, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockTerms = [
    { id: 1, term: "D-SecureAI", definition: "Our privacy-preserving AI gateway platform", category: "Product" },
    { id: 2, term: "PII Masking Engine", definition: "Core component that detects and replaces personally identifiable information", category: "Technical" },
    { id: 3, term: "Project Falcon", definition: "Internal codename for upcoming enterprise analytics module", category: "Internal" },
    { id: 4, term: "CTRL Protocol", definition: "Internal data handling standard v2.3", category: "Compliance" },
    { id: 5, term: "QuotaSync", definition: "Real-time quota tracking and allocation system", category: "Technical" },
];

const mockDocuments = [
    { id: 1, name: "Company Style Guide.pdf", size: "2.4 MB", uploadedAt: "2025-11-20", type: "PDF" },
    { id: 2, name: "Product Terminology.txt", size: "340 KB", uploadedAt: "2025-11-15", type: "TXT" },
    { id: 3, name: "Compliance Glossary.pdf", size: "1.1 MB", uploadedAt: "2025-10-28", type: "PDF" },
];

export default function EnterpriseContextPage() {
    const [newTerm, setNewTerm] = useState("");
    const [newDef, setNewDef] = useState("");

    const handleAddTerm = () => {
        if (!newTerm || !newDef) return;
        toast.success(`Term "${newTerm}" added!`);
        setNewTerm("");
        setNewDef("");
    };

    return (
        <div className="mx-auto max-w-5xl">
            <PageHeader
                title="Enterprise Context"
                subtitle="Teach the AI about your organization's specific terminology and documents."
                breadcrumbs={[{ label: "Organization", href: "/oa/dashboard" }, { label: "Enterprise Context" }]}
            />

            {/* Info banner */}
            <Card className="mb-6 border-brand-200 bg-brand-50/50">
                <CardContent className="flex items-start gap-3 p-4">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <div>
                        <p className="text-sm font-medium text-brand-800">How Enterprise Context Works</p>
                        <p className="text-sm text-brand-700 mt-1">
                            Define terms and upload documents so D-SecureAI can better understand your organization&apos;s specific language.
                            This improves anonymization accuracy by recognizing internal project names, product codes, and jargon that standard NLP models might miss.
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

                {/* Glossary */}
                <TabsContent value="glossary" className="mt-6 space-y-6">
                    {/* Add term */}
                    <Card>
                        <CardHeader><CardTitle className="text-base">Add Term</CardTitle></CardHeader>
                        <CardContent className="flex flex-col gap-3 sm:flex-row">
                            <Input placeholder="Term" value={newTerm} onChange={(e) => setNewTerm(e.target.value)} className="sm:w-48" />
                            <Input placeholder="Definition" value={newDef} onChange={(e) => setNewDef(e.target.value)} className="flex-1" />
                            <Button onClick={handleAddTerm} className="bg-brand-700 hover:bg-brand-800"><Plus className="mr-2 h-4 w-4" />Add</Button>
                        </CardContent>
                    </Card>

                    {/* Existing terms */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Organization Glossary</CardTitle>
                            <CardDescription>{mockTerms.length} terms defined</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {mockTerms.map((entry) => (
                                    <div key={entry.id} className="flex items-start justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-foreground">{entry.term}</p>
                                                <Badge variant="outline" className="text-[10px]">{entry.category}</Badge>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">{entry.definition}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger shrink-0"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Documents */}
                <TabsContent value="documents" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Upload Document</CardTitle>
                            <CardDescription>Upload company documents to enrich the AI&apos;s understanding of your terminology.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:border-brand-300">
                                <div className="text-center">
                                    <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                                    <p className="mt-2 text-sm font-medium">Drop files here or click to upload</p>
                                    <p className="text-xs text-muted-foreground mt-1">PDF, Excel, TXT — up to 10 MB</p>
                                    <Button variant="outline" size="sm" className="mt-3">Browse Files</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Uploaded Documents</CardTitle>
                            <CardDescription>{mockDocuments.length} documents</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {mockDocuments.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50"><FileText className="h-5 w-5 text-brand-600" /></div>
                                            <div>
                                                <p className="text-sm font-medium">{doc.name}</p>
                                                <p className="text-xs text-muted-foreground">{doc.size} · Uploaded {doc.uploadedAt}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Custom Patterns */}
                <TabsContent value="documents" className="mt-6">
                </TabsContent>
                <TabsContent value="patterns" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Custom Anonymization Patterns</CardTitle>
                            <CardDescription>Define regex patterns to detect organization-specific sensitive data.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { label: "Employee ID", pattern: "EMP-[0-9]{6}", example: "EMP-001234", active: true },
                                    { label: "Project Code", pattern: "PRJ-[A-Z]{2}-[0-9]{4}", example: "PRJ-EN-2025", active: true },
                                    { label: "Internal Doc Ref", pattern: "DOC-[A-Z]{3}-[0-9]+", example: "DOC-FIN-42", active: false },
                                ].map((p) => (
                                    <div key={p.label} className="flex items-center justify-between rounded-lg border border-border p-4">
                                        <div>
                                            <p className="text-sm font-medium">{p.label}</p>
                                            <code className="mt-1 text-xs bg-muted px-2 py-0.5 rounded font-mono">{p.pattern}</code>
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
