"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TopHeader from "@/components/layout/TopHeader";
import Footer from "@/components/layout/Footer";
import { useAuthStore } from "@/store/authStore";
import { dashboardFor } from "@/hooks/useAuthGuard";
import { useScrollAnimation, useParallax } from "@/hooks/useScrollAnimation";

const CATEGORIES = [
  { icon: "🍅", name: "خضروات", color: "from-red-500/15 to-red-600/20", border: "border-red-200/50", hover: "hover:border-red-300 hover:shadow-red-100" },
  { icon: "🍊", name: "فواكه", color: "from-orange-500/15 to-orange-600/20", border: "border-orange-200/50", hover: "hover:border-orange-300 hover:shadow-orange-100" },
  { icon: "🫒", name: "زيتون", color: "from-green-500/15 to-green-600/20", border: "border-green-200/50", hover: "hover:border-green-300 hover:shadow-green-100" },
  { icon: "🌿", name: "أعشاب", color: "from-emerald-500/15 to-emerald-600/20", border: "border-emerald-200/50", hover: "hover:border-emerald-300 hover:shadow-emerald-100" },
  { icon: "🥛", name: "ألبان", color: "from-blue-500/15 to-blue-600/20", border: "border-blue-200/50", hover: "hover:border-blue-300 hover:shadow-blue-100" },
  { icon: "🌾", name: "حبوب", color: "from-amber-500/15 to-amber-600/20", border: "border-amber-200/50", hover: "hover:border-amber-300 hover:shadow-amber-100" },
  { icon: "🍯", name: "عسل", color: "from-yellow-500/15 to-amber-600/20", border: "border-yellow-200/50", hover: "hover:border-yellow-300 hover:shadow-yellow-100" },
  { icon: "🥚", name: "بيض", color: "from-pink-500/15 to-rose-600/20", border: "border-pink-200/50", hover: "hover:border-pink-300 hover:shadow-pink-100" },
  { icon: "🧀", name: "جبنة", color: "from-amber-600/15 to-yellow-600/20", border: "border-amber-300/50", hover: "hover:border-amber-400 hover:shadow-amber-100" },
  { icon: "🌵", name: "نباتات", color: "from-lime-500/15 to-green-600/20", border: "border-lime-200/50", hover: "hover:border-lime-300 hover:shadow-lime-100" },
  { icon: "🍇", name: "كرمة", color: "from-violet-500/15 to-purple-600/20", border: "border-violet-200/50", hover: "hover:border-violet-300 hover:shadow-violet-100" },
  { icon: "🌻", name: "بذور", color: "from-orange-400/15 to-yellow-600/20", border: "border-orange-200/50", hover: "hover:border-orange-300 hover:shadow-orange-100" },
];

const FEATURES = [
  {
    icon: "🌾",
    title: "مباشر من المزرعة",
    desc: "بدون وسطاء. تتواصل مع المزارع مباشرةً وتحصل على أسعار عادلة للجميع.",
    color: "from-emerald-50 to-green-50",
    iconColor: "text-emerald-600",
    borderColor: "border-emerald-100/50",
  },
  {
    icon: "⚡",
    title: "توصيل سريع",
    desc: "طازج من المزرعة إلى بابك خلال ساعات. نضمن الجودة والسرعة.",
    color: "from-amber-50 to-orange-50",
    iconColor: "text-amber-600",
    borderColor: "border-amber-100/50",
  },
  {
    icon: "💵",
    title: "الدفع عند الاستلام",
    desc: "ادفع فقط عند استلام طلبك. نظام QR آمن يؤكد التسليم بدون مخاطر.",
    color: "from-teal-50 to-cyan-50",
    iconColor: "text-teal-600",
    borderColor: "border-teal-100/50",
  },
  {
    icon: "🏆",
    title: "جودة مضمونة",
    desc: "نختار أفضل المنتجات من مزارع موثوقة مع ضمان استبدال كامل.",
    color: "from-violet-50 to-purple-50",
    iconColor: "text-violet-600",
    borderColor: "border-violet-100/50",
  },
];

const STATS = [
  { value: "24/7", label: "دعم متواصل" },
];

