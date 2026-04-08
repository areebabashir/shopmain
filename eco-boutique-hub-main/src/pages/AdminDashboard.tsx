import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  createProductWithImage,
  deleteProduct,
  fetchAdminCustomers,
  fetchAdminOrders,
  fetchAdminStats,
  fetchProducts,
  productsQueryKey,
  updateAdminOrderStatus,
  updateProductWithImage,
  userInitials,
  type AdminCustomerRow,
  type AdminOrder,
} from "@/lib/api";
import {
  Banknote, ShoppingCart, Users, Package, TrendingUp, TrendingDown,
  Eye, Search, Bell, Plus, Edit, Trash2, ArrowUpRight, ArrowDownRight,
  BarChart3, PieChart, Activity, Star, X, Check, Clock, Mail,
  Settings, Download, RefreshCw,
  CreditCard, MapPin, Phone, ChevronRight, AlertCircle, CheckCircle,
  XCircle, Truck, FileText, Globe, UserCheck,
  LayoutDashboard, ChevronLeft, LogOut, Menu, Home
} from "lucide-react";
import { categories, type Product } from "@/data/products";
import { formatPkr, stripMoneyToNumber } from "@/lib/money";
import { getStoreSettings, saveStoreSettings, type StoreSettings } from "@/lib/storeSettings";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";

