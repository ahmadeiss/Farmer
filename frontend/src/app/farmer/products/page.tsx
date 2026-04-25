"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { catalogApi } from "@/lib/api";
import { getImageUrl, HASAAD_LOGO_URL } from "@/lib/utils";
import DashboardShell from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PriceDisplay from "@/components/ui/PriceDisplay";
import type { PaginatedResponse, ProductList } from "@/types";

/** Mini logo placeholder — matches buyer ProductCard style */
function ProductImageCell({ product }: { product: ProductList }) {
  const [loaded, setLoaded] = useState(false);
  const isPlaceholder = !product.image;

  return (
    <div className="relative aspect-video bg-stone-100 overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 bg-stone-200 animate-pulse" />
      )}

      {isPlaceholder ? (
        <div
          className={`absolute inset-0 flex items-center justify-center
            bg-gradient-to-br from-forest-50 via-white to-forest-100
            transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        >
          {/* Radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(26,157,101,0.12)_0%,transparent_70%)]" />
          {/* Spinning ring + logo */}
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-white/80 shadow-md border border-forest-100">
            <div
              className="absolute inset-0 rounded-full border-2 border-forest-200/50"
              style={{ borderTopColor: "transparent", borderBottomColor: "transparent", animation: "spin 12s linear infinite" }}
            />
            <Image
              src={HASAAD_LOGO_URL}
              alt="حصاد"
              width={48}
              height={48}
              className="object-contain w-12 h-12 drop-shadow-sm"
              onLoad={() => setLoaded(true)}
            />
          </div>
        </div>
      ) : (
        <Image
          src={getImageUrl(product.image)}
          alt={product.title}
          fill
          className={`object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      )}
    </div>
  );
}

export default function FarmerProductsPage() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<ProductList>>({
    queryKey: ["my-products"],
    queryFn: () => catalogApi.getMyProducts().then((r) => r.data),
  });

  const { mutate: deleteProduct, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => catalogApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      setDeleteTarget(null);
      toast.success("تم حذف المنتج ✓");
    },
    onError: () => toast.error("تعذّر حذف المنتج"),
  });

  const productCount = data?.count ?? data?.results?.length ?? 0;

  return (
    <DashboardShell role="farmer">
      <PageHeader
        title="منتجاتي"
        subtitle={productCount > 0 ? `${productCount} منتج منشور` : "لا توجد منتجات بعد"}
        actions={
          <Link href="/farmer/products/add">
            <Button size="sm" leftIcon={<span>+</span>}>إضافة محصول</Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : !data?.results?.length ? (
        <EmptyState
          icon="🌱"
          title="لا توجد محاصيل بعد"
          description="أضف أول محصول لك وابدأ البيع مباشرة"
          actionLabel="إضافة أول محصول"
          onAction={() => window.location.href = "/farmer/products/add"}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.results.map((product) => (
            <div key={product.id}
              className="card overflow-hidden hover:shadow-card-hover transition-all duration-200">
              {/* Image */}
              <div className="relative">
                <ProductImageCell product={product} />
                {/* Status overlays */}
                <div className="absolute top-2 end-2 flex flex-col gap-1">
                  {!product.is_in_stock && (
                    <span className="badge badge-danger text-2xs shadow-sm">نفد المخزون</span>
                  )}
                  {product.is_low_stock && (
                    <span className="badge badge-warning text-2xs shadow-sm">مخزون منخفض</span>
                  )}
                  {!product.is_active && (
                    <span className="badge badge-stone text-2xs shadow-sm">معطّل</span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-2xs font-semibold text-stone-400 uppercase tracking-wide mb-1">
                  {product.category_name}
                </p>
                <h3 className="font-bold text-stone-900 text-base mb-2 line-clamp-1">
                  {product.title}
                </h3>

                <div className="flex items-center justify-between mb-4">
                  <PriceDisplay amount={product.price} unit={product.unit_display} size="sm" />
                  <span className="text-xs text-stone-400 tabular-nums">
                    {Number(product.quantity_available).toFixed(1)} {product.unit_display} متاح
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/farmer/products/${product.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" fullWidth>
                      ✏️ تعديل
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger-500 hover:bg-danger-50 hover:text-danger-600 px-3"
                    onClick={() => setDeleteTarget({ id: product.id, title: product.title })}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`حذف "${deleteTarget?.title}"؟`}
        description="سيتم حذف هذا المنتج نهائياً ولن يظهر في السوق. لا يمكن التراجع."
        confirmLabel="نعم، احذفه"
        cancelLabel="تراجع"
        variant="danger"
        loading={isDeleting}
        onConfirm={() => deleteTarget && deleteProduct(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardShell>
  );
}
