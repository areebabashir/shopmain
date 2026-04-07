import { Link } from "react-router-dom";
import { CheckCircle, Package, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

const OrderSuccess = () => {
  const orderId = `SV-${Date.now().toString(36).toUpperCase()}`;

  return (
    <div className="container-main section-padding flex items-center justify-center min-h-[60vh]">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
          <CheckCircle className="w-20 h-20 text-primary mx-auto mb-6" />
        </motion.div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold mb-3">Order Placed Successfully!</h1>
        <p className="text-body mb-2">Thank you for your purchase. Your order has been confirmed.</p>
        <p className="text-sm text-muted-foreground mb-8">Order ID: <span className="font-mono font-medium text-heading">{orderId}</span></p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard" className="btn-gradient flex items-center justify-center gap-2">
            <Package className="w-4 h-4" /> Track Order
          </Link>
          <Link to="/products" className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-border font-semibold text-heading hover:bg-secondary transition-all text-sm uppercase tracking-wide">
            <ShoppingBag className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderSuccess;
