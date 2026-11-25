import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchSettings, mediaUrl } from "@/lib/api";
import {
  getStoreSettings,
  STORE_SETTINGS_CHANGE_EVENT,
  STORE_SETTINGS_STORAGE_KEY,
  type StoreSettings,
  defaultStoreSettings,
} from "@/lib/storeSettings";

type Ctx = {
  settings: StoreSettings;
  refreshSettings: () => Promise<void>;
};

const StoreSettingsContext = createContext<Ctx | null>(null);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(() => getStoreSettings());

  const refreshSettings = useCallback(async () => {
    try {
      const data = await fetchSettings();
      const newSettings = {
        ...defaultStoreSettings(),
        storeName: data.storeName || defaultStoreSettings().storeName,
        contactEmail: data.contactEmail || "",
        phone: data.phone || "",
        address: data.address || "",
        freeShippingMinimumPkr: Number(data.freeShippingMinimumPkr) || defaultStoreSettings().freeShippingMinimumPkr,
        standardShippingPkr: Number(data.standardShippingPkr) || defaultStoreSettings().standardShippingPkr,
        expressShippingPkr: Number(data.expressShippingPkr) || defaultStoreSettings().expressShippingPkr,
        logoUrl: data.logoUrl ? mediaUrl(data.logoUrl) : "",
      };
      setSettings(newSettings);
      
      // Also update local storage for backward compatibility for now
      localStorage.setItem(STORE_SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (err) {
      console.error("Failed to refresh settings from backend", err);
      // Fallback to local storage or defaults
      setSettings(getStoreSettings());
    }
  }, []);

  useEffect(() => {
    refreshSettings();

    const onCustom = () => refreshSettings();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORE_SETTINGS_STORAGE_KEY) refreshSettings();
    };
    window.addEventListener(STORE_SETTINGS_CHANGE_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(STORE_SETTINGS_CHANGE_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshSettings]);

  const value = useMemo(() => ({ settings, refreshSettings }), [settings, refreshSettings]);

  return <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>;
}

export function useStoreSettings(): Ctx {
  const ctx = useContext(StoreSettingsContext);
  if (!ctx) {
    throw new Error("useStoreSettings must be used within StoreSettingsProvider");
  }
  return ctx;
}
