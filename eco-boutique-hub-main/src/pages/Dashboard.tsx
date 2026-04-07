import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Package, Heart, MapPin, Settings, LogOut, Menu,
  ChevronLeft, ChevronRight, Home, ShoppingBag, Bell,
  Edit, Eye, Truck, Clock, CheckCircle, CreditCard, Star
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyOrders, fetchProducts, productsQueryKey, userInitials } from "@/lib/api";

const sidebarNav = [
  { id: "profile", icon: User, label: "My Profile" },
  { id: "orders", icon: Package, label: "My Orders" },
  { id: "wishlist", icon: Heart, label: "Wishlist" },
  { id: "addresses", icon: MapPin, label: "Addresses" },
  { id: "settings", icon: Settings, label: "Settings" },
];

const mockAddresses = [
  { id: 1, label: "Home", name: "John Doe", address: "123 Main Street, Apt 4B", city: "New York, NY 10001", phone: "+1 234 567 890", isDefault: true },
  { id: 2, label: "Office", name: "John Doe", address: "456 Business Ave, Floor 12", city: "New York, NY 10018", phone: "+1 234 567 891", isDefault: false },
];

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
  const { user, token, logout } = useAuth();
  const [active, setActive] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { wishlist } = useCart();
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

  const initials = user ? userInitials(user.name) : "?";

  const handleLogout = () => {
    logout();
    navigate("/");
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
              <button className="relative p-2 rounded-xl border border-border hover:bg-secondary transition-colors">
                <Bell className="w-4 h-4 text-body" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-primary-foreground text-[9px] font-bold flex items-center justify-center">2</span>
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
                    <div className="flex-1">
                      <h2 className="font-heading font-bold text-lg text-heading">{user?.name}</h2>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors text-sm font-medium">
                      <Edit className="w-3.5 h-3.5" /> Edit Profile
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total Orders", value: String(orderCount), icon: Package, color: "bg-primary/10 text-primary" },
                  { label: "Wishlist", value: String(wishedProducts.length), icon: Heart, color: "bg-rose-100 text-rose-600" },
                  { label: "Addresses", value: String(mockAddresses.length), icon: MapPin, color: "bg-blue-100 text-blue-600" },
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
                          <span className="font-heading font-bold text-sm text-heading">${Number(o.total).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                        <button type="button" className="text-xs px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors font-medium flex items-center gap-1.5"><Eye className="w-3 h-3" />View Details</button>
                        {o.status === "Delivered" && <button type="button" className="text-xs px-4 py-2 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 transition-colors font-medium">Reorder</button>}
                        {o.status === "In Transit" && <button type="button" className="text-xs px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium flex items-center gap-1.5"><Truck className="w-3 h-3" />Track Order</button>}
                      </div>
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
                          <p className="text-primary font-bold text-sm mt-1">${p.price}</p>
                          {p.oldPrice && <p className="text-xs text-muted-foreground line-through">${p.oldPrice}</p>}
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
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold">Saved Addresses</h2>
                <button className="btn-gradient text-xs flex items-center gap-1.5 !py-2 !px-4">
                  <MapPin className="w-3.5 h-3.5" /> Add Address
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mockAddresses.map((addr, i) => (
                  <motion.div key={addr.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`bg-card rounded-2xl p-5 card-hover relative ${addr.isDefault ? "border-2 border-primary" : ""}`}>
                    {addr.isDefault && (
                      <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Default</span>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><MapPin className="w-4 h-4 text-primary" /></div>
                      <span className="font-heading font-semibold text-sm text-heading">{addr.label}</span>
                    </div>
                    <div className="space-y-1 text-sm text-body">
                      <p className="font-medium text-heading">{addr.name}</p>
                      <p>{addr.address}</p>
                      <p>{addr.city}</p>
                      <p className="text-muted-foreground text-xs">{addr.phone}</p>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                      <button className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors font-medium flex items-center gap-1"><Edit className="w-3 h-3" />Edit</button>
                      {!addr.isDefault && <button className="text-xs px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/5 transition-colors font-medium">Set Default</button>}
                    </div>
                  </motion.div>
                ))}
                {/* Add New Card */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all">
                  <MapPin className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Add New Address</p>
                </motion.div>
              </div>
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
                      <input type="password" placeholder="Current password" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <input type="password" placeholder="New password" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <input type="password" placeholder="Confirm new password" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <button className="btn-gradient mt-3 text-sm">Update Password</button>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 card-hover">
                <h3 className="font-heading font-semibold mb-6">Notification Preferences</h3>
                <div className="space-y-4">
                  {[
                    { label: "Order updates via email", desc: "Receive emails about your order status", checked: true },
                    { label: "Promotional emails", desc: "Get deals, offers and discounts", checked: false },
                    { label: "New product alerts", desc: "Be notified about new arrivals", checked: true },
                    { label: "Price drop alerts", desc: "Get notified when wishlist items go on sale", checked: true },
                  ].map(n => (
                    <label key={n.label} className="flex items-start justify-between gap-4 cursor-pointer group p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                      <div>
                        <span className="text-sm font-medium text-heading group-hover:text-primary transition-colors">{n.label}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                      </div>
                      <input type="checkbox" defaultChecked={n.checked} className="w-4 h-4 accent-primary rounded mt-0.5" />
                    </label>
                  ))}
                </div>
                <button className="btn-gradient mt-4 text-sm">Save Settings</button>
              </div>

              <div className="bg-destructive/5 rounded-2xl p-6 border border-destructive/20">
                <h3 className="font-heading font-semibold mb-2 text-destructive">Delete Account</h3>
                <p className="text-xs text-muted-foreground mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <button className="text-xs px-4 py-2.5 rounded-xl bg-destructive text-primary-foreground hover:bg-destructive/90 transition-colors font-medium">Delete My Account</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
