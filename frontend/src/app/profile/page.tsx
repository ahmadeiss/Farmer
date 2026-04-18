"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { buyerApi, authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import TopHeader from "@/components/layout/TopHeader";
import { BuyerBottomNav } from "@/components/layout/MobileBottomNav";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LocationPicker, { type LocationValue } from "@/components/ui/LocationPicker";
import { Skeleton } from "@/components/ui/Skeleton";
import { findGovernorate } from "@/lib/palestine";

const accountSchema = z.object({
  full_name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal("")),
});

type AccountForm = z.infer<typeof accountSchema>;

export default function BuyerProfilePage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["buyer-profile"],
    queryFn: () => buyerApi.getProfile().then((r) => r.data),
    enabled: !!user && user.role === "buyer",
  });

  const [location, setLocation] = useState<LocationValue>({
    governorate: "",
    address: "",
    latitude: null,
    longitude: null,
  });
  const [notes, setNotes] = useState("");
  const [locationDirty, setLocationDirty] = useState(false);

  // Account form (name / email)
  const {
    register: regAccount,
    handleSubmit: handleAccount,
    reset: resetAccount,
    formState: { errors: accountErrors, isDirty: accountDirty },
  } = useForm<AccountForm>({ resolver: zodResolver(accountSchema) });

  useEffect(() => {
    if (profile) {
      setLocation({
        governorate: findGovernorate(profile.default_address)?.code ?? "",
        address: profile.default_address ?? "",
        latitude: profile.latitude ? +profile.latitude : null,
        longitude: profile.longitude ? +profile.longitude : null,
      });
      setNotes(profile.notes ?? "");
      setLocationDirty(false);
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      resetAccount({
        full_name: user.full_name ?? "",
        email: user.email ?? "",
      });
    }
  }, [user, resetAccount]);

  const { mutate: updateProfile, isPending: profilePending } = useMutation({
    mutationFn: (data: object) => buyerApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyer-profile"] });
      setLocationDirty(false);
      toast.success("تم حفظ معلومات التوصيل ✓");
    },
    onError: () => toast.error("حدث خطأ أثناء الحفظ"),
  });

  const { mutate: updateAccount, isPending: accountPending } = useMutation({
    mutationFn: (data: AccountForm) => authApi.updateProfile(data),
    onSuccess: (res) => {
      setUser(res.data);
      toast.success("تم تحديث بيانات الحساب ✓");
    },
    onError: () => toast.error("حدث خطأ أثناء تحديث الحساب"),
  });

  return (
    <div className="min-h-screen flex flex-col bg-surface-warm">
      <TopHeader />

      <main className="flex-1 page-container py-6 buyer-page-content space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">حسابي</h1>
          <p className="text-sm text-stone-400 mt-0.5">معلوماتك الشخصية وتفضيلات التوصيل</p>
        </div>

        {/* Account info */}
        <div className="card p-5">
          <h2 className="section-title mb-4">معلومات الحساب</h2>
          <div className="mb-4 p-3 bg-stone-50 rounded-xl border border-surface-border">
            <p className="text-xs text-stone-400 mb-1">رقم الهاتف (غير قابل للتعديل)</p>
            <p className="font-semibold text-stone-800 dir-ltr">{user?.phone}</p>
          </div>
          <form onSubmit={handleAccount((d) => updateAccount(d))} className="space-y-4">
            <Input
              label="الاسم الكامل"
              placeholder="أحمد محمد"
              required
              error={accountErrors.full_name?.message}
              {...regAccount("full_name")}
            />
            <Input
              label="البريد الإلكتروني (اختياري)"
              type="email"
              placeholder="example@email.com"
              className="dir-ltr"
              error={accountErrors.email?.message}
              {...regAccount("email")}
            />
            <div className="flex items-center gap-4">
              <Button
                type="submit"
                size="sm"
                loading={accountPending}
                disabled={!accountDirty && !accountPending}
              >
                حفظ بيانات الحساب
              </Button>
              <span className={`badge text-xs ${user?.is_verified ? "badge-success" : "badge-warning"}`}>
                {user?.is_verified ? "✓ حساب موثّق" : "غير موثّق"}
              </span>
            </div>
          </form>
        </div>

        {/* Delivery info */}
        <div className="card p-5">
          <h2 className="section-title mb-4">موقع التوصيل</h2>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProfile({
                  default_address: location.address,
                  latitude: location.latitude,
                  longitude: location.longitude,
                  notes,
                });
              }}
              className="space-y-4"
            >
              <LocationPicker
                value={location}
                onChange={(next) => { setLocation(next); setLocationDirty(true); }}
                label="عنوان التوصيل الافتراضي"
                helpText="حدّد موقعك مرّة واحدة ليتم ترتيب المنتجات حسب الأقرب إليك في السوق."
              />
              <div className="space-y-1.5">
                <label className="field-label">ملاحظات للسائق (اختياري)</label>
                <textarea
                  rows={3}
                  placeholder="مثال: الطابق الثالث، اتصل قبل التسليم..."
                  className="field-input resize-none"
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); setLocationDirty(true); }}
                />
              </div>
              <Button
                type="submit"
                size="sm"
                loading={profilePending}
                disabled={!locationDirty && !profilePending}
              >
                حفظ معلومات التوصيل
              </Button>
            </form>
          )}
        </div>
      </main>

      <Footer />
      <BuyerBottomNav />
    </div>
  );
}
