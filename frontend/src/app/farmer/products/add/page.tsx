"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { catalogApi } from "@/lib/api";
import DashboardShell from "@/components/layout/DashboardShell";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Category } from "@/types";

const schema = z.object({
  title: z.string().min(3, "اسم المنتج يجب أن يكون 3 أحرف على الأقل"),
  category: z.string().min(1, "اختر تصنيفاً"),
  price: z.string().min(1, "أدخل السعر"),
  quantity_available: z.string().min(1, "أدخل الكمية"),
  unit: z.string().min(1, "اختر الوحدة"),
  description: z.string().optional(),
  harvest_date: z.string().optional(),
  low_stock_threshold: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const UNITS = [
  { value: "kg", label: "كيلوغرام" },
  { value: "gram", label: "غرام" },
  { value: "ton", label: "طن" },
  { value: "box", label: "صندوق" },
  { value: "bunch", label: "ربطة" },
  { value: "piece", label: "حبة" },
  { value: "liter", label: "لتر" },
  { value: "bag", label: "كيس" },
];

export default function AddProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile]       = useState<File | null>(null);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => catalogApi.getCategories().then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { low_stock_threshold: "10" },
  });

  const { mutate: createProduct, isPending } = useMutation({
    mutationFn: (data: FormData) => {
      const fd = new FormData();
      
      // Add form fields
      fd.append("title", data.title);
      fd.append("category", data.category);
      fd.append("price", data.price);
      fd.append("quantity_available", data.quantity_available);
      fd.append("unit", data.unit);
      
      if (data.description) fd.append("description", data.description);
      if (data.harvest_date) fd.append("harvest_date", data.harvest_date);
      if (data.low_stock_threshold) fd.append("low_stock_threshold", data.low_stock_threshold);
      
      // Add image file
      if (imageFile) {
        fd.append("image", imageFile, "image.jpg");
      }
      
      return catalogApi.createProduct(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      toast.success("تم نشر المنتج بنجاح ✓");
      router.push("/farmer/products");
    },
    onError: (err: any) => {
      // Better error handling
      const errorData = err?.response?.data;
      
      if (typeof errorData === "string") {
        toast.error(errorData);
      } else if (errorData?.image) {
        toast.error(Array.isArray(errorData.image) ? errorData.image[0] : "خطأ في الصورة");
      } else if (errorData?.detail) {
        toast.error(errorData.detail);
      } else {
        const firstError = Object.values(errorData || {})?.[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : "حدث خطأ، حاول مرة أخرى");
      }
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - must be image
    if (!file.type.startsWith("image/")) {
      toast.error("الملف يجب أن يكون صورة فقط");
      return;
    }

    // Convert image to JPEG and compress if needed
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize if too large (max 1200px)
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to JPEG blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              toast.error("حدث خطأ في معالجة الصورة");
              return;
            }

            // Check file size (max 5MB after compression)
            if (blob.size > 5 * 1024 * 1024) {
              toast.error("حجم الصورة كبير جداً (الحد الأقصى 5MB)");
              return;
            }

            // Create new file object
            const jpegFile = new File([blob], "image.jpg", { type: "image/jpeg" });
            setImageFile(jpegFile);
            setImagePreview(URL.createObjectURL(blob));
          },
          "image/jpeg",
          0.85 // 85% quality for JPEG compression
        );
      };
      img.onerror = () => {
        toast.error("حدث خطأ في قراءة الصورة");
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      toast.error("حدث خطأ في قراءة الملف");
    };
    reader.readAsDataURL(file);
  };

  return (
    <DashboardShell role="farmer">
      <PageHeader
        title="إضافة محصول جديد"
        subtitle="أضف منتجك وابدأ البيع في دقائق"
        size="md"
        actions={
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            → رجوع
          </Button>
        }
      />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit((data) => createProduct(data))} className="space-y-5">

          {/* ── Section 1: Image ──────────────────────────────────────── */}
          <div className="card p-5">
            <h2 className="section-title mb-1 text-base">📸 صورة المنتج</h2>
            <p className="text-xs text-stone-400 mb-4">
              أضف صورة واضحة. المنتجات التي تحتوي على صور تُباع أسرع بكثير.
            </p>

            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="w-full h-44 rounded-xl border-2 border-dashed border-surface-border
                         bg-stone-50 hover:bg-forest-50 hover:border-forest-300
                         flex flex-col items-center justify-center gap-2
                         transition-all duration-150 cursor-pointer overflow-hidden"
            >
              {imagePreview ? (
                <div className="relative w-full h-full">
                  <Image src={imagePreview} alt="معاينة" fill className="object-cover" />
                  <div className="absolute inset-0 bg-stone-900/40 opacity-0 hover:opacity-100
                                  transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">تغيير الصورة</span>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-3xl">📷</span>
                  <p className="text-sm font-semibold text-stone-500">اضغط لإضافة صورة</p>
                  <p className="text-xs text-stone-400">JPG أو PNG، حتى 5MB</p>
                </>
              )}
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* ── Section 2: Basic Info ─────────────────────────────────── */}
          <div className="card p-5 space-y-4">
            <h2 className="section-title text-base mb-0">🌱 معلومات المحصول</h2>

            <Input
              label="اسم المحصول"
              placeholder="مثلاً: طماطم طازجة، زيت زيتون بكر..."
              required
              error={errors.title?.message}
              {...register("title")}
            />

            {/* Category */}
            <div>
              <label className="field-label">
                التصنيف <span className="text-danger-500">*</span>
              </label>
              <select className="field-input" {...register("category")}>
                <option value="">اختر التصنيف المناسب</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name_ar}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="field-error mt-1.5">⚠ {errors.category.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="field-label">الوصف (اختياري)</label>
              <textarea
                className="field-input resize-none"
                rows={3}
                placeholder="صف منتجك... مميزاته، طريقة جمعه، أي معلومات مفيدة للمشتري"
                {...register("description")}
              />
            </div>

            <Input
              label="تاريخ الحصاد"
              type="date"
              hint="يساعد المشتري على معرفة طزاجة المنتج"
              {...register("harvest_date")}
            />
          </div>

          {/* ── Section 3: Price & Quantity ───────────────────────────── */}
          <div className="card p-5">
            <h2 className="section-title text-base mb-4">💰 السعر والكمية</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="السعر (₪)"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                error={errors.price?.message}
                {...register("price")}
              />

              <div>
                <label className="field-label">
                  الوحدة <span className="text-danger-500">*</span>
                </label>
                <select className="field-input" {...register("unit")}>
                  <option value="">اختر الوحدة</option>
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
                {errors.unit && <p className="field-error mt-1.5">⚠ {errors.unit.message}</p>}
              </div>

              <Input
                label="الكمية المتاحة"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="الكمية"
                required
                error={errors.quantity_available?.message}
                {...register("quantity_available")}
              />

              <Input
                label="تنبيه المخزون المنخفض"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="10"
                hint="نرسل لك تنبيهاً عند هذه الكمية"
                {...register("low_stock_threshold")}
              />
            </div>
          </div>

          {/* ── Submit ────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 pb-4">
            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={isPending}
              className="sm:flex-1"
            >
              {isPending ? "جاري النشر..." : "نشر المحصول 🌱"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              className="sm:flex-1"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
