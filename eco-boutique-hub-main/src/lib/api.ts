import type { Product } from "@/data/products";

/** Use empty string in dev with Vite proxy; set VITE_API_URL in production if API is on another host. */
export const apiOrigin = import.meta.env.VITE_API_URL ?? "";

export const productsQueryKey = ["products"] as const;

export type ApiReview = {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  date: string;
  title: string;
  text: string;
  helpful: number;
  verified: boolean;
};

function specsToRecord(specs: unknown): Record<string, string> {
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(specs as Record<string, unknown>)) {
    out[k] = v == null ? "" : String(v);
  }
  return out;
}

/** Map JSON from `GET /api/products` or `GET /api/products/:id` into a `Product` with resolved image URLs. */
export function parseProduct(raw: unknown): Product {
  const o = raw as Record<string, unknown>;
  const stockRaw = o.stock != null && o.stock !== "" ? Number(o.stock) : NaN;
  const stock = Number.isFinite(stockRaw) ? stockRaw : undefined;
  const inStockFlag = o.inStock !== false;
  const hasStock = stock == null || stock > 0;
  return {
    id: String(o.id ?? ""),
    name: String(o.name ?? ""),
    price: Number(o.price ?? 0),
    oldPrice: o.oldPrice != null && o.oldPrice !== "" ? Number(o.oldPrice) : undefined,
    image: mediaUrl(String(o.image ?? "")),
    rating: Number(o.rating ?? 0),
    reviews: Number(o.reviews ?? 0),
    category: String(o.category ?? "General"),
    badge: o.badge != null && String(o.badge) !== "" ? String(o.badge) : undefined,
    description: String(o.description ?? ""),
    specs: specsToRecord(o.specs),
    inStock: Boolean(inStockFlag && hasStock),
    stock,
    createdAt: o.createdAt != null ? String(o.createdAt) : undefined,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const r = await fetch(`${apiOrigin}/api/products`);
  if (!r.ok) throw new Error("Failed to load products");
  const data: unknown = await r.json();
  if (!Array.isArray(data)) throw new Error("Invalid products response");
  return data.map(parseProduct);
}

export async function fetchProduct(id: string): Promise<Product | null> {
  if (!id) return null;
  const r = await fetch(`${apiOrigin}/api/products/${encodeURIComponent(id)}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("Failed to load product");
  return parseProduct(await r.json());
}

export async function fetchProductReviews(productId: string): Promise<ApiReview[]> {
  const r = await fetch(`${apiOrigin}/api/products/${encodeURIComponent(productId)}/reviews`);
  if (r.status === 404) return [];
  if (!r.ok) throw new Error("Failed to load reviews");
  return r.json();
}

export type SavedAddress = {
  id: string;
  label: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
  isDefault: boolean;
};

export type NotificationPrefs = {
  orderUpdates: boolean;
  promotional: boolean;
  newProducts: boolean;
  priceDrops: boolean;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  addresses?: SavedAddress[];
  notificationPrefs?: NotificationPrefs;
};

export type OrderLineItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  image: string;
};

export type OrderSummary = {
  id: string;
  date: string;
  status: string;
  total: number;
  items: number;
  product: string;
  payment: string;
  itemsDetail?: OrderLineItem[];
  shippingAddress?: { name?: string; phone?: string; address?: string; city?: string; zip?: string };
  delivery?: string;
};

export type AdminOrder = {
  id: string;
  customer: string;
  email: string;
  phone: string;
  product: string;
  amount: string;
  status: "Processing" | "In Transit" | "Delivered" | "Cancelled";
  date: string;
  address: string;
  payment: string;
  items: number;
};

export function getStoredToken(): string | null {
  return localStorage.getItem("token");
}

export function userInitials(name: string): string {
  if (!name.trim()) return "?";
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Absolute URL for static files served by the backend (e.g. /uploads/products/...). */
export function mediaUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${apiOrigin}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function authLogin(email: string, password: string): Promise<Response> {
  return fetch(`${apiOrigin}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function authRegister(name: string, email: string, password: string): Promise<Response> {
  return fetch(`${apiOrigin}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
}

export async function authMe(token: string): Promise<Response> {
  return fetch(`${apiOrigin}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateUserProfile(name: string, token: string): Promise<AuthUser> {
  const r = await fetch(`${apiOrigin}/api/auth/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to update profile");
  return data as AuthUser;
}

export async function changeUserPassword(currentPassword: string, newPassword: string, token: string): Promise<void> {
  const r = await fetch(`${apiOrigin}/api/auth/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to change password");
}

export type AddressPayload = {
  label?: string;
  name: string;
  address: string;
  city: string;
  zip?: string;
  phone?: string;
  isDefault?: boolean;
};

export async function addUserAddress(payload: AddressPayload, token: string): Promise<AuthUser> {
  const r = await fetch(`${apiOrigin}/api/auth/addresses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to add address");
  return data as AuthUser;
}

export async function updateUserAddress(
  addrId: string,
  payload: Partial<AddressPayload>,
  token: string
): Promise<AuthUser> {
  const r = await fetch(`${apiOrigin}/api/auth/addresses/${encodeURIComponent(addrId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to update address");
  return data as AuthUser;
}

export async function deleteUserAddress(addrId: string, token: string): Promise<AuthUser> {
  const r = await fetch(`${apiOrigin}/api/auth/addresses/${encodeURIComponent(addrId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to delete address");
  return data as AuthUser;
}

export async function setDefaultUserAddress(addrId: string, token: string): Promise<AuthUser> {
  const r = await fetch(`${apiOrigin}/api/auth/addresses/${encodeURIComponent(addrId)}/default`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to set default");
  return data as AuthUser;
}

export async function updateUserNotifications(prefs: Partial<NotificationPrefs>, token: string): Promise<AuthUser> {
  const r = await fetch(`${apiOrigin}/api/auth/notifications`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(prefs),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to save preferences");
  return data as AuthUser;
}

export async function deleteUserAccount(password: string, token: string): Promise<void> {
  const r = await fetch(`${apiOrigin}/api/auth/account`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ password }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to delete account");
}

export async function createProductReview(
  productId: string,
  body: { rating: number; title?: string; text: string },
  token: string
): Promise<ApiReview> {
  const r = await fetch(`${apiOrigin}/api/products/${encodeURIComponent(productId)}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to submit review");
  return data as ApiReview;
}

export async function fetchMyOrders(token: string): Promise<OrderSummary[]> {
  const r = await fetch(`${apiOrigin}/api/orders/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Failed to load orders");
  return r.json();
}

export async function fetchAdminOrders(token: string): Promise<AdminOrder[]> {
  const r = await fetch(`${apiOrigin}/api/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Failed to load admin orders");
  return r.json();
}

export async function updateAdminOrderStatus(
  id: string,
  status: AdminOrder["status"],
  token: string
): Promise<AdminOrder> {
  const r = await fetch(`${apiOrigin}/api/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to update order");
  return data as AdminOrder;
}

export async function createOrder(
  payload: {
    items: Array<{ productId: string; quantity: number }>;
    shippingAddress: { name: string; phone: string; address: string; city: string; zip: string };
    delivery: string;
    payment: string;
    shippingFee: number;
  },
  token: string
): Promise<Response> {
  return fetch(`${apiOrigin}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function initiateGatewayPayment(
  provider: "easypaisa" | "jazcash",
  orderId: string,
  token: string
): Promise<Response> {
  return fetch(`${apiOrigin}/api/payments/${provider}/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ orderId }),
  });
}

export async function createProductWithImage(
  formData: FormData,
  token: string
): Promise<Response> {
  return fetch(`${apiOrigin}/api/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
}

export async function updateProductWithImage(
  id: string,
  formData: FormData,
  token: string
): Promise<Response> {
  return fetch(`${apiOrigin}/api/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
}

export async function deleteProduct(id: string, token: string): Promise<void> {
  const r = await fetch(`${apiOrigin}/api/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to delete product");
}

export type AdminStats = {
  orders: number;
  customers: number;
  products: number;
  revenue: number;
  ordersByStatus: Record<AdminOrder["status"], number>;
  ordersToday: number;
  outOfStock: number;
  lowStock: number;
  monthlyRevenue: Array<{ label: string; total: number }>;
  monthlyRevenueNormalized: Array<{ label: string; total: number; value: number }>;
  categoryRevenue: Array<{ name: string; revenue: number; percent: number }>;
  recentCustomers: number;
  avgOrderValue: number;
};

export async function fetchAdminStats(token: string): Promise<AdminStats> {
  const r = await fetch(`${apiOrigin}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Failed to load admin stats");
  return r.json();
}

export type AdminCustomerRow = {
  id: string;
  name: string;
  email: string;
  orders: number;
  spent: string;
  joined: string;
  status: "Active" | "VIP" | "Inactive";
  avatar: string;
};

export async function fetchAdminCustomers(token: string): Promise<AdminCustomerRow[]> {
  const r = await fetch(`${apiOrigin}/api/admin/customers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Failed to load customers");
  return r.json();
}

export type ChatPeer = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

export type ChatMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  product: {
    productId: string;
    name: string;
    image: string;
    price: number;
  } | null;
  createdAt: string;
};

export type ChatThread = {
  peer: ChatPeer | null;
  messages: ChatMessage[];
};

export async function fetchChatContacts(token: string): Promise<ChatPeer[]> {
  const r = await fetch(`${apiOrigin}/api/chat/contacts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Failed to load contacts");
  return r.json();
}

export type AdminChatThreadItem = {
  user: ChatPeer;
  lastMessage: {
    text: string;
    hasProduct: boolean;
    createdAt: string;
  } | null;
};

export async function fetchAdminChatThreads(token: string): Promise<AdminChatThreadItem[]> {
  const r = await fetch(`${apiOrigin}/api/chat/threads`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Failed to load chat threads");
  return r.json();
}

export async function fetchChatThread(token: string, withId?: string): Promise<ChatThread> {
  const q = withId ? `?with=${encodeURIComponent(withId)}` : "";
  const r = await fetch(`${apiOrigin}/api/chat/thread${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Failed to load messages");
  return r.json();
}

export async function sendChatMessage(
  token: string,
  payload: { text?: string; with?: string; productId?: string }
): Promise<ChatMessage> {
  const r = await fetch(`${apiOrigin}/api/chat/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.message === "string" ? data.message : "Failed to send message");
  return data as ChatMessage;
}
