// Mixes real /api/v1/branches data with local member counts.
// In production this would just call /api/v1/branches.
import { mockStore } from "@/lib/mock-store";

export const nnakBranchesService = {
  list: async () => mockStore.listBranches(),
};
