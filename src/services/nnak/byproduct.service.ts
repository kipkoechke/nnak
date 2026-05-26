// MOCK — backend endpoint TBD. Suggested contract:
//   POST /byproduct-uploads  { branch_id, period_month, lines: [...] }
//   GET  /byproduct-uploads
//   GET  /byproduct-uploads/{id}/lines
import { mockStore } from "@/lib/nnak/mock-store";

export const byProductService = {
  list: async () => mockStore.listByProductUploads(),
  lines: async (id: string) => mockStore.listByProductLines(id),
  upload: async (input: {
    branch_id: string;
    period_month: string;
    uploaded_by: string;
    lines: { national_id: string; name: string; amount: number }[];
  }) => mockStore.uploadByProduct(input),
};
