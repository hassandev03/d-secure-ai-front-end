"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useSubscriptionStore } from "@/store/subscription.store";
import { Plus, BookText, Upload, Trash2, FileText, Globe, Info, FolderOpen, Edit, FileMusic, Loader2, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import * as contextService from "@/services/context.service";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface ExtractedEntity { id: string | number; type: string; original: string; description: string; checked: boolean; }
interface StagedDoc { id: string | number; name: string; size: string; file: File; }

const formatSize = (bytes: number) => {
    const sizeInMB = bytes / (1024 * 1024);
    return sizeInMB > 1 ? `${sizeInMB.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
};

export default function MyContextPage() {
    const [terms, setTerms] = useState<contextService.GlossaryTerm[]>([]);
    const [docs, setDocs] = useState<contextService.ContextDocument[]>([]);
    const [patterns, setPatterns] = useState<contextService.CustomPattern[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Processing Workflow State
    const [stagedDocs, setStagedDocs] = useState<StagedDoc[]>([]);
    const [processingDoc, setProcessingDoc] = useState<StagedDoc | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedEntities, setExtractedEntities] = useState<ExtractedEntity[]>([]);
    const [editingEntityId, setEditingEntityId] = useState<string | number | null>(null);
    const [editEntityForm, setEditEntityForm] = useState<Partial<ExtractedEntity>>({});

    useEffect(() => {
        const loadData = async () => {
            try {
                const [termsData, patternsData, docsData] = await Promise.all([
                    contextService.getGlossary(),
                    contextService.getPatterns(),
                    contextService.getContextDocuments(),
                ]);
                setTerms(termsData);
                setPatterns(patternsData);
                setDocs(docsData);
            } catch (err) {
                console.error("Failed to load context data:", err);
                toast.error("Failed to load your context data.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const startEditingEntity = (entity: ExtractedEntity) => {
        setEditingEntityId(entity.id);
        setEditEntityForm(entity);
    };

    const saveEditingEntity = () => {
        if (!editingEntityId) return;
        setExtractedEntities(prev => prev.map(e => e.id === editingEntityId ? { ...e, ...editEntityForm as ExtractedEntity } : e));
        setEditingEntityId(null);
    };

    const deleteEntity = (id: string | number) => {
        setExtractedEntities(prev => prev.filter(e => e.id !== id));
    };

    // Add new term form
    const [newTerm, setNewTerm] = useState("");
    const [newDef, setNewDef] = useState("");
    const [newCat, setNewCat] = useState("");

    // Editing Dialogs
    const [editingTerm, setEditingTerm] = useState<contextService.GlossaryTerm | null>(null);
    const [editingPattern, setEditingPattern] = useState<contextService.CustomPattern | null>(null);
    const [isPatternAddModalOpen, setIsPatternAddModalOpen] = useState(false);

    // Pattern Add form
    const [newPatLabel, setNewPatLabel] = useState("");
    const [newPatRegex, setNewPatRegex] = useState("");
    const [newPatExample, setNewPatExample] = useState("");

    const router = useRouter();
    const { user } = useAuthStore();
    const subscriptionStore = useSubscriptionStore();
    const [authorized, setAuthorized] = useState<boolean | null>(null);

    // Wait for both user (from persisted auth store) and subscription data.
    // subscriptionTier is persisted in auth store so it may be available immediately.
    // If it's missing, we wait for the subscription store to populate it.
    useEffect(() => {
        if (!user) return;

        // If subscriptionTier is already set (from persisted store), check immediately.
        // Otherwise wait for the subscription store to load (indicated by isLoaded=true).
        const tier = user.subscriptionTier;
        if (!tier && !subscriptionStore.isLoaded) return; // still loading — wait

        const canAccess = user.role === 'PROFESSIONAL'
            && (tier === 'PRO' || tier === 'MAX');
        setAuthorized(canAccess);
        if (!canAccess) {
            router.replace("/dashboard");
        }
    }, [user, router, subscriptionStore.isLoaded]);

    const handleAddTerm = async () => {
        if (!newTerm || !newDef) return;
        try {
            const added = await contextService.createGlossaryTerm({ term: newTerm, definition: newDef, category: newCat || "General" });
            setTerms((prev) => [added, ...prev]);
            setNewTerm(""); setNewDef(""); setNewCat("");
            toast.success(`Term "${newTerm}" added!`);
        } catch (err) {
            toast.error("Failed to add term.");
        }
    };

    const handleSaveEditTerm = async () => {
        if (!editingTerm) return;
        try {
            const updated = await contextService.updateGlossaryTerm(editingTerm.term_id, {
                term: editingTerm.term,
                definition: editingTerm.definition,
                category: editingTerm.category
            });
            setTerms(prev => prev.map(t => t.term_id === editingTerm.term_id ? updated : t));
            setEditingTerm(null);
            toast.success("Term updated successfully.");
        } catch (err) {
            toast.error("Failed to update term.");
        }
    };

    const handleRemoveTerm = async (id: string) => {
        try {
            await contextService.deleteGlossaryTerm(id);
            setTerms((prev) => prev.filter((t) => t.term_id !== id));
            toast.success("Term removed.");
        } catch (err) {
            toast.error("Failed to remove term.");
        }
    };

    const handleRemoveDoc = async (id: string) => {
        try {
            await contextService.deleteContextDocument(id);
            setDocs((prev) => prev.filter((d) => d.file_id !== id));
            toast.success("Document removed.");
        } catch (err) {
            toast.error("Failed to remove document.");
        }
    };

    const handleAddPattern = async () => {
        if (!newPatLabel || !newPatRegex) return;
        try {
            const added = await contextService.createPattern({ label: newPatLabel, pattern: newPatRegex, example: newPatExample, is_active: true });
            setPatterns(prev => [added, ...prev]);
            setNewPatLabel(""); setNewPatRegex(""); setNewPatExample("");
            setIsPatternAddModalOpen(false);
            toast.success("Pattern added successfully.");
        } catch (err) {
            toast.error("Failed to add pattern.");
        }
    };

    const handleSaveEditPattern = async () => {
        if (!editingPattern) return;
        try {
            const updated = await contextService.updatePattern(editingPattern.pattern_id, {
                label: editingPattern.label,
                pattern: editingPattern.pattern,
                example: editingPattern.example,
                is_active: editingPattern.is_active
            });
            setPatterns(prev => prev.map(p => p.pattern_id === editingPattern.pattern_id ? updated : p));
            setEditingPattern(null);
            toast.success("Pattern updated successfully.");
        } catch (err) {
            toast.error("Failed to update pattern.");
        }
    };

    const handleRemovePattern = async (id: string) => {
        try {
            await contextService.deletePattern(id);
            setPatterns(prev => prev.filter(p => p.pattern_id !== id));
            toast.success("Pattern removed.");
        } catch (err) {
            toast.error("Failed to remove pattern.");
        }
    };

    const togglePatternActive = async (id: string, current: boolean) => {
        try {
            const updated = await contextService.updatePattern(id, { is_active: !current });
            setPatterns(prev => prev.map(p => p.pattern_id === id ? updated : p));
        } catch (err) {
            toast.error("Failed to toggle pattern status.");
        }
    };

    // Document Processing Logic
    const handleProcessDoc = async (doc: StagedDoc) => {
        setProcessingDoc(doc);
        setIsExtracting(true);
        // Simulate processing time
        await new Promise(r => setTimeout(r, 2000));

        // Mock extracted entities
        const mockEntities: ExtractedEntity[] = doc.name.toLowerCase().includes('nda') ? [
            { id: 1, type: 'ORG', original: 'Acme Corp', description: 'Extracted organizational entity', checked: true },
            { id: 2, type: 'PERSON', original: 'John Doe', description: 'Extracted personal entity', checked: true }
        ] : [
            { id: 1, type: 'PROJECT', original: 'Project Titan', description: `Extracted PROJECT from ${doc.name}`, checked: true },
            { id: 2, type: 'EMAIL', original: 'contact@acmecorp.com', description: `Extracted EMAIL from ${doc.name}`, checked: true }
        ];

        setExtractedEntities(mockEntities);
        setIsExtracting(false);
    };

    const toggleEntityCheck = (id: string | number) => {
        setExtractedEntities(prev => prev.map(e => e.id === id ? { ...e, checked: !e.checked } : e));
    };

    const handleSaveEntities = async () => {
        if (!processingDoc) return;

        // Add checked entities to glossary terms
        const entitiesToSave = extractedEntities.filter(e => e.checked);
        
        try {
            if (entitiesToSave.length > 0) {
                const results = await Promise.all(entitiesToSave.map(e => 
                    contextService.createGlossaryTerm({
                        term: e.original,
                        definition: e.description || `Extracted ${e.type} from ${processingDoc.name}`,
                        category: e.type
                    })
                ));
                setTerms(prev => [...results, ...prev]);
                toast.success(`Added ${results.length} terms to Glossary.`);
            }

            // Upload the file to DB
            const uploadedFile = await contextService.uploadContextDocument(processingDoc.file);
            setDocs(prev => [uploadedFile, ...prev]);

            setStagedDocs(prev => prev.filter(d => d.id !== processingDoc.id));
            setProcessingDoc(null);
            toast.success(`${processingDoc.name} processed and saved to DB.`);
        } catch (err) {
            toast.error("Failed to save context from document.");
        }
    };

    // Dropzone logic
    const onDrop = useCallback((acceptedFiles: File[]) => {
        acceptedFiles.forEach((file) => {
            const sizeInMB = file.size / (1024 * 1024);
            const sizeStr = sizeInMB > 1 ? `${sizeInMB.toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`;
            setStagedDocs(prev => [...prev, {
                id: Date.now() + Math.random(),
                name: file.name,
                size: sizeStr,
                file
            }]);
            toast.success(`${file.name} staged for processing.`);
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'text/plain': ['.txt']
        },
        maxSize: 10485760 // 10MB
    });

    if (!authorized) return null;

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
                            <Input placeholder="Term (e.g. Project Enigma)" value={newTerm} onChange={(e) => setNewTerm(e.target.value)} className="sm:w-44" />
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
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-20 w-full rounded-lg bg-muted animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {terms.map((entry) => (
                                        <div key={entry.term_id} className="flex items-start justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50 group">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-foreground">{entry.term}</p>
                                                    <Badge variant="outline" className="text-[10px]">{entry.category}</Badge>
                                                </div>
                                                <p className="mt-1 text-sm text-muted-foreground">{entry.definition}</p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-brand-600" onClick={() => setEditingTerm(entry)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger shrink-0" onClick={() => handleRemoveTerm(entry.term_id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {terms.length === 0 && (
                                        <div className="py-8 text-center"><FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No terms added yet</p></div>
                                    )}
                                </div>
                            )}
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
                            <div
                                {...getRootProps()}
                                className={`flex items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-border bg-muted/30 hover:border-brand-300'}`}
                            >
                                <input {...getInputProps()} />
                                <div className="text-center">
                                    <Upload className={`mx-auto h-10 w-10 ${isDragActive ? 'text-brand-500' : 'text-muted-foreground'}`} />
                                    <p className="mt-2 text-sm font-medium">{isDragActive ? "Drop the files here" : "Drop files here or click to upload"}</p>
                                    <p className="text-xs text-muted-foreground mt-1">PDF, TXT — up to 10 MB</p>
                                    <Button variant="outline" size="sm" className="mt-3 pointer-events-none">Browse Files</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {stagedDocs.length > 0 && (
                        <Card className="border-brand-200 bg-brand-50/20">
                            <CardHeader>
                                <CardTitle className="text-base text-brand-800 flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Staged for Processing
                                </CardTitle>
                                <CardDescription>Review and process these documents to extract domain terms.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {stagedDocs.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between rounded-lg border border-brand-200 bg-white p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50"><FileText className="h-5 w-5 text-orange-600" /></div>
                                                <div>
                                                    <p className="text-sm font-medium">{doc.name}</p>
                                                    <p className="text-xs text-muted-foreground">{doc.size}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" className="h-8 text-brand-600 border-brand-200 hover:bg-brand-50" onClick={() => handleProcessDoc(doc)}>
                                                    Process
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger" onClick={() => setStagedDocs(prev => prev.filter(d => d.id !== doc.id))}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Uploaded Documents</CardTitle>
                            <CardDescription>{docs.length} documents — used for context enrichment in all chats</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2].map(i => (
                                        <div key={i} className="h-16 w-full rounded-lg bg-muted animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {docs.map((doc) => (
                                        <div key={doc.file_id} className="flex items-center justify-between rounded-lg border border-border p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50"><FileText className="h-5 w-5 text-brand-600" /></div>
                                                <div>
                                                    <p className="text-sm font-medium">{doc.filename}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatSize(doc.file_size_bytes)} · Uploaded {new Date(doc.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger" onClick={() => handleRemoveDoc(doc.file_id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {docs.length === 0 && (
                                        <div className="py-8 text-center"><FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No documents uploaded yet</p></div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── Custom Patterns Tab ─── */}
                <TabsContent value="patterns" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-base">Custom Anonymization Patterns</CardTitle>
                                    <CardDescription>Define regex patterns to detect your domain-specific sensitive data (client IDs, project codes, etc.).</CardDescription>
                                </div>
                                <Button className="bg-brand-700 hover:bg-brand-800" onClick={() => setIsPatternAddModalOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />Add Pattern
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2].map(i => (
                                        <div key={i} className="h-24 w-full rounded-lg bg-muted animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {patterns.map((p) => (
                                        <div key={p.pattern_id} className="flex items-center justify-between rounded-lg border border-border p-4 overflow-hidden group">
                                            <div>
                                                <p className="text-sm font-medium flex items-center gap-2">
                                                    {p.label}
                                                    <Badge variant={p.is_active ? "default" : "secondary"} className={p.is_active ? "bg-success/10 text-success hover:bg-success/20 border-0" : ""}>{p.is_active ? "Active" : "Disabled"}</Badge>
                                                </p>
                                                <code className="mt-1.5 inline-block text-xs bg-muted px-2 py-0.5 rounded font-mono border border-border/50">{p.pattern}</code>
                                                {p.example && <p className="text-[11px] text-muted-foreground mt-1.5">Example: {p.example}</p>}
                                            </div>
                                            <div className="flex items-center gap-2 sm:gap-4">
                                                <Switch checked={p.is_active} onCheckedChange={() => togglePatternActive(p.pattern_id, p.is_active)} />
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-brand-600" onClick={() => setEditingPattern(p)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger" onClick={() => handleRemovePattern(p.pattern_id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {patterns.length === 0 && (
                                        <div className="py-8 text-center"><FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No patterns added yet</p></div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Editing Term Modal */}
            <Dialog open={!!editingTerm} onOpenChange={(open) => !open && setEditingTerm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Term</DialogTitle>
                    </DialogHeader>
                    {editingTerm && (
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2"><Label>Term</Label><Input value={editingTerm.term} onChange={e => setEditingTerm({ ...editingTerm, term: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Definition</Label><Input value={editingTerm.definition} onChange={e => setEditingTerm({ ...editingTerm, definition: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Category</Label><Input value={editingTerm.category} onChange={e => setEditingTerm({ ...editingTerm, category: e.target.value })} /></div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingTerm(null)}>Cancel</Button>
                        <Button onClick={handleSaveEditTerm} className="bg-brand-600 hover:bg-brand-700">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Pattern Modal */}
            <Dialog open={!!editingPattern || isPatternAddModalOpen} onOpenChange={(open) => { if (!open) { setEditingPattern(null); setIsPatternAddModalOpen(false); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingPattern ? "Edit Pattern" : "Add Custom Pattern"}</DialogTitle>
                        <DialogDescription>Define a regular expression to instruct the anonymizer on what to blank out.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Label/Name</Label>
                            <Input
                                placeholder="e.g. Account Number"
                                value={editingPattern ? editingPattern.label : newPatLabel}
                                onChange={e => editingPattern ? setEditingPattern({ ...editingPattern, label: e.target.value }) : setNewPatLabel(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Regex Pattern</Label>
                            <Input
                                placeholder="e.g. ACCT-[0-9]{6}"
                                value={editingPattern ? editingPattern.pattern : newPatRegex}
                                onChange={e => editingPattern ? setEditingPattern({ ...editingPattern, pattern: e.target.value }) : setNewPatRegex(e.target.value)}
                                className="font-mono text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Example Match <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                            <Input
                                placeholder="e.g. ACCT-123456"
                                value={editingPattern ? (editingPattern.example || "") : newPatExample}
                                onChange={e => editingPattern ? setEditingPattern({ ...editingPattern, example: e.target.value }) : setNewPatExample(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between px-1 py-2 mb-2">
                        <Label className="text-sm font-medium">Pattern Status</Label>
                        <Switch 
                            checked={editingPattern ? editingPattern.is_active : true} 
                            onCheckedChange={v => editingPattern && setEditingPattern({...editingPattern, is_active: v})}
                            disabled={!editingPattern}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setEditingPattern(null); setIsPatternAddModalOpen(false); }}>Cancel</Button>
                        <Button onClick={editingPattern ? handleSaveEditPattern : handleAddPattern} className="bg-brand-600 hover:bg-brand-700">
                            {editingPattern ? "Save Changes" : "Create Pattern"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Process Document Modal */}
            <Dialog open={!!processingDoc} onOpenChange={(open) => !open && !isExtracting && setProcessingDoc(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Processing Document</DialogTitle>
                        <DialogDescription>
                            {processingDoc?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {isExtracting ? (
                            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
                                <p className="text-sm font-medium text-muted-foreground">Extracting sensitive entities...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-lg bg-success/10 p-3 flex items-center gap-2 text-sm text-success-700">
                                    <CheckCircle2 className="h-5 w-5" />
                                    Successfully extracted {extractedEntities.length} entities.
                                </div>
                                <p className="text-sm text-muted-foreground">Select the entities you want to add to your Context Glossary.</p>
                                <div className="mt-4 border rounded-md divide-y overflow-y-auto max-h-[350px] pr-2">
                                    {extractedEntities.map(entity => (
                                        <div key={entity.id} className="relative flex flex-col p-3 hover:bg-muted/50 transition-colors group">
                                            {editingEntityId === entity.id ? (
                                                <div className="space-y-3 w-full animate-in fade-in zoom-in duration-200">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs text-muted-foreground">Entity Name</Label>
                                                            <Input size={1} className="h-8 text-sm" value={editEntityForm.original || ""} onChange={e => setEditEntityForm({ ...editEntityForm, original: e.target.value })} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs text-muted-foreground">Type</Label>
                                                            <Input size={1} className="h-8 text-sm" value={editEntityForm.type || ""} onChange={e => setEditEntityForm({ ...editEntityForm, type: e.target.value })} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">Description</Label>
                                                        <Input size={1} className="h-8 text-sm" value={editEntityForm.description || ""} onChange={e => setEditEntityForm({ ...editEntityForm, description: e.target.value })} />
                                                    </div>
                                                    <div className="flex justify-end gap-2 pt-1">
                                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingEntityId(null)}>Cancel</Button>
                                                        <Button size="sm" className="h-7 text-xs bg-brand-600 hover:bg-brand-700 text-white" onClick={saveEditingEntity}>Save</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start justify-between w-full">
                                                    <div className="flex items-start gap-3">
                                                        <Switch checked={entity.checked} onCheckedChange={() => toggleEntityCheck(entity.id)} className="mt-0.5" />
                                                        <div>
                                                            <p className="font-medium text-sm flex items-center gap-2">
                                                                {entity.original}
                                                                {entity.type && <Badge variant="outline" className="text-[10px]">{entity.type}</Badge>}
                                                            </p>
                                                            {entity.description && <p className="text-xs text-muted-foreground mt-0.5">{entity.description}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/50 backdrop-blur-sm rounded-md p-0.5">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-brand-600" onClick={() => startEditingEntity(entity)}>
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-danger" onClick={() => deleteEntity(entity.id)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {extractedEntities.length === 0 && (
                                        <div className="p-8 text-center text-sm text-muted-foreground">No entities remaining.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {!isExtracting && (
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setProcessingDoc(null)}>Discard</Button>
                            <Button className="bg-brand-600 hover:bg-brand-700" onClick={handleSaveEntities}>
                                Save to Context
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
