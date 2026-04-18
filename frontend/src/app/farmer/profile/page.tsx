"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { farmerApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import DashboardShell from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LocationPicker, { type LocationValue } from "@/components/ui/LocationPicker";
import { Skeleton } from "@/components/ui/Skeleton";
import { findGovernorate, GOVERNORATE_BY_CODE } from "@/lib/palestine";
import type { FarmerProfile } from "@/types";

const schema = z.object({
  farm_name: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  village: z.string().max(100).optional().or(z.literal("")),
  bio: z.string().max(1000).optional().or(z.literal("")),
  preferred_payout_method: z.enum(["cash", "bank", "wallet"]),
});

type FormData = z.infer<typeof schema>;

const PAYOUT_METHODS = [
  { value: "cash", label: "نقداً" },
  { value: "bank", label: "تحويل بنكي" },
  { value: "wallet", label: "محفظة إلكترونية" },
] as const;

export default function FarmerProfilePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<FarmerProfile>({
    queryKey: ["farmer-profile"],
    queryFn: () => farmerApi.getProfile().then((r) => r.data),
  });

  const [location, setLocation] = useState<LocationValue>({
    governorate: "",
    address: "",
    latitude: null,
    longitude: null,
  });
  const [locationDirty, setLocationDirty] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      farm_name: "",
      city: "",
      village: "",
      bio: "",
      preferred_payout_method: "cash",
    },
  });

  // Populate form once profile loads
  useEffect(() => {
    if (profile) {
      reset({
        farm_name: profile.farm_name ?? "",
        city: profile.city ?? "",
        village: profile.village ?? "",
        bio: profile.bio ?? "",
        preferred_payout_method:
          (profile.preferred_payout_method as "cash" | "bank" | "wallet") ?? "cash",
      });
      setLocation({
        governorate: findGovernorate(profile.governorate)?.code ?? "",
        address: profile.address ?? "",
        latitude: profile.latitude ? +profile.latitude : null,
        longitude: profile.longitude ? +profile.longitude : null,
      });
      setLocationDirty(false);
    }
  }, [profile, reset]);

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: (data: object) => farmerApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmer-profile"] });
      setLocationDirty(false);
      toast.success("تم حفظ الملف الشخصي ✓");
    },
    onError: (error: any) => {
      const fieldError = error?.response?.data?.address?.[0] || 
                        error?.response?.data?.governorate?.[0] ||
                        error?.response?.data?.message ||
                        "حدث خطأ أثناء الحفظ";
      toast.error(fieldError);
    },
  });

  const onSubmit = (data: FormData) => {
    const govName = GOVERNORATE_BY_CODE[location.governorate]?.name_ar ?? location.governorate;
    updateProfile({
      ...data,
      governorate: govName,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  return (
    <DashboardShell role="farmer">
      <PageHeader title="حسابي" subtitle="معلوماتك الشخصية وتفاصيل مزرعتك" />

      {/* Account info card (read-only) */}
      <div className="card p-5 mb-6">
        <h2 className="section-title mb-4">معلومات الحساب</h2>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="field-label">الاسم الكامل</p>
              <p className="text-stone-900 font-semibold mt-1">{user?.full_name}</p>
            </div>
            <div>
              <p className="field-label">رقم الهاتف</p>
              <p className="text-stone-900 font-semibold mt-1 dir-ltr">{user?.phone}</p>
            </div>
            <div>
              <p className="field-label">نوع الحساب</p>
              <span className="badge badge-success mt-1 inline-block">مزارع</span>
            </div>
            <div>
              <p className="field-label">حالة التحقق</p>
              <span className={`badge mt-1 inline-block ${
                user?.is_verified ? "badge-success" : "badge-warning"
              }`}>
                {user?.is_verified ? "✓ موثّق" : "غير موثّق"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Farm profile form */}
      <div className="card p-5">
        <h2 className="section-title mb-5">تفاصيل المزرعة</h2>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="اسم المزرعة"
                placeholder="مزرعة الأمل"
                error={errors.farm_name?.message}
                {...register("farm_name")}
              />
              <Input
                label="المدينة"
                placeholder="غزة"
                error={errors.city?.message}
                {...register("city")}
              />
              <Input
                label="القرية / الحي"
                placeholder="الرمال"
                error={errors.village?.message}
                {...register("village")}
              />
            </div>

            <div className="rounded-xl border border-surface-border bg-stone-50/50 p-4">
              <LocationPicker
                value={location}
                onChange={(next) => { setLocation(next); setLocationDirty(true); }}
                label="موقع المزرعة"
                helpText="اختر المحافظة واضغط 'اكتشف موقعي' من داخل المزرعة ليصل لك المشترون القريبون أولاً."
              />
            </div>

            <div className="space-y-1.5">
              <label className="field-label">نبذة عن المزرعة</label>
              <textarea
                rows={3}
                placeholder="اكتب نبذة مختصرة عن مزرعتك ومنتجاتك..."
                className="field-input resize-none"
                {...register("bio")}
              />
              {errors.bio && <p className="field-error">{errors.bio.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="field-label">طريقة الصرف المفضلة</label>
              <div className="grid grid-cols-3 gap-2">
                {PAYOUT_METHODS.map((m) => (
                  <label
                    key={m.value}
                    className="flex flex-col items-center gap-1 p-3 border-2 rounded-xl
                               cursor-pointer transition-all duration-150 text-center text-sm
                               has-[:checked]:border-forest-500 has-[:checked]:bg-forest-50
                               has-[:checked]:text-forest-700 border-surface-border text-stone-500"
                  >
                    <input type="radio" value={m.value} className="hidden" {...register("preferred_payout_method")} />
                    <span className="font-medium">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                loading={isPending}
                disabled={!isDirty && !locationDirty && !isPending}
              >
                حفظ التغييرات
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardShell>
  );
}
