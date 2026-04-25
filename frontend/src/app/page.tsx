"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TopHeader from "@/components/layout/TopHeader";
import Footer from "@/components/layout/Footer";
import { useAuthStore } from "@/store/authStore";
import { dashboardFor } from "@/hooks/useAuthGuard";

const FEATURES = [
  {
    icon: "🌾",
    title: "مباشر من المزرعة",
    desc: "بدون وسطاء. تتواصل مع المزارع مباشرةً وتحصل على أسعار عادلة للجميع.",
    color: "bg-forest-50 text-forest-600",
  },
  {
    icon: "⚡",
    title: "توصيل سريع",
    desc: "طازج من المزرعة إلى بابك خلال ساعات. نضمن الجودة والسرعة.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: "💵",
    title: "الدفع عند الاستلام",
    desc: "ادفع فقط عند استلام طلبك. نظام QR آمن يؤكد التسليم بدون مخاطر.",
    color: "bg-emerald-50 text-emerald-600",
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "تصفّح السوق", desc: "اختر من منتجات طازجة مباشرة من مزارع فلسطينية موثوقة." },
  { step: "2", title: "أضف للسلة", desc: "ضع ما تريد وأدخل عنوان التوصيل — كل شي خلال دقيقة." },
  { step: "3", title: "استلم طازجاً", desc: "يصلك طازجاً. امسح QR للتأكيد والدفع عند الاستلام." },
];

const CATEGORIES = [
  { icon: "🍅", name: "خضروات", color: "from-red-500/10 to-red-600/10", border: "border-red-200" },
  { icon: "🍊", name: "فواكه", color: "from-orange-500/10 to-orange-600/10", border: "border-orange-200" },
  { icon: "🫒", name: "زيتون", color: "from-green-500/10 to-green-600/10", border: "border-green-200" },
  { icon: "🌿", name: "أعشاب", color: "from-emerald-500/10 to-emerald-600/10", border: "border-emerald-200" },
  { icon: "🥛", name: "ألبان", color: "from-blue-500/10 to-blue-600/10", border: "border-blue-200" },
  { icon: "🌾", name: "حبوب", color: "from-amber-500/10 to-amber-600/10", border: "border-amber-200" },
];



