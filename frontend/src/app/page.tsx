import Link from "next/link";
import TopHeader from "@/components/layout/TopHeader";
import Footer from "@/components/layout/Footer";

const FEATURES = [
  {
    icon: "🌾",
    title: "مباشر من المزرعة",
    desc: "بدون وسطاء. تتواصل مع المزارع مباشرةً وتحصل على أسعار عادلة للجميع.",
  },
  {
    icon: "📦",
    title: "توصيل في نفس اليوم",
    desc: "طازج من المزرعة إلى بابك. نضمن جودة المنتج وسرعة التوصيل.",
  },
  {
    icon: "💵",
    title: "الدفع عند الاستلام",
    desc: "ادفع فقط عند استلام طلبك. نظام QR آمن يؤكد التسليم.",
  },
];

const HOW_IT_WORKS = [
  { step: "١", title: "تصفّح السوق",    desc: "اختر من مئات المنتجات الطازجة من مزارع فلسطينية موثوقة." },
  { step: "٢", title: "ضع طلبك",        desc: "أضف ما تريد للسلة وأدخل عنوان التوصيل — لا يستغرق دقيقة." },
  { step: "٣", title: "استلم طازجاً",   desc: "يصلك طلبك طازجاً. امسح رمز QR لتأكيد الاستلام." },
];

const CATEGORIES = [
  { icon: "🍅", name: "خضروات",  color: "bg-red-50 text-red-700"   },
  { icon: "🍊", name: "فواكه",   color: "bg-orange-50 text-orange-700" },
  { icon: "🫒", name: "زيت زيتون", color: "bg-forest-50 text-forest-700" },
  { icon: "🌿", name: "أعشاب",   color: "bg-emerald-50 text-emerald-700" },
  { icon: "🐄", name: "ألبان",   color: "bg-blue-50 text-blue-700"  },
  { icon: "🌾", name: "حبوب",    color: "bg-earth-50 text-earth-700" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-warm">
      <TopHeader />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-forest-900 via-forest-800 to-forest-700" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #d4771a 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1a9d65 0%, transparent 40%)" }} />

        <div className="relative page-container py-16 sm:py-24 lg:py-28">
          <div className="max-w-2xl">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 bg-white/10 text-forest-100
                            px-4 py-1.5 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-forest-300 rounded-full animate-pulse-slow" />
              منتجات طازجة من مزارع فلسطين
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white
                           leading-tight mb-4">
              سوقك الزراعي{" "}
              <span className="text-forest-300">الذكي</span>
            </h1>

            <p className="text-lg sm:text-xl text-forest-100 leading-relaxed mb-8 max-w-xl">
              نربط المزارعين الفلسطينيين بالمستهلكين مباشرةً.
              منتجات طازجة، أسعار عادلة، وتوصيل موثوق.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 bg-white text-forest-700
                           font-bold px-6 py-3 rounded-xl hover:bg-forest-50
                           transition-colors shadow-lg text-base"
              >
                🛒 تصفّح السوق الآن
              </Link>
              <Link
                href="/register?role=farmer"
                className="inline-flex items-center gap-2 bg-white/10 text-white
                           border border-white/30 font-semibold px-6 py-3 rounded-xl
                           hover:bg-white/20 transition-colors backdrop-blur-sm text-base"
              >
                🌾 انضم كمزارع
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-10 pt-8 border-t border-white/20">
              {[
                { num: "٥٠+",  label: "مزارع" },
                { num: "٢٠٠+", label: "منتج طازج" },
                { num: "٥٠٠+", label: "عميل راضٍ" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-extrabold text-white tabular-nums">{s.num}</p>
                  <p className="text-sm text-forest-200">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────── */}
      <section className="bg-white border-b border-surface-border">
        <div className="page-container py-8">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={`/marketplace?category=${encodeURIComponent(cat.name)}`}
                className={`flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl
                            shrink-0 text-sm font-semibold transition-all duration-150
                            hover:shadow-sm hover:-translate-y-0.5 ${cat.color}`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Hasaad ───────────────────────────────────────────────── */}
      <section className="py-16 bg-surface-warm">
        <div className="page-container">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-stone-900 mb-3">لماذا حصاد الذكي؟</h2>
            <p className="text-stone-500 max-w-md mx-auto">
              منصة زراعية متكاملة تحمي حقوق المزارع وترضي المستهلك
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title}
                className="card p-6 hover:shadow-card-hover transition-all duration-200">
                <div className="w-12 h-12 bg-forest-50 rounded-xl flex items-center
                               justify-center text-2xl mb-4">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">{f.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="page-container">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-stone-900 mb-3">كيف يعمل؟</h2>
            <p className="text-stone-500">ثلاث خطوات بسيطة وطلبك في طريقه</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="text-center">
                <div className="w-12 h-12 bg-forest-500 text-white font-extrabold text-xl
                               rounded-full flex items-center justify-center mx-auto mb-4
                               shadow-forest">
                  {step.step}
                </div>
                <h3 className="font-bold text-stone-900 mb-2">{step.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{step.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute translate-x-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dual CTA ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-surface-warm">
        <div className="page-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {/* Buyer card */}
            <div className="card p-8 text-center hover:shadow-card-hover transition-all">
              <div className="text-4xl mb-3">🛒</div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">أنت مستهلك؟</h3>
              <p className="text-stone-500 text-sm mb-5">
                اطلب الطازج مباشرة من المزارع بسعر عادل وتوصيل سريع
              </p>
              <Link
                href="/register?role=buyer"
                className="inline-flex items-center justify-center gap-2 w-full
                           bg-forest-500 text-white font-bold py-3 px-6 rounded-xl
                           hover:bg-forest-600 transition-colors shadow-sm"
              >
                تسجيل كمشتري
              </Link>
            </div>

            {/* Farmer card */}
            <div className="card p-8 text-center border-2 border-forest-500 hover:shadow-card-hover transition-all">
              <div className="text-4xl mb-3">🌾</div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">أنت مزارع؟</h3>
              <p className="text-stone-500 text-sm mb-5">
                بيع محاصيلك بسعر عادل وأدر طلباتك بسهولة من هاتفك
              </p>
              <Link
                href="/register?role=farmer"
                className="inline-flex items-center justify-center gap-2 w-full
                           bg-white border-2 border-forest-500 text-forest-600
                           font-bold py-3 px-6 rounded-xl hover:bg-forest-50 transition-colors"
              >
                تسجيل كمزارع
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────────────────── */}
      <section className="bg-forest-900 py-8">
        <div className="page-container">
          <div className="flex flex-wrap gap-6 justify-center items-center text-forest-200 text-sm">
            {[
              "✓ منتجات طازجة 100%",
              "✓ مزارعون موثوقون",
              "✓ الدفع عند الاستلام",
              "✓ دعم عملاء على مدار الساعة",
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
