import { Link } from "react-router-dom";
import { ArrowRight, Zap, Star, ChevronRight, Truck, ShieldCheck, RotateCcw, Headphones } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/data/products";
import { categories, testimonials } from "@/data/products";
import { fetchProducts, productsQueryKey } from "@/lib/api";
import { useState, useEffect, useMemo } from "react";

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

const Index = () => {
  const { data: catalog = [], isLoading } = useQuery({
    queryKey: productsQueryKey,
    queryFn: fetchProducts,
  });

  const { featured, flashSale, bestSellers } = useMemo(() => {
    const list = catalog.length ? catalog : [];
    return {
      featured: list.slice(0, 4),
      flashSale: list.filter((p) => p.oldPrice).slice(0, 4),
      bestSellers: list.filter((p) => p.rating >= 4.5).slice(0, 4),
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
                Discover premium products at unbeatable prices. Free shipping on orders over $50.
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

      {/* Trust badges */}
      <section className="border-b border-border bg-card">
        <div className="container-main py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck, title: "Free Shipping", desc: "On orders over $50" },
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
          <div className="flex max-w-md mx-auto">
            <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 rounded-l-xl bg-white/20 border border-white/30 text-white placeholder:text-white/50 text-sm focus:outline-none backdrop-blur-sm" />
            <button className="px-6 py-3 rounded-r-xl bg-white text-primary font-heading font-semibold text-sm hover:bg-white/90 transition-colors">Subscribe</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
