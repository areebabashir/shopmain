import { useParams, Link } from "react-router-dom";
import { Star, Minus, Plus, ShoppingCart, Heart, ChevronRight, Share2, Truck, ShieldCheck, RotateCcw, Check, ThumbsUp, MessageSquare } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import ProductCard from "@/components/ProductCard";
import {
  createProductReview,
  fetchProduct,
  fetchProductReviews,
  fetchProducts,
  productsQueryKey,
  sendChatMessage,
  type ApiReview,
} from "@/lib/api";
import { formatPkr } from "@/lib/money";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";
import { toast } from "sonner";

const ProductDetail = () => {
  const { id = "" } = useParams();
  const { addToCart, wishlist, toggleWishlist } = useCart();
  const { token } = useAuth();
  const { settings } = useStoreSettings();
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewFilter, setReviewFilter] = useState("all");
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: catalog = [] } = useQuery({
    queryKey: productsQueryKey,
    queryFn: fetchProducts,
  });

  const { data: product, isLoading: productLoading, isError: productError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
    enabled: Boolean(id),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => fetchProductReviews(id),
    enabled: Boolean(id) && product != null,
  });

  useEffect(() => {
    setSelectedImage(0);
  }, [id]);

  const images = useMemo(() => (product?.image ? [product.image] : []), [product?.image]);

  const avgRating = useMemo(() => {
    if (reviews.length > 0) return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    return product?.rating ?? 0;
  }, [reviews, product?.rating]);

  const ratingBreakdown = useMemo(() => {
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((r) => {
      const count = reviews.filter((rev) => rev.rating === r).length;
      return { stars: r, count, percent: (count / total) * 100 };
    });
  }, [reviews]);

  const filteredReviews: ApiReview[] = useMemo(
    () => (reviewFilter === "all" ? reviews : reviews.filter((r) => r.rating === Number(reviewFilter))),
    [reviews, reviewFilter]
  );

  if (productLoading) {
    return (
      <div className="container-main section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-secondary rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-secondary rounded w-3/4" />
            <div className="h-24 bg-secondary rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="container-main section-padding text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Link to="/products" className="text-primary text-sm font-medium mt-4 inline-block">Back to products</Link>
      </div>
    );
  }

  const isWished = wishlist.includes(product.id);
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
  const related = catalog.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  const submitReview = async () => {
    if (!token) {
      toast.error("Please sign in to write a review");
      return;
    }
    if (!reviewText.trim()) {
      toast.error("Please write your review");
      return;
    }
    setReviewSubmitting(true);
    try {
      await createProductReview(
        id,
        { rating: reviewRating, title: reviewTitle.trim() || undefined, text: reviewText.trim() },
        token
      );
      toast.success("Thanks for your review");
      setReviewTitle("");
      setReviewText("");
      setReviewRating(5);
      await queryClient.invalidateQueries({ queryKey: ["reviews", id] });
      await queryClient.invalidateQueries({ queryKey: ["product", id] });
      await queryClient.invalidateQueries({ queryKey: productsQueryKey });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleShareToChat = async () => {
    if (!token) {
      toast.error("Please login to share products in chat");
      return;
    }
    try {
      await sendChatMessage(token, {
        text: `Check this product: ${product.name}`,
        productId: product.id,
      });
      toast.success("Product shared in chat");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to share product");
    }
  };

  return (
    <div className="container-main section-padding">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-primary transition-colors">{product.category}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-heading font-medium line-clamp-1">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
        {/* Image Gallery */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          {/* Main Image */}
          <div className="rounded-2xl overflow-hidden bg-card relative group" style={{ boxShadow: "var(--shadow-card)" }}>
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                src={images[selectedImage] || ""}
                alt={product.name}
                className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </AnimatePresence>
            {product.badge && (
              <span className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide">{product.badge}</span>
            )}
            {discount > 0 && (
              <span className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-destructive text-primary-foreground text-xs font-bold">-{discount}%</span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className={`flex-1 aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? "border-primary shadow-lg" : "border-transparent hover:border-border opacity-70 hover:opacity-100"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
          {/* Category badge */}
          <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="inline-flex self-start items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3 hover:bg-primary/20 transition-colors">
            {product.category}
          </Link>

          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-3 text-heading">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-border"}`} />
              ))}
            </div>
            <span className="text-sm font-medium text-heading">{product.rating}</span>
            <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
            {product.stock != null && product.stock > 0 && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-primary font-medium">{product.stock} in stock</span>
              </>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6 p-4 rounded-xl bg-secondary/50">
            <span className="text-3xl font-heading font-bold text-primary">{formatPkr(product.price)}</span>
            {product.oldPrice && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatPkr(product.oldPrice)}</span>
                <span className="px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold">Save {formatPkr(product.oldPrice - product.price)}</span>
              </>
            )}
          </div>

          <p className="text-body leading-relaxed mb-6">{product.description}</p>

          {/* Key Features */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {Object.entries(product.specs).slice(0, 4).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50">
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs text-body"><span className="font-medium text-heading">{k}:</span> {v}</span>
              </div>
            ))}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium text-heading">Quantity</span>
            <div className="flex items-center border border-border rounded-xl overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3 hover:bg-secondary transition-colors"><Minus className="w-4 h-4" /></button>
              <span className="px-5 py-2.5 text-sm font-semibold min-w-[50px] text-center border-x border-border">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="p-3 hover:bg-secondary transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
            <span className="text-xs text-muted-foreground">({product.inStock ? "In stock" : "Out of stock"})</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button onClick={() => addToCart(product, qty)} className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-all text-sm">
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </button>
            <Link to="/checkout" onClick={() => addToCart(product, qty)} className="flex-1 btn-gradient flex items-center justify-center gap-2 text-sm">
              Buy Now
            </Link>
            <button onClick={handleShareToChat} className="px-4 py-3.5 rounded-xl border-2 border-border text-body hover:border-primary hover:text-primary transition-all text-sm">
              Share in Chat
            </button>
            <button onClick={() => toggleWishlist(product.id)} className={`p-3.5 rounded-xl border-2 transition-all ${isWished ? "border-destructive text-destructive bg-destructive/5" : "border-border text-muted-foreground hover:border-destructive hover:text-destructive"}`}>
              <Heart className={`w-5 h-5 ${isWished ? "fill-current" : ""}`} />
            </button>
            <div className="relative">
              <button onClick={() => setShowShareMenu(!showShareMenu)} className="p-3.5 rounded-xl border-2 border-border text-muted-foreground hover:border-primary hover:text-primary transition-all">
                <Share2 className="w-5 h-5" />
              </button>
              {showShareMenu && (
                <div className="absolute right-0 top-14 bg-card rounded-xl border border-border p-2 min-w-[120px] z-10" style={{ boxShadow: "var(--shadow-card)" }}>
                  {["Copy Link", "Facebook", "Twitter", "WhatsApp"].map(s => (
                    <button key={s} onClick={() => setShowShareMenu(false)} className="block w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-secondary transition-colors">{s}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border">
            {[
              { icon: Truck, label: "Free Shipping", desc: `Over ${formatPkr(settings.freeShippingMinimumPkr)}` },
              { icon: ShieldCheck, label: "Secure Payment", desc: "Encrypted" },
              { icon: RotateCcw, label: "Easy Returns", desc: "30 days" },
            ].map(b => (
              <div key={b.label} className="flex flex-col items-center text-center gap-1.5 p-3 rounded-xl bg-secondary/50">
                <b.icon className="w-5 h-5 text-primary" />
                <span className="text-[11px] font-semibold text-heading">{b.label}</span>
                <span className="text-[10px] text-muted-foreground">{b.desc}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mb-16">
        <div className="flex gap-1 border-b border-border mb-6">
          {[
            { id: "description", label: "Description" },
            { id: "specifications", label: "Specifications" },
            { id: "reviews", label: `Reviews (${reviews.length})` },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-5 py-3.5 text-sm font-medium transition-colors relative ${activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-heading"}`}>
              {tab.label}
              {activeTab === tab.id && <motion.span layoutId="product-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </div>

        <div className="bg-card rounded-2xl p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
          {activeTab === "description" && (
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg">About this product</h3>
              <p className="text-body leading-relaxed">{product.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h4 className="text-sm font-semibold text-heading mb-2">Key Features</h4>
                  <ul className="space-y-2">
                    {Object.entries(product.specs).map(([k, v]) => (
                      <li key={k} className="flex items-center gap-2 text-sm text-body">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        {k}: {v}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h4 className="text-sm font-semibold text-heading mb-2">What's in the Box</h4>
                  <ul className="space-y-2 text-sm text-body">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" />1x {product.name}</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" />User Manual</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" />Warranty Card</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "specifications" && (
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">Technical Specifications</h3>
              <div className="rounded-xl border border-border overflow-hidden">
                {Object.entries(product.specs).map(([k, v], i) => (
                  <div key={k} className={`flex justify-between py-3.5 px-5 ${i % 2 === 0 ? "bg-secondary/30" : ""}`}>
                    <span className="text-sm font-medium text-heading">{k}</span>
                    <span className="text-sm text-body">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div>
              {/* Review Summary */}
              <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b border-border">
                <div className="text-center md:text-left">
                  <div className="text-5xl font-heading font-bold text-heading mb-1">{avgRating.toFixed(1)}</div>
                  <div className="flex items-center gap-1 justify-center md:justify-start mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-border"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{reviews.length} reviews</p>
                </div>
                <div className="flex-1 space-y-2">
                  {ratingBreakdown.map(r => (
                    <div key={r.stars} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-12">{r.stars} stars</span>
                      <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${r.percent}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-6">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs font-medium text-muted-foreground">Filter:</span>
                {["all", "5", "4", "3", "2", "1"].map(f => (
                  <button key={f} onClick={() => setReviewFilter(f)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${reviewFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}>
                    {f === "all" ? "All" : `${f} ★`}
                  </button>
                ))}
              </div>

              {/* Reviews */}
              <div className="space-y-5">
                {reviews.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">No reviews yet. Be the first to review this product.</p>
                )}
                {filteredReviews.map((r) => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-xl bg-secondary/30">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-heading font-bold text-sm flex items-center justify-center">{r.avatar}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-heading">{r.name}</span>
                            {r.verified && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">Verified</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-border"}`} />
                              ))}
                            </div>
                            <span className="text-[10px] text-muted-foreground">{r.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <h4 className="text-sm font-semibold text-heading mb-1">{r.title}</h4>
                    <p className="text-sm text-body leading-relaxed mb-3">{r.text}</p>
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <ThumbsUp className="w-3 h-3" /> Helpful ({r.helpful})
                      </button>
                      <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <MessageSquare className="w-3 h-3" /> Reply
                      </button>
                    </div>
                  </motion.div>
                ))}
                {filteredReviews.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No reviews with this rating.</p>}
              </div>

              {/* Write Review */}
              <div className="mt-8 pt-8 border-t border-border">
                <h4 className="font-heading font-semibold mb-4">Write a Review</h4>
                {!token ? (
                  <p className="text-sm text-muted-foreground mb-4">
                    <Link to="/auth" className="text-primary font-medium hover:underline">
                      Sign in
                    </Link>{" "}
                    to leave a review.
                  </p>
                ) : null}
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your Rating</label>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          disabled={!token}
                          onClick={() => setReviewRating(i + 1)}
                          className="p-1 disabled:opacity-40"
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              i < reviewRating ? "fill-amber-400 text-amber-400" : "text-border hover:text-amber-400"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Review Title</label>
                    <input
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      disabled={!token}
                      placeholder="Sum up your review"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your Review</label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      disabled={!token}
                      placeholder="Share your experience..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 h-24 resize-none disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!token || reviewSubmitting}
                    onClick={submitReview}
                    className="btn-gradient text-sm disabled:opacity-50"
                  >
                    {reviewSubmitting ? "Submitting…" : "Submit Review"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* You May Also Like */}
      {related.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-bold">You May Also Like</h2>
            <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
