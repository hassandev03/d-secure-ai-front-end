import api from "./api";

export const uploadFile = async (file: File, purpose: string = "GENERAL"): Promise<{ file_id: string; status: string; storage_path: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", purpose);
    
    // Use the specific avatar upload endpoint for avatars to bypass policy size limits (uses fixed 5MB limit)
    const endpoint = purpose === "AVATAR" ? "/files/upload/avatar" : "/files/upload";
    
    const res = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
};
