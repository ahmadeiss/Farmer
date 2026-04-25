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

const STATS = [
  { value: "500+", label: "منتج طازج" },
  { value: "50+", label: "مزارع موثوقة" },
  { value: "10K+", label: "طلب منفّذ" },
  { value: "4.8", label: "تقييم" },
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

      {/* Hero Section - Modern Design */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-forest-900 via-forest-800 to-forest-700" />
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, #d4771a 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1a9d65 0%, transparent 40%), radial-gradient(circle at 60% 80%, #22c55e 0%, transparent 30%)`,
          }} />
        </div>

        {/* Floating Elements */}
        <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-all duration-1000 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute -top-20 -end-20 w-64 h-64 bg-forest-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -start-20 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative page-container py-16 sm:py-20 lg:py-24">
          <div className="max-w-2xl">
            {/* Tag */}
            <div className={`inline-flex items-center gap-2 bg-white/10 text-forest-100 px-4 py-1.5 rounded-full text-sm font-medium mb-6 backdrop-blur-sm transition-all duration-700 transform ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-forest-300"></span>
              </span>
              منتجات طازجة مباشرة من المزارع
            </div>

            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4 transition-all duration-700 delay-100 transform ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              سوقك الزراعي{" "}
              <span className="text-forest-300">الذكي</span>
            </h1>

            <p className={`text-lg sm:text-xl text-forest-100 leading-relaxed mb-8 max-w-xl transition-all duration-700 delay-200 transform ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              نربط المزارعين بالمستهلكين مباشرة. منتجات طازجة، أسعار عادلة، توصيل موثوق.
            </p>

            <div className={`flex flex-wrap gap-3 transition-all duration-700 delay-300 transform ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 bg-white text-forest-700 font-bold px-6 py-3.5 rounded-xl hover:bg-forest-50 transition-all duration-200 hover:shadow-lg hover:shadow-forest-500/25 active:scale-[0.98] shadow-lg text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m5-9v9m4-9v9m5-9l2 9" />
                </svg>
                تصفّح السوق الآن
              </Link>
              {showRegisterCTAs && (
                <Link
                  href="/register?role=farmer"
                  className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/20 font-semibold px-6 py-3.5 rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm text-base"
                >
                  🌾 انضم كمزارع
                </Link>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className={`mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 transition-all duration-700 delay-500 transform ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            {STATS.map((stat, i) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-forest-200">{stat.label}</div>
              </div>
            ))}
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