import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, Grid3X3, List, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/data/products";
import { categories } from "@/data/products";
import { fetchProducts, productsQueryKey } from "@/lib/api";
import { formatPkr } from "@/lib/money";
import { Link } from "react-router-dom";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const Products = () => {
  const [searchParams] = useSearchParams();
  const queryCategory = searchParams.get("category") || "";
  const querySearch = searchParams.get("q") || "";

  const [selectedCategory, setSelectedCategory] = useState(queryCategory);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: true, price: true, rating: true, availability: true, brands: false,
  });

  const { addToCart, wishlist, toggleWishlist } = useCart();

  const { data: catalog = [], isLoading, isError } = useQuery({
    queryKey: productsQueryKey,
    queryFn: fetchProducts,
  });

  useEffect(() => {
    setSelectedCategory(queryCategory);
  }, [queryCategory]);

  const priceCeiling = useMemo(() => {
    const maxP = catalog.reduce((m, p) => Math.max(m, p.price), 0);
    return Math.max(200, Math.ceil(maxP / 50) * 50 || 500);
  }, [catalog]);

  const priceQuickPick = useMemo(() => {
    const base = [50, 100, 150, 200, 500];
    return [...new Set([...base.filter((x) => x <= priceCeiling), priceCeiling])]
      .filter((x) => x >= 50)
      .sort((a, b) => a - b);
  }, [priceCeiling]);

  useEffect(() => {
    setPriceRange((prev) => [prev[0], Math.min(prev[1], priceCeiling)]);
  }, [priceCeiling]);

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const filtered = useMemo(() => {
    let result = catalog.filter((p) => {
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      if (p.rating < minRating) return false;
      if (querySearch && !p.name.toLowerCase().includes(querySearch.toLowerCase())) return false;
      if (inStockOnly && !p.inStock) return false;
      return true;
    });
    if (sortBy === "price-low") result.sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") result.sort((a, b) => b.price - a.price);
    if (sortBy === "rating") result.sort((a, b) => b.rating - a.rating);
    if (sortBy === "newest")
      result.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
    if (sortBy === "popular") result.sort((a, b) => b.reviews - a.reviews);
    return result;
  }, [catalog, selectedCategory, priceRange, minRating, sortBy, querySearch, inStockOnly]);

  const activeFilters = [
    ...(selectedCategory ? [{ label: selectedCategory, clear: () => setSelectedCategory("") }] : []),
    ...(priceRange[1] < priceCeiling ? [`Under ${formatPkr(priceRange[1])}`] : []).map((l) => ({ label: l, clear: () => setPriceRange([0, priceCeiling]) })),
    ...(minRating > 0 ? [{ label: `${minRating}+ Stars`, clear: () => setMinRating(0) }] : []),
    ...(inStockOnly ? [{ label: "In Stock", clear: () => setInStockOnly(false) }] : []),
  ];

  const clearAll = () => {
    setSelectedCategory("");
    setPriceRange([0, priceCeiling]);
    setMinRating(0);
    setInStockOnly(false);
  };

  const SidebarSection = ({ title, id, children }: { title: string; id: string; children: React.ReactNode }) => (
    <div className="border-b border-border pb-4 last:border-0 last:pb-0">
      <button onClick={() => toggleSection(id)} className="flex items-center justify-between w-full mb-3">
        <h3 className="font-heading font-semibold text-sm text-heading">{title}</h3>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedSections[id] ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {expandedSections[id] && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const Sidebar = () => (
    <div className="space-y-4">
      <SidebarSection title="Categories" id="categories">
        <div className="space-y-0.5">
          <button onClick={() => setSelectedCategory("")} className={`flex items-center justify-between w-full text-sm px-3 py-2 rounded-lg transition-colors ${!selectedCategory ? "bg-primary/10 text-primary font-medium" : "text-body hover:bg-secondary"}`}>
            <span>All Categories</span>
            <span className="text-[10px] text-muted-foreground">{catalog.length}</span>
          </button>
          {categories.map((c) => {
            const count = catalog.filter(p => p.category === c.name).length;
            return (
              <button key={c.id} onClick={() => setSelectedCategory(c.name)} className={`flex items-center justify-between w-full text-sm px-3 py-2 rounded-lg transition-colors ${selectedCategory === c.name ? "bg-primary/10 text-primary font-medium" : "text-body hover:bg-secondary"}`}>
                <span>{c.icon} {c.name}</span>
                <span className="text-[10px] text-muted-foreground">{count}</span>
              </button>
            );
          })}
        </div>
      </SidebarSection>

      <SidebarSection title="Price Range" id="price">
        <div>
          <input type="range" min={0} max={priceCeiling} value={Math.min(priceRange[1], priceCeiling)} onChange={(e) => setPriceRange([0, Number(e.target.value)])} className="w-full accent-primary" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatPkr(0)}</span><span>{formatPkr(Math.min(priceRange[1], priceCeiling))}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {priceQuickPick.map((v) => (
              <button key={v} onClick={() => setPriceRange([0, v])} className={`text-xs px-2 py-1.5 rounded-lg border transition-colors ${priceRange[1] === v ? "bg-primary/10 text-primary border-primary/30" : "border-border hover:bg-secondary"}`}>
                Under {formatPkr(v)}
              </button>
            ))}
          </div>
        </div>
      </SidebarSection>

      <SidebarSection title="Rating" id="rating">
        <div className="space-y-0.5">
          {[4, 3, 2, 0].map((r) => (
            <button key={r} onClick={() => setMinRating(r)} className={`flex items-center gap-2 w-full text-sm px-3 py-2 rounded-lg transition-colors ${minRating === r ? "bg-primary/10 text-primary font-medium" : "text-body hover:bg-secondary"}`}>
              {r > 0 ? (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < r ? "fill-amber-400 text-amber-400" : "text-border"}`} />
                  ))}
                  <span className="ml-1">& up</span>
                </div>
              ) : "All Ratings"}
            </button>
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="Availability" id="availability">
        <label className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg hover:bg-secondary transition-colors">
          <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="w-4 h-4 accent-primary rounded" />
          <span className="text-sm text-body">In Stock Only</span>
        </label>
      </SidebarSection>
    </div>
  );

  const ListProductCard = ({ product: p }: { product: Product }) => {
    const isWished = wishlist.includes(p.id);
    const disc = p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl overflow-hidden card-hover flex flex-col sm:flex-row">
        <Link to={`/product/${p.id}`} className="sm:w-48 shrink-0">
          <div className="aspect-square sm:aspect-auto sm:h-full overflow-hidden bg-secondary relative">
            <img src={p.image} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
            {p.badge && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold">{p.badge}</span>}
          </div>
        </Link>
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <Link to={`/product/${p.id}`}><h3 className="font-medium text-heading hover:text-primary transition-colors mb-1">{p.name}</h3></Link>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{p.description}</p>
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < Math.floor(p.rating) ? "fill-amber-400 text-amber-400" : "text-border"}`} />
              ))}
              <span className="text-[11px] text-muted-foreground ml-1">({p.reviews})</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-primary text-lg">{formatPkr(p.price)}</span>
              {p.oldPrice != null && <span className="text-xs text-muted-foreground line-through">{formatPkr(p.oldPrice)}</span>}
              {disc > 0 && <span className="text-[10px] font-bold text-destructive">-{disc}%</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleWishlist(p.id)} className="p-2 rounded-xl hover:bg-secondary transition-colors">
                <Heart className={`w-4 h-4 ${isWished ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
              </button>
              <button onClick={() => addToCart(p)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                <ShoppingCart className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="container-main section-padding">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">
            {querySearch ? `Results for "${querySearch}"` : selectedCategory || "All Products"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} products found</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="hidden md:flex items-center border border-border rounded-xl overflow-hidden">
            <button onClick={() => setViewMode("grid")} className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setFiltersOpen(true)} className="md:hidden p-2.5 rounded-xl border border-border">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-sm px-3 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="featured">Featured</option>
            <option value="popular">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {activeFilters.map((f, i) => (
            <button key={i} onClick={f.clear} className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">
              {f.label} <X className="w-3 h-3" />
            </button>
          ))}
          <button onClick={clearAll} className="text-xs text-destructive font-medium hover:underline">Clear All</button>
        </div>
      )}

      <div className="flex gap-8">
        <aside className="hidden md:block w-64 shrink-0 sticky top-20 self-start bg-card p-5 rounded-2xl" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-sm">Filters</h2>
            {activeFilters.length > 0 && <button onClick={clearAll} className="text-[10px] text-primary font-medium">Reset</button>}
          </div>
          <Sidebar />
        </aside>

        <div className="flex-1">
          {isLoading && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl aspect-[3/4] animate-pulse" />
              ))}
            </div>
          )}
          {isError && !isLoading && (
            <p className="text-center text-destructive text-sm py-16">Could not load products. Is the API running?</p>
          )}
          {!isLoading && !isError && viewMode === "grid" && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
          {!isLoading && !isError && viewMode === "list" && (
            <div className="space-y-4">
              {filtered.map(p => <ListProductCard key={p.id} product={p} />)}
            </div>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <SlidersHorizontal className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium mb-1">No products found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or search criteria.</p>
              <button onClick={clearAll} className="btn-gradient text-sm mt-4">Clear Filters</button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {filtersOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween" }} className="absolute right-0 top-0 bottom-0 w-80 bg-card p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-heading font-bold">Filters</h2>
                <button onClick={() => setFiltersOpen(false)} className="p-2 rounded-xl hover:bg-secondary"><X className="w-5 h-5" /></button>
              </div>
              <Sidebar />
              <button onClick={() => setFiltersOpen(false)} className="btn-gradient w-full mt-6 text-sm">Apply Filters ({filtered.length} results)</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
