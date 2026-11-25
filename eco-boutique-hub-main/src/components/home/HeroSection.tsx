import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { bannersQueryKey, fetchBanners, mediaUrl, type Banner } from "@/lib/api";
import { formatPkr } from "@/lib/money";

type HeroSectionProps = {
  freeShippingMinPkr: number;
};

const floatingProducts = [
  { img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop", delay: 0, x: "75%", y: "10%" },
  { img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop", delay: 0.3, x: "85%", y: "55%" },
  { img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop", delay: 0.6, x: "65%", y: "65%" },
];

const DefaultHeroContent = ({ freeShippingMinPkr }: HeroSectionProps) => (
  <>
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6"
    >
      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
      New Season — Up to 60% Off
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
  </>
);

const BannerSlideContent = ({ banner, freeShippingMinPkr }: { banner: Banner; freeShippingMinPkr: number }) => {
  const ctaHref = banner.link?.trim() || "/products";
  const isExternal = /^https?:\/\//i.test(ctaHref);

  return (
    <>
      {banner.subtitle && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          {banner.subtitle}
        </motion.div>
      )}

      <motion.h1
        key={banner._id + "-title"}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-white leading-[1.1] mb-6 drop-shadow-lg"
      >
        {banner.title || "Shop the Collection"}
      </motion.h1>

      {!banner.subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-white/85 text-lg md:text-xl mb-8 max-w-lg leading-relaxed"
        >
          Free standard shipping on orders over {formatPkr(freeShippingMinPkr)}.
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-4 mb-10"
      >
        {isExternal ? (
          <a
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 bg-white text-primary font-heading font-bold px-8 py-4 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-base"
          >
            Shop Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        ) : (
          <Link
            to={ctaHref}
            className="group inline-flex items-center gap-2 bg-white text-primary font-heading font-bold px-8 py-4 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-base"
          >
            Shop Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
        <Link
          to="/products?sale=true"
          className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-heading font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300 text-base"
        >
          View Deals
        </Link>
      </motion.div>
    </>
  );
};

const HeroDecorations = () => (
  <>
    <div className="absolute inset-0 opacity-20 pointer-events-none">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
    </div>
    <div className="absolute inset-0 opacity-5 pointer-events-none">
      <div className="absolute top-10 left-10 w-40 h-40 border-2 border-white rounded-2xl rotate-12" />
      <div className="absolute bottom-20 left-1/3 w-24 h-24 border-2 border-white rounded-full" />
      <div className="absolute top-1/3 right-1/4 w-32 h-32 border-2 border-white rounded-2xl -rotate-6" />
    </div>
  </>
);

const HeroRightPanel = () => (
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
);

const HeroSection = ({ freeShippingMinPkr }: HeroSectionProps) => {
  const { data: banners = [] } = useQuery({
    queryKey: bannersQueryKey,
    queryFn: fetchBanners,
    staleTime: 60_000,
  });

  const activeBanners = useMemo(
    () => banners.filter((b) => b.isActive).map((b) => ({ ...b, imageUrl: mediaUrl(b.imageUrl) })),
    [banners]
  );

  const [slideIndex, setSlideIndex] = useState(0);
  const hasBanners = activeBanners.length > 0;
  const current = hasBanners ? activeBanners[slideIndex % activeBanners.length] : null;

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const t = setInterval(() => {
      setSlideIndex((i) => (i + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(t);
  }, [activeBanners.length]);

  useEffect(() => {
    if (slideIndex >= activeBanners.length) setSlideIndex(0);
  }, [activeBanners.length, slideIndex]);

  return (
    <section className="relative overflow-hidden min-h-[520px] md:min-h-[600px]">
      {/* Background */}
      {hasBanners && current ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={current._id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0"
          >
            <img
              src={current.imageUrl}
              alt={current.title || "Hero banner"}
              className="absolute inset-0 w-full h-full object-cover brightness-[0.82]"
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-primary/22 to-primary/8" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/40" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.06),transparent_55%)]" />
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-primary" />
      )}

      <HeroDecorations />

      <div className="container-main py-16 md:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <AnimatePresence mode="wait">
              {hasBanners && current ? (
                <motion.div
                  key={current._id + "-content"}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4 }}
                >
                  <BannerSlideContent banner={current} freeShippingMinPkr={freeShippingMinPkr} />
                </motion.div>
              ) : (
                <DefaultHeroContent freeShippingMinPkr={freeShippingMinPkr} />
              )}
            </AnimatePresence>

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

            {activeBanners.length > 1 && (
              <div className="flex gap-2 mt-8">
                {activeBanners.map((b, i) => (
                  <button
                    key={b._id}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => setSlideIndex(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === slideIndex ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <HeroRightPanel />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
