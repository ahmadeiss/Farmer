"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { buyerApi, cartApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils";
import TopHeader from "@/components/layout/TopHeader";
import { BuyerBottomNav } from "@/components/layout/MobileBottomNav";
import Button from "@/components/ui/Button";
import PriceDisplay from "@/components/ui/PriceDisplay";
import { Skeleton } from "@/components/ui/Skeleton";
import LocationPicker, { type LocationValue } from "@/components/ui/LocationPicker";
import { findGovernorate, GOVERNORATE_BY_CODE } from "@/lib/palestine";
import type { BuyerProfile, Cart, CheckoutResult } from "@/types";

const schema = z.object({
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: () => cartApi.getCart().then((r) => r.data),
  });

  const { data: buyerProfile } = useQuery<BuyerProfile>({
    queryKey: ["buyer-profile"],
    queryFn: () => buyerApi.getProfile().then((r) => r.data),
    enabled: user?.role === "buyer",
  });

  const [location, setLocation] = useState<LocationValue>({
    governorate: "",
    town: "",
    address: "",
    latitude: null,
    longitude: null,
  });

  const { register, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { notes: "" },
  });

  useEffect(() => {
    if (buyerProfile) {
      reset({ notes: buyerProfile.notes ?? "" });
      setLocation({
        governorate: findGovernorate(buyerProfile.default_address)?.code ?? "",
        town: "",
        address: buyerProfile.default_address ?? "",
        latitude: buyerProfile.latitude ? +buyerProfile.latitude : null,
        longitude: buyerProfile.longitude ? +buyerProfile.longitude : null,
      });
    }
  }, [buyerProfile, reset]);

  const { mutate: checkout, isPending } = useMutation({
    mutationFn: (data: object) => cartApi.checkout(data),
    onSuccess: (res) => {
      const data = res.data as CheckoutResult;
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success(data.order_count > 1 ? `تم إنشاء ${data.order_count} طلبات بنجاح` : "تم تقديم طلبك بنجاح! ✅");
      router.push(data.order_count === 1 ? `/orders/${data.order_ids[0]}` : "/orders");
    },
    onError: (err: unknown) => {
      const errorData = (err as { response?: { data?: { error?: string } } })?.response?.data;
      toast.error(errorData?.error || "تعذّر إتمام الطلب. حاول مرة أخرى.");
    },
  });

  const onSubmit = (data: FormData) => {
    if (!location.governorate) {
      toast.error("يرجى اختيار المحافظة أولاً");
      return;
    }
    const govName = GOVERNORATE_BY_CODE[location.governorate]?.name_ar ?? "";
    checkout({
      delivery_address: location.address,
      notes: data.notes ?? "",
      governorate: govName,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-warm">
        <TopHeader />
        <div className="flex-1 page-container py-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.item_count === 0) {
    router.push("/cart");
    return null;
  }

  const farmersCount = new Set(cart.items.map((item) => item.farmer_id)).size;

  return (
    <div className="min-h-screen flex flex-col bg-surface-warm">
      <TopHeader />

      <main className="flex-1 page-container py-6 buyer-page-content">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">إتمام الشراء</h1>
          <p className="text-sm text-stone-400 mt-0.5">خطوة أخيرة وطلبك في طريقه إليك</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 card p-5">
            <h2 className="font-bold text-stone-900 mb-5">📌 بيانات التوصيل</h2>

            {buyerProfile?.default_address && (
              <div className="mb-4 rounded-xl border border-forest-100 bg-forest-50 p-4 text-sm text-forest-800">
                تم تعبئة بيانات التوصيل تلقائياً من الملف الشخصي، ويمكنك تعديلها هنا قبل تأكيد الطلب.
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <LocationPicker
                value={location}
                onChange={setLocation}
                label="موقع التوصيل"
                helpText="اختر المحافظة والقرية، أو اضغط 'اكتشف موقعي' لتحديد موقعك تلقائياً."
              />

              <div>
                <label className="field-label">ملاحظات إضافية (اختياري)</label>
                <textarea
                  {...register("notes")}
                  className="field-input resize-none"
                  rows={2}
                  placeholder="أي تعليمات خاصة للتوصيل أو للسائق..."
                />
              </div>

              <div className="rounded-xl border border-surface-border bg-white p-4 text-sm text-stone-600">
                سيتم استخدام هذه البيانات مع {farmersCount} {farmersCount === 1 ? "مزارع" : "مزارعين"} في هذه السلة، وسينشأ طلب منفصل لكل مزارع تلقائياً.
              </div>

              <div className="flex gap-3 bg-earth-50 border border-earth-100 rounded-xl p-4">
                <span className="text-2xl">💵</span>
                <div>
                  <p className="font-bold text-earth-800 text-sm">الدفع نقداً عند الاستلام</p>
                  <p className="text-xs text-earth-600 mt-0.5 leading-relaxed">
                    ادفع فقط عند استلام طلبك. ستحصل على رمز QR لتأكيد التسليم بأمان.
                  </p>
                </div>
              </div>

              <Button type="submit" fullWidth size="lg" loading={isPending}>
                {isPending ? "جارٍ تقديم الطلب..." : "تأكيد الطلب ✅"}
              </Button>
            </form>
          </div>

          <div className="lg:col-span-2">
            <div className="card p-5 lg:sticky lg:top-20">
              <h2 className="font-bold text-stone-900 mb-4">ملخص الطلب</h2>

              <div className="space-y-2.5 mb-4 text-sm">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <span className="text-stone-600 flex-1 min-w-0 truncate">
                      {item.product_title}
                      <span className="text-stone-400 ms-1">×{item.quantity}</span>
                    </span>
                    <span className="font-semibold text-stone-800 tabular-nums ms-3 shrink-0">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-surface-border pt-3 space-y-2.5">
                <div className="flex justify-between text-sm text-stone-500">
                  <span>المجموع الفرعي</span>
                  <span className="tabular-nums">{formatCurrency(cart.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">التوصيل</span>
                  <span className="text-forest-600 font-semibold">مجاني</span>
                </div>
                <div className="flex items-baseline justify-between pt-2 border-t border-surface-border">
                  <span className="font-bold text-stone-900">الإجمالي</span>
                  <PriceDisplay amount={cart.total} size="lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BuyerBottomNav />
    </div>
  );
}
