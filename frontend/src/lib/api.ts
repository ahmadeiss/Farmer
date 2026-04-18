/**
 * Smart Hasaad API Client
 * Centralized Axios instance with auth token management.
 * All API calls go through this client.
 */
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": "ar",
  },
  timeout: 30000,
});

// ── Request interceptor: attach JWT token ──────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 + token refresh ──────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${API_BASE_URL}/api/v1/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const newToken = data.access;
        localStorage.setItem("access_token", newToken);
        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// ── API endpoint functions ─────────────────────────────────────────────────

export const authApi = {
  register: (data: object) => apiClient.post("/auth/register/", data),
  login: (data: object) => apiClient.post("/auth/login/", data),
  logout: (refresh: string) => apiClient.post("/auth/logout/", { refresh }),
  getProfile: () => apiClient.get("/auth/profile/"),
  updateProfile: (data: object) => apiClient.patch("/auth/profile/", data),
  changePassword: (data: object) => apiClient.post("/auth/change-password/", data),
  requestOtp: (phone: string) => apiClient.post("/auth/otp/request/", { phone }),
  verifyOtp: (data: object) => apiClient.post("/auth/otp/verify/", data),
};

export const catalogApi = {
  getCategories: () => apiClient.get("/catalog/categories/"),
  getProducts: (params?: object) => apiClient.get("/catalog/products/", { params }),
  getProduct: (id: number) => apiClient.get(`/catalog/products/${id}/`),
  // Farmer product management
  getMyProducts: (params?: object) => apiClient.get("/catalog/my-products/", { params }),
  getMyProduct: (id: number) => apiClient.get(`/catalog/my-products/${id}/`),
  createProduct: (data: FormData) => apiClient.post("/catalog/my-products/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  updateProduct: (id: number, data: FormData) => apiClient.patch(`/catalog/my-products/${id}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  deleteProduct: (id: number) => apiClient.delete(`/catalog/my-products/${id}/`),
  getLowStockProducts: () => apiClient.get("/catalog/my-products/low-stock/"),
};

export const cartApi = {
  getCart: () => apiClient.get("/orders/cart/"),
  addToCart: (productId: number, quantity: number) =>
    apiClient.post("/orders/cart/add/", { product_id: productId, quantity }),
  removeFromCart: (productId: number) => apiClient.delete(`/orders/cart/remove/${productId}/`),
  clearCart: () => apiClient.delete("/orders/cart/clear/"),
  checkout: (data: object) => apiClient.post("/orders/checkout/", data),
};

export const ordersApi = {
  getMyOrders: (params?: object) => apiClient.get("/orders/my-orders/", { params }),
  getMyOrder: (id: number) => apiClient.get(`/orders/my-orders/${id}/`),
  getFarmerOrders: (params?: object) => apiClient.get("/orders/farmer-orders/", { params }),
  getFarmerOrder: (id: number) => apiClient.get(`/orders/farmer-orders/${id}/`),
  updateOrderStatus: (id: number, status: string) =>
    apiClient.patch(`/orders/farmer-orders/${id}/status/`, { status }),
  assignDelivery: (id: number, data: object) => apiClient.post(`/logistics/orders/${id}/assign/`, data),
  confirmQr: (token: string) => apiClient.post(`/orders/confirm-qr/${token}/`),
  submitReview: (data: object) => apiClient.post("/orders/reviews/", data),
};

export const walletApi = {
  getMyWallet: () => apiClient.get("/wallets/my-wallet/"),
  getMyLedger: () => apiClient.get("/wallets/my-wallet/ledger/"),
};

export const farmerApi = {
  getProfile: () => apiClient.get("/farmers/profile/"),
  updateProfile: (data: FormData | object) => apiClient.patch("/farmers/profile/", data),
};

export const buyerApi = {
  getProfile: () => apiClient.get("/buyers/profile/"),
  updateProfile: (data: object) => apiClient.patch("/buyers/profile/", data),
};

export const driverApi = {
  getDashboardSummary: () => apiClient.get("/logistics/driver/dashboard-summary/"),
  getDeliveries: (params?: object) => apiClient.get("/logistics/driver/deliveries/", { params }),
  markPickup: (assignmentId: number) =>
    apiClient.post(`/logistics/driver/deliveries/${assignmentId}/pickup/`),
  getAvailableDrivers: (params?: object) => apiClient.get("/logistics/drivers/", { params }),
};

export const inventoryApi = {
  getMovements: (productId: number) => apiClient.get(`/inventory/products/${productId}/movements/`),
  addStock: (productId: number, data: object) =>
    apiClient.post(`/inventory/products/${productId}/add-stock/`, data),
  getLowStock: () => apiClient.get("/inventory/low-stock/"),
};

export const notificationsApi = {
  getNotifications: (params?: object) => apiClient.get("/notifications/", { params }),
  getUnreadCount: () => apiClient.get("/notifications/unread-count/"),
  markAllRead: () => apiClient.post("/notifications/mark-all-read/"),
  markRead: (id: number) => apiClient.post(`/notifications/${id}/mark-read/`),
};

export const analyticsApi = {
  getDashboard: () => apiClient.get("/analytics/dashboard/"),
  getTopProducts: (limit?: number) => apiClient.get("/analytics/top-products/", { params: { limit } }),
  getTopFarmers: (limit?: number) => apiClient.get("/analytics/top-farmers/", { params: { limit } }),
  getOrdersByStatus: () => apiClient.get("/analytics/orders-by-status/"),
  getRevenueTrend: (days?: number) => apiClient.get("/analytics/revenue-trend/", { params: { days } }),
  getLowStock: () => apiClient.get("/analytics/low-stock/"),
  getCategories: () => apiClient.get("/analytics/categories/"),
  getFarmerSummary: () => apiClient.get("/analytics/farmer-summary/"),
};

export const adminApi = {
  getOrders: (params?: object) => apiClient.get("/orders/admin/orders/", { params }),
  getOrder: (id: number) => apiClient.get(`/orders/admin/orders/${id}/`),
  updateOrder: (id: number, data: object) => apiClient.patch(`/orders/admin/orders/${id}/`, data),
  updateOrderStatus: (id: number, status: string) =>
    apiClient.patch(`/orders/admin/orders/${id}/status/`, { status }),
  getFarmers: (params?: object) => apiClient.get("/farmers/admin/list/", { params }),
  getBuyers: (params?: object) => apiClient.get("/buyers/admin/list/", { params }),
  getWallets: () => apiClient.get("/wallets/admin/wallets/"),
  settleWallet: (farmerId: number, data: object) =>
    apiClient.post(`/wallets/admin/wallets/${farmerId}/settle/`, data),
  getAdminProducts: (params?: object) => apiClient.get("/catalog/admin/products/", { params }),
  toggleProductVisibility: (productId: number, isActive: boolean) =>
    apiClient.patch(`/catalog/admin/products/${productId}/`, { is_active: isActive }),
};
