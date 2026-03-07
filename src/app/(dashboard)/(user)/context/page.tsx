"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Plus, BookText, Upload, Trash2, FileText, Globe, Info, FolderOpen, Edit, FileMusic, Loader2, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

/* ── Mock data ─────────────────────────── */
const initialTerms = [
    { id: 1, term: "Project Enigma", definition: "Internal codename for new ML pipeline", category: "Project" },
    { id: 2, term: "DataPipe v3", definition: "Legacy ETL framework being phased out", category: "Technical" },
    { id: 3, term: "CTRL Protocol", definition: "Internal data handling standard v2.3", category: "Compliance" },
    { id: 4, term: "NeuroSense", definition: "Proprietary NLP model for medical text classification", category: "Product" },
];

const initialDocs = [
    { id: 1, name: "NDA_Template.pdf", size: "1.2 MB", uploadedAt: "2025-11-20" },
    { id: 2, name: "Domain_Glossary.xlsx", size: "340 KB", uploadedAt: "2025-11-15" },
    { id: 3, name: "Research_Notes_Q4.pdf", size: "2.8 MB", uploadedAt: "2025-12-01" },
];

const initialPatterns = [
    { id: 1, label: "Client ID", pattern: "CLT-[0-9]{5}", example: "CLT-00421", active: true },
    { id: 2, label: "Internal Doc Ref", pattern: "DOC-[A-Z]{3}-[0-9]+", example: "DOC-FIN-42", active: true },
];

interface ExtractedEntity { id: number; type: string; original: string; description: string; checked: boolean; }
interface StagedDoc { id: number; name: string; size: string; file: File; }