const HOW_IT_WORKS = [
  { 
    step: "1", 
    title: "تصفّح السوق", 
    desc: "اختر من منتجات طازجة مباشرة من مزارع فلسطينية موثوقة.", 
    icon: "search",
    color: "bg-gradient-to-br from-emerald-500 to-green-600" 
  },
  { 
    step: "2", 
    title: "أضف للسلة", 
    desc: "ضع ما تريد وأدخل عنوان التوصيل — كل شي خلال دقيقة.", 
    icon: "cart",
    color: "bg-gradient-to-br from-amber-500 to-orange-600" 
  },
  { 
    step: "3", 
    title: "استلم طازجاً", 
    desc: "يصلك طازجاً. امسح QR للتأكيد والدفع عند الاستلام.", 
    icon: "truck",
    color: "bg-gradient-to-br from-teal-500 to-cyan-600" 
  },
];

function AnimatedSection({ 
  children, 
  className = "", 
  delay = 0,
  direction = "up"
}: { 
  children: React.ReactNode; 
  className?: string; 
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  
  const directionClasses = {
    up: "translate-y-12",
    down: "-translate-y-12",
    left: "translate-x-12",
    right: "-translate-x-12",
  };
  
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className} ${
        isVisible 
          ? "opacity-100 translate-y-0 translate-x-0" 
          : `opacity-0 ${directionClasses[direction]}`
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function HeroParallaxBackground() {
  const { ref: parallaxRef } = useParallax(0.3);
  
  return (
    <div 
      ref={parallaxRef}
      className="absolute inset-0 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/20 via-transparent to-transparent rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-500/15 via-transparent to-transparent rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-gradient-to-t from-forest-600/10 to-transparent rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
}

function HeroSection({ heroLoaded }: { heroLoaded: boolean }) {
  return (
    <section className="relative overflow-hidden min-h-[600px] sm:min-h-[700px] lg:min-h-[800px] flex items-center">
      <div className="absolute inset-0 bg-gradient-to-br from-forest-950 via-forest-900 to-forest-800" />
      <HeroParallaxBackground />
      
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
      }} />
      
      <div className="relative w-full page-container py-20 sm:py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 text-center lg:text-right">
            <div className={`inline-flex items-center gap-2 bg-white/10 border border-white/15 text-emerald-300 px-4 py-2 rounded-full text-sm font-medium mb-8 backdrop-blur-md transition-all duration-700 ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300" />
              </span>
              منصة زراعية فلسطينية رائدة
            </div>

            <h1 className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.05] mb-6 transition-all duration-700 delay-100 ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              سوقك الزراعي
              <br />
              <span className="bg-gradient-to-l from-emerald-300 via-green-300 to-teal-300 bg-clip-text text-transparent">
                الذكي
              </span>
            </h1>

            <p className={`text-base sm:text-lg lg:text-xl text-emerald-100/80 leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0 transition-all duration-700 delay-200 ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              نربط المزارعين الفلسطينيين بالمستهلكين مباشرة —
              <br className="hidden sm:block" />
              منتجات طازجة بأسعار عادلة ودفع آمن عند الاستلام.
            </p>

            <div className={`flex flex-wrap gap-4 justify-center lg:justify-start transition-all duration-700 delay-300 ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <Link
                href="/marketplace"
                className="group inline-flex items-center gap-3 bg-white text-forest-800 font-bold px-8 py-4 rounded-2xl hover:bg-emerald-50 transition-all duration-300 shadow-xl shadow-black/20 hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m5-9v9m4-9v9m5-9l2 9" />
                </svg>
                تصفّح السوق
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/register?role=farmer"
                className="group inline-flex items-center gap-2 bg-emerald-500/20 text-white border border-emerald-400/30 font-semibold px-8 py-4 rounded-2xl hover:bg-emerald-500/30 transition-all duration-300 backdrop-blur-sm text-base hover:-translate-y-1 active:scale-[0.98]"
              >
                🌾 انضم كمزارع
              </Link>
            </div>

            <div className={`mt-10 flex flex-wrap gap-6 justify-center lg:justify-start transition-all duration-700 delay-500 ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              {["دفع عند الاستلام", "جودة مضمونة", "توصيل موثوق"].map((t, i) => (
                <span key={i} className="flex items-center gap-2 text-sm text-emerald-200/80">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className={`order-1 lg:order-2 flex items-center justify-center transition-all duration-1000 delay-200 ${heroLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            <div className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/20 blur-3xl animate-pulse-slow" />
              
              <div
                className="absolute inset-4 rounded-full border border-dashed border-white/20 animate-spin-slow"
              />
              
              <div
                className="absolute inset-8 sm:inset-12 rounded-full"
                style={{
                  background: "conic-gradient(from 0deg, rgba(26,157,101,0.6), rgba(212,119,26,0.4), rgba(26,157,101,0.6), rgba(34,197,94,0.3), rgba(26,157,101,0.6))",
                  animation: "spin 12s linear infinite",
                  borderRadius: "9999px",
                  padding: "2px",
                }}
              >
                <div className="w-full h-full rounded-full bg-gradient-to-br from-forest-950 to-forest-900" />
              </div>

              <div
                className="absolute inset-16 sm:inset-20 rounded-full border border-emerald-400/20 animate-spin-reverse"
                style={{ animationDuration: "10s" }}
              />

              <div className="absolute inset-20 sm:inset-24 rounded-full bg-white/5 backdrop-blur-sm border border-white/15 shadow-inner" />

              <Image
                src="https://res.cloudinary.com/dutilondd/image/upload/v1777122878/logo_hasaad_v8s05t.png"
                alt="حصاد"
                width={180}
                height={180}
                className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 object-contain"
                style={{ animation: "floatLogo 6s ease-in-out infinite, logoGlow 4s ease-in-out infinite" }}
                priority
              />

              <div
                className="absolute w-4 h-4 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"
                style={{
                  top: "5%",
                  left: "50%",
                  transformOrigin: "0 150px",
                  animation: "spin 8s linear infinite",
                }}
              />
              
              <div
                className="absolute w-3 h-3 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50"
                style={{
                  bottom: "8%",
                  right: "10%",
                  animation: "floatLogo 5s ease-in-out infinite reverse",
                }}
              />
              
              <div
                className="absolute w-2 h-2 rounded-full bg-teal-400 shadow-lg shadow-teal-400/50"
                style={{
                  top: "30%",
                  left: "5%",
                  animation: "floatLogo 6s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-warm to-transparent" />
    </section>
  );
}

function StatsSection() {
  return (
    <section className="relative -mt-16 z-10">
      <div className="page-container">
        <AnimatedSection>
          <div className="bg-white rounded-3xl shadow-xl shadow-black/10 border border-surface-border overflow-hidden">
            <div className="grid grid-cols-1 divide-x divide-surface-border">
              {STATS.map((stat, i) => (
                <div key={stat.label} className="p-8 text-center hover:bg-surface-warm transition-colors duration-300">
                  <div className="text-5xl sm:text-6xl font-extrabold text-forest-600 mb-2">{stat.value}</div>
                  <div className="text-lg text-stone-600 font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

function CategoriesSection() {
  return (
    <section className="py-20 bg-surface-warm">
      <div className="page-container">
        <AnimatedSection className="text-center mb-14">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-forest-600 mb-4 px-4 py-1.5 bg-forest-50 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            تسوق حسب الفئة
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mb-4">
            منتجات طازجة من المزرعة
          </h2>
          <p className="text-stone-500 max-w-xl mx-auto text-lg">
            اكتشف تشكيلتنا الواسعة من المنتجات الزراعية الطازجة واللحوم ومشتقات الألبان
          </p>
        </AnimatedSection>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat, i) => (
            <AnimatedSection key={cat.name} delay={i * 50}>
              <Link
                href={`/marketplace?category=${encodeURIComponent(cat.name)}`}
                className={`group flex flex-col items-center gap-3 p-5 rounded-2xl border ${cat.border} ${cat.hover} bg-gradient-to-br ${cat.color} hover:shadow-xl transition-all duration-300 active:scale-95 text-center`}
              >
                <span className="text-5xl filter drop-shadow-sm transform transition-transform duration-300 group-hover:scale-110">{cat.icon}</span>
                <span className="text-sm font-bold text-stone-700">{cat.name}</span>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="page-container">
        <AnimatedSection className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-amber-600 mb-3 px-4 py-1.5 bg-amber-50 rounded-full">
            مميزاتنا
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mb-4">
            لماذا حصاد؟
          </h2>
          <p className="text-stone-500 max-w-2xl mx-auto text-lg">
            منصة زراعية متكاملة تحمي حقوق المزارع وترضي المستهلك
          </p>
        </AnimatedSection>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <AnimatedSection key={f.title} delay={i * 100}>
              <div className="group h-full">
                <div className={`h-full p-8 rounded-2xl border ${f.borderColor} bg-gradient-to-br ${f.color} hover:shadow-xl hover:-translate-y-2 transition-all duration-300`}>
                  <div className={`w-16 h-16 rounded-2xl ${f.color} flex items-center justify-center text-3xl mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-3">{f.title}</h3>
                  <p className="text-stone-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-surface-warm to-white">
      <div className="page-container">
        <AnimatedSection className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-teal-600 mb-3 px-4 py-1.5 bg-teal-50 rounded-full">
            بسيط وسريع
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mb-4">
            كيف يعمل؟
          </h2>
          <p className="text-stone-500 max-w-lg mx-auto text-lg">
            ثلاث خطوات بسيطة وطلبك في طريقه
          </p>
        </AnimatedSection>
        
        <div className="relative max-w-5xl mx-auto">
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-200 to-transparent -translate-y-1/2" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {HOW_IT_WORKS.map((step, i) => (
              <AnimatedSection key={step.title} delay={i * 150}>
                <div className="relative text-center">
                  <div className={`relative inline-flex items-center justify-center w-20 h-20 ${step.color} rounded-2xl text-white font-extrabold text-3xl shadow-lg mb-6 ring-4 ring-white`}>
                    {step.step}
                    <div className="absolute -z-10 inset-0 rounded-2xl blur-xl opacity-50" style={{ background: "inherit", filter: "blur(20px)" }} />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-3">{step.title}</h3>
                  <p className="text-stone-500 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection({ showRegisterCTAs }: { showRegisterCTAs: boolean }) {
  if (!showRegisterCTAs) return null;
  
  return (
    <section className="py-20 bg-gradient-to-br from-forest-700 via-forest-800 to-forest-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>
      
      <div className="relative page-container text-center">
        <AnimatedSection>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-emerald-200 px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            🌾 انضم لمئات المزارعين
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
            هل أنت مزارع وتريد<br />بيع منتجاتك؟
          </h2>
          <p className="text-emerald-100/80 mb-10 max-w-xl mx-auto text-lg">
            انضم لمئات المزارعين وبيع منتجاتك مباشرة للمستهلكين بدون وسطاء
          </p>
        </AnimatedSection>
        
        <AnimatedSection delay={200}>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/register?role=farmer"
              className="group inline-flex items-center gap-3 bg-white text-forest-700 font-bold px-10 py-5 rounded-2xl hover:bg-emerald-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] text-lg"
            >
              🌾 سجل كمزارع مجاني
              <svg className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/register?role=buyer"
              className="group inline-flex items-center gap-2 bg-emerald-500/20 text-white border-2 border-emerald-400/30 font-bold px-10 py-5 rounded-2xl hover:bg-emerald-500/30 transition-all duration-300 backdrop-blur-sm text-lg hover:-translate-y-1 active:scale-[0.98]"
            >
              🛒 سجل كمشتري
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

function TrustStripSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });
  
  return (
    <section ref={ref} className={`py-12 bg-stone-900 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="page-container">
        <div className="flex flex-wrap gap-8 justify-center items-center">
          {[
            { icon: "✅", text: "منتجات طازجة 100%" },
            { icon: "🏆", text: "مزارعون موثوقون" },
            { icon: "💵", text: "الدفع عند الاستلام" },
            { icon: "🎧", text: "دعم على مدار الساعة" },
          ].map((item, i) => (
            <div key={item.text} className="flex items-center gap-3 text-stone-300">
              <span className="text-2xl">{item.icon}</span>
              <span className="font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
      
      <HeroSection heroLoaded={heroLoaded} />
      <StatsSection />
      <CategoriesSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection showRegisterCTAs={showRegisterCTAs} />
      <TrustStripSection />
      
      <Footer />
    </div>
  );
}