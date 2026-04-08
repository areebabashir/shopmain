import { Star, ShoppingCart, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/data/products";
import { formatPkr } from "@/lib/money";
import { motion } from "framer-motion";

const ProductCard = ({ product, index = 0 }: { product: Product; index?: number }) => {
  const { addToCart, wishlist, toggleWishlist } = useCart();
  const isWished = wishlist.includes(product.id);
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group bg-card rounded-2xl overflow-hidden card-hover relative"
    >
      <button onClick={() => toggleWishlist(product.id)} className="absolute top-3 right-3 z-10 p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors">
        <Heart className={`w-4 h-4 ${isWished ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
      </button>

      {product.badge && (
        <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wide">{product.badge}</span>
      )}

      <Link to={`/product/${product.id}`}>
        <div className="aspect-square overflow-hidden bg-secondary">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-medium text-sm text-heading line-clamp-2 mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-border"}`} />
          ))}
          <span className="text-[11px] text-muted-foreground ml-1">({product.reviews})</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-primary">{formatPkr(product.price)}</span>
            {product.oldPrice != null && <span className="text-xs text-muted-foreground line-through">{formatPkr(product.oldPrice)}</span>}
            {discount > 0 && <span className="text-[10px] font-bold text-destructive">-{discount}%</span>}
          </div>
          <button onClick={() => addToCart(product)} className="p-2 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground transition-all duration-300 opacity-0 group-hover:opacity-100">
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
