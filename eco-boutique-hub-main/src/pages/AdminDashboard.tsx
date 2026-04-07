import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { createProductWithImage, fetchAdminOrders, fetchProducts, productsQueryKey, updateAdminOrderStatus, userInitials, type AdminOrder } from "@/lib/api";
import {
  DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown,
  Eye, Search, Bell, Plus, Edit, Trash2, ArrowUpRight, ArrowDownRight,
  BarChart3, PieChart, Activity, Star, X, Check, Clock, Mail,
  Settings, Download, Filter, MoreVertical, RefreshCw, Calendar,
  CreditCard, MapPin, Phone, ChevronRight, AlertCircle, CheckCircle,
  XCircle, Truck, FileText, Globe, Shield, UserCheck, UserX,
  LayoutDashboard, ChevronLeft, LogOut, Menu, Home
} from "lucide-react";
import { categories } from "@/data/products";

const stats = [
  { title: "Total Revenue", value: "$48,294", change: "+12.5%", up: true, icon: DollarSign, color: "bg-primary/10 text-primary", subtext: "vs $42,890 last month" },
  { title: "Total Orders", value: "1,847", change: "+8.2%", up: true, icon: ShoppingCart, color: "bg-blue-100 text-blue-600", subtext: "142 today" },
  { title: "Total Customers", value: "3,291", change: "+15.3%", up: true, icon: Users, color: "bg-violet-100 text-violet-600", subtext: "89 new this week" },
  { title: "Products Listed", value: "462", change: "-2.1%", up: false, icon: Package, color: "bg-amber-100 text-amber-600", subtext: "12 out of stock" },
];

const recentOrders = [
  { id: "SV-9A8B7C", customer: "Sarah Miller", email: "sarah@mail.com", phone: "+1 555-0101", product: "Wireless Headphones", amount: "$89.99", status: "Delivered", date: "Mar 28, 2026", address: "123 Main St, NYC", payment: "Credit Card", items: 2 },
  { id: "SV-6D5E4F", customer: "James Kim", email: "james@mail.com", phone: "+1 555-0102", product: "Leather Watch", amount: "$149.99", status: "In Transit", date: "Mar 27, 2026", address: "456 Oak Ave, LA", payment: "PayPal", items: 1 },
  { id: "SV-3G2H1I", customer: "Emily Rose", email: "emily@mail.com", phone: "+1 555-0103", product: "Skincare Bundle", amount: "$54.99", status: "Processing", date: "Mar 27, 2026", address: "789 Pine Rd, Chicago", payment: "Debit Card", items: 3 },
  { id: "SV-7J6K5L", customer: "David Chen", email: "david@mail.com", phone: "+1 555-0104", product: "Running Shoes", amount: "$119.99", status: "Delivered", date: "Mar 26, 2026", address: "321 Elm St, Houston", payment: "Credit Card", items: 1 },
  { id: "SV-2M1N0O", customer: "Lisa Wang", email: "lisa@mail.com", phone: "+1 555-0105", product: "Fitness Tracker", amount: "$59.99", status: "Cancelled", date: "Mar 26, 2026", address: "654 Maple Dr, Phoenix", payment: "Wallet", items: 2 },
  { id: "SV-8P7Q6R", customer: "Mike Johnson", email: "mike@mail.com", phone: "+1 555-0106", product: "Bluetooth Speaker", amount: "$39.99", status: "Processing", date: "Mar 25, 2026", address: "987 Cedar Ln, Denver", payment: "Credit Card", items: 1 },
  { id: "SV-4S3T2U", customer: "Anna Davis", email: "anna@mail.com", phone: "+1 555-0107", product: "Yoga Mat Premium", amount: "$44.99", status: "Delivered", date: "Mar 25, 2026", address: "147 Birch St, Seattle", payment: "PayPal", items: 2 },
  { id: "SV-9V8W7X", customer: "Tom Wilson", email: "tom@mail.com", phone: "+1 555-0108", product: "Novel Collection", amount: "$24.99", status: "In Transit", date: "Mar 24, 2026", address: "258 Walnut Ave, Boston", payment: "Debit Card", items: 1 },
];

