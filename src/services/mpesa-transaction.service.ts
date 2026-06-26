// M-Pesa transaction endpoints:
//   GET /mpesa/transactions?transaction_type&status&date_from&date_to&used&search
import { nnakApi } from "@/lib/api";
import type {
  MpesaTransaction,
  MpesaTransactionListParams,
  NnakPagination,
} from "@/types/nnak";

interface MpesaTransactionsResponse {
  success: boolean;
  data: MpesaTransaction[];
  pagination?: NnakPagination;
}

export const mpesaTransactionService = {
  list: async (params?: MpesaTransactionListParams) => {
    const r = await nnakApi.get<MpesaTransactionsResponse>(
      "/admin/mpesa/transactions",
      { params },
    );
    return {
      data: r.data?.data ?? [],
      pagination: r.data?.pagination,
      meta: r.data?.pagination,
    };
  },
};