export default function MyContextPage() {
    const [terms, setTerms] = useState(initialTerms);
    const [docs, setDocs] = useState(initialDocs);
    const [patterns, setPatterns] = useState(initialPatterns);

    // Processing Workflow State
    const [stagedDocs, setStagedDocs] = useState<StagedDoc[]>([]);
    const [processingDoc, setProcessingDoc] = useState<StagedDoc | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedEntities, setExtractedEntities] = useState<ExtractedEntity[]>([]);
    const [editingEntityId, setEditingEntityId] = useState<number | null>(null);
    const [editEntityForm, setEditEntityForm] = useState<Partial<ExtractedEntity>>({});

    const startEditingEntity = (entity: ExtractedEntity) => {
        setEditingEntityId(entity.id);
        setEditEntityForm(entity);
    };

    const saveEditingEntity = () => {
        if (!editingEntityId) return;
        setExtractedEntities(prev => prev.map(e => e.id === editingEntityId ? { ...e, ...editEntityForm as ExtractedEntity } : e));
        setEditingEntityId(null);
    };

    const deleteEntity = (id: number) => {
        setExtractedEntities(prev => prev.filter(e => e.id !== id));
    };

    // Add new term form
    const [newTerm, setNewTerm] = useState("");
    const [newDef, setNewDef] = useState("");
    const [newCat, setNewCat] = useState("");

    // Editing Dialogs
    const [editingTerm, setEditingTerm] = useState<typeof initialTerms[0] | null>(null);
    const [editingPattern, setEditingPattern] = useState<typeof initialPatterns[0] | null>(null);
    const [isPatternAddModalOpen, setIsPatternAddModalOpen] = useState(false);

    // Pattern Add form
    const [newPatLabel, setNewPatLabel] = useState("");
    const [newPatRegex, setNewPatRegex] = useState("");
    const [newPatExample, setNewPatExample] = useState("");

    const router = useRouter();
    const { user } = useAuthStore();
    const [authorized, setAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        if (!user) return;
        const canAccess = user.role === 'PROFESSIONAL' && (user.subscriptionTier === 'PRO' || user.subscriptionTier === 'MAX');
        if (!canAccess) {
            router.replace("/dashboard");
        } else {
            setAuthorized(true);
        }
    }, [user, router]);

    const handleAddTerm = () => {
        if (!newTerm || !newDef) return;
        setTerms((prev) => [...prev, { id: Date.now(), term: newTerm, definition: newDef, category: newCat || "General" }]);
        setNewTerm(""); setNewDef(""); setNewCat("");
        toast.success(`Term "${newTerm}" added!`);
    };

    const handleSaveEditTerm = () => {
        if (!editingTerm) return;
        setTerms(prev => prev.map(t => t.id === editingTerm.id ? editingTerm : t));
        setEditingTerm(null);
        toast.success("Term updated successfully.");
    };

    const handleRemoveTerm = (id: number) => setTerms((prev) => prev.filter((t) => t.id !== id));
    const handleRemoveDoc = (id: number) => setDocs((prev) => prev.filter((d) => d.id !== id));

    const handleAddPattern = () => {
        if (!newPatLabel || !newPatRegex) return;
        setPatterns(prev => [...prev, { id: Date.now(), label: newPatLabel, pattern: newPatRegex, example: newPatExample, active: true }]);
        setNewPatLabel(""); setNewPatRegex(""); setNewPatExample("");
        setIsPatternAddModalOpen(false);
        toast.success("Pattern added successfully.");
    };

    const handleSaveEditPattern = () => {
        if (!editingPattern) return;
        setPatterns(prev => prev.map(p => p.id === editingPattern.id ? editingPattern : p));
        setEditingPattern(null);
        toast.success("Pattern updated successfully.");
    };

    const handleRemovePattern = (id: number) => setPatterns(prev => prev.filter(p => p.id !== id));

    const togglePatternActive = (id: number) => {
        setPatterns(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
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

    const toggleEntityCheck = (id: number) => {
        setExtractedEntities(prev => prev.map(e => e.id === id ? { ...e, checked: !e.checked } : e));
    };

    const handleSaveEntities = () => {
        if (!processingDoc) return;

        // Add checked entities to glossary terms
        const newTerms = extractedEntities.filter(e => e.checked).map(e => ({
            id: Date.now() + Math.random(),
            term: e.original,
            definition: e.description || `Extracted ${e.type} from ${processingDoc.name}`,
            category: e.type
        }));

        if (newTerms.length > 0) {
            setTerms(prev => [...prev, ...newTerms]);
            toast.success(`Added ${newTerms.length} terms to Glossary.`);
        }

        // Move doc to uploaded
        setDocs(prev => [{
            id: processingDoc.id,
            name: processingDoc.name,
            size: processingDoc.size,
            uploadedAt: new Date().toISOString().split('T')[0]
        }, ...prev]);

        setStagedDocs(prev => prev.filter(d => d.id !== processingDoc.id));
        setProcessingDoc(null);
        toast.success(`${processingDoc.name} processed and saved.`);
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
                            <div className="space-y-3">
                                {terms.map((entry) => (
                                    <div key={entry.id} className="flex items-start justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50 group">
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
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger shrink-0" onClick={() => handleRemoveTerm(entry.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
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
                            <div className="space-y-4">
                                {patterns.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-4 overflow-hidden group">
                                        <div>
                                            <p className="text-sm font-medium flex items-center gap-2">
                                                {p.label}
                                                <Badge variant={p.active ? "default" : "secondary"} className={p.active ? "bg-success/10 text-success hover:bg-success/20 border-0" : ""}>{p.active ? "Active" : "Disabled"}</Badge>
                                            </p>
                                            <code className="mt-1.5 inline-block text-xs bg-muted px-2 py-0.5 rounded font-mono border border-border/50">{p.pattern}</code>
                                            {p.example && <p className="text-[11px] text-muted-foreground mt-1.5">Example: {p.example}</p>}
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-4">
                                            <Switch checked={p.active} onCheckedChange={() => togglePatternActive(p.id)} />
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-brand-600" onClick={() => setEditingPattern(p)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger" onClick={() => handleRemovePattern(p.id)}>
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
                                value={editingPattern ? editingPattern.example : newPatExample}
                                onChange={e => editingPattern ? setEditingPattern({ ...editingPattern, example: e.target.value }) : setNewPatExample(e.target.value)}
                            />
                        </div>
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
