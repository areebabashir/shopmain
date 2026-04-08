import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Package, Heart, MapPin, Settings, LogOut, Menu,
  ChevronLeft, ChevronRight, Home, ShoppingBag, Bell,
  Edit, Eye, Truck, Clock, CheckCircle, Star, Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Product } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchMyOrders,
  fetchProducts,
  productsQueryKey,
  userInitials,
  mediaUrl,
  type OrderLineItem,
  type NotificationPrefs,
  updateUserProfile,
  changeUserPassword,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultUserAddress,
  updateUserNotifications,
  deleteUserAccount,
} from "@/lib/api";
import { formatPkr } from "@/lib/money";
import { toast } from "sonner";

const sidebarNav = [
  { id: "profile", icon: User, label: "My Profile" },
  { id: "orders", icon: Package, label: "My Orders" },
  { id: "wishlist", icon: Heart, label: "Wishlist" },
  { id: "addresses", icon: MapPin, label: "Addresses" },
  { id: "settings", icon: Settings, label: "Settings" },
];

function orderLineToProduct(line: OrderLineItem): Product {
  return {
    id: line.productId,
    name: line.name,
    price: line.unitPrice,
    image: mediaUrl(line.image || ""),
    rating: 0,
    reviews: 0,
    category: "General",
    description: "",
    specs: {},
    inStock: true,
  };
}

const defaultNotif: NotificationPrefs = {
  orderUpdates: true,
  promotional: false,
  newProducts: true,
  priceDrops: true,
};

const statusColor = (s: string) => {
  if (s === "Delivered") return "bg-primary/10 text-primary";
  if (s === "In Transit") return "bg-blue-100 text-blue-600";
  return "bg-amber-100 text-amber-700";
};

