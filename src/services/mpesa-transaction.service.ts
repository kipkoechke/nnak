// M-Pesa transaction endpoints:
//   GET /mpesa/transactions?transaction_type&status&date_from&date_to&used&search
//
// Since 2026-08-13 the list returns only successful, terminal payments
// (stk_push_callback / c2b_confirmation) unless an explicit filter overrides
// it — the request/query rows and failures are hidden by default. What it
// filtered on comes back in `meta.default_filters`.
import { nnakApi } from "@/lib/api";
import type {
  MpesaListingMeta,
  MpesaTransaction,
  MpesaTransactionListParams,
  NnakPagination,
} from "@/types/nnak";

interface MpesaTransactionsResponse {
  success: boolean;
  data: MpesaTransaction[];
  pagination?: NnakPagination;
  meta?: MpesaListingMeta;
}

export const mpesaTransactionService = {
  /**
   * Finance officers hold `/finance/mpesa/transactions`, not the admin route,
   * and the sidebar shows them this screen — so the caller passes its scope
   * rather than everyone hitting `/admin` and finance getting a 403.
   */
  list: async (
    params?: MpesaTransactionListParams,
    scope: "admin" | "finance" = "admin",
  ) => {
    const r = await nnakApi.get<MpesaTransactionsResponse>(
      `/${scope}/mpesa/transactions`,
      { params },
    );
    return {
      data: Array.isArray(r.data?.data) ? r.data.data : [],
      pagination: r.data?.pagination,
      meta: r.data?.pagination,
      /** Which filters the route applied by default vs. what we asked for. */
      listing: r.data?.meta,
    };
  },
};