const customersList = [
  { id: 1, name: "Sarah Miller", email: "sarah@mail.com", phone: "+1 555-0101", orders: 12, spent: "$1,247.80", joined: "Jan 2025", status: "Active", avatar: "SM" },
  { id: 2, name: "James Kim", email: "james@mail.com", phone: "+1 555-0102", orders: 8, spent: "$892.50", joined: "Mar 2025", status: "Active", avatar: "JK" },
  { id: 3, name: "Emily Rose", email: "emily@mail.com", phone: "+1 555-0103", orders: 15, spent: "$2,134.25", joined: "Dec 2024", status: "VIP", avatar: "ER" },
  { id: 4, name: "David Chen", email: "david@mail.com", phone: "+1 555-0104", orders: 3, spent: "$289.97", joined: "Feb 2026", status: "Active", avatar: "DC" },
  { id: 5, name: "Lisa Wang", email: "lisa@mail.com", phone: "+1 555-0105", orders: 0, spent: "$0.00", joined: "Mar 2026", status: "Inactive", avatar: "LW" },
  { id: 6, name: "Mike Johnson", email: "mike@mail.com", phone: "+1 555-0106", orders: 22, spent: "$3,456.90", joined: "Aug 2024", status: "VIP", avatar: "MJ" },
];

const notifications = [
  { id: 1, type: "order", title: "New order received", desc: "Order SV-9A8B7C from Sarah Miller — $89.99", time: "2 min ago", read: false },
  { id: 2, type: "stock", title: "Low stock alert", desc: "Wireless Headphones — Only 3 left in stock", time: "15 min ago", read: false },
  { id: 3, type: "customer", title: "New customer signup", desc: "Tom Wilson joined your store", time: "1 hr ago", read: false },
  { id: 4, type: "review", title: "New 5-star review", desc: "Sarah M. reviewed Leather Watch — ★★★★★", time: "2 hrs ago", read: true },
  { id: 5, type: "order", title: "Order delivered", desc: "Order SV-7J6K5L delivered to David Chen", time: "3 hrs ago", read: true },
];

const revenueData = [
  { month: "Oct", value: 32 }, { month: "Nov", value: 45 }, { month: "Dec", value: 58 },
  { month: "Jan", value: 42 }, { month: "Feb", value: 51 }, { month: "Mar", value: 68 },
];

