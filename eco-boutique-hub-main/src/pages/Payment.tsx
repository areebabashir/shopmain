import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { completeGatewayPayment } from "@/lib/api";
import { formatPkr } from "@/lib/money";

const providerMeta = {
  easypaisa: {
    name: "EasyPaisa",
    gradient: "from-green-600 to-green-700",
    accent: "text-green-600",
    border: "border-green-200",
    bg: "bg-green-50",
    placeholder: "03XX XXXXXXX",
  },
  jazzcash: {
    name: "JazzCash",
    gradient: "from-violet-700 to-fuchsia-700",
    accent: "text-violet-700",
    border: "border-violet-200",
    bg: "bg-violet-50",
    placeholder: "03XX XXXXXXX",
  },
  jazcash: {
    name: "JazzCash",
    gradient: "from-violet-700 to-fuchsia-700",
    accent: "text-violet-700",
    border: "border-violet-200",
    bg: "bg-violet-50",
    placeholder: "03XX XXXXXXX",
  },
};

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const orderId = searchParams.get("orderId") || "";
  const amount = Number(searchParams.get("amount") || 0);
  const providerKey = (searchParams.get("provider") || "easypaisa").toLowerCase();
  const meta = providerMeta[providerKey as keyof typeof providerMeta] || providerMeta.easypaisa;

  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!orderId || !token) {
    return (
      <div className="container-main section-padding text-center">
        <p className="text-muted-foreground mb-4">Invalid payment session. Please checkout again.</p>
        <Link to="/checkout" className="btn-gradient inline-block">Back to checkout</Link>
      </div>
    );
  }

  const handlePay = async () => {
    const phone = mobile.replace(/\s/g, "");
    if (!/^03\d{9}$/.test(phone)) {
      toast.error("Enter a valid Pakistani mobile number (03XXXXXXXXX)");
      return;
    }
    if (pin.length < 4) {
      toast.error("Enter your wallet PIN or OTP");
      return;
    }
    setSubmitting(true);
    try {
      await completeGatewayPayment(orderId, true, token);
      sessionStorage.removeItem("pendingPaymentOrderId");
      toast.success("Payment successful!");
      navigate("/order-success", { state: { orderId, paidOnline: true } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setSubmitting(true);
    try {
      await completeGatewayPayment(orderId, false, token);
    } catch {
      /* ignore */
    }
    navigate("/order-success", { state: { orderId, paymentFailed: true } });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center section-padding">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className={`rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br ${meta.gradient} text-white p-6 mb-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Pay with</p>
              <h1 className="text-2xl font-heading font-bold">{meta.name}</h1>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-heading font-bold">{formatPkr(amount)}</p>
          <p className="text-xs text-white/70 mt-1 font-mono">Order {orderId.slice(-8)}</p>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <Lock className="w-3.5 h-3.5" />
            Secure payment · Enter your {meta.name} account details
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Mobile number</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder={meta.placeholder}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">PIN / OTP</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 tracking-widest"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handlePay}
            disabled={submitting}
            className={`w-full mt-6 py-4 rounded-xl font-heading font-bold text-white bg-gradient-to-r ${meta.gradient} hover:opacity-95 transition-opacity disabled:opacity-60`}
          >
            {submitting ? "Processing…" : `Pay ${formatPkr(amount)}`}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="w-full mt-3 py-2.5 text-sm text-muted-foreground hover:text-heading transition-colors"
          >
            Cancel payment
          </button>

          <Link
            to="/dashboard"
            className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Back to orders
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Payment;
