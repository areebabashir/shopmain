import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import ProductCard from "@/components/ProductCard";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchProducts, productsQueryKey } from "@/lib/api";

const Wishlist = () => {
  const { wishlist } = useCart();
  const { data: catalog = [], isLoading } = useQuery({
    queryKey: productsQueryKey,
    queryFn: fetchProducts,
  });
  const wishedProducts = catalog.filter((p) => wishlist.includes(p.id));

  if (isLoading) {
    return (
      <div className="container-main section-padding">
        <div className="h-8 w-48 bg-secondary rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl aspect-[3/4] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (wishedProducts.length === 0)
    return (
      <div className="container-main section-padding text-center">
        <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-heading font-bold mb-2">Your wishlist is empty</h2>
        <p className="text-muted-foreground mb-6">Save items you love for later.</p>
        <Link to="/products" className="btn-gradient inline-block">Browse Products</Link>
      </div>
    );

  return (
    <div className="container-main section-padding">
      <h1 className="text-2xl font-heading font-bold mb-8">Wishlist ({wishedProducts.length})</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {wishedProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>
    </div>
  );
};

export default Wishlist;