const categoryBarColors = ["bg-primary", "bg-blue-500", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-muted-foreground"];

const sidebarNav = [
  { id: "overview", icon: LayoutDashboard, label: "Dashboard" },
  { id: "orders", icon: ShoppingCart, label: "Orders" },
  { id: "products", icon: Package, label: "Products" },
  { id: "customers", icon: Users, label: "Customers" },
  { id: "analytics", icon: BarChart3, label: "Analytics" },
  { id: "settings", icon: Settings, label: "Settings" },
];

const statusStyle = (s: string) => {
  if (s === "Delivered") return "bg-primary/10 text-primary";
  if (s === "In Transit") return "bg-blue-100 text-blue-600";
  if (s === "Processing") return "bg-amber-100 text-amber-700";
  if (s === "Cancelled") return "bg-destructive/10 text-destructive";
  if (s === "Active") return "bg-primary/10 text-primary";
  if (s === "VIP") return "bg-violet-100 text-violet-600";
  if (s === "Inactive") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
};

const statusIcon = (s: string) => {
  if (s === "Delivered") return CheckCircle;
  if (s === "In Transit") return Truck;
  if (s === "Processing") return Clock;
  return XCircle;
};

const brandMarkFromStoreName = (name: string) => {
  const t = name.trim();
  if (!t) return "SV";
  const ini = userInitials(t);
  if (ini.length >= 2) return ini;
  return t.length >= 2 ? t.slice(0, 2).toUpperCase() : `${t[0] || "S"}${t[1] || "V"}`.toUpperCase();
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshSettings } = useStoreSettings();
  const { user, token, logout } = useAuth();
  const { data: apiProducts = [], isLoading: catalogLoading } = useQuery({
    queryKey: productsQueryKey,
    queryFn: fetchProducts,
  });
  const { data: adminOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["adminOrders", token],
    queryFn: () => fetchAdminOrders(token!),
    enabled: Boolean(token),
  });
  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ["adminStats", token],
    queryFn: () => fetchAdminStats(token!),
    enabled: Boolean(token),
  });
  const { data: adminCustomers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["adminCustomers", token],
    queryFn: () => fetchAdminCustomers(token!),
    enabled: Boolean(token),
  });
  const topProducts = useMemo(
    () => [...apiProducts].sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 5),
    [apiProducts]
  );
  const productStats = useMemo(() => {
    const total = apiProducts.length;
    const inStock = apiProducts.filter((p) => p.inStock).length;
    const catCount = new Set(apiProducts.map((p) => p.category)).size;
    return {
      total,
      inStock,
      out: Math.max(0, total - inStock),
      categories: catCount || categories.length,
    };
  }, [apiProducts]);

  const overviewStats = useMemo(() => {
    if (!adminStats) return [];
    return [
      {
        title: "Total Revenue",
        value: formatPkr(adminStats.revenue, true),
        change: "Live",
        up: true,
        icon: Banknote,
        color: "bg-primary/10 text-primary",
        subtext: `${adminStats.ordersToday} orders today · ${adminStats.lowStock} low-stock SKUs`,
      },
      {
        title: "Total Orders",
        value: String(adminStats.orders),
        change: "Live",
        up: true,
        icon: ShoppingCart,
        color: "bg-blue-100 text-blue-600",
        subtext: `${adminStats.ordersByStatus?.Processing ?? 0} processing`,
      },
      {
        title: "Total Customers",
        value: String(adminStats.customers),
        change: "Live",
        up: true,
        icon: Users,
        color: "bg-violet-100 text-violet-600",
        subtext: `${adminStats.recentCustomers} new in last 30 days`,
      },
      {
        title: "Products Listed",
        value: String(adminStats.products),
        change: productStats.out > 0 ? "Attention" : "OK",
        up: productStats.out === 0,
        icon: Package,
        color: "bg-amber-100 text-amber-600",
        subtext: `${adminStats.outOfStock} out of stock`,
      },
    ];
  }, [adminStats, productStats.out]);

  const liveNotifications = useMemo(() => {
    type N = { id: string; type: "order" | "stock" | "customer"; title: string; desc: string; time: string };
    const list: N[] = [];
    adminOrders.slice(0, 6).forEach((o) => {
      list.push({
        id: `ord-${o.id}`,
        type: "order",
        title: "Order",
        desc: `${o.id.slice(-8)} · ${o.customer} · ${o.amount} · ${o.status}`,
        time: o.date,
      });
    });
    apiProducts
      .filter((p) => p.stock != null && p.stock > 0 && p.stock <= 5)
      .slice(0, 4)
      .forEach((p) => {
        list.push({
          id: `stock-${p.id}`,
          type: "stock",
          title: "Low stock",
          desc: `${p.name} — ${p.stock} left`,
          time: "Inventory",
        });
      });
    return list.slice(0, 10);
  }, [adminOrders, apiProducts]);

  const paymentMix = useMemo(() => {
    const counts: Record<string, number> = {};
    adminOrders.forEach((o) => {
      counts[o.payment] = (counts[o.payment] || 0) + 1;
    });
    const total = adminOrders.length || 1;
    return Object.entries(counts)
      .map(([source, n], i) => ({
        source,
        count: n,
        percent: Math.round((n / total) * 1000) / 10,
        color: categoryBarColors[i % categoryBarColors.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [adminOrders]);

  const analyticsDerived = useMemo(() => {
    const cust = adminStats?.customers ?? 0;
    const ord = adminStats?.orders ?? 0;
    const ordersPerCustomer = cust > 0 ? Math.round((ord / cust) * 100) / 100 : 0;
    const emailCounts: Record<string, number> = {};
    adminOrders.forEach((o) => {
      emailCounts[o.email] = (emailCounts[o.email] || 0) + 1;
    });
    const buyers = Object.keys(emailCounts).length;
    const repeat = Object.values(emailCounts).filter((n) => n > 1).length;
    const repeatPct = buyers > 0 ? Math.round((repeat / buyers) * 1000) / 10 : 0;
    return {
      ordersPerCustomer,
      repeatPct,
      aov: adminStats?.avgOrderValue ?? 0,
    };
  }, [adminStats, adminOrders]);

  const customerStatsRow = useMemo(() => {
    const total = adminCustomers.length;
    const vip = adminCustomers.filter((c) => c.status === "VIP").length;
    const active = adminCustomers.filter((c) => c.status === "Active" || c.status === "VIP").length;
    const recent = adminStats?.recentCustomers ?? 0;
    return [
      { label: "Total Customers", value: String(total), icon: Users, color: "bg-primary/10 text-primary" },
      { label: "Active", value: String(active), icon: UserCheck, color: "bg-primary/10 text-primary" },
      { label: "VIP Members", value: String(vip), icon: Star, color: "bg-violet-100 text-violet-600" },
      { label: "New (30 days)", value: String(recent), icon: TrendingUp, color: "bg-blue-100 text-blue-600" },
    ];
  }, [adminCustomers, adminStats?.recentCustomers]);

  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [orderFilter, setOrderFilter] = useState("All");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(() => new Set());
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => getStoreSettings());
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newOldPrice, setNewOldPrice] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStock, setNewStock] = useState("0");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  useEffect(() => {
    if (activeTab === "settings") setStoreSettings(getStoreSettings());
  }, [activeTab]);

  const resetProductForm = () => {
    setEditingProductId(null);
    setNewName("");
    setNewPrice("");
    setNewOldPrice("");
    setNewCategory("");
    setNewDescription("");
    setNewStock("0");
    setNewImage(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const openAddProduct = () => {
    resetProductForm();
    setShowAddProduct(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setNewName(p.name);
    setNewPrice(String(p.price));
    setNewOldPrice(p.oldPrice != null ? String(p.oldPrice) : "");
    setNewCategory(p.category || "");
    setNewDescription(p.description || "");
    setNewStock(p.stock != null ? String(p.stock) : "0");
    setNewImage(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    setShowAddProduct(true);
  };

  const adminInitials = user ? userInitials(user.name) : "AD";

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: productsQueryKey });
    queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
    queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    queryClient.invalidateQueries({ queryKey: ["adminCustomers"] });
    toast.success("Dashboard refreshed");
  };

  const exportOrdersCsv = () => {
    const rows = [["id", "customer", "email", "product", "amount", "status", "date", "payment"]];
    adminOrders.forEach((o) =>
      rows.push([o.id, o.customer, o.email, o.product, stripMoneyToNumber(o.amount), o.status, o.date, o.payment])
    );
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Orders exported");
  };

  const exportCustomersCsv = () => {
    const rows = [["id", "name", "email", "orders", "spent", "joined", "status"]];
    adminCustomers.forEach((c) => rows.push([c.id, c.name, c.email, String(c.orders), stripMoneyToNumber(c.spent), c.joined, c.status]));
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Customers exported");
  };

  const persistStoreSettings = () => {
    saveStoreSettings(storeSettings);
    refreshSettings();
    toast.success("Store settings saved — storefront header and shipping rules updated.");
  };

  const adminBrandName = storeSettings.storeName?.trim() || "ShopVert";
  const adminBrandMark = brandMarkFromStoreName(adminBrandName);

  const handleDeleteProduct = async (p: Product) => {
    if (!token) return;
    if (!window.confirm(`Delete “${p.name}”? This cannot be undone.`)) return;
    try {
      await deleteProduct(p.id, token);
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const ordersSource: AdminOrder[] = adminOrders;

  const filteredOrders = ordersSource.filter(o =>
    (orderFilter === "All" || o.status === orderFilter) &&
    (searchQuery === "" || o.customer.toLowerCase().includes(searchQuery.toLowerCase()) || o.id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOrderStatusUpdate = async (orderId: string, nextStatus: AdminOrder["status"]) => {
    if (!token) {
      toast.error("Session expired. Sign in again.");
      return;
    }
    setUpdatingOrderId(orderId);
    try {
      const updated = await updateAdminOrderStatus(orderId, nextStatus, token);
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      setSelectedOrder((prev) => (prev && prev.id === orderId ? updated : prev));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update order");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filteredCustomers = adminCustomers.filter(
    (c: AdminCustomerRow) =>
      customerSearch === "" ||
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return apiProducts;
    return apiProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
    );
  }, [apiProducts, productSearch]);

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-xs leading-none">{adminBrandMark}</span>
            </div>
            {(sidebarOpen || mobile) && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-heading font-bold text-heading text-lg truncate">
                {adminBrandName}
              </motion.span>
            )}
          </Link>
          {!mobile && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors hidden md:flex">
              <ChevronLeft className={`w-4 h-4 text-muted-foreground transition-transform ${!sidebarOpen ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        <p className={`text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2 ${!sidebarOpen && !mobile ? "sr-only" : ""}`}>Menu</p>
        {sidebarNav.map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); if (mobile) setMobileSidebarOpen(false); }}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all ${
              activeTab === item.id
                ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20"
                : "text-body hover:bg-secondary hover:text-heading"
            } ${!sidebarOpen && !mobile ? "justify-center" : ""}`}
            title={!sidebarOpen && !mobile ? item.label : undefined}
          >
            <item.icon className="w-4.5 h-4.5 shrink-0" />
            {(sidebarOpen || mobile) && <span>{item.label}</span>}
            {(sidebarOpen || mobile) && activeTab === item.id && (
              <ChevronRight className="w-3.5 h-3.5 ml-auto" />
            )}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-border space-y-1">
        <Link
          to="/"
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-body hover:bg-secondary transition-colors ${!sidebarOpen && !mobile ? "justify-center" : ""}`}
        >
          <Home className="w-4.5 h-4.5 shrink-0" />
          {(sidebarOpen || mobile) && <span>Back to Store</span>}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/5 transition-colors ${!sidebarOpen && !mobile ? "justify-center" : ""}`}
        >
          <LogOut className="w-4.5 h-4.5 shrink-0" />
          {(sidebarOpen || mobile) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 shrink-0 ${sidebarOpen ? "w-64" : "w-[72px]"}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border md:hidden"
            >
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 md:px-6 h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileSidebarOpen(true)} className="p-2 rounded-xl hover:bg-secondary transition-colors md:hidden">
                <Menu className="w-5 h-5 text-heading" />
              </button>
              <div>
                <h1 className="text-lg font-heading font-bold text-heading capitalize">{sidebarNav.find(n => n.id === activeTab)?.label}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Welcome back, {user?.name ?? "Admin"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  placeholder="Find product… (Enter)"
                  className="pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-56"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setProductSearch((e.target as HTMLInputElement).value);
                      setActiveTab("products");
                    }
                  }}
                />
              </div>
              <button
                type="button"
                title="Export orders CSV"
                onClick={() => (adminOrders.length ? exportOrdersCsv() : toast.message("No orders to export"))}
                className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors"
              >
                <Download className="w-4 h-4 text-body" />
              </button>
              <button type="button" title="Refresh data" onClick={refreshAll} className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors">
                <RefreshCw className="w-4 h-4 text-body" />
              </button>
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-xl border border-border hover:bg-secondary transition-colors">
                  <Bell className="w-4 h-4 text-body" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                    {liveNotifications.filter((n) => !readNotifIds.has(n.id)).length}
                  </span>
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-12 w-80 bg-card rounded-2xl border border-border overflow-hidden z-50" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
                      <div className="flex items-center justify-between p-4 border-b border-border">
                        <h3 className="font-heading font-semibold text-sm">Notifications</h3>
                        <button
                          type="button"
                          className="text-xs text-primary font-medium"
                          onClick={() => setReadNotifIds(new Set(liveNotifications.map((n) => n.id)))}
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {liveNotifications.length === 0 && (
                          <p className="p-4 text-xs text-muted-foreground text-center">No activity yet. Orders and low-stock items appear here.</p>
                        )}
                        {liveNotifications.map((n) => {
                          const read = readNotifIds.has(n.id);
                          return (
                          <div
                            key={n.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setReadNotifIds((prev) => new Set(prev).add(n.id))}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setReadNotifIds((prev) => new Set(prev).add(n.id)); } }}
                            className={`flex gap-3 p-4 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer ${!read ? "bg-primary/5" : ""}`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === "order" ? "bg-primary/10 text-primary" : n.type === "stock" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>
                              {n.type === "order" ? <ShoppingCart className="w-3.5 h-3.5" /> : n.type === "stock" ? <AlertCircle className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-heading">{n.title}</p>
                              <p className="text-[11px] text-muted-foreground line-clamp-2">{n.desc}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                            </div>
                            {!read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                          </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary ml-1">{adminInitials}</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {/* Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {statsLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-2xl p-5 animate-pulse h-32" />
                  ))}
                {!statsLoading &&
                  overviewStats.map((stat, i) => (
                    <motion.div key={stat.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="bg-card rounded-2xl p-5 card-hover">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                          <stat.icon className="w-5 h-5" />
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-semibold ${stat.up ? "text-primary" : "text-destructive"}`}>
                          {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {stat.change}
                        </div>
                      </div>
                      <p className="text-2xl font-heading font-bold text-heading">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{stat.subtext}</p>
                    </motion.div>
                  ))}
                {!statsLoading && overviewStats.length === 0 && (
                  <p className="col-span-full text-sm text-muted-foreground">Could not load stats. Check API and try refresh.</p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card rounded-2xl p-6 card-hover">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-heading font-semibold">Revenue Overview</h3>
                      <p className="text-xs text-muted-foreground">Last 6 months (excl. cancelled)</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <ArrowUpRight className="w-3 h-3" /> Live
                    </div>
                  </div>
                  <div className="flex items-end gap-3 h-48">
                    {(adminStats?.monthlyRevenueNormalized ?? []).length === 0 && !statsLoading && (
                      <p className="text-xs text-muted-foreground w-full text-center py-12">No order revenue yet.</p>
                    )}
                    {(adminStats?.monthlyRevenueNormalized ?? []).map((d) => (
                      <div key={d.label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${d.value}%` }}
                          transition={{ duration: 0.6 }}
                          className="w-full rounded-xl bg-gradient-to-t from-primary to-primary/60 min-h-[8px] relative group cursor-pointer hover:from-primary/80 hover:to-primary/40 transition-colors"
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-heading text-white text-[10px] px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {formatPkr(d.total, true)}
                          </div>
                        </motion.div>
                        <span className="text-[10px] text-muted-foreground font-medium truncate w-full text-center">{d.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-6 card-hover">
                  <h3 className="font-heading font-semibold mb-6">Sales by Category</h3>
                  <div className="space-y-4">
                    {(adminStats?.categoryRevenue ?? []).length === 0 && !statsLoading && (
                      <p className="text-xs text-muted-foreground">No category data until orders are placed.</p>
                    )}
                    {(adminStats?.categoryRevenue ?? []).map((cat, idx) => {
                      const bar = categoryBarColors[idx % categoryBarColors.length];
                      return (
                        <div key={cat.name}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-heading font-medium truncate pr-2">{cat.name}</span>
                            <span className="text-xs font-semibold text-muted-foreground shrink-0">
                              {cat.percent}% · {formatPkr(cat.revenue, true)}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, cat.percent)}%` }}
                              transition={{ duration: 0.8 }}
                              className={`h-full rounded-full ${bar}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card rounded-2xl p-6 card-hover">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-semibold">Recent Orders</h3>
                    <button onClick={() => setActiveTab("orders")} className="text-xs text-primary font-medium hover:underline">View All →</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border">
                        <th className="text-left py-3 px-2 text-xs text-muted-foreground font-medium">Order</th>
                        <th className="text-left py-3 px-2 text-xs text-muted-foreground font-medium hidden sm:table-cell">Customer</th>
                        <th className="text-left py-3 px-2 text-xs text-muted-foreground font-medium">Amount</th>
                        <th className="text-left py-3 px-2 text-xs text-muted-foreground font-medium">Status</th>
                      </tr></thead>
                      <tbody>
                        {ordersLoading && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-muted-foreground text-sm">
                              Loading orders…
                            </td>
                          </tr>
                        )}
                        {!ordersLoading &&
                          ordersSource.slice(0, 5).map((o) => {
                            const Icon = statusIcon(o.status);
                            return (
                              <tr key={o.id} onClick={() => setSelectedOrder(o)} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer">
                                <td className="py-3 px-2">
                                  <span className="font-mono text-xs font-medium">{o.id.slice(-8)}</span>
                                  <p className="text-[10px] text-muted-foreground">{o.date}</p>
                                </td>
                                <td className="py-3 px-2 hidden sm:table-cell">
                                  <span className="text-heading font-medium">{o.customer}</span>
                                </td>
                                <td className="py-3 px-2 font-semibold">{o.amount}</td>
                                <td className="py-3 px-2">
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${statusStyle(o.status)}`}>
                                    <Icon className="w-3 h-3" />
                                    {o.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        {!ordersLoading && ordersSource.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-muted-foreground text-sm">
                              No orders yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-card rounded-2xl p-6 card-hover">
                    <h3 className="font-heading font-semibold mb-4">Top Products</h3>
                    <div className="space-y-3">
                      {catalogLoading && <p className="text-xs text-muted-foreground py-4">Loading products…</p>}
                      {!catalogLoading && topProducts.length === 0 && <p className="text-xs text-muted-foreground py-4">No products in catalog yet.</p>}
                      {!catalogLoading && topProducts.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-3 group cursor-pointer">
                          <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                          <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0"><p className="text-xs font-medium text-heading line-clamp-1 group-hover:text-primary transition-colors">{p.name}</p><p className="text-[10px] text-muted-foreground">{p.reviews} reviews</p></div>
                          <span className="text-xs font-bold text-primary">{formatPkr(p.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-card rounded-2xl p-6 card-hover">
                    <h3 className="font-heading font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: Plus, label: "Add Product", action: () => openAddProduct() },
                        { icon: FileText, label: "Reports", action: () => setActiveTab("analytics") },
                        { icon: Users, label: "Customers", action: () => setActiveTab("customers") },
                        { icon: Settings, label: "Settings", action: () => setActiveTab("settings") },
                      ].map(item => (
                        <button key={item.label} onClick={item.action} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground">
                          <item.icon className="w-4 h-4" /><span className="text-[11px] font-medium">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Orders", value: String(adminStats?.orders ?? "—"), icon: ShoppingCart, color: "bg-primary/10 text-primary" },
                  { label: "Delivered", value: String(adminStats?.ordersByStatus?.Delivered ?? "—"), icon: CheckCircle, color: "bg-primary/10 text-primary" },
                  { label: "In Transit", value: String(adminStats?.ordersByStatus?.["In Transit"] ?? "—"), icon: Truck, color: "bg-blue-100 text-blue-600" },
                  { label: "Cancelled", value: String(adminStats?.ordersByStatus?.Cancelled ?? "—"), icon: XCircle, color: "bg-destructive/10 text-destructive" },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl p-4 card-hover">
                    <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-2`}><s.icon className="w-4 h-4" /></div>
                    <p className="text-xl font-heading font-bold text-heading">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p>
                  </motion.div>
                ))}
              </div>
              <div className="bg-card rounded-2xl p-6 card-hover">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                  <h3 className="font-heading font-semibold">All Orders</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => (adminOrders.length ? exportOrdersCsv() : toast.message("No orders to export"))}
                      className="text-xs px-3 py-2 rounded-xl border border-border hover:bg-secondary transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Export CSV
                    </button>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search orders..." className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 w-48" />
                    </div>
                    <div className="flex gap-1">
                      {["All", "Delivered", "In Transit", "Processing", "Cancelled"].map(f => (
                        <button key={f} onClick={() => setOrderFilter(f)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${orderFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}>{f}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      {["Order ID", "Customer", "Product", "Amount", "Payment", "Status", "Date", ""].map(h => (
                        <th key={h} className="text-left py-3 px-3 text-xs text-muted-foreground font-medium">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {ordersLoading && (
                        <tr><td colSpan={8} className="py-8 text-center text-muted-foreground text-sm">Loading orders…</td></tr>
                      )}
                      {!ordersLoading && filteredOrders.map((o) => {
                        const Icon = statusIcon(o.status);
                        return (
                          <tr key={o.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                            <td className="py-3 px-3 font-mono text-xs font-medium">{o.id}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">{o.customer.split(" ").map(w => w[0]).join("")}</div>
                                <div><p className="font-medium text-heading text-xs">{o.customer}</p><p className="text-[10px] text-muted-foreground">{o.email}</p></div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-body text-xs">{o.product}</td>
                            <td className="py-3 px-3 font-semibold text-xs">{o.amount}</td>
                            <td className="py-3 px-3"><span className="text-[10px] text-muted-foreground flex items-center gap-1"><CreditCard className="w-3 h-3" />{o.payment}</span></td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full ${statusStyle(o.status)}`}><Icon className="w-3 h-3" />{o.status}</span>
                                <select
                                  value={o.status}
                                  disabled={updatingOrderId === o.id}
                                  onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value as AdminOrder["status"])}
                                  className="text-[10px] px-2 py-1 rounded border border-border bg-background"
                                >
                                  {["Processing", "In Transit", "Delivered", "Cancelled"].map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-muted-foreground text-xs">{o.date}</td>
                            <td className="py-3 px-3"><button onClick={() => setSelectedOrder(o)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {!ordersLoading && filteredOrders.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No orders found.</p>}
              </div>
            </div>
          )}

          {/* Products */}
          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Products", value: String(productStats.total), icon: Package, color: "bg-primary/10 text-primary" },
                  { label: "In Stock", value: String(productStats.inStock), icon: Check, color: "bg-primary/10 text-primary" },
                  { label: "Out of Stock", value: String(productStats.out), icon: AlertCircle, color: "bg-destructive/10 text-destructive" },
                  { label: "Categories", value: String(productStats.categories), icon: Globe, color: "bg-violet-100 text-violet-600" },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl p-4 card-hover">
                    <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-2`}><s.icon className="w-4 h-4" /></div>
                    <p className="text-xl font-heading font-bold text-heading">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p>
                  </motion.div>
                ))}
              </div>
              <div className="bg-card rounded-2xl p-6 card-hover">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                  <h3 className="font-heading font-semibold">Product Management</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search products..."
                        className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
                      />
                    </div>
                    <button type="button" onClick={() => openAddProduct()} className="btn-gradient text-xs flex items-center gap-1.5 !py-2 !px-4">
                      <Plus className="w-3.5 h-3.5" /> Add Product
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      {["Product", "SKU", "Category", "Price", "Rating", "Stock", "Actions"].map(h => (
                        <th key={h} className="text-left py-3 px-3 text-xs text-muted-foreground font-medium">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {catalogLoading && (
                        <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">Loading products…</td></tr>
                      )}
                      {!catalogLoading && apiProducts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                            No products yet. Use Add Product.
                          </td>
                        </tr>
                      )}
                      {!catalogLoading && apiProducts.length > 0 && filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                            No products match your search.
                          </td>
                        </tr>
                      )}
                      {!catalogLoading &&
                        filteredProducts.map((p) => (
                          <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                                <div>
                                  <span className="font-medium text-heading line-clamp-1 max-w-[180px] text-xs">{p.name}</span>
                                  {p.badge && (
                                    <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">{p.badge}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-muted-foreground max-w-[100px] truncate" title={p.id}>
                              {p.id.slice(-8).toUpperCase()}
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-xs px-2 py-1 rounded-lg bg-secondary text-body">{p.category}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-semibold text-primary text-xs">{formatPkr(p.price)}</span>
                              {p.oldPrice != null && <span className="block text-[10px] text-muted-foreground line-through">{formatPkr(p.oldPrice)}</span>}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-xs">{p.rating}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-xs text-body">{p.stock ?? "—"}</span>
                              <span className={`ml-1 text-[10px] font-semibold px-2 py-1 rounded-full ${p.inStock ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                                {p.inStock ? "OK" : "Out"}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex gap-1">
                                <Link
                                  to={`/product/${p.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors inline-flex"
                                  title="View on store"
                                >
                                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => openEditProduct(p)}
                                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(p)}
                                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Customers */}
          {activeTab === "customers" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {customerStatsRow.map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl p-4 card-hover">
                    <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-2`}><s.icon className="w-4 h-4" /></div>
                    <p className="text-xl font-heading font-bold text-heading">{customersLoading ? "—" : s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p>
                  </motion.div>
                ))}
              </div>
              <div className="bg-card rounded-2xl p-6 card-hover">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                  <h3 className="font-heading font-semibold">Customer Management</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search customers..." className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 w-48" /></div>
                    <button
                      type="button"
                      onClick={() => (adminCustomers.length ? exportCustomersCsv() : toast.message("No customers to export"))}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors"
                    >
                      <Download className="w-3 h-3" /> Export
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      {["Customer", "Phone", "Orders", "Total Spent", "Joined", "Status", "Actions"].map(h => (
                        <th key={h} className="text-left py-3 px-3 text-xs text-muted-foreground font-medium">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {customersLoading && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                            Loading customers…
                          </td>
                        </tr>
                      )}
                      {!customersLoading &&
                        filteredCustomers.map((c: AdminCustomerRow) => (
                          <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{c.avatar}</div>
                                <div>
                                  <p className="font-medium text-heading text-xs">{c.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{c.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-xs text-body">—</td>
                            <td className="py-3 px-3 text-xs font-semibold text-heading">{c.orders}</td>
                            <td className="py-3 px-3 text-xs font-semibold text-primary">{c.spent}</td>
                            <td className="py-3 px-3 text-xs text-muted-foreground">{c.joined}</td>
                            <td className="py-3 px-3">
                              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${statusStyle(c.status)}`}>{c.status}</span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex gap-1">
                                <a href={`mailto:${encodeURIComponent(c.email)}`} className="p-1.5 rounded-lg hover:bg-secondary transition-colors inline-flex" title="Email">
                                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {!customersLoading && filteredCustomers.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                            {customerSearch.trim()
                              ? "No customers match your search."
                              : adminCustomers.length === 0
                                ? "No registered customers yet."
                                : "No customers match your search."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Analytics */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    icon: BarChart3,
                    title: "Orders per customer",
                    value: String(analyticsDerived.ordersPerCustomer),
                    change: "Live",
                    desc: "Total orders ÷ registered customers",
                    up: true,
                  },
                  {
                    icon: PieChart,
                    title: "Avg. order value",
                    value: formatPkr(analyticsDerived.aov, true),
                    change: "excl. cancelled",
                    desc: "Mean on non-cancelled orders",
                    up: true,
                  },
                  {
                    icon: Activity,
                    title: "Repeat buyers",
                    value: `${analyticsDerived.repeatPct}%`,
                    change: "of order emails",
                    desc: "Customers (by email) with 2+ orders",
                    up: analyticsDerived.repeatPct >= 20,
                  },
                ].map((item, i) => (
                  <motion.div key={item.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-2xl p-6 card-hover">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><item.icon className="w-5 h-5 text-primary" /></div>
                      <span className={`text-xs font-semibold flex items-center gap-1 ${item.up ? "text-primary" : "text-destructive"}`}>{item.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{item.change}</span>
                    </div>
                    <p className="text-2xl font-heading font-bold text-heading">{item.value}</p>
                    <p className="text-sm font-medium text-heading mt-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-2xl p-6 card-hover">
                  <h3 className="font-heading font-semibold mb-6">Monthly revenue</h3>
                  <div className="flex items-end gap-2 h-56">
                    {(adminStats?.monthlyRevenueNormalized ?? []).length === 0 && !statsLoading && (
                      <p className="text-xs text-muted-foreground w-full text-center py-16">No revenue data yet.</p>
                    )}
                    {(adminStats?.monthlyRevenueNormalized ?? []).map((d, i) => (
                      <div key={`${d.label}-${i}`} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                        <motion.div initial={{ height: 0 }} animate={{ height: `${d.value}%` }} transition={{ duration: 0.6, delay: i * 0.05 }}
                          className="w-full rounded-lg bg-gradient-to-t from-primary to-primary/50 min-h-[4px] cursor-pointer hover:from-primary/80 hover:to-primary/40 transition-colors relative group">
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-heading text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{formatPkr(d.total, true)}</div>
                        </motion.div>
                        <span className="text-[9px] text-muted-foreground truncate w-full text-center">{d.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card rounded-2xl p-6 card-hover">
                  <h3 className="font-heading font-semibold mb-6">Payment mix</h3>
                  <div className="space-y-4">
                    {paymentMix.length === 0 && (
                      <p className="text-xs text-muted-foreground">No orders yet — payment breakdown will appear here.</p>
                    )}
                    {paymentMix.map((s) => (
                      <div key={s.source}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <div className="flex items-center gap-2 min-w-0"><div className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.color}`} /><span className="text-heading font-medium text-xs truncate">{s.source}</span></div>
                          <span className="text-xs font-semibold text-muted-foreground shrink-0">{s.percent}% · {s.count} orders</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, s.percent)}%` }} transition={{ duration: 0.8 }} className={`h-full rounded-full ${s.color}`} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings — PKR store + shipping (drives cart & checkout) */}
          {activeTab === "settings" && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-card rounded-2xl p-6 md:p-8 card-hover border border-border">
                <h3 className="font-heading font-semibold text-lg mb-1">Store settings</h3>
                <p className="text-xs text-muted-foreground mb-6">
                  All prices on the site are <strong className="text-heading">Pakistani Rupees (PKR)</strong>. Shipping rules below apply to cart and checkout.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Store name</label>
                    <input value={storeSettings.storeName} onChange={(e) => setStoreSettings((s) => ({ ...s, storeName: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Contact email</label>
                      <input type="email" value={storeSettings.contactEmail} onChange={(e) => setStoreSettings((s) => ({ ...s, contactEmail: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Phone</label>
                      <input value={storeSettings.phone} onChange={(e) => setStoreSettings((s) => ({ ...s, phone: e.target.value }))} placeholder="+92…" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Business address</label>
                    <input value={storeSettings.address} onChange={(e) => setStoreSettings((s) => ({ ...s, address: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
                <div className="border-t border-border mt-8 pt-6 space-y-4">
                  <h4 className="text-sm font-semibold text-heading flex items-center gap-2"><Truck className="w-4 h-4 text-primary" />Shipping (PKR)</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Free standard shipping from cart total (PKR)</label>
                      <input type="number" min={0} step={1} value={storeSettings.freeShippingMinimumPkr} onChange={(e) => setStoreSettings((s) => ({ ...s, freeShippingMinimumPkr: Math.max(0, Number(e.target.value) || 0) }))} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <p className="text-[10px] text-muted-foreground mt-1">If subtotal is below this, standard fee applies.</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Standard shipping fee (PKR)</label>
                      <input type="number" min={0} step={1} value={storeSettings.standardShippingPkr} onChange={(e) => setStoreSettings((s) => ({ ...s, standardShippingPkr: Math.max(0, Number(e.target.value) || 0) }))} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Express delivery extra (PKR)</label>
                      <input type="number" min={0} step={1} value={storeSettings.expressShippingPkr} onChange={(e) => setStoreSettings((s) => ({ ...s, expressShippingPkr: Math.max(0, Number(e.target.value) || 0) }))} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <p className="text-[10px] text-muted-foreground mt-1">Added when customer chooses express (on top of standard fee when shipping is not free).</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-8">
                  <button type="button" onClick={persistStoreSettings} className="btn-gradient text-sm px-6 py-2.5">Save settings</button>
                  <p className="text-xs text-muted-foreground self-center">Checkout & cart read these values immediately after save.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-3 text-xs text-muted-foreground">
                <strong className="text-heading">Payments:</strong> Cash on Delivery, EasyPaisa, and JazzCash are configured on checkout. Card/PayPal labels were removed for a Pakistan-focused store.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 print:hidden" onClick={() => setSelectedOrder(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-card rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto print:shadow-none print:max-h-none" style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>
              <div className="flex items-center justify-between mb-6">
                <div><h3 className="font-heading font-semibold">Order Details</h3><p className="text-xs text-muted-foreground font-mono">{selectedOrder.id}</p></div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-xl hover:bg-secondary transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2">{(() => { const Icon = statusIcon(selectedOrder.status); return <Icon className="w-4 h-4" />; })()}<span className="text-sm font-semibold">{selectedOrder.status}</span></div>
                  <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${statusStyle(selectedOrder.status)}`}>{selectedOrder.status}</span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Customer</h4>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{selectedOrder.customer.split(" ").map(w => w[0]).join("")}</div>
                    <div><p className="text-sm font-medium text-heading">{selectedOrder.customer}</p><p className="text-xs text-muted-foreground">{selectedOrder.email}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 text-body"><Phone className="w-3 h-3 text-muted-foreground" />{selectedOrder.phone}</div>
                    <div className="flex items-center gap-2 text-body"><MapPin className="w-3 h-3 text-muted-foreground" />{selectedOrder.address}</div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Order Info</h4>
                  <div className="space-y-2">
                    {[
                      { label: "Product", value: selectedOrder.product },
                      { label: "Items", value: String(selectedOrder.items) },
                      { label: "Amount", value: selectedOrder.amount },
                      { label: "Payment", value: selectedOrder.payment },
                      { label: "Date", value: selectedOrder.date },
                    ].map(f => (
                      <div key={f.label} className="flex justify-between py-2 border-b border-border last:border-0"><span className="text-xs text-muted-foreground">{f.label}</span><span className="text-xs font-medium text-heading">{f.value}</span></div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleOrderStatusUpdate(selectedOrder.id, e.target.value as AdminOrder["status"])}
                    disabled={updatingOrderId === selectedOrder.id}
                    className="btn-gradient text-xs flex-1 !py-2.5"
                  >
                    {["Processing", "In Transit", "Delivered", "Cancelled"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button type="button" className="flex-1 text-xs px-4 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors font-medium print:hidden" onClick={() => window.print()}>Print / PDF</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Product Modal — multipart + Bearer token */}
      <AnimatePresence>
        {showAddProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => { setShowAddProduct(false); resetProductForm(); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-card rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto" style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading font-semibold">{editingProductId ? "Edit product" : "Add new product"}</h3>
                <button type="button" onClick={() => { setShowAddProduct(false); resetProductForm(); }} className="p-2 rounded-xl hover:bg-secondary transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!token) {
                    toast.error("Session expired. Sign in again.");
                    return;
                  }
                  if (!newName.trim() || newPrice === "") {
                    toast.error("Name and price are required.");
                    return;
                  }
                  setProductSubmitting(true);
                  try {
                    const fd = new FormData();
                    fd.append("name", newName.trim());
                    fd.append("price", String(Number(newPrice)));
                    if (newOldPrice !== "") fd.append("oldPrice", String(Number(newOldPrice)));
                    fd.append("category", newCategory || "General");
                    fd.append("description", newDescription);
                    fd.append("stock", String(Number(newStock) || 0));
                    fd.append("specs", JSON.stringify({}));
                    if (newImage) fd.append("image", newImage);
                    const res = editingProductId
                      ? await updateProductWithImage(editingProductId, fd, token)
                      : await createProductWithImage(fd, token);
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      toast.error(typeof data.message === "string" ? data.message : editingProductId ? "Failed to update product" : "Failed to create product");
                      return;
                    }
                    toast.success(editingProductId ? "Product updated" : "Product created");
                    queryClient.invalidateQueries({ queryKey: productsQueryKey });
                    queryClient.invalidateQueries({ queryKey: ["adminStats"] });
                    setShowAddProduct(false);
                    resetProductForm();
                  } catch {
                    toast.error("Network error");
                  } finally {
                    setProductSubmitting(false);
                  }
                }}
              >
                <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Product Name</label><input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Enter product name" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Price (PKR)</label><input required type="number" step="1" min="0" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Old price / compare-at (PKR)</label><input type="number" step="1" min="0" value={newOldPrice} onChange={(e) => setNewOldPrice(e.target.value)} placeholder="Optional" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Stock</label><input type="number" min="0" value={newStock} onChange={(e) => setNewStock(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label><select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"><option value="">Select category</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label><textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Enter product description" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 h-24 resize-none" /></div>
                <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(e) => setNewImage(e.target.files?.[0] ?? null)} />
                <button type="button" onClick={() => imageInputRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all">
                  <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">{newImage ? newImage.name : "Click to choose image (optional)"}</p>
                </button>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={productSubmitting} className="btn-gradient text-sm flex-1 disabled:opacity-60">{productSubmitting ? "Saving…" : editingProductId ? "Save changes" : "Add product"}</button>
                  <button type="button" onClick={() => { setShowAddProduct(false); resetProductForm(); }} className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors font-medium">Cancel</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
