import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { createOrder, initiateGatewayPayment } from "@/lib/api";
import { formatPkr } from "@/lib/money";
import { computeShippingPkr } from "@/lib/storeSettings";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";
import { toast } from "sonner";
import { Check } from "lucide-react";

const steps = ["Shipping", "Delivery", "Payment"];

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { token, user } = useAuth();
  const { settings } = useStoreSettings();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", zip: "", delivery: "standard", payment: "cod" });
  const [shippingPrefilled, setShippingPrefilled] = useState(false);

  useEffect(() => {
    if (shippingPrefilled || !user?.addresses?.length) return;
    const def = user.addresses.find((a) => a.isDefault) ?? user.addresses[0];
    if (!def) return;
    setForm((f) => ({
      ...f,
      name: def.name || f.name,
      phone: def.phone || f.phone,
      address: def.address || f.address,
      city: def.city || f.city,
      zip: def.zip || f.zip,
    }));
    setShippingPrefilled(true);
  }, [user?.addresses, shippingPrefilled]);
  const shipStandard = computeShippingPkr(totalPrice, "standard", settings);
  const shipExpress = computeShippingPkr(totalPrice, "express", settings);
  const shippingFee = (form.delivery === "express" ? shipExpress : shipStandard).totalShipping;
  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!token) {
      toast.error("Please login first");
      navigate("/auth", { state: { from: "/checkout" } });
      return;
    }
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    const fee = computeShippingPkr(totalPrice, form.delivery === "express" ? "express" : "standard", settings).totalShipping;
    const payload = {
      items: items.map((i) => ({ productId: String(i.product.id), quantity: i.quantity })),
      shippingAddress: {
        name: form.name,
        phone: form.phone,
        address: form.address,
        city: form.city,
        zip: form.zip,
      },
      delivery: form.delivery,
      payment: form.payment,
      shippingFee: fee,
    };
    try {
      const res = await createOrder(payload, token);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.message === "string" ? data.message : "Failed to place order");
        return;
      }
      const createdOrderId = typeof data.id === "string" ? data.id : "";
      if ((form.payment === "easypaisa" || form.payment === "jazcash") && createdOrderId) {
        const gatewayRes = await initiateGatewayPayment(form.payment as "easypaisa" | "jazcash", createdOrderId, token);
        const gatewayData = await gatewayRes.json().catch(() => ({}));
        if (!gatewayRes.ok || typeof gatewayData.redirectUrl !== "string") {
          toast.error(typeof gatewayData.message === "string" ? gatewayData.message : "Failed to initiate gateway payment");
          return;
        }
        clearCart();
        window.location.href = gatewayData.redirectUrl;
        return;
      }
      clearCart();
      toast.success("Order placed successfully");
      navigate("/order-success");
    } catch {
      toast.error("Network error");
    }
  };

  const canNext = () => {
    if (step === 0) return form.name && form.phone && form.address && form.city && form.zip;
    return true;
  };

  const InputField = ({ label, field, type = "text", placeholder = "" }: { label: string; field: string; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-sm font-medium text-heading mb-1.5">{label}</label>
      <input type={type} value={(form as any)[field]} onChange={(e) => update(field, e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
    </div>
  );

  return (
    <div className="container-main section-padding">
      <h1 className="text-2xl font-heading font-bold mb-8">Checkout</h1>

      {/* Progress */}
      <div className="flex items-center justify-center gap-4 mb-10">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${i <= step ? "text-heading" : "text-muted-foreground"}`}>{s}</span>
            {i < steps.length - 1 && <div className={`w-12 h-0.5 ${i < step ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-heading font-semibold mb-2">Shipping Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Full Name" field="name" placeholder="John Doe" />
                <InputField label="Phone" field="phone" type="tel" placeholder="+92 300 1234567" />
              </div>
              <InputField label="Address" field="address" placeholder="House / street, area" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="City" field="city" placeholder="Karachi, Lahore, Islamabad…" />
                <InputField label="Postal code" field="zip" placeholder="74400" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-heading font-semibold mb-4">Delivery Option</h2>
              <div className="space-y-3">
                {[
                  { id: "standard", label: "Standard delivery", desc: "Typically 5–7 working days", price: shipStandard.totalShipping === 0 ? "Free" : formatPkr(shipStandard.totalShipping) },
                  { id: "express", label: "Express delivery", desc: "Faster dispatch where available", price: shipExpress.totalShipping === 0 ? "Free" : formatPkr(shipExpress.totalShipping) },
                ].map((o) => (
                  <label key={o.id} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${form.delivery === o.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.delivery === o.id ? "border-primary" : "border-border"}`}>
                        {form.delivery === o.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <div><p className="text-sm font-medium text-heading">{o.label}</p><p className="text-xs text-muted-foreground">{o.desc}</p></div>
                    </div>
                    <span className="text-sm font-semibold text-primary">{o.price}</span>
                    <input type="radio" name="delivery" value={o.id} checked={form.delivery === o.id} onChange={() => update("delivery", o.id)} className="sr-only" />
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-heading font-semibold mb-4">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { id: "cod", label: "Cash on Delivery", icon: "💵" },
                  { id: "easypaisa", label: "EasyPaisa", icon: "🟢" },
                  { id: "jazcash", label: "JazzCash", icon: "🟣" },
                ].map((o) => (
                  <label key={o.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.payment === o.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.payment === o.id ? "border-primary" : "border-border"}`}>
                      {form.payment === o.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <span className="text-lg">{o.icon}</span>
                    <span className="text-sm font-medium text-heading">{o.label}</span>
                    <input type="radio" name="payment" value={o.id} checked={form.payment === o.id} onChange={() => update("payment", o.id)} className="sr-only" />
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">Back</button>
            ) : <div />}
            {step < 2 ? (
              <button onClick={() => canNext() && setStep(step + 1)} disabled={!canNext()} className="btn-gradient disabled:opacity-50 disabled:hover:scale-100">Continue</button>
            ) : (
              <button onClick={handleSubmit} className="btn-gradient">Place Order</button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-card rounded-2xl p-6 h-fit sticky top-20" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="font-heading font-semibold mb-4">Order Summary</h3>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3">
                <img src={item.product.image} alt={item.product.name} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-heading line-clamp-1">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                </div>
                <span className="text-xs font-medium">{formatPkr(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-body">Subtotal</span><span>{formatPkr(totalPrice)}</span></div>
            <div className="flex justify-between"><span className="text-body">Shipping</span><span>{shippingFee === 0 ? "Free" : formatPkr(shippingFee)}</span></div>
            <div className="flex justify-between font-heading font-bold pt-2 border-t border-border">
              <span>Total (PKR)</span>
              <span className="text-primary">{formatPkr(totalPrice + shippingFee)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