const statusIcon = (s: string) => {
  if (s === "Delivered") return CheckCircle;
  if (s === "In Transit") return Truck;
  return Clock;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout, refreshUser } = useAuth();
  const [active, setActive] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { wishlist, addToCart } = useCart();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdBusy, setPwdBusy] = useState(false);
  const [notif, setNotif] = useState<NotificationPrefs>(defaultNotif);
  const [notifBusy, setNotifBusy] = useState(false);
  const [deletePwd, setDeletePwd] = useState("");
  const [addrForm, setAddrForm] = useState<{
    open: boolean;
    editId: string | null;
    label: string;
    name: string;
    address: string;
    city: string;
    zip: string;
    phone: string;
    isDefault: boolean;
  }>({ open: false, editId: null, label: "Home", name: "", address: "", city: "", zip: "", phone: "", isDefault: false });
  const [addrBusy, setAddrBusy] = useState(false);

  useEffect(() => {
    if (user?.name != null) setProfileName(user.name);
  }, [user?.name]);

  useEffect(() => {
    if (user?.notificationPrefs) setNotif({ ...defaultNotif, ...user.notificationPrefs });
  }, [user?.notificationPrefs]);
  const { data: catalog = [] } = useQuery({
    queryKey: productsQueryKey,
    queryFn: fetchProducts,
  });
  const wishedProducts = catalog.filter((p) => wishlist.includes(p.id));

  const { data: orders = [], isLoading: ordersLoading, isError: ordersError } = useQuery({
    queryKey: ["myOrders", token],
    queryFn: () => fetchMyOrders(token!),
    enabled: Boolean(token),
  });

  const orderCount = orders.length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;
  const transitCount = orders.filter((o) => o.status === "In Transit").length;
  const processingCount = orders.filter((o) => o.status === "Processing").length;
  const addresses = user?.addresses ?? [];
  const addressCount = addresses.length;
  const activityBellCount = processingCount + orders.filter((o) => o.status === "In Transit").length;

  const initials = user ? userInitials(user.name) : "?";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const saveProfile = async () => {
    if (!token || !profileName.trim()) return;
    setSavingProfile(true);
    try {
      await updateUserProfile(profileName.trim(), token);
      await refreshUser();
      toast.success("Profile updated");
      setEditingProfile(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async () => {
    if (!token) return;
    if (pwd.next !== pwd.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setPwdBusy(true);
    try {
      await changeUserPassword(pwd.current, pwd.next, token);
      toast.success("Password updated");
      setPwd({ current: "", next: "", confirm: "" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change password");
    } finally {
      setPwdBusy(false);
    }
  };

  const saveNotifications = async () => {
    if (!token) return;
    setNotifBusy(true);
    try {
      const updated = await updateUserNotifications(notif, token);
      if (updated?.notificationPrefs) {
        setNotif({ ...defaultNotif, ...updated.notificationPrefs });
      }
      await refreshUser();
      toast.success("Preferences saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setNotifBusy(false);
    }
  };

  const submitAddress = async () => {
    if (!token) return;
    const { label, name, address, city, zip, phone, isDefault, editId } = addrForm;
    if (!name.trim() || !address.trim() || !city.trim()) {
      toast.error("Name, address and city are required");
      return;
    }
    setAddrBusy(true);
    try {
      if (editId) {
        await updateUserAddress(
          editId,
          { label, name: name.trim(), address: address.trim(), city: city.trim(), zip, phone, isDefault },
          token
        );
        toast.success("Address updated");
      } else {
        await addUserAddress(
          { label, name: name.trim(), address: address.trim(), city: city.trim(), zip, phone, isDefault },
          token
        );
        toast.success("Address saved");
      }
      await refreshUser();
      setAddrForm((f) => ({ ...f, open: false, editId: null }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save address");
    } finally {
      setAddrBusy(false);
    }
  };

  const openAddAddress = () => {
    setAddrForm({
      open: true,
      editId: null,
      label: "Home",
      name: user?.name ?? "",
      address: "",
      city: "",
      zip: "",
      phone: "",
      isDefault: addressCount === 0,
    });
  };

  const openEditAddress = (a: (typeof addresses)[0]) => {
    setAddrForm({
      open: true,
      editId: a.id,
      label: a.label,
      name: a.name,
      address: a.address,
      city: a.city,
      zip: a.zip,
      phone: a.phone,
      isDefault: a.isDefault,
    });
  };

  const handleDeleteAddress = async (id: string) => {
    if (!token || !window.confirm("Remove this address?")) return;
    try {
      await deleteUserAddress(id, token);
      await refreshUser();
      toast.success("Address removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!token) return;
    try {
      await setDefaultUserAddress(id, token);
      await refreshUser();
      toast.success("Default address updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    }
  };

  const handleReorder = (lines: OrderLineItem[] | undefined) => {
    if (!lines?.length) return;
    lines.forEach((line) => addToCart(orderLineToProduct(line), line.quantity));
    toast.success("Items added to cart");
    navigate("/cart");
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    if (!deletePwd) {
      toast.error("Enter your password to confirm");
      return;
    }
    if (!window.confirm("Permanently delete your account? This cannot be undone.")) return;
    try {
      await deleteUserAccount(deletePwd, token);
      toast.success("Account deleted");
      logout();
      navigate("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete account");
    }
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* User Card */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">{initials}</span>
          </div>
          {(sidebarOpen || mobile) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
              <p className="font-heading font-semibold text-heading text-sm truncate">{user?.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </motion.div>
          )}
          {!mobile && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors hidden md:flex ml-auto shrink-0">
              <ChevronLeft className={`w-4 h-4 text-muted-foreground transition-transform ${!sidebarOpen ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        <p className={`text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2 ${!sidebarOpen && !mobile ? "sr-only" : ""}`}>Account</p>
        {sidebarNav.map(item => (
          <button
            key={item.id}
            onClick={() => { setActive(item.id); if (mobile) setMobileSidebarOpen(false); }}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all ${
              active === item.id
                ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20"
                : "text-body hover:bg-secondary hover:text-heading"
            } ${!sidebarOpen && !mobile ? "justify-center" : ""}`}
            title={!sidebarOpen && !mobile ? item.label : undefined}
          >
            <item.icon className="w-4.5 h-4.5 shrink-0" />
            {(sidebarOpen || mobile) && <span>{item.label}</span>}
            {(sidebarOpen || mobile) && active === item.id && (
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
                <h1 className="text-lg font-heading font-bold text-heading capitalize">{sidebarNav.find(n => n.id === active)?.label || "Dashboard"}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Manage your account</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/cart" className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors">
                <ShoppingBag className="w-4 h-4 text-body" />
              </Link>
              <button
                type="button"
                title="Active orders"
                onClick={() => setActive("orders")}
                className="relative p-2 rounded-xl border border-border hover:bg-secondary transition-colors"
              >
                <Bell className="w-4 h-4 text-body" />
                {activityBellCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-0.5 rounded-full bg-destructive text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                    {activityBellCount > 9 ? "9+" : activityBellCount}
                  </span>
                )}
              </button>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary ml-1">{initials}</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {/* Profile */}
          {active === "profile" && (
            <div className="space-y-6 max-w-3xl">
              {/* Profile Header Card */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl overflow-hidden card-hover">
                <div className="h-24 bg-gradient-to-r from-primary to-primary/60" />
                <div className="px-6 pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-8">
                    <div className="w-20 h-20 rounded-2xl bg-card border-4 border-card flex items-center justify-center shadow-lg">
                      <span className="text-2xl font-heading font-bold text-primary">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingProfile ? (
                        <input
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full max-w-xs px-3 py-2 rounded-xl border border-border bg-background text-sm font-heading font-bold text-heading"
                        />
                      ) : (
                        <h2 className="font-heading font-bold text-lg text-heading truncate">{user?.name}</h2>
                      )}
                      <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    {editingProfile ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={savingProfile}
                          onClick={saveProfile}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                        >
                          {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProfile(false);
                            setProfileName(user?.name ?? "");
                          }}
                          className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingProfile(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors text-sm font-medium shrink-0"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Profile
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total Orders", value: String(orderCount), icon: Package, color: "bg-primary/10 text-primary" },
                  { label: "Wishlist", value: String(wishedProducts.length), icon: Heart, color: "bg-rose-100 text-rose-600" },
                  { label: "Addresses", value: String(addressCount), icon: MapPin, color: "bg-blue-100 text-blue-600" },
                  { label: "Role", value: user?.role === "admin" ? "Admin" : "Member", icon: Star, color: "bg-amber-100 text-amber-600" },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl p-4 card-hover text-center">
                    <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}><s.icon className="w-5 h-5" /></div>
                    <p className="text-xl font-heading font-bold text-heading">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Profile Form */}
              <div className="bg-card rounded-2xl p-6 card-hover">
                <h3 className="font-heading font-semibold mb-6">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { l: "Full Name", v: user?.name ?? "" },
                    { l: "Email", v: user?.email ?? "" },
                    { l: "Account role", v: user?.role === "admin" ? "Administrator" : "Customer" },
                  ].map((f) => (
                    <div key={f.l}>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{f.l}</label>
                      <input readOnly value={f.v} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm" />
                    </div>
                  ))}
                  <p className="sm:col-span-2 text-xs text-muted-foreground">Use Edit Profile above to change your display name.</p>
                </div>
                {user?.role === "admin" && (
                  <Link to="/admin" className="btn-gradient mt-6 text-sm inline-block text-center">
                    Open admin dashboard
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Orders */}
          {active === "orders" && (
            <div className="space-y-6">
              {/* Order Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Orders", value: String(orderCount), icon: Package, color: "bg-primary/10 text-primary" },
                  { label: "Delivered", value: String(deliveredCount), icon: CheckCircle, color: "bg-primary/10 text-primary" },
                  { label: "In Transit", value: String(transitCount), icon: Truck, color: "bg-blue-100 text-blue-600" },
                  { label: "Processing", value: String(processingCount), icon: Clock, color: "bg-amber-100 text-amber-600" },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl p-4 card-hover">
                    <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-2`}><s.icon className="w-4 h-4" /></div>
                    <p className="text-xl font-heading font-bold text-heading">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Order List */}
              <div className="space-y-4">
                {ordersLoading && <p className="text-sm text-muted-foreground">Loading orders…</p>}
                {ordersError && <p className="text-sm text-destructive">Could not load orders.</p>}
                {!ordersLoading && !ordersError && orders.length === 0 && (
                  <p className="text-sm text-muted-foreground">No orders yet. Browse the store and checkout to see them here.</p>
                )}
                {orders.map((o, i) => {
                  const Icon = statusIcon(o.status);
                  return (
                    <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-card rounded-2xl p-5 card-hover">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-mono text-sm font-semibold text-heading">{o.id.slice(0, 8)}…</p>
                            <p className="text-xs text-muted-foreground">{o.product} · {o.items} item(s)</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{o.date} · {o.payment}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-3 py-1 rounded-full ${statusColor(o.status)}`}>
                            <Icon className="w-3 h-3" />{o.status}
                          </span>
                          <span className="font-heading font-bold text-sm text-heading">{formatPkr(Number(o.total))}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                        <button
                          type="button"
                          onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}
                          className="text-xs px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors font-medium flex items-center gap-1.5"
                        >
                          <Eye className="w-3 h-3" />
                          {expandedOrderId === o.id ? "Hide Details" : "View Details"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorder(o.itemsDetail)}
                          className="text-xs px-4 py-2 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 transition-colors font-medium"
                        >
                          Reorder
                        </button>
                      </div>
                      {expandedOrderId === o.id && (
                        <div className="mt-4 pt-4 border-t border-border space-y-3 text-sm">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Items</p>
                          <ul className="space-y-2">
                            {(o.itemsDetail ?? []).map((line) => (
                              <li key={`${line.productId}-${line.name}`} className="flex justify-between gap-2 text-body">
                                <span className="min-w-0">
                                  {line.name} × {line.quantity}
                                </span>
                                <span className="shrink-0 font-medium text-heading">{formatPkr(line.unitPrice * line.quantity)}</span>
                              </li>
                            ))}
                          </ul>
                          {o.shippingAddress && (o.shippingAddress.address || o.shippingAddress.city) && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Ship to</p>
                              <p className="text-body text-xs leading-relaxed">
                                {[o.shippingAddress.name, o.shippingAddress.phone, o.shippingAddress.address, o.shippingAddress.city, o.shippingAddress.zip]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Wishlist */}
          {active === "wishlist" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading font-semibold">My Wishlist ({wishedProducts.length})</h2>
              </div>
              {wishedProducts.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl p-12 text-center card-hover">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-heading font-semibold text-heading mb-2">Your wishlist is empty</p>
                  <p className="text-sm text-muted-foreground mb-4">Browse products and add your favorites here.</p>
                  <Link to="/products" className="btn-gradient text-sm">Browse Products</Link>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishedProducts.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Link to={`/product/${p.id}`} className="bg-card rounded-2xl p-4 card-hover flex gap-4 group">
                        <img src={p.image} alt={p.name} className="w-20 h-20 rounded-xl object-cover group-hover:scale-105 transition-transform" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-heading line-clamp-2 group-hover:text-primary transition-colors">{p.name}</p>
                          <p className="text-primary font-bold text-sm mt-1">{formatPkr(p.price)}</p>
                          {p.oldPrice != null && <p className="text-xs text-muted-foreground line-through">{formatPkr(p.oldPrice)}</p>}
                          <div className="flex items-center gap-1 mt-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span className="text-xs text-muted-foreground">{p.rating}</span></div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Addresses */}
          {active === "addresses" && (
            <div className="space-y-6 max-w-3xl">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="font-heading font-semibold">Saved Addresses</h2>
                <button type="button" onClick={openAddAddress} className="btn-gradient text-xs flex items-center gap-1.5 !py-2 !px-4">
                  <MapPin className="w-3.5 h-3.5" /> Add Address
                </button>
              </div>

              {addrForm.open && (
                <div className="bg-card rounded-2xl p-5 border border-border space-y-3">
                  <h3 className="font-heading font-semibold text-sm">{addrForm.editId ? "Edit address" : "New address"}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Label</label>
                      <input
                        value={addrForm.label}
                        onChange={(e) => setAddrForm((f) => ({ ...f, label: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Full name</label>
                      <input
                        value={addrForm.name}
                        onChange={(e) => setAddrForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted-foreground block mb-1">Street address</label>
                      <input
                        value={addrForm.address}
                        onChange={(e) => setAddrForm((f) => ({ ...f, address: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">City</label>
                      <input
                        value={addrForm.city}
                        onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Postal code</label>
                      <input
                        value={addrForm.zip}
                        onChange={(e) => setAddrForm((f) => ({ ...f, zip: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted-foreground block mb-1">Phone</label>
                      <input
                        value={addrForm.phone}
                        onChange={(e) => setAddrForm((f) => ({ ...f, phone: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                      />
                    </div>
                    <label className="sm:col-span-2 flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addrForm.isDefault}
                        onChange={(e) => setAddrForm((f) => ({ ...f, isDefault: e.target.checked }))}
                        className="accent-primary rounded"
                      />
                      Set as default shipping address
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      disabled={addrBusy}
                      onClick={submitAddress}
                      className="btn-gradient text-xs !py-2 !px-4 disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      {addrBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddrForm((f) => ({ ...f, open: false, editId: null }))}
                      className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr, i) => (
                  <motion.div
                    key={addr.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`bg-card rounded-2xl p-5 card-hover relative ${addr.isDefault ? "border-2 border-primary" : ""}`}
                  >
                    {addr.isDefault && (
                      <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Default</span>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-heading font-semibold text-sm text-heading">{addr.label}</span>
                    </div>
                    <div className="space-y-1 text-sm text-body">
                      <p className="font-medium text-heading">{addr.name}</p>
                      <p>{addr.address}</p>
                      <p>{addr.city}{addr.zip ? `, ${addr.zip}` : ""}</p>
                      {addr.phone ? <p className="text-muted-foreground text-xs">{addr.phone}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border">
                      <button
                        type="button"
                        onClick={() => openEditAddress(addr)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors font-medium flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/5 transition-colors font-medium"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(0.05 * addresses.length, 0.3) }}
                  role="button"
                  tabIndex={0}
                  onClick={openAddAddress}
                  onKeyDown={(e) => e.key === "Enter" && openAddAddress()}
                  className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  <MapPin className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Add New Address</p>
                </motion.div>
              </div>
              {addresses.length === 0 && !addrForm.open && (
                <p className="text-sm text-muted-foreground">No saved addresses yet. Add one for faster checkout.</p>
              )}
            </div>
          )}

          {/* Settings */}
          {active === "settings" && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-card rounded-2xl p-6 card-hover">
                <h3 className="font-heading font-semibold mb-6">Account Settings</h3>
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Change Password</label>
                    <div className="space-y-3">
                      <input
                        type="password"
                        value={pwd.current}
                        onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
                        placeholder="Current password"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <input
                        type="password"
                        value={pwd.next}
                        onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
                        placeholder="New password (min 6 characters)"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <input
                        type="password"
                        value={pwd.confirm}
                        onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                        placeholder="Confirm new password"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={pwdBusy}
                      onClick={submitPassword}
                      className="btn-gradient mt-3 text-sm disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {pwdBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Update Password
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 card-hover">
                <h3 className="font-heading font-semibold mb-6">Notification Preferences</h3>
                <div className="space-y-4">
                  {(
                    [
                      { key: "orderUpdates" as const, label: "Order updates via email", desc: "Receive emails about your order status" },
                      { key: "promotional" as const, label: "Promotional emails", desc: "Get deals, offers and discounts" },
                      { key: "newProducts" as const, label: "New product alerts", desc: "Be notified about new arrivals" },
                      { key: "priceDrops" as const, label: "Price drop alerts", desc: "Get notified when wishlist items go on sale" },
                    ] as const
                  ).map((n) => (
                    <label key={n.key} className="flex items-start justify-between gap-4 cursor-pointer group p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                      <div>
                        <span className="text-sm font-medium text-heading group-hover:text-primary transition-colors">{n.label}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notif[n.key]}
                        onChange={(e) => setNotif((p) => ({ ...p, [n.key]: e.target.checked }))}
                        className="w-4 h-4 accent-primary rounded mt-0.5"
                      />
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={notifBusy}
                  onClick={saveNotifications}
                  className="btn-gradient mt-4 text-sm disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {notifBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Settings
                </button>
              </div>

              <div className="bg-destructive/5 rounded-2xl p-6 border border-destructive/20">
                <h3 className="font-heading font-semibold mb-2 text-destructive">Delete Account</h3>
                <p className="text-xs text-muted-foreground mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <input
                  type="password"
                  value={deletePwd}
                  onChange={(e) => setDeletePwd(e.target.value)}
                  placeholder="Enter password to confirm"
                  className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-border bg-background text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-destructive/30"
                />
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="text-xs px-4 py-2.5 rounded-xl bg-destructive text-primary-foreground hover:bg-destructive/90 transition-colors font-medium"
                >
                  Delete My Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
