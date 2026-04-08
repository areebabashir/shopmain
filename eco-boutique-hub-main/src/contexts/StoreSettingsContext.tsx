import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getStoreSettings,
  STORE_SETTINGS_CHANGE_EVENT,
  STORE_SETTINGS_STORAGE_KEY,
  type StoreSettings,
} from "@/lib/storeSettings";

type Ctx = {
  settings: StoreSettings;
  refreshSettings: () => void;
};

const StoreSettingsContext = createContext<Ctx | null>(null);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(() => getStoreSettings());

  const refreshSettings = useCallback(() => {
    setSettings(getStoreSettings());
  }, []);

  useEffect(() => {
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
