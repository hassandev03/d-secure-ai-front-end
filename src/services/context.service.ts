import api from "./api";

export interface GlossaryTerm {
    term_id: string;
    user_id: string;
    term: string;
    definition: string;
    category: string;
    created_at: string;
    updated_at?: string;
}

export interface GlossaryTermCreate {
    term: string;
    definition: string;
    category: string;
}

export interface CustomPattern {
    pattern_id: string;
    user_id: string;
    label: string;
    pattern: string;
    example?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

export interface CustomPatternCreate {
    label: string;
    pattern: string;
    example?: string;
    is_active?: boolean;
}

export interface ContextSummary {
    glossary: GlossaryTerm[];
    patterns: CustomPattern[];
}

// ── Combined fetch — replaces separate /glossary + /patterns calls ──────────
// Uses the backend GET /context/summary endpoint which fires both DB queries
// concurrently (asyncio.gather) and runs a single auth chain instead of two.
export const getContextSummary = async (): Promise<ContextSummary> => {
    const res = await api.get("/context/summary");
    return res.data as ContextSummary;
};

// ── Individual endpoints (used for CRUD mutations) ───────────────────────────

export const getGlossary = async (): Promise<GlossaryTerm[]> => {
    const res = await api.get("/context/glossary");
    return res.data;
};

export const createGlossaryTerm = async (data: GlossaryTermCreate): Promise<GlossaryTerm> => {
    const res = await api.post("/context/glossary", data);
    return res.data;
};

export const updateGlossaryTerm = async (id: string, data: Partial<GlossaryTermCreate>): Promise<GlossaryTerm> => {
    const res = await api.patch(`/context/glossary/${id}`, data);
    return res.data;
};

export const deleteGlossaryTerm = async (id: string): Promise<void> => {
    await api.delete(`/context/glossary/${id}`);
};

export const getPatterns = async (): Promise<CustomPattern[]> => {
    const res = await api.get("/context/patterns");
    return res.data;
};

export const createPattern = async (data: CustomPatternCreate): Promise<CustomPattern> => {
    const res = await api.post("/context/patterns", data);
    return res.data;
};

export const updatePattern = async (id: string, data: Partial<CustomPatternCreate>): Promise<CustomPattern> => {
    const res = await api.patch(`/context/patterns/${id}`, data);
    return res.data;
};

export const deletePattern = async (id: string): Promise<void> => {
    await api.delete(`/context/patterns/${id}`);
};

// ── Document operations ───────────────────────────────────────────────────────

export interface ContextDocument {
    file_id: string;
    file_name: string;
    size: number;
    mime_type: string;
    created_at: string;
    is_processed: boolean;
}

export const getContextDocuments = async (): Promise<ContextDocument[]> => {
    const res = await api.get("/context/documents");
    return res.data;
};

export const uploadContextDocument = async (file: File): Promise<ContextDocument> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/context/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
};

export const deleteContextDocument = async (id: string): Promise<void> => {
    await api.delete(`/context/documents/${id}`);
};
