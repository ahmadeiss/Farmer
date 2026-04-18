import Link from "next/link";

const LINKS = [
  { label: "السوق",         href: "/marketplace"         },
  { label: "انضم كمزارع",   href: "/register?role=farmer" },
  { label: "انضم كمشترٍ",   href: "/register?role=buyer"  },
  { label: "تسجيل الدخول",  href: "/login"                },
];

const CONTACT = [
  { icon: "📧", text: "ahmadbar887@gmail.com"     },
  { icon: "📞", text: "+970 59 845 5262"         },
  { icon: "📍", text: "فلسطين — الضفة الغربية"  },
];

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 mt-auto">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="sm:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-forest-500/20 rounded-xl flex items-center
                              justify-center border border-forest-500/30">
                <span className="text-xl">🌾</span>
              </div>
              <div>
                <p className="font-extrabold text-white text-base leading-none">حصاد الذكي</p>
                <p className="text-xs text-stone-500 leading-none mt-0.5">Smart Hasaad</p>
              </div>
            </div>
            <p className="text-stone-500 text-sm leading-relaxed">
              سوق زراعي ذكي يربط المزارعين الفلسطينيين بالمستهلكين مباشرةً.
              أسعار عادلة، منتجات طازجة، توصيل موثوق.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">روابط سريعة</h4>
            <ul className="space-y-2.5">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}
                    className="text-sm text-stone-500 hover:text-forest-400 transition-colors duration-150">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">تواصل معنا</h4>
            <ul className="space-y-2.5">
              {CONTACT.map((c) => (
                <li key={c.text}
                  className="flex items-center gap-2 text-sm text-stone-500">
                  <span>{c.icon}</span>
                  <span>{c.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-stone-800 mt-10 pt-6 flex flex-wrap items-center
                        justify-between gap-3 text-xs text-stone-600">
          <p>© {new Date().getFullYear()} حصاد الذكي — Smart Hasaad. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-forest-500 rounded-full animate-pulse-slow" />
            <span>النظام يعمل بشكل طبيعي</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
