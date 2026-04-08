import { Link } from "react-router-dom";
import {
  ArrowRight, Zap, Star, ChevronRight, Truck, ShieldCheck, RotateCcw, Headphones,
  Sparkles, Gift, Leaf, Percent, Clock, BadgeCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/data/products";
import { categories, testimonials } from "@/data/products";
import { fetchProducts, productsQueryKey } from "@/lib/api";
import { formatPkr } from "@/lib/money";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";
import { useState, useEffect, useMemo, type FormEvent } from "react";
import { toast } from "sonner";

const CountdownTimer = () => {
  const [time, setTime] = useState({ h: 5, m: 23, s: 47 });
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => {
        let { h, m, s } = t;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex gap-2">
      {[{ v: time.h, l: "HRS" }, { v: time.m, l: "MIN" }, { v: time.s, l: "SEC" }].map((t) => (
        <div key={t.l} className="bg-heading text-white px-3 py-2 rounded-xl text-center min-w-[52px]">
          <div className="font-heading font-bold text-lg">{String(t.v).padStart(2, "0")}</div>
          <div className="text-[9px] tracking-wider opacity-70">{t.l}</div>
        </div>
      ))}
    </div>
  );
};

const floatingProducts = [
  { img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop", delay: 0, x: "75%", y: "10%" },
  { img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop", delay: 0.3, x: "85%", y: "55%" },
  { img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop", delay: 0.6, x: "65%", y: "65%" },
];

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const Index = () => {
  const { settings } = useStoreSettings();
  const freeShippingMinPkr = settings.freeShippingMinimumPkr;
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const submitNewsletter = (e: FormEvent) => {
    e.preventDefault();
    if (!emailOk(newsletterEmail)) {
      toast.error("Enter a valid email address");
      return;
    }
    toast.success("Thanks! You'll hear from us with deals and new arrivals.");
    setNewsletterEmail("");
  };

  const { data: catalog = [], isLoading } = useQuery({
    queryKey: productsQueryKey,
    queryFn: fetchProducts,
  });

  const { featured, flashSale, bestSellers, landingStats } = useMemo(() => {
    const list = catalog.length ? catalog : [];
    const cats = new Set(list.map((p) => p.category)).size;
    const onSale = list.filter((p) => p.oldPrice).length;
    return {
      featured: list.slice(0, 4),
      flashSale: list.filter((p) => p.oldPrice).slice(0, 4),
      bestSellers: list.filter((p) => p.rating >= 4.5).slice(0, 4),
      landingStats: {
        products: list.length,
        categories: cats || categories.length,
        onSale,
      },
    };
  }, [catalog]);

  const ProductGrid = ({ items }: { items: Product[] }) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl overflow-hidden animate-pulse aspect-[3/4]" />
          ))}
        </div>
      );
    }
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground text-center py-8">No products yet. Add some from the admin dashboard.</p>;
    }
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[520px] md:min-h-[600px]">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-primary" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        {/* Geometric patterns */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-40 h-40 border-2 border-white rounded-2xl rotate-12" />
          <div className="absolute bottom-20 left-1/3 w-24 h-24 border-2 border-white rounded-full" />
          <div className="absolute top-1/3 right-1/4 w-32 h-32 border-2 border-white rounded-2xl -rotate-6" />
        </div>

        <div className="container-main py-16 md:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left content */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                🔥 New Season — Up to 60% Off
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-white leading-[1.1] mb-6"
              >
                Shop Smarter,
                <br />
                <span className="relative">
                  Live Better
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="absolute -bottom-2 left-0 right-0 h-1.5 bg-white/30 rounded-full origin-left"
                  />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white/80 text-lg md:text-xl mb-8 max-w-lg leading-relaxed"
              >
                Discover premium products at unbeatable prices. Nationwide delivery — free standard shipping on orders over {formatPkr(freeShippingMinPkr)}.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="flex flex-wrap gap-4 mb-10"
              >
                <Link to="/products" className="group inline-flex items-center gap-2 bg-white text-primary font-heading font-bold px-8 py-4 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-base">
                  Shop Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/products?sale=true" className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-heading font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300 text-base">
                  View Deals
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex gap-8"
              >
                {[
                  { value: "10K+", label: "Products" },
                  { value: "50K+", label: "Customers" },
                  { value: "4.8", label: "Avg Rating" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl md:text-3xl font-heading font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-white/60 uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — floating product showcase */}
            <div className="hidden lg:block relative h-[450px]">
              {floatingProducts.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.4 + item.delay, duration: 0.6, type: "spring" }}
                  className="absolute"
                  style={{ left: item.x, top: item.y }}
                >
                  <motion.div
                    animate={{ y: [0, -12, 0] }}
                    transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
                    className="w-32 h-32 xl:w-40 xl:h-40 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 backdrop-blur-sm"
                  >
                    <img src={item.img} alt="" className="w-full h-full object-cover" />
                  </motion.div>
                </motion.div>
              ))}

              {/* Decorative sale badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, type: "spring" }}
                className="absolute top-[35%] left-[55%]"
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center shadow-xl"
                >
                  <span className="text-primary font-heading font-bold text-lg">60%</span>
                  <span className="text-primary/70 text-[9px] font-bold uppercase -mt-0.5">OFF</span>
                </motion.div>
              </motion.div>

              {/* Floating review card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="absolute bottom-4 left-[50%] bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {["SM", "JK", "ER"].map((a) => (
                      <div key={a} className="w-7 h-7 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-[8px] font-bold text-primary">{a}</div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                    </div>
                    <p className="text-[10px] text-body">50K+ happy customers</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Live pulse strip */}
      <section className="relative overflow-hidden border-b border-primary/20 bg-gradient-to-r from-primary/15 via-primary/8 to-primary/15">
        <div
          className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08)_40%,transparent)] bg-[length:200%_100%] animate-shimmer pointer-events-none"
          aria-hidden
        />
        <div className="container-main py-3 relative z-10">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2 text-heading font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Live store — new arrivals weekly
            </span>
            <span className="hidden sm:inline text-muted-foreground">|</span>
            <span className="text-muted-foreground">
              <span className="font-semibold text-primary tabular-nums">{isLoading ? "—" : landingStats.products}</span> products ·{" "}
              <span className="font-semibold text-primary tabular-nums">{isLoading ? "—" : landingStats.categories}</span> categories ·{" "}
              <span className="font-semibold text-destructive tabular-nums">{isLoading ? "—" : landingStats.onSale}</span> on sale
            </span>
          </div>
        </div>
      </section>

      {/* Quick highlights */}
      <section className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container-main py-10 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: Sparkles,
                title: "Curated picks",
                desc: "Our team highlights quality, value, and trending styles every week.",
                accent: "from-violet-500/20 to-primary/10",
              },
              {
                icon: Percent,
                title: "Real deals",
                desc: "Flash sales and member-only drops — no fake strikethroughs.",
                accent: "from-amber-500/20 to-primary/10",
              },
              {
                icon: Gift,
                title: "Rewards feel",
                desc: `Free shipping over ${formatPkr(freeShippingMinPkr)}, COD & mobile wallets, and support that replies.`,
                accent: "from-rose-500/15 to-primary/10",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                className={`relative rounded-2xl p-6 md:p-7 overflow-hidden border border-border bg-gradient-to-br ${item.accent} card-hover`}
              >
                <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-primary/10 blur-2xl" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-card shadow-sm border border-border flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-heading mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop collections — large visual cards */}
      <section className="section-padding bg-background">
        <div className="container-main">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Collections</p>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading">Shop the mood</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">Jump into our most-loved corners of the store — each curated for a different vibe.</p>
            </div>
            <Link to="/products" className="text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all shrink-0">
              Browse everything <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                title: "Tech & gadgets",
                subtitle: "Electronics",
                href: "/products?category=Electronics",
                img: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=600&fit=crop",
              },
              {
                title: "Style edit",
                subtitle: "Fashion",
                href: "/products?category=Fashion",
                img: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop",
              },
              {
                title: "Cozy home",
                subtitle: "Home & Living",
                href: "/products?category=Home%20%26%20Living",
                img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
              },
            ].map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  to={c.href}
                  className="group relative block aspect-[4/5] md:aspect-[3/4] rounded-3xl overflow-hidden border border-border shadow-lg"
                >
                  <img src={c.img} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-7">
                    <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-1">{c.subtitle}</p>
                    <h3 className="text-xl md:text-2xl font-heading font-bold text-white mb-3">{c.title}</h3>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:gap-3 transition-all">
                      Shop now <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why ShopVert */}
      <section className="py-12 md:py-16 border-y border-border bg-muted/30">
        <div className="container-main">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Why us</p>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-heading mb-4">Built for shoppers who hate clutter</h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-8">
                Clean listings, honest pricing, and a checkout that does not fight you. We focus on products you will actually use — not endless scroll fatigue.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: BadgeCheck, text: "Verified-quality picks and clear product details" },
                  { icon: Clock, text: "Fast dispatch and tracking you can trust" },
                  { icon: Leaf, text: "Eco-conscious options where it matters most" },
                ].map((row, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <row.icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm text-body pt-2">{row.text}</p>
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="inline-flex mt-8 btn-gradient text-sm">
                Create free account
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden aspect-square max-w-md mx-auto lg:max-w-none border border-border shadow-xl"
            >
              <img
                src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=800&fit=crop"
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-card/95 backdrop-blur-md border border-border p-4 shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">This week</p>
                    <p className="font-heading font-bold text-heading">Member favorites</p>
                  </div>
                  <Link to="/products" className="text-xs font-semibold text-primary whitespace-nowrap">View →</Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-border bg-card">
        <div className="container-main py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck, title: "Free Shipping", desc: `On orders over ${formatPkr(freeShippingMinPkr)}` },
              { icon: ShieldCheck, title: "Secure Payment", desc: "100% protected" },
              { icon: RotateCcw, title: "Easy Returns", desc: "30-day return policy" },
              { icon: Headphones, title: "24/7 Support", desc: "Here to help" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="flex items-center gap-3 p-3"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-heading">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-padding">
        <div className="container-main">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-heading font-bold">Shop by Category</h2>
              <p className="text-sm text-muted-foreground mt-1">Find exactly what you need</p>
            </div>
            <Link to="/products" className="text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">View All <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/products?category=${encodeURIComponent(cat.name)}`} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card card-hover text-center group">
                  <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                  <span className="text-xs font-medium text-heading">{cat.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="section-padding bg-card">
        <div className="container-main">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-heading font-bold">Featured Products</h2>
              <p className="text-sm text-muted-foreground mt-1">Handpicked just for you</p>
            </div>
            <Link to="/products" className="text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">See All <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <ProductGrid items={featured} />
        </div>
      </section>

      {/* Flash Sale */}
      <section className="section-padding">
        <div className="container-main">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-destructive fill-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold">Flash Sale</h2>
                <p className="text-sm text-muted-foreground">Hurry, limited time only!</p>
              </div>
            </div>
            <CountdownTimer />
          </div>
          <ProductGrid items={flashSale} />
        </div>
      </section>

      {/* Promo Banner */}
      <section className="container-main my-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl p-8 md:p-12"
          style={{ background: "linear-gradient(135deg, #1A1A1A, #333)" }}
        >
          <div className="relative z-10 max-w-lg">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold mb-4">LIMITED OFFER</span>
            <h2 className="text-2xl md:text-4xl font-heading font-bold text-white mb-3">Premium Collection</h2>
            <p className="text-white/60 mb-6">Get exclusive access to our premium range with up to 40% discount this season.</p>
            <Link to="/products" className="btn-gradient inline-flex items-center gap-2">
              Explore Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
            <div className="absolute top-5 right-10 w-60 h-60 rounded-full bg-primary blur-3xl" />
          </div>
        </motion.div>
      </section>

      {/* Best Sellers */}
      <section className="section-padding bg-card">
        <div className="container-main">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-heading font-bold">Best Sellers</h2>
              <p className="text-sm text-muted-foreground mt-1">Most loved by our customers</p>
            </div>
            <Link to="/products" className="text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">View All <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <ProductGrid items={bestSellers} />
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding">
        <div className="container-main">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-heading font-bold">What Our Customers Say</h2>
            <p className="text-sm text-muted-foreground mt-1">Trusted by thousands of happy shoppers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-card p-6 rounded-2xl card-hover relative">
                <div className="absolute top-4 right-4 text-4xl opacity-10 font-heading">"</div>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-body text-sm mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-heading font-bold text-xs flex items-center justify-center">{t.avatar}</div>
                  <span className="font-medium text-sm text-heading">{t.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section-padding relative overflow-hidden" style={{ background: "var(--gradient-primary)" }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container-main text-center relative z-10">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-3">Stay in the Loop</h2>
          <p className="text-white/70 mb-6 max-w-md mx-auto">Subscribe for exclusive deals, new arrivals, and insider-only discounts.</p>
          <form onSubmit={submitNewsletter} className="flex max-w-md mx-auto">
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-l-xl bg-white/20 border border-white/30 text-white placeholder:text-white/50 text-sm focus:outline-none backdrop-blur-sm"
            />
            <button type="submit" className="px-6 py-3 rounded-r-xl bg-white text-primary font-heading font-semibold text-sm hover:bg-white/90 transition-colors">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Index;
