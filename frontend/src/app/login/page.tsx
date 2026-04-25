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
      {/* ── Left decorative panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[42%] bg-gradient-to-br from-forest-950 via-forest-900 to-forest-800 flex-col justify-between p-10 relative overflow-hidden">
        {/* Mesh gradient */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `radial-gradient(ellipse at 20% 70%, rgba(212,119,26,0.3) 0%, transparent 55%),
                            radial-gradient(ellipse at 80% 20%, rgba(26,157,101,0.25) 0%, transparent 50%)`,
        }} />

        {/* Logo mark — top */}
        <div className="relative flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden backdrop-blur-sm group-hover:bg-white/15 transition-colors">
              <Image
                src="https://res.cloudinary.com/dutilondd/image/upload/v1777122878/logo_hasaad_v8s05t.png"
                alt="حصاد"
                width={36}
                height={36}
                className="object-contain w-9 h-9"
              />
            </div>
            <div>
              <p className="text-white font-extrabold text-xl leading-none">حصاد</p>
              <p className="text-forest-400 text-xs mt-0.5">Hasaad</p>
            </div>
          </Link>
        </div>

        {/* Central logo visual */}
        <div className="relative flex items-center justify-center my-8">
          <div className="relative w-52 h-52">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-forest-500/20 to-earth-500/10 blur-3xl" />
            <div className="absolute inset-4 rounded-full border border-white/8"
                 style={{ animation: "spin 20s linear infinite" }} />
            <div className="absolute inset-0 rounded-full"
                 style={{ background: "conic-gradient(from 0deg, rgba(26,157,101,0.3), transparent, rgba(212,119,26,0.2), transparent, rgba(26,157,101,0.3))",
                          animation: "spin 12s linear infinite" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="https://res.cloudinary.com/dutilondd/image/upload/v1777122878/logo_hasaad_v8s05t.png"
                alt="حصاد"
                width={120}
                height={120}
                className="object-contain w-28 h-28"
                style={{ animation: "floatLogo 7s ease-in-out infinite" }}
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="relative space-y-4">
          {[
            { icon: "🌾", text: "منتجات طازجة مباشرة من المزرعة" },
            { icon: "💵", text: "الدفع عند الاستلام — لا مخاطرة" },
            { icon: "📦", text: "توصيل سريع وموثوق إلى بابك" },
          ].map((p) => (
            <div key={p.text} className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-base shrink-0">{p.icon}</span>
              <span className="text-forest-100 text-sm">{p.text}</span>
            </div>
          ))}
        </div>

        <p className="relative text-forest-500 text-xs mt-8">© {new Date().getFullYear()} حصاد — Hasaad. جميع الحقوق محفوظة.</p>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex flex-col items-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-forest-500 flex items-center justify-center shadow-lg shadow-forest-500/30">
              <Image
                src="https://res.cloudinary.com/dutilondd/image/upload/v1777122878/logo_hasaad_v8s05t.png"
                alt="حصاد"
                width={44}
                height={44}
                className="object-contain w-11 h-11"
              />
            </div>
            <span className="font-extrabold text-stone-900 text-xl">حصاد</span>
          </Link>

          <h1 className="text-2xl font-bold text-stone-900 mb-1">أهلاً بعودتك 👋</h1>
          <p className="text-stone-400 text-sm mb-8">سجّل دخولك للمتابعة إلى السوق</p>

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
              <span className="text-xs text-stone-400 cursor-default select-none">
                للمساعدة تواصل مع الدعم
              </span>
            </div>

            <Button type="submit" fullWidth size="lg" loading={isLoading}>
              تسجيل الدخول
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <p className="text-center text-sm text-stone-500">
              ليس لديك حساب؟
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/register?role=buyer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-surface-border text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
              >
                🛒 مشترٍ
              </Link>
              <Link
                href="/register?role=farmer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-forest-600 text-white text-sm font-semibold hover:bg-forest-700 transition-colors"
              >
                🌾 مزارع
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}