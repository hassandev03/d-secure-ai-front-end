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

// --- Document Operations ---

export interface ContextDocument {
    file_id: string;
    filename: string;
    file_size_bytes: number;
    mime_type: string;
    created_at: string;
    status: string;
}

export const getContextDocuments = async (): Promise<ContextDocument[]> => {
    const res = await api.get("/files", { params: { purpose: "KNOWLEDGE_CONTEXT" } });
    return res.data;
};

export const uploadContextDocument = async (file: File): Promise<ContextDocument> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", "KNOWLEDGE_CONTEXT");
    const res = await api.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
};

export const deleteContextDocument = async (id: string): Promise<void> => {
    await api.delete(`/files/${id}`);
};
