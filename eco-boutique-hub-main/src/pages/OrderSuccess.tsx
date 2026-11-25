import { Link, useLocation } from "react-router-dom";
import { CheckCircle, Clock, Package, ShoppingBag, XCircle } from "lucide-react";
import { motion } from "framer-motion";

type OrderSuccessState = {
  orderId?: string;
  pendingPayment?: boolean;
  paymentFailed?: boolean;
  paidOnline?: boolean;
};

const OrderSuccess = () => {
  const location = useLocation();
  const state = (location.state || {}) as OrderSuccessState;
  const orderId = state.orderId || "";
  const pendingPayment = Boolean(state.pendingPayment);
  const paymentFailed = Boolean(state.paymentFailed);
  const paidOnline = Boolean(state.paidOnline);

  if (paymentFailed) {
    return (
      <div className="container-main section-padding flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <XCircle className="w-20 h-20 text-destructive mx-auto mb-6" />
          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-3">Payment Not Completed</h1>
          <p className="text-body mb-2">Your order was not confirmed because payment was not received.</p>
          {orderId && (
            <p className="text-sm text-muted-foreground mb-8">
              Order ID: <span className="font-mono font-medium text-heading">{orderId}</span>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/checkout" className="btn-gradient flex items-center justify-center gap-2">Try Again</Link>
            <Link to="/dashboard" className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-border font-semibold text-heading hover:bg-secondary transition-all text-sm">
              My Orders
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (pendingPayment) {
    return (
      <div className="container-main section-padding flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <Clock className="w-20 h-20 text-amber-500 mx-auto mb-6" />
          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-3">Awaiting Payment</h1>
          <p className="text-body mb-2">
            Your order is saved but <strong className="text-heading">not confirmed</strong> until payment is completed.
          </p>
          {orderId && (
            <p className="text-sm text-muted-foreground mb-8">
              Order ID: <span className="font-mono font-medium text-heading">{orderId}</span>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard" className="btn-gradient flex items-center justify-center gap-2">
              <Package className="w-4 h-4" /> View Orders
            </Link>
            <Link to="/products" className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-border font-semibold text-heading hover:bg-secondary transition-all text-sm uppercase tracking-wide">
              <ShoppingBag className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container-main section-padding flex items-center justify-center min-h-[60vh]">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
          <CheckCircle className="w-20 h-20 text-primary mx-auto mb-6" />
        </motion.div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold mb-3">
          {paidOnline ? "Payment Successful!" : "Order Placed Successfully!"}
        </h1>
        <p className="text-body mb-2">
          {paidOnline
            ? "Thank you! Your payment was received and your order is confirmed."
            : "Thank you for your purchase. Your order has been confirmed."}
        </p>
        {orderId && (
          <p className="text-sm text-muted-foreground mb-8">
            Order ID: <span className="font-mono font-medium text-heading">{orderId}</span>
          </p>
        )}
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