const categoryData = [
  { name: "Electronics", percent: 35, color: "bg-primary", revenue: "$16,903" },
  { name: "Fashion", percent: 25, color: "bg-blue-500", revenue: "$12,074" },
  { name: "Home", percent: 20, color: "bg-violet-500", revenue: "$9,659" },
  { name: "Beauty", percent: 12, color: "bg-amber-500", revenue: "$5,795" },
  { name: "Other", percent: 8, color: "bg-muted-foreground", revenue: "$3,863" },
];

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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [orderFilter, setOrderFilter] = useState("All");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
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

  const adminInitials = user ? userInitials(user.name) : "AD";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const ordersSource: AdminOrder[] = token ? adminOrders : (recentOrders as unknown as AdminOrder[]);

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
      setSelectedOrder((prev) => (prev && prev.id === orderId ? updated : prev));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update order");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filteredCustomers = customersList.filter(c =>
    customerSearch === "" || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">SV</span>
            </div>
            {(sidebarOpen || mobile) && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-heading font-bold text-heading text-lg">
                ShopVert
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
                <input placeholder="Search anything..." className="pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-56" />
              </div>
              <button className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors"><Download className="w-4 h-4 text-body" /></button>
              <button className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors"><RefreshCw className="w-4 h-4 text-body" /></button>
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-xl border border-border hover:bg-secondary transition-colors">
                  <Bell className="w-4 h-4 text-body" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-12 w-80 bg-card rounded-2xl border border-border overflow-hidden z-50" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
                      <div className="flex items-center justify-between p-4 border-b border-border">
                        <h3 className="font-heading font-semibold text-sm">Notifications</h3>
                        <button className="text-xs text-primary font-medium">Mark all read</button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.map(n => (
                          <div key={n.id} className={`flex gap-3 p-4 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer ${!n.read ? "bg-primary/5" : ""}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === "order" ? "bg-primary/10 text-primary" : n.type === "stock" ? "bg-amber-100 text-amber-600" : n.type === "customer" ? "bg-blue-100 text-blue-600" : "bg-violet-100 text-violet-600"}`}>
                              {n.type === "order" ? <ShoppingCart className="w-3.5 h-3.5" /> : n.type === "stock" ? <AlertCircle className="w-3.5 h-3.5" /> : n.type === "customer" ? <Users className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-heading">{n.title}</p>
                              <p className="text-[11px] text-muted-foreground line-clamp-1">{n.desc}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                            </div>
                            {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                          </div>
                        ))}
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
                {stats.map((stat, i) => (
                  <motion.div key={stat.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="bg-card rounded-2xl p-5 card-hover">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}><stat.icon className="w-5 h-5" /></div>
                      <div className={`flex items-center gap-1 text-xs font-semibold ${stat.up ? "text-primary" : "text-destructive"}`}>
                        {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{stat.change}
                      </div>
                    </div>
                    <p className="text-2xl font-heading font-bold text-heading">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{stat.subtext}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card rounded-2xl p-6 card-hover">
                  <div className="flex items-center justify-between mb-6">
                    <div><h3 className="font-heading font-semibold">Revenue Overview</h3><p className="text-xs text-muted-foreground">Last 6 months</p></div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-primary"><ArrowUpRight className="w-3 h-3" /> +24.5%</div>
                  </div>
                  <div className="flex items-end gap-3 h-48">
                    {revenueData.map(d => (
                      <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                        <motion.div initial={{ height: 0 }} animate={{ height: `${d.value}%` }} transition={{ duration: 0.6 }}
                          className="w-full rounded-xl bg-gradient-to-t from-primary to-primary/60 min-h-[8px] relative group cursor-pointer hover:from-primary/80 hover:to-primary/40 transition-colors">
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-heading text-white text-[10px] px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">${(d.value * 750).toLocaleString()}</div>
                        </motion.div>
                        <span className="text-[10px] text-muted-foreground font-medium">{d.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-6 card-hover">
                  <h3 className="font-heading font-semibold mb-6">Sales by Category</h3>
                  <div className="space-y-4">
                    {categoryData.map(cat => (
                      <div key={cat.name}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-heading font-medium">{cat.name}</span>
                          <span className="text-xs font-semibold text-muted-foreground">{cat.percent}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${cat.percent}%` }} transition={{ duration: 0.8 }} className={`h-full rounded-full ${cat.color}`} />
                        </div>
                      </div>
                    ))}
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
                        {ordersSource.slice(0, 5).map(o => {
                          const Icon = statusIcon(o.status);
                          return (
                            <tr key={o.id} onClick={() => setSelectedOrder(o)} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer">
                              <td className="py-3 px-2"><span className="font-mono text-xs font-medium">{o.id}</span><p className="text-[10px] text-muted-foreground">{o.date}</p></td>
                              <td className="py-3 px-2 hidden sm:table-cell"><span className="text-heading font-medium">{o.customer}</span></td>
                              <td className="py-3 px-2 font-semibold">{o.amount}</td>
                              <td className="py-3 px-2"><span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${statusStyle(o.status)}`}><Icon className="w-3 h-3" />{o.status}</span></td>
                            </tr>
                          );
                        })}
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
                          <span className="text-xs font-bold text-primary">${p.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-card rounded-2xl p-6 card-hover">
                    <h3 className="font-heading font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: Plus, label: "Add Product", action: () => setShowAddProduct(true) },
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
                  { label: "Total Orders", value: "1,847", icon: ShoppingCart, color: "bg-primary/10 text-primary" },
                  { label: "Delivered", value: "1,423", icon: CheckCircle, color: "bg-primary/10 text-primary" },
                  { label: "In Transit", value: "289", icon: Truck, color: "bg-blue-100 text-blue-600" },
                  { label: "Cancelled", value: "135", icon: XCircle, color: "bg-destructive/10 text-destructive" },
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
                      {filteredOrders.map(o => {
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
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><input placeholder="Search products..." className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 w-48" /></div>
                    <button onClick={() => setShowAddProduct(true)} className="btn-gradient text-xs flex items-center gap-1.5 !py-2 !px-4"><Plus className="w-3.5 h-3.5" /> Add Product</button>
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
                        <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">No products yet. Use Add Product.</td></tr>
                      )}
                      {!catalogLoading && apiProducts.map(p => (
                        <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                              <div><span className="font-medium text-heading line-clamp-1 max-w-[180px] text-xs">{p.name}</span>
                              {p.badge && <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">{p.badge}</span>}</div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-muted-foreground max-w-[100px] truncate" title={p.id}>{p.id.slice(-8).toUpperCase()}</td>
                          <td className="py-3 px-3"><span className="text-xs px-2 py-1 rounded-lg bg-secondary text-body">{p.category}</span></td>
                          <td className="py-3 px-3"><span className="font-semibold text-primary text-xs">${p.price}</span>{p.oldPrice && <span className="block text-[10px] text-muted-foreground line-through">${p.oldPrice}</span>}</td>
                          <td className="py-3 px-3"><div className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span className="text-xs">{p.rating}</span></div></td>
                          <td className="py-3 px-3"><span className="text-xs text-body">{p.stock ?? "—"}</span><span className={`ml-1 text-[10px] font-semibold px-2 py-1 rounded-full ${p.inStock ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>{p.inStock ? "OK" : "Out"}</span></td>
                          <td className="py-3 px-3"><div className="flex gap-1">
                            <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                            <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><Edit className="w-3.5 h-3.5 text-muted-foreground" /></button>
                            <button className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                          </div></td>
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
                {[
                  { label: "Total Customers", value: "3,291", icon: Users, color: "bg-primary/10 text-primary" },
                  { label: "Active", value: "2,847", icon: UserCheck, color: "bg-primary/10 text-primary" },
                  { label: "VIP Members", value: "156", icon: Star, color: "bg-violet-100 text-violet-600" },
                  { label: "New This Month", value: "89", icon: TrendingUp, color: "bg-blue-100 text-blue-600" },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl p-4 card-hover">
                    <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-2`}><s.icon className="w-4 h-4" /></div>
                    <p className="text-xl font-heading font-bold text-heading">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p>
                  </motion.div>
                ))}
              </div>
              <div className="bg-card rounded-2xl p-6 card-hover">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                  <h3 className="font-heading font-semibold">Customer Management</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search customers..." className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 w-48" /></div>
                    <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors"><Download className="w-3 h-3" /> Export</button>
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
                      {filteredCustomers.map(c => (
                        <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                          <td className="py-3 px-3"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{c.avatar}</div><div><p className="font-medium text-heading text-xs">{c.name}</p><p className="text-[10px] text-muted-foreground">{c.email}</p></div></div></td>
                          <td className="py-3 px-3 text-xs text-body">{c.phone}</td>
                          <td className="py-3 px-3 text-xs font-semibold text-heading">{c.orders}</td>
                          <td className="py-3 px-3 text-xs font-semibold text-primary">{c.spent}</td>
                          <td className="py-3 px-3 text-xs text-muted-foreground">{c.joined}</td>
                          <td className="py-3 px-3"><span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${statusStyle(c.status)}`}>{c.status}</span></td>
                          <td className="py-3 px-3"><div className="flex gap-1"><button className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button><button className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><Mail className="w-3.5 h-3.5 text-muted-foreground" /></button></div></td>
                        </tr>
                      ))}
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
                  { icon: BarChart3, title: "Conversion Rate", value: "3.24%", change: "+0.5%", desc: "Visitor to buyer ratio", up: true },
                  { icon: PieChart, title: "Avg. Order Value", value: "$72.40", change: "+$4.20", desc: "Per transaction average", up: true },
                  { icon: Activity, title: "Customer Retention", value: "68.5%", change: "+2.1%", desc: "Returning customers", up: true },
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
                  <h3 className="font-heading font-semibold mb-6">Monthly Revenue Trend</h3>
                  <div className="flex items-end gap-2 h-56">
                    {[28, 42, 35, 58, 45, 52, 38, 65, 48, 72, 55, 68].map((v, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <motion.div initial={{ height: 0 }} animate={{ height: `${v}%` }} transition={{ duration: 0.6, delay: i * 0.05 }}
                          className="w-full rounded-lg bg-gradient-to-t from-primary to-primary/50 min-h-[4px] cursor-pointer hover:from-primary/80 hover:to-primary/40 transition-colors relative group">
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-heading text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">${(v * 710).toLocaleString()}</div>
                        </motion.div>
                        <span className="text-[9px] text-muted-foreground">{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card rounded-2xl p-6 card-hover">
                  <h3 className="font-heading font-semibold mb-6">Traffic Sources</h3>
                  <div className="space-y-4">
                    {[
                      { source: "Organic Search", visitors: "12,450", percent: 42, color: "bg-primary" },
                      { source: "Social Media", visitors: "8,230", percent: 28, color: "bg-blue-500" },
                      { source: "Direct", visitors: "5,120", percent: 17, color: "bg-violet-500" },
                      { source: "Referral", visitors: "2,340", percent: 8, color: "bg-amber-500" },
                      { source: "Email", visitors: "1,470", percent: 5, color: "bg-rose-500" },
                    ].map(s => (
                      <div key={s.source}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${s.color}`} /><span className="text-heading font-medium text-xs">{s.source}</span></div>
                          <span className="text-xs font-semibold text-muted-foreground">{s.percent}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${s.percent}%` }} transition={{ duration: 0.8 }} className={`h-full rounded-full ${s.color}`} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card rounded-2xl p-6 card-hover">
                  <h3 className="font-heading font-semibold mb-6">Store Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "Store Name", value: "ShopVert", icon: Globe },
                      { label: "Contact Email", value: "admin@shopvert.com", icon: Mail },
                      { label: "Phone", value: "+1 (555) 123-4567", icon: Phone },
                      { label: "Address", value: "123 Commerce St, NYC", icon: MapPin },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5"><f.icon className="w-3.5 h-3.5" />{f.label}</label>
                        <input defaultValue={f.value} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                    ))}
                  </div>
                  <button className="btn-gradient mt-4 text-sm">Save Changes</button>
                </div>
                <div className="bg-card rounded-2xl p-6 card-hover">
                  <h3 className="font-heading font-semibold mb-6">Shipping & Delivery</h3>
                  <div className="space-y-4">
                    {[
                      { label: "Standard Shipping", price: "$4.99", time: "5-7 business days", active: true },
                      { label: "Express Shipping", price: "$12.99", time: "2-3 business days", active: true },
                      { label: "Overnight Shipping", price: "$24.99", time: "Next business day", active: false },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                        <div className="flex items-center gap-3"><Truck className="w-5 h-5 text-primary" /><div><p className="text-sm font-medium text-heading">{s.label}</p><p className="text-xs text-muted-foreground">{s.time}</p></div></div>
                        <div className="flex items-center gap-3"><span className="text-sm font-semibold">{s.price}</span>
                          <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${s.active ? "bg-primary" : "bg-muted"}`}><div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${s.active ? "translate-x-5" : "translate-x-0.5"}`} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card rounded-2xl p-6 card-hover">
                  <h3 className="font-heading font-semibold mb-6">Payment Methods</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Credit/Debit Card", icon: CreditCard, active: true },
                      { name: "PayPal", icon: Globe, active: true },
                      { name: "Digital Wallet", icon: Shield, active: false },
                      { name: "Cash on Delivery", icon: DollarSign, active: true },
                    ].map(p => (
                      <div key={p.name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                        <div className="flex items-center gap-3"><p.icon className="w-4 h-4 text-primary" /><span className="text-sm font-medium text-heading">{p.name}</span></div>
                        <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${p.active ? "bg-primary" : "bg-muted"}`}><div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${p.active ? "translate-x-5" : "translate-x-0.5"}`} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-card rounded-2xl p-6 card-hover">
                  <h3 className="font-heading font-semibold mb-4">Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Order notifications", checked: true },
                      { label: "Low stock alerts", checked: true },
                      { label: "Customer reviews", checked: false },
                      { label: "Marketing reports", checked: true },
                      { label: "Security alerts", checked: true },
                    ].map(n => (
                      <label key={n.label} className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm text-body group-hover:text-heading transition-colors">{n.label}</span>
                        <input type="checkbox" defaultChecked={n.checked} className="w-4 h-4 accent-primary rounded" />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="bg-card rounded-2xl p-6 card-hover">
                  <h3 className="font-heading font-semibold mb-4">Tax Settings</h3>
                  <div className="space-y-3">
                    <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tax Rate (%)</label><input defaultValue="8.25" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" defaultChecked className="w-4 h-4 accent-primary rounded" /><span className="text-sm text-body">Include tax in price</span></label>
                  </div>
                </div>
                <div className="bg-destructive/5 rounded-2xl p-6 border border-destructive/20">
                  <h3 className="font-heading font-semibold mb-2 text-destructive">Danger Zone</h3>
                  <p className="text-xs text-muted-foreground mb-4">These actions cannot be undone.</p>
                  <div className="space-y-2">
                    <button className="w-full text-xs px-4 py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors font-medium">Reset Store Data</button>
                    <button className="w-full text-xs px-4 py-2.5 rounded-xl bg-destructive text-primary-foreground hover:bg-destructive/90 transition-colors font-medium">Delete Store</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setSelectedOrder(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-card rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto" style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>
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
                  <button className="flex-1 text-xs px-4 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors font-medium">Print Invoice</button>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setShowAddProduct(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-card rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto" style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading font-semibold">Add New Product</h3>
                <button type="button" onClick={() => setShowAddProduct(false)} className="p-2 rounded-xl hover:bg-secondary transition-colors"><X className="w-4 h-4" /></button>
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
                    const res = await createProductWithImage(fd, token);
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      toast.error(typeof data.message === "string" ? data.message : "Failed to create product");
                      return;
                    }
                    toast.success("Product created");
                    queryClient.invalidateQueries({ queryKey: productsQueryKey });
                    setShowAddProduct(false);
                    setNewName("");
                    setNewPrice("");
                    setNewOldPrice("");
                    setNewCategory("");
                    setNewDescription("");
                    setNewStock("0");
                    setNewImage(null);
                    if (imageInputRef.current) imageInputRef.current.value = "";
                  } catch {
                    toast.error("Network error");
                  } finally {
                    setProductSubmitting(false);
                  }
                }}
              >
                <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Product Name</label><input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Enter product name" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Price ($)</label><input required type="number" step="0.01" min="0" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Old Price ($)</label><input type="number" step="0.01" min="0" value={newOldPrice} onChange={(e) => setNewOldPrice(e.target.value)} placeholder="Optional" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
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
                  <button type="submit" disabled={productSubmitting} className="btn-gradient text-sm flex-1 disabled:opacity-60">{productSubmitting ? "Saving…" : "Add Product"}</button>
                  <button type="button" onClick={() => setShowAddProduct(false)} className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors font-medium">Cancel</button>
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
