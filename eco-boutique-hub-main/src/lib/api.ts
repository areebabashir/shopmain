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

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

export type OrderSummary = {
  id: string;
  date: string;
  status: string;
  total: number;
  items: number;
  product: string;
  payment: string;
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
