// Member subscriptions: /member/subscriptions
//   GET  /member/subscriptions             -> { data: MemberSubscription[] }
//   GET  /member/subscriptions/{id}        -> { data: MemberSubscription }
//   POST /member/subscriptions             create
import { nnakApi } from "@/lib/api";
import { isDemoSession } from "@/lib/demo-token";
import type { ApiEnvelope, MemberSubscription } from "@/types/nnak";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

const demoSubs = (): MemberSubscription[] => [
  {
    id: "demo-sub-1",
    amount: "3000.00",
    payment_method: "mpesa",
    status: true,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
      .toISOString()
      .slice(0, 10),
    member_category: { id: "demo-cat", name: "Individual" },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const subscriptionsService = {
  list: async (): Promise<MemberSubscription[]> => {
    if (isDemoSession()) return demoSubs();
    try {
      return await unwrap<MemberSubscription[]>(
        nnakApi.get("/member/subscriptions"),
      );
    } catch {
      return demoSubs();
    }
  },
  getById: async (id: string): Promise<MemberSubscription | null> => {
    if (isDemoSession()) return demoSubs()[0] ?? null;
    try {
      return await unwrap<MemberSubscription>(
        nnakApi.get(`/member/subscriptions/${id}`),
      );
    } catch {
      return null;
    }
  },
  /** POST /member/subscriptions — body shape is backend-defined; commonly
   *  {} for individuals (server resolves the member's category) or
   *  { member_category_id } for explicit picks. */
  create: async (
    body: { member_category_id?: string; payment_method?: string } = {},
  ): Promise<MemberSubscription> =>
    unwrap<MemberSubscription>(nnakApi.post("/member/subscriptions", body)),
};
