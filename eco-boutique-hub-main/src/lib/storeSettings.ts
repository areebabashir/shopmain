/**
 * Store configuration (PKR) — saved locally and read by cart/checkout.
 * Admin Settings tab edits this object.
 */

export type StoreSettings = {
  storeName: string;
  contactEmail: string;
  phone: string;
  address: string;
  /** Cart subtotal ≥ this → standard shipping is free (PKR). */
  freeShippingMinimumPkr: number;
  /** Flat standard shipping when below free-shipping threshold (PKR). */
  standardShippingPkr: number;
  /** Extra fee for express delivery (PKR), added on top of standard when not free. */
  expressShippingPkr: number;
};

export const STORE_SETTINGS_STORAGE_KEY = "shopvert_store_settings_v2";
/** Same-tab + explicit refresh after admin saves (storage event only fires in other tabs). */
export const STORE_SETTINGS_CHANGE_EVENT = "shopvert-store-settings-changed";

const STORAGE_KEY = STORE_SETTINGS_STORAGE_KEY;
const LEGACY_ADMIN_KEY = "shopvert_admin_settings";

export const defaultStoreSettings = (): StoreSettings => ({
  storeName: "ShopVert",
  contactEmail: "",
  phone: "",
  address: "",
  freeShippingMinimumPkr: 5000,
  standardShippingPkr: 250,
  expressShippingPkr: 500,
});

function parseNum(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function getStoreSettings(): StoreSettings {
  const base = defaultStoreSettings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const o = JSON.parse(raw) as Partial<StoreSettings>;
      return {
        ...base,
        storeName: typeof o.storeName === "string" ? o.storeName : base.storeName,
        contactEmail: typeof o.contactEmail === "string" ? o.contactEmail : base.contactEmail,
        phone: typeof o.phone === "string" ? o.phone : base.phone,
        address: typeof o.address === "string" ? o.address : base.address,
        freeShippingMinimumPkr: parseNum(o.freeShippingMinimumPkr, base.freeShippingMinimumPkr),
        standardShippingPkr: parseNum(o.standardShippingPkr, base.standardShippingPkr),
        expressShippingPkr: parseNum(o.expressShippingPkr, base.expressShippingPkr),
      };
    }
    const legacy = localStorage.getItem(LEGACY_ADMIN_KEY);
    if (legacy) {
      const o = JSON.parse(legacy) as Record<string, unknown>;
      const migrated: StoreSettings = {
        ...base,
        storeName: typeof o.storeName === "string" ? o.storeName : base.storeName,
        contactEmail: typeof o.contactEmail === "string" ? o.contactEmail : base.contactEmail,
        phone: typeof o.phone === "string" ? o.phone : base.phone,
        address: typeof o.address === "string" ? o.address : base.address,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    /* ignore */
  }
  return base;
}

export function saveStoreSettings(settings: StoreSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORE_SETTINGS_CHANGE_EVENT));
  }
}

/** Shipping line items for cart / checkout (amounts in PKR). Pass `settings` from `useStoreSettings()` so UI updates when admin saves. */
export function computeShippingPkr(
  cartSubtotal: number,
  delivery: "standard" | "express",
  s: StoreSettings = getStoreSettings()
): {
  standardFee: number;
  expressExtra: number;
  totalShipping: number;
  isFreeStandard: boolean;
} {
  const isFreeStandard = cartSubtotal >= s.freeShippingMinimumPkr;
  const standardFee = isFreeStandard ? 0 : s.standardShippingPkr;
  const expressExtra = delivery === "express" ? s.expressShippingPkr : 0;
  return {
    standardFee,
    expressExtra,
    totalShipping: standardFee + expressExtra,
    isFreeStandard,
  };
}
