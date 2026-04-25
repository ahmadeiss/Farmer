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
import type { LoginResponse } from "@/types";

const schema = z.object({
  phone: z.string().min(7, "رقم هاتف غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-warm" />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

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
      const res = await authApi.login(data);
      const { user, access, refresh } = res.data as LoginResponse & { access: string; refresh: string };
      setAuth(user, { access, refresh });
      toast.success(`أهلاً ${user.full_name} 👋`);

      const next = searchParams.get("next");
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        router.push(next);
        return;
      }

      if (user.role === "farmer") router.push("/farmer/dashboard");
      else if (user.role === "admin") router.push("/admin/dashboard");
      else if (user.role === "driver") router.push("/driver/dashboard");
      else router.push("/marketplace");
    } catch (err: unknown) {
      toast.error(extractApiError(err, "بيانات الدخول غير صحيحة"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-warm flex">
      {/* Left decorative panel – hidden on mobile */}
      <div className="hidden lg:flex lg:w-2/5 bg-forest-800 flex-col justify-between p-10">
        <Link href="/" className="flex items-center gap-3">
            <Image
              src="https://res.cloudinary.com/dutilondd/image/upload/v1777122878/logo_hasaad_v8s05t.png"
              alt="حصاد"
              width={40}
              height={40}
              className="w-10 h-10 rounded-xl object-contain bg-white/10"
            />
            <span className="text-white font-extrabold text-lg">حصاد</span>
          </Link>

        <div className="space-y-3">
          {[
            { icon: "🌾", text: "منتجات طازجة مباشرة من المزرعة" },
            { icon: "💵", text: "الدفع عند الاستلام — لا مخاطرة" },
            { icon: "📦", text: "توصيل سريع وموثوق" },
          ].map((p) => (
            <div key={p.text} className="flex items-center gap-3 text-forest-100 text-sm">
              <span className="text-lg">{p.icon}</span>
              <span>{p.text}</span>
            </div>
          ))}
        </div>

        <p className="text-forest-400 text-xs">© 2025 حصاد — Hasaad</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Image
              src="https://res.cloudinary.com/dutilondd/image/upload/v1777122878/logo_hasaad_v8s05t.png"
              alt="حصاد"
              width={36}
              height={36}
              className="w-9 h-9 rounded-xl object-contain bg-forest-500 p-1"
            />
            <span className="font-extrabold text-stone-900 text-lg">حصاد</span>
          </Link>

          <h1 className="text-2xl font-bold text-stone-900 mb-1">أهلاً بعودتك</h1>
          <p className="text-stone-400 text-sm mb-8">سجّل دخولك للمتابعة</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              autoComplete="current-password"
              error={errors.password?.message}
              required
              {...register("password")}
            />

            <div className="flex justify-end">
              <Link href="/forgot-password"
                className="text-xs text-forest-600 hover:text-forest-700 font-medium transition-colors">
                نسيت كلمة المرور؟
              </Link>
            </div>

            <Button type="submit" fullWidth size="lg" loading={isLoading}>
              تسجيل الدخول
            </Button>
          </form>

          <p className="text-center text-sm text-stone-500 mt-6">
            ليس لديك حساب؟{" "}
            <Link href="/register"
              className="text-forest-600 font-semibold hover:text-forest-700 transition-colors">
              أنشئ حساباً مجانياً
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}