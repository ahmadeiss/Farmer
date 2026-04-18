"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ordersApi } from "@/lib/api";
import TopHeader from "@/components/layout/TopHeader";
import { BuyerBottomNav } from "@/components/layout/MobileBottomNav";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Order } from "@/types";

const STAR_LABELS = ["", "سيء", "مقبول", "جيد", "جيد جداً", "ممتاز"];

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["my-order", id],
    queryFn: () => ordersApi.getMyOrder(Number(id)).then((r) => r.data),
  });

  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: () =>
      ordersApi.submitReview({ order: Number(id), rating, comment }),
    onSuccess: () => {
      toast.success("شكراً على تقييمك! 🌟");
      router.push(`/orders/${id}`);
    },
    onError: (err: unknown) => {
      const e = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      const msg = e ? Object.values(e)[0]?.[0] : null;
      toast.error(msg || "تعذّر إرسال التقييم");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-warm">
        <TopHeader />
        <div className="flex-1 page-container py-6 buyer-page-content space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order || order.status !== "delivered") {
    return (
      <div className="min-h-screen flex flex-col bg-surface-warm">
        <TopHeader />
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <p className="text-4xl mb-3">🚫</p>
            <p className="font-bold text-stone-900">التقييم غير متاح</p>
            <p className="text-sm text-stone-400 mt-1 mb-4">
              يمكنك تقييم الطلب فقط بعد تسليمه بنجاح
            </p>
            <Button size="sm" onClick={() => router.back()}>رجوع</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-warm">
      <TopHeader />

      <main className="flex-1 page-container py-6 buyer-page-content">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-white border border-surface-border
                       flex items-center justify-center text-stone-500
                       hover:bg-stone-50 transition-colors shrink-0">
            →
          </button>
          <div>
            <h1 className="text-xl font-bold text-stone-900">تقييم الطلب #{order.id}</h1>
            <p className="text-xs text-stone-400 mt-0.5">من المزارع: {order.farmer_name}</p>
          </div>
        </div>

        <div className="card p-6 space-y-7 max-w-lg">
          {/* Star rating */}
          <div className="text-center">
            <p className="font-semibold text-stone-800 mb-4">كيف كانت تجربتك؟</p>
            <div className="flex justify-center gap-2 mb-2"
              onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  className="text-4xl transition-transform duration-100 active:scale-90
                             hover:scale-110 focus:outline-none"
                  aria-label={`${star} نجوم`}
                >
                  <span className={
                    star <= (hover || rating)
                      ? "text-amber-400"
                      : "text-stone-200"
                  }>★</span>
                </button>
              ))}
            </div>
            {(hover || rating) > 0 && (
              <p className="text-sm font-semibold text-amber-600 h-5">
                {STAR_LABELS[hover || rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label className="field-label">
              تعليقك (اختياري)
            </label>
            <textarea
              rows={4}
              placeholder="شارك تجربتك... جودة المنتج، التعبئة، سرعة التوصيل..."
              className="field-input resize-none"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
            />
            <p className="text-xs text-stone-400 text-end">{comment.length}/500</p>
          </div>

          {/* Items reminder */}
          <div className="bg-stone-50 rounded-xl p-3 border border-surface-border">
            <p className="text-xs font-semibold text-stone-500 mb-2">ما اشتريته:</p>
            <div className="flex flex-wrap gap-1.5">
              {order.items.map((item) => (
                <span key={item.id}
                  className="text-xs bg-white border border-surface-border
                             text-stone-600 px-2.5 py-1 rounded-full">
                  {item.title_snapshot}
                </span>
              ))}
            </div>
          </div>

          {/* Submit */}
          <Button
            fullWidth
            size="lg"
            loading={isPending}
            disabled={rating === 0}
            onClick={() => submitReview()}
          >
            {rating === 0 ? "اختر تقييمك أولاً" : "إرسال التقييم ⭐"}
          </Button>
        </div>
      </main>

      <Footer />
      <BuyerBottomNav />
    </div>
  );
}
