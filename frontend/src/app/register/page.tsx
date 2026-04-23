"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { authApi, extractApiError } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useGuestOnly } from "@/hooks/useAuthGuard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const schema = z.object({
  full_name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  phone: z.string().min(7, "رقم هاتف غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  password_confirm: z.string(),
  role: z.enum(["farmer", "buyer"]),
}).refine((d) => d.password === d.password_confirm, {
  message: "كلمتا المرور غير متطابقتان",
  path: ["password_confirm"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-warm" />}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get("role") as "farmer" | "buyer") || "buyer";
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  // ALL hooks must be called unconditionally before any early return (Rules of Hooks)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole },
  });

  const role = watch("role");

  // Redirect to dashboard if already logged in
  const { mounted, isAuthenticated } = useGuestOnly();
  if (!mounted || isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-warm flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const { password_confirm, ...payload } = data;
      const res = await authApi.register(payload);
      const { tokens, ...user } = res.data;
      setAuth(user, tokens);
      toast.success("تم إنشاء الحساب بنجاح! ✅");
      if (role === "farmer") router.push("/farmer/dashboard");
      else router.push("/marketplace");
    } catch (err: unknown) {
      toast.error(extractApiError(err, "حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى."));
    } finally {
      setIsLoading(false);
    }
  };

  const ROLES = [
    { value: "buyer", icon: "🛒", label: "مشتري", desc: "أشتري منتجات طازجة" },
    { value: "farmer", icon: "🌾", label: "مزارع", desc: "أبيع محاصيلي الزراعية" },
  ] as const;

  return (
    <div className="min-h-screen bg-surface-warm flex items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 bg-forest-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">🌾</span>
          </div>
          <span className="font-extrabold text-stone-900 text-lg">حصاد الذكي</span>
        </Link>

        <h1 className="text-2xl font-bold text-stone-900 mb-1">إنشاء حساب جديد</h1>
        <p className="text-stone-400 text-sm mb-8">انضم إلى آلاف المزارعين والمستهلكين</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <p className="field-label mb-2">نوع الحساب *</p>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex flex-col items-center gap-1.5 p-4 border-2 rounded-xl cursor-pointer transition-all duration-150 text-center ${
                    role === opt.value
                      ? "border-forest-500 bg-forest-50 text-forest-700"
                      : "border-surface-border text-stone-500 hover:border-stone-300 bg-white"
                  }`}
                >
                  <input type="radio" value={opt.value} className="hidden" {...register("role")} />
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="font-bold text-sm">{opt.label}</span>
                  <span className="text-2xs leading-tight text-stone-400">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>

          <Input
            label="الاسم الكامل"
            placeholder="محمد أحمد العلي"
            autoComplete="name"
            required
            error={errors.full_name?.message}
            {...register("full_name")}
          />
          <Input
            label="رقم الهاتف"
            placeholder="05xxxxxxxx"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="dir-ltr"
            required
            error={errors.phone?.message}
            {...register("phone")}
          />
          <Input
            label="كلمة المرور"
            type="password"
            placeholder="8 أحرف على الأقل"
            autoComplete="new-password"
            required
            error={errors.password?.message}
            hint="8 أحرف على الأقل، يفضّل خلط أرقام وحروف"
            {...register("password")}
          />
          <Input
            label="تأكيد كلمة المرور"
            type="password"
            placeholder="أعد كتابة كلمة المرور"
            autoComplete="new-password"
            required
            error={errors.password_confirm?.message}
            {...register("password_confirm")}
          />

          <Button type="submit" fullWidth size="lg" loading={isLoading}>
            {isLoading ? "جارٍ إنشاء الحساب..." : `إنشاء حساب ${role === "farmer" ? "مزارع" : "مشتري"}`}
          </Button>
        </form>

        <p className="text-center text-sm text-stone-500 mt-6">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="text-forest-600 font-semibold hover:text-forest-700 transition-colors">
            سجّل دخولك
          </Link>
        </p>
      </div>
    </div>
  );
}
