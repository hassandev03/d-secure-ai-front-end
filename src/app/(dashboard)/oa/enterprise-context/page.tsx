"use client";

import { useState, useMemo, useCallback } from "react";
import {
    Plus, BookText, Upload, Trash2, FileText, Globe, Loader2, Info,
    Search, Tag, Code, Clock, CheckCircle2,
    Edit, FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
    DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
interface GlossaryTerm {
    id: number;
    term: string;
    definition: string;
    category: string;
}

interface ContextDocument {
    id: number;
    name: string;
    size: string;
    uploadedAt: string;
    type: "PDF" | "TXT";
}

interface CustomPattern {
    id: number;
    label: string;
    pattern: string;
    example: string;
    active: boolean;
}

interface StagedDoc {
    id: number;
    name: string;
    size: string;
    file: File;
}

interface ExtractedEntity {
    id: number;
    type: string;
    original: string;
    description: string;
    checked: boolean;
}

/* ------------------------------------------------------------------ */
/* Initial data                                                         */
/* ------------------------------------------------------------------ */
const INITIAL_TERMS: GlossaryTerm[] = [
    { id: 1, term: "D-SecureAI",           definition: "Our privacy-preserving AI gateway platform",                                        category: "Product"    },
    { id: 2, term: "Entity Masking Engine", definition: "Core component that detects and replaces personally identifiable information",       category: "Technical"  },
    { id: 3, term: "Project Falcon",        definition: "Internal codename for upcoming enterprise analytics module",                         category: "Internal"   },
    { id: 4, term: "CTRL Protocol",         definition: "Internal data handling standard v2.3",                                              category: "Compliance" },
    { id: 5, term: "QuotaSync",             definition: "Real-time quota tracking and allocation system",                                     category: "Technical"  },
];

const INITIAL_DOCUMENTS: ContextDocument[] = [
    { id: 1, name: "Company Style Guide.pdf",  size: "2.4 MB", uploadedAt: "2025-11-20", type: "PDF" },
    { id: 2, name: "Product Terminology.txt",  size: "340 KB", uploadedAt: "2025-11-15", type: "TXT" },
    { id: 3, name: "Compliance Glossary.pdf",  size: "1.1 MB", uploadedAt: "2025-10-28", type: "PDF" },
];

const INITIAL_PATTERNS: CustomPattern[] = [
    { id: 1, label: "Employee ID",      pattern: "EMP-[0-9]{6}",          example: "EMP-001234",  active: true  },
    { id: 2, label: "Project Code",     pattern: "PRJ-[A-Z]{2}-[0-9]{4}", example: "PRJ-EN-2025", active: true  },
    { id: 3, label: "Internal Doc Ref", pattern: "DOC-[A-Z]{3}-[0-9]+",   example: "DOC-FIN-42",  active: false },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
const CATEGORY_COLORS: Record<string, string> = {
    Product:    "bg-brand-50 text-brand-700 border-brand-200",
    Technical:  "bg-blue-50 text-blue-700 border-blue-200",
    Internal:   "bg-purple-50 text-purple-700 border-purple-200",
    Compliance: "bg-orange-50 text-orange-700 border-orange-200",
    General:    "bg-muted text-muted-foreground border-border",
};

function getCategoryColor(cat: string): string {
    return CATEGORY_COLORS[cat] ?? "bg-muted text-muted-foreground border-border";
}

const TYPE_COLORS: Record<string, string> = {
    PDF: "bg-red-50 text-red-600",
    TXT: "bg-gray-50 text-gray-600",
};

function fileSizeStr(bytes: number): string {
    return bytes > 1_048_576
        ? `${(bytes / 1_048_576).toFixed(1)} MB`
        : `${(bytes / 1024).toFixed(0)} KB`;
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function EnterpriseContextPage() {
    /* ---- Glossary ---- */
    const [terms,         setTerms]         = useState<GlossaryTerm[]>(INITIAL_TERMS);
    const [termOpen,      setTermOpen]       = useState(false);
    const [newTerm,       setNewTerm]        = useState("");
    const [newDef,        setNewDef]         = useState("");
    const [newCategory,   setNewCategory]    = useState("");
    const [termSaving,    setTermSaving]     = useState(false);
    const [termSearch,    setTermSearch]     = useState("");
    const [termCatFilter, setTermCatFilter]  = useState("all");

    /* ---- Documents ---- */
    const [documents,   setDocuments]   = useState<ContextDocument[]>(INITIAL_DOCUMENTS);
    const [stagedDocs,  setStagedDocs]  = useState<StagedDoc[]>([]);

    /* ---- Entity extraction ---- */
    const [processingDoc,    setProcessingDoc]    = useState<StagedDoc | null>(null);
    const [isExtracting,     setIsExtracting]     = useState(false);
    const [extractedEntities, setExtractedEntities] = useState<ExtractedEntity[]>([]);
    const [editingEntityId,  setEditingEntityId]  = useState<number | null>(null);
    const [editEntityForm,   setEditEntityForm]   = useState<Partial<ExtractedEntity>>({});

    /* ---- Patterns ---- */
    const [patterns,    setPatterns]    = useState<CustomPattern[]>(INITIAL_PATTERNS);
    const [patternOpen, setPatternOpen] = useState(false);
    const [patLabel,    setPatLabel]    = useState("");
    const [patRegex,    setPatRegex]    = useState("");
    const [patExample,  setPatExample]  = useState("");
    const [patSaving,   setPatSaving]   = useState(false);

    /* ---- Derived ---- */
    const uniqueCategories = useMemo(
        () => Array.from(new Set(terms.map(t => t.category).filter(Boolean))).sort(),
        [terms]
    );

    const filteredTerms = useMemo(() => {
        let list = [...terms];
        if (termSearch.trim()) {
            const q = termSearch.toLowerCase();
            list = list.filter(t =>
                t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
            );
        }
        if (termCatFilter !== "all") list = list.filter(t => t.category === termCatFilter);
        return list;
    }, [terms, termSearch, termCatFilter]);

    /* ================================================================ */
    /* Handlers — Glossary                                               */
    /* ================================================================ */
    const handleAddTerm = () => {
        if (!newTerm.trim() || !newDef.trim()) {
            toast.error("Term and definition are required");
            return;
        }
        setTermSaving(true);
        setTimeout(() => {
            setTerms(prev => [
                ...prev,
                { id: Date.now(), term: newTerm.trim(), definition: newDef.trim(), category: newCategory.trim() || "General" },
            ]);
            toast.success(`Term "${newTerm.trim()}" added`);
            setNewTerm(""); setNewDef(""); setNewCategory("");
            setTermSaving(false);
            setTermOpen(false);
        }, 400);
    };

    const handleDeleteTerm = (id: number, name: string) => {
        setTerms(prev => prev.filter(t => t.id !== id));
        toast.success(`Term "${name}" removed`);
    };

    /* ================================================================ */
    /* Handlers — Documents / Dropzone                                   */
    /* ================================================================ */
    const onDrop = useCallback((acceptedFiles: File[]) => {
        acceptedFiles.forEach(file => {
            setStagedDocs(prev => [
                ...prev,
                { id: Date.now() + Math.random(), name: file.name, size: fileSizeStr(file.size), file },
            ]);
            toast.success(`"${file.name}" staged for processing`);
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"], "text/plain": [".txt"] },
        maxSize: 10_485_760, // 10 MB
    });

    const handleDeleteDocument = (id: number, name: string) => {
        setDocuments(prev => prev.filter(d => d.id !== id));
        toast.success(`"${name}" removed`);
    };

    /* ================================================================ */
    /* Handlers — Entity extraction                                      */
    /* ================================================================ */
    const handleProcessDoc = async (doc: StagedDoc) => {
        setProcessingDoc(doc);
        setIsExtracting(true);
        await new Promise(r => setTimeout(r, 2000));
        // Mock entity extraction — in production this calls the backend
        const mockEntities: ExtractedEntity[] = doc.name.toLowerCase().includes("policy") ? [
            { id: 1, type: "ORG",        original: "Acme Corporation",    description: "Extracted organisational entity",    checked: true },
            { id: 2, type: "COMPLIANCE", original: "ISO 27001",            description: "Extracted compliance standard",       checked: true },
            { id: 3, type: "INTERNAL",   original: "Data Governance Act",  description: "Extracted internal policy reference", checked: true },
        ] : [
            { id: 1, type: "PROJECT",  original: doc.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "), description: `Extracted project identifier from ${doc.name}`, checked: true  },
            { id: 2, type: "PRODUCT",  original: "D-SecureAI Platform",    description: "Extracted product name reference",                    checked: true  },
            { id: 3, type: "TECHNICAL", original: "Entity Anonymisation",  description: "Extracted technical concept",                         checked: false },
        ];
        setExtractedEntities(mockEntities);
        setIsExtracting(false);
    };

    const toggleEntityCheck = (id: number) =>
        setExtractedEntities(prev => prev.map(e => e.id === id ? { ...e, checked: !e.checked } : e));

    const startEditingEntity = (entity: ExtractedEntity) => {
        setEditingEntityId(entity.id);
        setEditEntityForm(entity);
    };

    const saveEditingEntity = () => {
        if (!editingEntityId) return;
        setExtractedEntities(prev =>
            prev.map(e => e.id === editingEntityId ? { ...e, ...editEntityForm as ExtractedEntity } : e)
        );
        setEditingEntityId(null);
    };

    const deleteEntity = (id: number) =>
        setExtractedEntities(prev => prev.filter(e => e.id !== id));

    const handleSaveEntities = () => {
        if (!processingDoc) return;
        const checkedEntities = extractedEntities.filter(e => e.checked);
        if (checkedEntities.length > 0) {
            setTerms(prev => [
                ...prev,
                ...checkedEntities.map(e => ({
                    id: Date.now() + Math.random(),
                    term: e.original,
                    definition: e.description || `Extracted ${e.type} from ${processingDoc.name}`,
                    category: e.type,
                })),
            ]);
            toast.success(`Added ${checkedEntities.length} term${checkedEntities.length !== 1 ? "s" : ""} to Glossary`);
        }
        const ext = processingDoc.name.split(".").pop()?.toUpperCase();
        setDocuments(prev => [{
            id: processingDoc.id,
            name: processingDoc.name,
            size: processingDoc.size,
            uploadedAt: new Date().toISOString().split("T")[0],
            type: (ext === "PDF" || ext === "TXT") ? ext : "PDF",
        }, ...prev]);
        setStagedDocs(prev => prev.filter(d => d.id !== processingDoc.id));
        toast.success(`"${processingDoc.name}" processed and saved`);
        setProcessingDoc(null);
        setExtractedEntities([]);
    };

    /* ================================================================ */
    /* Handlers — Patterns                                               */
    /* ================================================================ */
    const handleTogglePattern = (id: number) =>
        setPatterns(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));

    const handleDeletePattern = (id: number, label: string) => {
        setPatterns(prev => prev.filter(p => p.id !== id));
        toast.success(`Pattern "${label}" removed`);
    };

    const handleAddPattern = () => {
        if (!patLabel.trim() || !patRegex.trim()) {
            toast.error("Label and pattern are required");
            return;
        }
        setPatSaving(true);
        setTimeout(() => {
            setPatterns(prev => [
                ...prev,
                { id: Date.now(), label: patLabel.trim(), pattern: patRegex.trim(), example: patExample.trim(), active: true },
            ]);
            toast.success(`Pattern "${patLabel.trim()}" added`);
            setPatLabel(""); setPatRegex(""); setPatExample("");
            setPatSaving(false);
            setPatternOpen(false);
        }, 500);
    };

    /* ================================================================ */
    /* Render                                                             */
    /* ================================================================ */
    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <PageHeader
                title="Enterprise Context"
                subtitle="Teach the AI about your organisation's specific terminology and documents."
                breadcrumbs={[
                    { label: "Organization", href: "/oa/dashboard" },
                    { label: "Enterprise Context" },
                ]}
            />

            {/* Info banner */}
            <Card className="border-brand-200 bg-brand-50/50">
                <CardContent className="flex items-start gap-3 p-4">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <div>
                        <p className="text-sm font-medium text-brand-800">How Enterprise Context Works</p>
                        <p className="mt-1 text-sm text-brand-700">
                            Define terms and upload documents so D-SecureAI can better understand your
                            organisation&apos;s specific language. Documents are scanned for domain entities
                            which you can review and save to the Glossary — improving anonymization accuracy
                            across all departments.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="glossary">
                <TabsList>
                    <TabsTrigger value="glossary" className="gap-2">
                        <BookText className="h-4 w-4" />Glossary
                        <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{terms.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="gap-2">
                        <FileText className="h-4 w-4" />Documents
                        <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{documents.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="patterns" className="gap-2">
                        <Globe className="h-4 w-4" />Custom Patterns
                        <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{patterns.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                {/* ============================================================ */}
                {/* Glossary tab                                                   */}
                {/* ============================================================ */}
                <TabsContent value="glossary" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base">Organisation Glossary</CardTitle>
                                    <CardDescription>{filteredTerms.length} of {terms.length} terms</CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    className="bg-brand-700 hover:bg-brand-800 shrink-0"
                                    onClick={() => setTermOpen(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />Add Term
                                </Button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <div className="relative min-w-45 flex-1">
                                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        className="h-8 pl-8 text-sm"
                                        placeholder="Search terms…"
                                        value={termSearch}
                                        onChange={e => setTermSearch(e.target.value)}
                                    />
                                </div>
                                {uniqueCategories.length > 0 && (
                                    <Select value={termCatFilter} onValueChange={setTermCatFilter}>
                                        <SelectTrigger className="h-8 w-36 text-sm">
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {uniqueCategories.map(c => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredTerms.length === 0 ? (
                                <div className="flex flex-col items-center py-10 text-center">
                                    <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
                                    <p className="mt-2 text-sm text-muted-foreground">No terms match your search</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredTerms.map(entry => (
                                        <div
                                            key={entry.id}
                                            className="group flex items-start justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/40"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold">{entry.term}</p>
                                                    {entry.category && (
                                                        <Badge
                                                            variant="outline"
                                                            className={`border text-[10px] ${getCategoryColor(entry.category)}`}
                                                        >
                                                            {entry.category}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-sm text-muted-foreground">{entry.definition}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="ml-2 h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger"
                                                onClick={() => handleDeleteTerm(entry.id, entry.term)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============================================================ */}
                {/* Documents tab                                                  */}
                {/* ============================================================ */}
                <TabsContent value="documents" className="mt-6 space-y-6">
                    {/* Dropzone */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Upload Document</CardTitle>
                            <CardDescription>
                                Upload company documents (PDF or TXT). Entities will be extracted for
                                review before being added to the Glossary.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                {...getRootProps()}
                                className={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors
                                    ${isDragActive
                                        ? "border-brand-500 bg-brand-50"
                                        : "border-border bg-muted/30 hover:border-brand-300"}`}
                            >
                                <input {...getInputProps()} />
                                <div className="text-center">
                                    <Upload className={`mx-auto h-10 w-10 ${isDragActive ? "text-brand-500" : "text-muted-foreground"}`} />
                                    <p className="mt-2 text-sm font-medium">
                                        {isDragActive ? "Drop files here" : "Drop files here or click to upload"}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">PDF, TXT — up to 10 MB</p>
                                    <Button variant="outline" size="sm" className="pointer-events-none mt-3">
                                        Browse Files
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Staged for processing */}
                    {stagedDocs.length > 0 && (
                        <Card className="border-brand-200 bg-brand-50/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-brand-800">
                                    <Clock className="h-4 w-4" />Staged for Processing
                                </CardTitle>
                                <CardDescription>
                                    Process each document to extract domain terms before they're added to the Glossary.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {stagedDocs.map(doc => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between rounded-lg border border-brand-200 bg-white p-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                                                    <FileText className="h-5 w-5 text-orange-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{doc.name}</p>
                                                    <p className="text-xs text-muted-foreground">{doc.size}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 border-brand-200 text-brand-600 hover:bg-brand-50"
                                                    onClick={() => handleProcessDoc(doc)}
                                                >
                                                    Process
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-danger"
                                                    onClick={() => setStagedDocs(prev => prev.filter(d => d.id !== doc.id))}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Uploaded documents */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Uploaded Documents</CardTitle>
                            <CardDescription>
                                {documents.length} document{documents.length !== 1 ? "s" : ""} indexed
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {documents.length === 0 ? (
                                <div className="flex flex-col items-center py-10 text-center">
                                    <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
                                    <p className="mt-2 text-sm text-muted-foreground">No documents uploaded yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {documents.map(doc => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/40"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${TYPE_COLORS[doc.type] ?? "bg-brand-50 text-brand-600"}`}>
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{doc.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {doc.size} · Uploaded {doc.uploadedAt}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-[10px]">Indexed</Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-danger"
                                                    onClick={() => handleDeleteDocument(doc.id, doc.name)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============================================================ */}
                {/* Custom Patterns tab                                            */}
                {/* ============================================================ */}
                <TabsContent value="patterns" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">Custom Anonymization Patterns</CardTitle>
                                    <CardDescription>
                                        Define regex patterns to detect organisation-specific sensitive data.
                                    </CardDescription>
                                </div>
                                <Button
                                    className="bg-brand-700 hover:bg-brand-800"
                                    size="sm"
                                    onClick={() => setPatternOpen(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />Add Pattern
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {patterns.length === 0 ? (
                                <div className="flex flex-col items-center py-10 text-center">
                                    <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
                                    <p className="mt-2 text-sm text-muted-foreground">No custom patterns defined</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {patterns.map(p => (
                                        <div
                                            key={p.id}
                                            className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/40"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                    <p className="text-sm font-medium">{p.label}</p>
                                                    <Badge
                                                        variant={p.active ? "default" : "secondary"}
                                                        className={p.active
                                                            ? "border-0 bg-success/10 text-success hover:bg-success/20"
                                                            : ""}
                                                    >
                                                        {p.active ? "Active" : "Disabled"}
                                                    </Badge>
                                                </div>
                                                <div className="mt-1.5 flex items-center gap-3">
                                                    <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                                                        {p.pattern}
                                                    </code>
                                                    {p.example && (
                                                        <span className="text-xs text-muted-foreground">
                                                            e.g. {p.example}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="ml-3 flex items-center gap-3">
                                                <Switch
                                                    checked={p.active}
                                                    onCheckedChange={() => handleTogglePattern(p.id)}
                                                />
                                                <Separator orientation="vertical" className="h-4" />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-danger"
                                                    onClick={() => handleDeletePattern(p.id, p.label)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ================================================================ */}
            {/* Add Term Dialog                                                    */}
            {/* ================================================================ */}
            <Dialog open={termOpen} onOpenChange={v => { if (!v) { setNewTerm(""); setNewDef(""); setNewCategory(""); } setTermOpen(v); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Glossary Term</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Term or Acronym <span className="text-danger">*</span></Label>
                            <Input
                                placeholder="e.g. D-SecureAI"
                                value={newTerm}
                                onChange={e => setNewTerm(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Definition <span className="text-danger">*</span></Label>
                            <Input
                                placeholder="What does this term mean?"
                                value={newDef}
                                onChange={e => setNewDef(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Input
                                placeholder="e.g. Product, Technical, Internal…"
                                value={newCategory}
                                onChange={e => setNewCategory(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Optional — used to group and filter terms.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            className="bg-brand-700 hover:bg-brand-800"
                            onClick={handleAddTerm}
                            disabled={termSaving}
                        >
                            {termSaving
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding…</>
                                : "Add Term"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ================================================================ */}
            {/* Process Document Dialog                                            */}
            {/* ================================================================ */}
            <Dialog
                open={!!processingDoc}
                onOpenChange={open => { if (!open && !isExtracting) { setProcessingDoc(null); setExtractedEntities([]); setEditingEntityId(null); } }}
            >
                <DialogContent className="sm:max-w-130">
                    <DialogHeader>
                        <DialogTitle>Processing Document</DialogTitle>
                        <DialogDescription>{processingDoc?.name}</DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        {isExtracting ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                                <p className="text-sm text-muted-foreground">Extracting sensitive entities…</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
                                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                                    Successfully extracted {extractedEntities.length} entities.
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Select the entities you want to add to the Organisation Glossary.
                                    You can edit or remove any before saving.
                                </p>

                                <div className="max-h-85 divide-y overflow-y-auto rounded-md border">
                                    {extractedEntities.map(entity => (
                                        <div
                                            key={entity.id}
                                            className="group relative flex flex-col p-3 transition-colors hover:bg-muted/50"
                                        >
                                            {editingEntityId === entity.id ? (
                                                /* ---- Inline edit form ---- */
                                                <div className="w-full space-y-3">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs text-muted-foreground">Entity Name</Label>
                                                            <Input
                                                                className="h-8 text-sm"
                                                                value={editEntityForm.original ?? ""}
                                                                onChange={e => setEditEntityForm(f => ({ ...f, original: e.target.value }))}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs text-muted-foreground">Type / Category</Label>
                                                            <Input
                                                                className="h-8 text-sm"
                                                                value={editEntityForm.type ?? ""}
                                                                onChange={e => setEditEntityForm(f => ({ ...f, type: e.target.value }))}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">Description</Label>
                                                        <Input
                                                            className="h-8 text-sm"
                                                            value={editEntityForm.description ?? ""}
                                                            onChange={e => setEditEntityForm(f => ({ ...f, description: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingEntityId(null)}>
                                                            Cancel
                                                        </Button>
                                                        <Button size="sm" className="h-7 bg-brand-700 text-xs hover:bg-brand-800" onClick={saveEditingEntity}>
                                                            Save
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* ---- Normal row ---- */
                                                <div className="flex w-full items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <Switch
                                                            checked={entity.checked}
                                                            onCheckedChange={() => toggleEntityCheck(entity.id)}
                                                            className="mt-0.5"
                                                        />
                                                        <div>
                                                            <p className="flex items-center gap-2 text-sm font-medium">
                                                                {entity.original}
                                                                {entity.type && (
                                                                    <Badge variant="outline" className="text-[10px]">
                                                                        {entity.type}
                                                                    </Badge>
                                                                )}
                                                            </p>
                                                            {entity.description && (
                                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                                    {entity.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 rounded-md p-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-brand-600"
                                                            onClick={() => startEditingEntity(entity)}
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-danger"
                                                            onClick={() => deleteEntity(entity.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {extractedEntities.length === 0 && (
                                        <div className="p-8 text-center text-sm text-muted-foreground">
                                            No entities remaining
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {!isExtracting && (
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => { setProcessingDoc(null); setExtractedEntities([]); setEditingEntityId(null); }}
                            >
                                Discard
                            </Button>
                            <Button className="bg-brand-700 hover:bg-brand-800" onClick={handleSaveEntities}>
                                Save to Context
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>

            {/* ================================================================ */}
            {/* Add Pattern Dialog                                                 */}
            {/* ================================================================ */}
            <Dialog open={patternOpen} onOpenChange={setPatternOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Custom Pattern</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Label <span className="text-danger">*</span></Label>
                            <Input
                                placeholder="e.g. Employee ID"
                                value={patLabel}
                                onChange={e => setPatLabel(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5">
                                <Code className="h-3.5 w-3.5" />
                                Regex Pattern <span className="text-danger">*</span>
                            </Label>
                            <Input
                                className="font-mono text-sm"
                                placeholder="e.g. EMP-[0-9]{6}"
                                value={patRegex}
                                onChange={e => setPatRegex(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Standard regex syntax. Do not include delimiters.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Example match</Label>
                            <Input
                                placeholder="e.g. EMP-001234"
                                value={patExample}
                                onChange={e => setPatExample(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            className="bg-brand-700 hover:bg-brand-800"
                            onClick={handleAddPattern}
                            disabled={patSaving}
                        >
                            {patSaving
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding…</>
                                : "Add Pattern"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
