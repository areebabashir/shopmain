import { Link, useLocation } from "react-router-dom";
import { Home, Grid3X3, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const MobileNav = () => {
  const { totalItems } = useCart();
  const { pathname } = useLocation();
  const items = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/products", icon: Grid3X3, label: "Shop" },
    { to: "/cart", icon: ShoppingCart, label: "Cart", badge: totalItems },
    { to: "/dashboard", icon: User, label: "Account" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex justify-around py-2">
        {items.map((item) => {
          const active = pathname === item.to;
          return (
            <Link key={item.to} to={item.to} className={`flex flex-col items-center gap-0.5 px-3 py-1 relative ${active ? "text-primary" : "text-muted-foreground"}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.badge ? (
                <span className="absolute -top-0.5 right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">{item.badge}</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
