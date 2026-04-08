import React, { createContext, useContext, useState, useCallback } from "react";
import type { Product } from "@/data/products";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const addToCart = useCallback((product: Product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { product, quantity: qty }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => setItems((p) => p.filter((i) => i.product.id !== id)), []);
  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty < 1) return;
    setItems((p) => p.map((i) => i.product.id === id ? { ...i, quantity: qty } : i));
  }, []);
  const clearCart = useCallback(() => setItems([]), []);
  const toggleWishlist = useCallback((id: string) => setWishlist((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, wishlist, toggleWishlist, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};
