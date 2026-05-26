// MOCK upload service. Real NNAK backend endpoint TBD.
// Suggested contract:  POST /uploads  (multipart/form-data, field "file")
//                      -> { url: string }
// For now we return a temporary object URL so RichTextEditor / ImageUpload
// keep working in development.

export const uploadService = {
  upload: async (file: File): Promise<{ url: string }> => {
    if (typeof window === "undefined") {
      return { url: "" };
    }
    const url = URL.createObjectURL(file);
    return { url };
  },
};
