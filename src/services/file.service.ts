import api from "./api";

export const uploadFile = async (file: File, purpose: string = "GENERAL"): Promise<{ file_id: string; status: string; storage_path: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", purpose);
    const res = await api.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
};
