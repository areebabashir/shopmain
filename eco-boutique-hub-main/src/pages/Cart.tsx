import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatPkr } from "@/lib/money";
import { computeShippingPkr } from "@/lib/storeSettings";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";
import { motion } from "framer-motion";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, totalPrice } = useCart();
  const { settings } = useStoreSettings();
  const shipping = computeShippingPkr(totalPrice, "standard", settings).totalShipping;

  if (items.length === 0)
    return (
      <div className="container-main section-padding text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-heading font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="btn-gradient inline-block">Start Shopping</Link>
      </div>
    );

  return (
    <div className="container-main section-padding">
      <h1 className="text-2xl font-heading font-bold mb-8">Shopping Cart ({items.length})</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, i) => (
            <motion.div key={item.product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex gap-4 bg-card rounded-2xl p-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <Link to={`/product/${item.product.id}`} className="shrink-0">
                <img src={item.product.image} alt={item.product.name} className="w-24 h-24 rounded-xl object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.product.id}`} className="font-medium text-sm text-heading hover:text-primary transition-colors line-clamp-2">{item.product.name}</Link>
                <p className="text-primary font-heading font-bold mt-1">{formatPkr(item.product.price)}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-border rounded-lg">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1.5 hover:bg-secondary rounded-l-lg"><Minus className="w-3 h-3" /></button>
                    <span className="px-3 text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1.5 hover:bg-secondary rounded-r-lg"><Plus className="w-3 h-3" /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-card rounded-2xl p-6 h-fit sticky top-20" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="font-heading font-semibold mb-4">Order Summary</h3>
          <div className="space-y-3 text-sm mb-4">
            <div className="flex justify-between"><span className="text-body">Subtotal</span><span className="font-medium">{formatPkr(totalPrice)}</span></div>
            <div className="flex justify-between"><span className="text-body">Shipping (est.)</span><span className="font-medium">{shipping === 0 ? "Free" : formatPkr(shipping)}</span></div>
            {shipping === 0 && <p className="text-xs text-primary">Free standard shipping on this cart total.</p>}
          </div>
          <div className="border-t border-border pt-3 mb-6">
            <div className="flex justify-between font-heading font-bold"><span>Total (PKR)</span><span className="text-primary">{formatPkr(totalPrice + shipping)}</span></div>
          </div>
          <Link to="/checkout" className="btn-gradient block text-center w-full">Proceed to Checkout</Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