export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setTimeout(() => setHeroLoaded(true), 100); }, []);

  useEffect(() => {
    if (!mounted || !isAuthenticated || !user) return;
    if (user.role !== "buyer") {
      router.replace(dashboardFor(user.role));
    }
  }, [mounted, isAuthenticated, user, router]);

  if (mounted && isAuthenticated && user && user.role !== "buyer") {
    return (
      <div className="min-h-screen bg-surface-warm flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const showRegisterCTAs = !isAuthenticated;

  return (
    <div className="min-h-screen flex flex-col bg-surface-warm">
      <TopHeader />

      {/* ═══════════════════ Hero Section ═══════════════════ */}
      <section className="relative overflow-hidden min-h-[480px] sm:min-h-[560px] flex items-center">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-forest-950 via-forest-900 to-forest-800" />

        {/* Subtle mesh gradient overlay */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(ellipse at 10% 50%, rgba(212,119,26,0.25) 0%, transparent 55%),
                            radial-gradient(ellipse at 90% 20%, rgba(26,157,101,0.3) 0%, transparent 50%)`,
        }} />

        {/* Grain texture for depth */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }} />

        <div className="relative w-full page-container py-16 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* ── Left: Text Content ── */}
            <div className="order-2 lg:order-1">
              {/* Live badge */}
              <div className={`inline-flex items-center gap-2 bg-white/8 border border-white/12 text-forest-200 px-4 py-1.5 rounded-full text-sm font-medium mb-7 backdrop-blur-sm transition-all duration-700 ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-forest-300" />
                </span>
                سوق زراعي فلسطيني — مباشر من المزرعة
              </div>

              <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-5 transition-all duration-700 delay-100 ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                سوقك الزراعي
                <br />
                <span className="bg-gradient-to-l from-forest-300 to-emerald-300 bg-clip-text text-transparent">
                  الذكي
                </span>
              </h1>

              <p className={`text-base sm:text-lg text-forest-100/80 leading-relaxed mb-8 max-w-lg transition-all duration-700 delay-200 ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                نربط المزارعين الفلسطينيين بالمستهلكين مباشرة —<br className="hidden sm:block" />
                منتجات طازجة، أسعار عادلة، ودفع آمن عند الاستلام.
              </p>

              <div className={`flex flex-wrap gap-3 transition-all duration-700 delay-300 ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 bg-white text-forest-800 font-bold px-7 py-3.5 rounded-2xl hover:bg-forest-50 transition-all duration-200 shadow-xl shadow-black/20 hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] text-base"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m5-9v9m4-9v9m5-9l2 9" />
                  </svg>
                  تصفّح السوق
                </Link>
                {showRegisterCTAs && (
                  <Link
                    href="/register?role=farmer"
                    className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/20 font-semibold px-7 py-3.5 rounded-2xl hover:bg-white/18 transition-all duration-200 backdrop-blur-sm text-base hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    🌾 انضم كمزارع
                  </Link>
                )}
              </div>

              {/* Trust badges */}
              <div className={`mt-8 flex flex-wrap gap-4 transition-all duration-700 delay-500 ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                {["✓ دفع عند الاستلام", "✓ جودة مضمونة", "✓ توصيل موثوق"].map((t) => (
                  <span key={t} className="text-xs text-forest-300/80 font-medium">{t}</span>
                ))}
              </div>
            </div>

            {/* ── Right: Logo Visual ── */}
            <div className={`order-1 lg:order-2 flex items-center justify-center transition-all duration-1000 delay-200 ${heroLoaded ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
              <div className="relative flex items-center justify-center w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80">

                {/* Outermost glow ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-forest-500/15 to-emerald-500/10 blur-3xl" />

                {/* Spinning dashed ring — large */}
                <div
                  className="absolute inset-2 rounded-full border border-dashed border-white/10"
                  style={{ animation: "spin 25s linear infinite" }}
                />

                {/* Spinning solid ring — medium */}
                <div
                  className="absolute inset-8 sm:inset-10 rounded-full"
                  style={{
                    background: "conic-gradient(from 0deg, rgba(26,157,101,0.4), rgba(212,119,26,0.2), rgba(26,157,101,0.4))",
                    animation: "spin 10s linear infinite",
                    borderRadius: "9999px",
                    padding: "1px",
                  }}
                >
                  <div className="w-full h-full rounded-full bg-forest-900/80" />
                </div>

                {/* Counter-spin inner accent */}
                <div
                  className="absolute inset-12 sm:inset-16 rounded-full border border-earth-400/30"
                  style={{ animation: "spin 8s linear infinite reverse" }}
                />

                {/* Center glass circle */}
                <div className="absolute inset-14 sm:inset-18 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 shadow-inner" />

                {/* The logo */}
                <Image
                  src="https://res.cloudinary.com/dutilondd/image/upload/v1777122878/logo_hasaad_v8s05t.png"
                  alt="حصاد"
                  width={160}
                  height={160}
                  className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40 object-contain"
                  style={{ animation: "floatLogo 7s ease-in-out infinite, logoGlow 5s ease-in-out infinite" }}
                  priority
                />

                {/* Orbiting dot — top */}
                <div
                  className="absolute w-3 h-3 rounded-full bg-forest-300 shadow-lg shadow-forest-400/50"
                  style={{
                    top: "8%", left: "50%", transformOrigin: "0 140px",
                    animation: "spin 8s linear infinite",
                    transform: "translateX(-50%)",
                  }}
                />
                {/* Orbiting dot — bottom */}
                <div
                  className="absolute w-2 h-2 rounded-full bg-earth-400 shadow-md shadow-earth-400/50"
                  style={{
                    bottom: "10%", right: "15%",
                    animation: "floatLogo 5s ease-in-out infinite reverse",
                  }}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-b border-surface-border">
        <div className="page-container">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.name}
                href={`/marketplace?category=${encodeURIComponent(cat.name)}`}
                className={`shrink-0 flex flex-col items-center gap-2 px-5 py-4 rounded-2xl border ${cat.border} bg-gradient-to-br ${cat.color} hover:shadow-lg transition-all duration-200 active:scale-95`}
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-sm font-semibold text-stone-700">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Hasaad */}
      <section className="py-16 bg-surface-warm">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-900 mb-3">لماذا حصاد؟</h2>
            <p className="text-stone-500 max-w-md mx-auto">
              منصة زراعية متكاملة تحمي حقوق المزارع وترضي المستهلك
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div 
                key={f.title}
                className="card p-6 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center text-2xl mb-4 transition-transform duration-300 group-hover:scale-110`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">{f.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-900 mb-3">كيف يعمل؟</h2>
            <p className="text-stone-500">ثلاث خطوات بسيطة وطلبك في طريقه</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="relative text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-forest-500 to-forest-600 rounded-2xl text-white font-extrabold text-2xl shadow-forest mb-4">
                  {step.step}
                </div>
                <h3 className="font-bold text-stone-900 mb-2">{step.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {showRegisterCTAs && (
        <section className="py-16 bg-gradient-to-br from-forest-600 to-forest-800">
          <div className="page-container text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              هل أنت مزارع وتريد بيع منتجاتك؟
            </h2>
            <p className="text-forest-100 mb-8 max-w-lg mx-auto">
              انضم لمئات المزارعين وبيع منتجاتك مباشرة للمستهلكين بدون وسطاء
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/register?role=farmer"
                className="inline-flex items-center gap-2 bg-white text-forest-700 font-bold px-8 py-4 rounded-xl hover:bg-forest-50 transition-all duration-200 shadow-lg"
              >
                🌾 سجل كمزارع مجاني
              </Link>
              <Link
                href="/register?role=buyer"
                className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/20 font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
              >
                🛒 سجل كمشتري
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Trust Strip */}
      <section className="bg-forest-900 py-8">
        <div className="page-container">
          <div className="flex flex-wrap gap-6 justify-center items-center text-forest-200 text-sm">
            {[
              "✓ منتجات طازجة 100%",
              "✓ مزارعون موثوقون",
              "✓ الدفع عند الاستلام",
              "✓ دعم على مدار ��لساعة",
            ].map((t) => (
              <span key={t} className="font-medium">{t}</span>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}