"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ordersApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import TopHeader from "@/components/layout/TopHeader";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";

type Phase = "checking" | "confirming" | "success" | "error" | "needs_login";

export default function OrderConfirmPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [phase, setPhase] = useState<Phase>("checking");
  const [message, setMessage] = useState<string>("");
  const [orderId, setOrderId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;

    if (!isAuthenticated || !user) {
      setPhase("needs_login");
      return;
    }

    // Only the buyer may confirm via scan (admins can too, but typical path is buyer)
    setPhase("confirming");
    ordersApi
      .confirmQr(token)
      .then((res) => {
        const data = res.data as { order_id?: number; message?: string };
        setOrderId(data.order_id ?? null);
        setMessage(data.message ?? "تم تأكيد التسليم بنجاح.");
        setPhase("success");
        // Auto-navigate to the order page after a short delay
        if (data.order_id) {
          setTimeout(() => router.push(`/orders/${data.order_id}`), 2500);
        }
      })
      .catch((err: unknown) => {
        const e = (err as { response?: { data?: { error?: string } } })?.response?.data;
        setMessage(e?.error || "تعذّر تأكيد التسليم. حاول مرة أخرى.");
        setPhase("error");
      });
  }, [token, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex flex-col bg-surface-warm">
      <TopHeader />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="card p-8 w-full max-w-md text-center space-y-4">
          {phase === "checking" || phase === "confirming" ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-forest-100 flex items-center justify-center text-3xl animate-pulse">
                🔐
              </div>
              <h1 className="text-xl font-bold text-stone-900">جارٍ تأكيد التسليم…</h1>
              <p className="text-sm text-stone-500">يرجى الانتظار قليلاً.</p>
            </>
          ) : phase === "success" ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-forest-500 flex items-center justify-center text-3xl text-white">
                ✓
              </div>
              <h1 className="text-xl font-bold text-forest-700">تم تأكيد الاستلام!</h1>
              <p className="text-sm text-stone-600 leading-relaxed">{message}</p>
              {orderId && (
                <p className="text-xs text-stone-400">
                  جارٍ تحويلك لصفحة الطلب #{orderId}…
                </p>
              )}
              <Link href={orderId ? `/orders/${orderId}` : "/orders"}>
                <Button fullWidth>عرض الطلب</Button>
              </Link>
            </>
          ) : phase === "needs_login" ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-earth-100 flex items-center justify-center text-3xl">
                🔑
              </div>
              <h1 className="text-xl font-bold text-stone-900">يرجى تسجيل الدخول</h1>
              <p className="text-sm text-stone-500 leading-relaxed">
                لتأكيد استلام طلبك، سجّل الدخول بحسابك أولاً.
              </p>
              <Link href={`/login?next=/orders/confirm/${token}`}>
                <Button fullWidth>تسجيل الدخول</Button>
              </Link>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-danger-100 flex items-center justify-center text-3xl">
                ⚠️
              </div>
              <h1 className="text-xl font-bold text-danger-700">تعذّر التأكيد</h1>
              <p className="text-sm text-stone-600 leading-relaxed">{message}</p>
              <div className="flex gap-3">
                <Link href="/orders" className="flex-1">
                  <Button variant="outline" fullWidth>طلباتي</Button>
                </Link>
                <Link href="/marketplace" className="flex-1">
                  <Button fullWidth>السوق</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
