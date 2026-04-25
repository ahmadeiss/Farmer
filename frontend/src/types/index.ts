// ============================================================
// Hasaad - Core TypeScript Types
// ============================================================

export type UserRole = "farmer" | "buyer" | "admin" | "driver";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";



export interface User {
  id: number;
  full_name: string;
  phone: string;
  email?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface Category {
  id: number;
  name_ar: string;
  name_en: string;
  slug: string;
  icon: string;
  is_active: boolean;
}

export type ProductUnit = "kg" | "gram" | "ton" | "box" | "bunch" | "piece" | "liter" | "bag";

export interface ProductList {
  id: number;
  title: string;
  image: string | null;
  price: string;
  unit: ProductUnit;
  unit_display: string;
  quantity_available: string;
  is_low_stock: boolean;
  is_in_stock: boolean;
  is_active: boolean;
  is_approved: boolean;
  is_featured: boolean;
  harvest_date: string | null;
  category_name: string;
  farmer_name: string;
  farmer_phone?: string;
  farmer_is_verified?: boolean;
  farmer_location: string;
  farmer_governorate?: string;
  farmer_latitude?: string | null;
  farmer_longitude?: string | null;
  distance_km?: number | null;
  created_at: string;
}

export interface FarmerPublic {
  id: number;
  full_name: string;
  phone: string;
  farm_name: string;
  governorate: string;
  city: string;
  avatar: string | null;
  bio: string;
}

export interface ProductDetail extends ProductList {
  description: string;
  audio_file: string | null;
  transcription_text: string | null;
  transcription_status: string;
  transcription_status_display: string;
  low_stock_threshold: string;
  category: Category;
  farmer: FarmerPublic;
  updated_at: string;
}

export interface CartItem {
  id: number;
  product: number;
  product_title: string;
  product_image: string | null;
  unit_display: string;
  farmer_id: number;
  farmer_name: string;
  quantity: string;
  unit_price_snapshot: string;
  subtotal: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total: string;
  item_count: number;
  updated_at: string;
}



export type PaymentStatus = "pending" | "collected" | "settled";

export interface OrderItem {
  id: number;
  product: number | null;
  title_snapshot: string;
  unit_price: string;
  quantity: string;
  unit: string;
  subtotal: string;
}

export interface Order {
  id: number;
  buyer: number;
  buyer_name: string;
  farmer: number;
  farmer_name: string;
  status: OrderStatus;
  status_display: string;
  payment_method: string;
  payment_status: PaymentStatus;
  payment_status_display: string;
  subtotal: string;
  delivery_fee: string;
  total: string;
  delivery_address: string;
  notes: string;
  qr_token: string;
  qr_confirmed_at: string | null;
  qr_code_url: string;
  delivery_assignment: {
    id: number;
    driver_id: number | null;
    driver_name: string | null;
    delivery_mode: "driver" | "self_delivery";
    delivery_mode_display: string;
    status: DeliveryAssignmentStatus;
    notes: string;
    pickup_time: string | null;
    delivered_time: string | null;
  } | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CheckoutResult {
  orders: Order[];
  order_ids: number[];
  order_count: number;
  total: string;
}

export interface BuyerProfile {
  id: number;
  user: User;
  full_name: string;
  phone: string;
  default_address: string;
  latitude: string | null;
  longitude: string | null;
  notes: string;
  has_location: boolean;
  created_at: string;
}

export type DeliveryAssignmentStatus =
  | "unassigned"
  | "assigned"
  | "picked_up"
  | "delivered"
  | "failed";

export interface DeliveryAssignment {
  id: number;
  order: Order;
  driver_id?: number | null;
  driver_name: string;
  delivery_mode?: "driver" | "self_delivery";
  delivery_mode_display?: string;
  status: DeliveryAssignmentStatus;
  pickup_time: string | null;
  delivered_time: string | null;
  notes: string;
  buyer_phone?: string | null;
  farmer_phone?: string | null;
  farmer_location?: {
    farm_name: string;
    address: string;
    latitude: string | null;
    longitude: string | null;
  } | null;
  buyer_location?: {
    address: string;
    governorate: string;
    latitude: string | null;
    longitude: string | null;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface DriverDashboardSummary {
  assigned: number;
  picked_up: number;
  delivered_today: number;
  active_deliveries: number;
}

export interface DriverOption {
  id: number;
  full_name: string;
  phone: string;
  is_verified: boolean;
}

export interface Wallet {
  id: number;
  farmer: number;
  farmer_name: string;
  farmer_phone: string;
  current_balance: string;
  updated_at: string;
}

export interface WalletLedgerEntry {
  id: number;
  entry_type: string;
  entry_type_display: string;
  amount: string;
  balance_before: string;
  balance_after: string;
  reference_type: string;
  reference_id: number | null;
  description: string;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  body: string;
  notification_type: string;
  notification_type_display: string;
  is_read: boolean;
  data: Record<string, unknown>;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  results: T[];
}

export interface FarmerProfile {
  id: number;
  user: User;
  full_name: string;
  phone: string;
  farm_name: string;
  governorate: string;
  city: string;
  village: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  bio: string;
  avatar: string | null;
  preferred_payout_method: string;
  has_location: boolean;
  created_at: string;
}

export interface DashboardSummary {
  orders: {
    total: number;
    today: number;
    this_month: number;
    pending: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    this_month: number;
  };
  users: {
    farmers: number;
    buyers: number;
  };
  products: {
    active: number;
  };
}
