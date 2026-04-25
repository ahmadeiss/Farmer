"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { authApi, extractApiError } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useGuestOnly } from "@/hooks/useAuthGuard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { User } from "@/types";

const schema = z.object({
  full_name: z.string().min(3, "الاسم الكامل يجب أن يكون 3 أحرف على الأقل"),
  phone: z.string().min(9, "رقم الهاتف يجب أن يكون 9 أرقام"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  password_confirm: z.string(),
}).refine((data) => data.password === data.password_confirm, {
  message: "كلمات المرور غير متطابقة",
  path: ["password_confirm"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "buyer";

  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-warm" />}>
      <RegisterPageContent role={role} />
    </Suspense>
  );
}

function RegisterPageContent({ role }: { role: string }) {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", phone: "", password: "", password_confirm: "" },
  });

  const { mounted, isAuthenticated } = useGuestOnly();

  if (!mounted || isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-warm flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roleLabel = role === "farmer" ? "مزارع" : "مشترٍ";

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const payload = {
        full_name: data.full_name,
        phone: data.phone,
        password: data.password,
        password_confirm: data.password_confirm,
        role,
      };
      const res = await authApi.register(payload);
      const { user, access, refresh } = res.data as { user: User; access: string; refresh: string };
      setAuth(user, { access, refresh });
      toast.success(`أهلاً ${user.full_name} 👋 تم إنشاء حسابك بنجاح!`);

      if (role === "farmer") router.push("/farmer/dashboard");
      else router.push("/marketplace");
    } catch (err: unknown) {
      toast.error(extractApiError(err, "تعذر إنشاء الحساب"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-warm flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-forest-800 via-forest-700 to-forest-900 flex-col justify-between p-8">
        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="https://res.cloudinary.com/dutilondd/image/upload/v1777122878/logo_hasaad_v8s05t.png"
              alt="حصاد"
              width={48}
              height={48}
              className="w-12 h-12 rounded-xl object-contain bg-white/10 p-2"
            />
            <span className="text-white font-extrabold text-xl">حصاد</span>
          </Link>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-2xl font-bold text-white">
            انضم كـ{roleLabel} واستمتع بمميزات حصرية
          </h2>
          <ul className="space-y-3">
            {role === "farmer" ? [
              "✅ بيع منتجاتك مباشرة للمستهلكين",
              "✅ أسعار عادلة بدون وسطاء",
              "✅ إدارة Orders بسهولة من هاتفك",
              "✅ استلام المدفوعات عبر المحفظة",
            ] : [
              "✅ منتجات طازجة مباشرة من المزرعة",
              "✅ أسعار أفضل من السوق",
              "✅ توصيل سريع لباب بيتك",
              "✅ دفع آمن عند الاستلام",
            ].map((feat) => (
              <li key={feat} className="flex items-center gap-2 text-forest-100 text-sm">
                {feat}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-forest-400 text-xs">© 2025 حصاد — Hasaad</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-auto">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-6 justify-center">
            <Image
              src="https://res.cloudinary.com/dutilondd/image/upload/v1777122878/logo_hasaad_v8s05t.png"
              alt="حصاد"
              width={40}
              height={40}
              className="w-10 h-10 rounded-xl object-contain bg-forest-500 p-1.5"
            />
          </Link>

          <h1 className="text-2xl font-bold text-stone-900 mb-1">
            {role === "farmer" ? "أنشئ حساب مزارع" : "أنشئ حساب مشترٍ"}
          </h1>
          <p className="text-stone-400 text-sm mb-6">
            سجّل الآن واستمتع بمميزات حصرية
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="الاسم الكامل"
              placeholder="أدخل اسمك الكامل"
              error={errors.full_name?.message}
              required
              {...register("full_name")}
            />
            <Input
              label="رقم الهاتف"
              placeholder="05xxxxxxxx"
              type="tel"
              inputMode="tel"
              className="dir-ltr"
              autoComplete="tel"
              error={errors.phone?.message}
              required
              {...register("phone")}
            />
            <Input
              label="كلمة المرور"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              required
              {...register("password")}
            />
            <Input
              label="تأكيد كلمة المرور"
              type="password"
              placeholder="••••••••"
              error={errors.password_confirm?.message}
              required
              {...register("password_confirm")}
            />

            <Button type="submit" fullWidth size="lg" loading={isLoading}>
              أنشئ حسابي
            </Button>
          </form>

          <div className="mt-6 p-4 bg-stone-50 rounded-xl">
            <p className="text-xs text-stone-500">
              عند التسجيل أنت توافق على{" "}
              <Link href="/terms" className="text-forest-600 underline">الشروط والأحكام</Link>
            </p>
          </div>

          <p className="text-center text-sm text-stone-500 mt-6">
           已经有 حساب؟{" "}
            <Link href="/login"
              className="text-forest-600 font-semibold hover:text-forest-700 transition-colors">
              سجل دخولك
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}