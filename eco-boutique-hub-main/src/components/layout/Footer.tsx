import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { toast } from "sonner";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const Footer = () => {
  const [footerEmail, setFooterEmail] = useState("");

  const submitFooterNewsletter = (e: FormEvent) => {
    e.preventDefault();
    if (!emailOk(footerEmail)) {
      toast.error("Enter a valid email address");
      return;
    }
    toast.success("Subscribed! Check your inbox soon.");
    setFooterEmail("");
  };

  return (
  <footer className="bg-heading text-muted pt-16 pb-8">
    <div className="container-main">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-sm">S</span>
            </div>
            <span className="font-heading font-bold text-xl text-white">ShopVert</span>
          </div>
          <p className="text-sm leading-relaxed">Your go-to destination for premium products at unbeatable prices. Quality guaranteed.</p>
        </div>
        <div>
          <h4 className="font-heading font-semibold text-white mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {["About Us", "Products", "Flash Sale", "Blog"].map((l) => (
              <li key={l}><Link to="/products" className="hover:text-primary transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-heading font-semibold text-white mb-4">Customer Support</h4>
          <ul className="space-y-2 text-sm">
            {["Help Center", "Returns & Refunds", "Shipping Info", "Contact Us"].map((l) => (
              <li key={l}><Link to="/" className="hover:text-primary transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-heading font-semibold text-white mb-4">Newsletter</h4>
          <p className="text-sm mb-3">Get exclusive deals straight to your inbox.</p>
          <form onSubmit={submitFooterNewsletter} className="flex">
            <input
              type="email"
              value={footerEmail}
              onChange={(e) => setFooterEmail(e.target.value)}
              placeholder="Your email"
              className="flex-1 px-3 py-2 rounded-l-lg bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
            <button type="submit" className="px-4 py-2 rounded-r-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark transition-colors" aria-label="Subscribe">
              <Mail className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
        <p>© 2026 ShopVert. All rights reserved.</p>
        <div className="flex gap-4 text-xs font-medium">
          {["VISA", "MC", "PAYPAL", "COD"].map((p) => (
            <span key={p} className="px-2 py-1 rounded bg-white/10">{p}</span>
          ))}
        </div>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
