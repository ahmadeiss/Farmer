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
  phone: z
    .string()
    .min(9, "رقم الهاتف يجب أن يكون 9 أرقام على الأقل")
    .regex(/^[0-9+\-\s]+$/, "رقم الهاتف يجب أن يحتوي على أرقام فقط"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  password_confirm: z.string().min(1, "يرجى تأكيد كلمة المرور"),
}).refine((data) => data.password === data.password_confirm, {
  message: "كلمات المرور غير متطابقة",
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
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "buyer";
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
      {/* ── Left decorative panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[42%] bg-gradient-to-br from-forest-950 via-forest-900 to-forest-800 flex-col justify-between p-10 relative overflow-hidden">
        {/* Mesh gradient */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `radial-gradient(ellipse at 80% 20%, rgba(26,157,101,0.3) 0%, transparent 55%),
                            radial-gradient(ellipse at 15% 80%, rgba(212,119,26,0.25) 0%, transparent 50%)`,
        }} />

        {/* Logo mark */}
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/15 transition-colors">
              <Image
                src="https://res.cloudinary.com/dutilondd/image/upload/v1777122878/logo_hasaad_v8s05t.png"
                alt="حصاد" width={36} height={36} className="object-contain w-9 h-9"
              />
            </div>
            <div>
              <p className="text-white font-extrabold text-xl leading-none">حصاد</p>
              <p className="text-forest-400 text-xs mt-0.5">Hasaad</p>
            </div>
          </Link>
        </div>

        {/* Central logo visual */}
        <div className="relative flex items-center justify-center my-6">
          <div className="relative w-48 h-48">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-forest-500/20 to-earth-500/10 blur-3xl" />
            <div className="absolute inset-0 rounded-full"
                 style={{ background: "conic-gradient(from 0deg, rgba(26,157,101,0.3), transparent, rgba(212,119,26,0.2), transparent, rgba(26,157,101,0.3))",
                          animation: "spin 12s linear infinite" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="https://res.cloudinary.com/dutilondd/image/upload/v1777122878/logo_hasaad_v8s05t.png"
                alt="حصاد" width={100} height={100}
                className="object-contain w-24 h-24"
                style={{ animation: "floatLogo 7s ease-in-out infinite" }}
              />
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="relative space-y-4">
          <h2 className="text-lg font-bold text-white mb-2">
            انضم كـ{roleLabel} واستمتع بمميزات حصرية
          </h2>
          <ul className="space-y-3">
            {(role === "farmer" ? [
              { icon: "🌾", text: "بيع منتجاتك مباشرة للمستهلكين" },
              { icon: "💰", text: "أسعار عادلة بدون وسطاء" },
              { icon: "📱", text: "إدارة طلباتك بسهولة من هاتفك" },
              { icon: "🏦", text: "استلام المدفوعات عبر المحفظة" },
            ] : [
              { icon: "🍅", text: "منتجات طازجة مباشرة من المزرعة" },
              { icon: "💵", text: "أسعار أفضل من السوق التقليدي" },
              { icon: "🚚", text: "توصيل سريع لباب بيتك" },
              { icon: "🔒", text: "دفع آمن عند الاستلام فقط" },
            ]).map((feat) => (
              <li key={feat.text} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-sm shrink-0">{feat.icon}</span>
                <span className="text-forest-100 text-sm">{feat.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-forest-500 text-xs mt-6">© {new Date().getFullYear()} حصاد — Hasaad.</p>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-auto bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex flex-col items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-forest-500 flex items-center justify-center shadow-lg shadow-forest-500/30">
              <Image
                src="https://res.cloudinary.com/dutilondd/image/upload/v1777122878/logo_hasaad_v8s05t.png"
                alt="حصاد" width={44} height={44} className="object-contain w-11 h-11"
              />
            </div>
            <span className="font-extrabold text-stone-900 text-xl">حصاد</span>
          </Link>

          <h1 className="text-2xl font-bold text-stone-900 mb-1">
            {role === "farmer" ? "🌾 أنشئ حساب مزارع" : "🛒 أنشئ حساب مشترٍ"}
          </h1>
          <p className="text-stone-400 text-sm mb-6">
            سجّل الآن واستمتع بمميزات حصرية — مجاناً تماماً
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
            لديك حساب بالفعل؟{" "}
            <Link href="/login"
              className="text-forest-600 font-semibold hover:text-forest-700 transition-colors">
              سجّل دخولك
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}