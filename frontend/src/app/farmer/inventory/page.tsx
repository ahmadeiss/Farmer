"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { inventoryApi } from "@/lib/api";
import DashboardShell from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PaginatedResponse, ProductList } from "@/types";

interface AddStockForm {
  productId: number;
  productTitle: string;
  currentQty: number;
}

export default function FarmerInventoryPage() {
  const queryClient = useQueryClient();
  const [addStockTarget, setAddStockTarget] = useState<AddStockForm | null>(null);
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const { data: lowStock, isLoading } = useQuery<PaginatedResponse<ProductList> | ProductList[]>({
    queryKey: ["low-stock"],
    queryFn: () => inventoryApi.getLowStock().then((r) => r.data),
  });

  const products = Array.isArray(lowStock)
    ? lowStock
    : (lowStock as PaginatedResponse<ProductList>)?.results ?? [];

  const { mutate: addStock, isPending } = useMutation({
    mutationFn: ({ id, qty, note }: { id: number; qty: number; note: string }) =>
      inventoryApi.addStock(id, { quantity: qty, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      toast.success("تم إضافة المخزون بنجاح ✓");
      setAddStockTarget(null);
      setQuantity("");
      setNote("");
    },
    onError: () => toast.error("حدث خطأ أثناء إضافة المخزون"),
  });

  const handleAddStock = () => {
    const qty = parseFloat(quantity);
    if (!addStockTarget || isNaN(qty) || qty <= 0) {
      toast.error("أدخل كمية صحيحة أكبر من صفر");
      return;
    }
    addStock({ id: addStockTarget.productId, qty, note });
  };

  return (
    <DashboardShell role="farmer">
      <PageHeader
        title="إدارة المخزون"
        subtitle="منتجاتك ذات المخزون المنخفض"
      />

      {/* Low Stock Alert Banner */}
      {!isLoading && products.length > 0 && (
        <div className="mb-5 p-4 bg-warning-50 border border-warning-200 rounded-xl
                        flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-bold text-warning-800 text-sm">
              {products.length} منتج بحاجة لإعادة تعبئة
            </p>
            <p className="text-xs text-warning-600 mt-0.5">
              المنتجات التالية وصلت لحد المخزون المنخفض أو نفدت
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon="✅"
          title="مخزونك ممتاز!"
          description="لا توجد منتجات بمخزون منخفض حالياً"
          actionLabel="إدارة منتجاتي"
          onAction={() => (window.location.href = "/farmer/products")}
        />
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="card p-4 flex items-center gap-4"
            >
              {/* Status dot */}
              <div className={`w-3 h-3 rounded-full shrink-0 ${
                !product.is_in_stock ? "bg-danger-500" : "bg-warning-400"
              }`} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-900 text-sm truncate">
                  {product.title}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {product.category_name} ·{" "}
                  <span className={`font-medium ${
                    !product.is_in_stock ? "text-danger-600" : "text-warning-600"
                  }`}>
                    {Number(product.quantity_available).toFixed(1)} {product.unit_display} متبقي
                  </span>
                </p>
              </div>

              {/* Badge + Action */}
              <div className="flex items-center gap-3 shrink-0">
                <span className={`badge text-2xs ${
                  !product.is_in_stock ? "badge-danger" : "badge-warning"
                }`}>
                  {!product.is_in_stock ? "نفد المخزون" : "منخفض"}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAddStockTarget({
                      productId: product.id,
                      productTitle: product.title,
                      currentQty: Number(product.quantity_available),
                    });
                    setQuantity("");
                    setNote("");
                  }}
                >
                  + إضافة مخزون
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Stock Modal */}
      {addStockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div>
              <h2 className="font-bold text-stone-900 text-lg">إضافة مخزون</h2>
              <p className="text-sm text-stone-400 mt-0.5 truncate">
                {addStockTarget.productTitle}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                الكمية الحالية: {addStockTarget.currentQty.toFixed(1)}
              </p>
            </div>

            <Input
              label="الكمية المضافة"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="مثال: 50"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            <Input
              label="ملاحظة (اختياري)"
              placeholder="مثال: دفعة جديدة من المزرعة"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="flex gap-3 pt-2">
              <Button
                fullWidth
                loading={isPending}
                onClick={handleAddStock}
              >
                تأكيد الإضافة
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => setAddStockTarget(null)}
                disabled={isPending}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
