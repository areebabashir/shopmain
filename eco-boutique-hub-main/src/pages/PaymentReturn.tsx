import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { completeGatewayPayment } from "@/lib/api";

/** Handles redirect back from external EasyPaisa / JazzCash merchant pages. */
const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [message, setMessage] = useState("Confirming your payment…");

  useEffect(() => {
    const orderId = searchParams.get("orderId") || "";
    const successParam = searchParams.get("success") ?? searchParams.get("status") ?? "";
    const paid =
      successParam === "true" ||
      successParam === "1" ||
      successParam.toLowerCase() === "success" ||
      successParam.toLowerCase() === "paid";

    if (!orderId || !token) {
      navigate("/order-success", { state: { paymentFailed: true } });
      return;
    }

    (async () => {
      try {
        await completeGatewayPayment(orderId, paid, token);
        sessionStorage.removeItem("pendingPaymentOrderId");
        navigate("/order-success", {
          state: paid ? { orderId, paidOnline: true } : { orderId, paymentFailed: true },
          replace: true,
        });
      } catch {
        setMessage("Could not verify payment. Check your orders.");
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 2500);
      }
    })();
  }, [searchParams, navigate, token]);

  return (
    <div className="container-main section-padding flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

export default PaymentReturn;
