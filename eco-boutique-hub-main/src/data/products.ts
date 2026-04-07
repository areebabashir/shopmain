/** Product shape aligned with backend `formatProduct` (id is Mongo ObjectId string). */
export interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  badge?: string;
  description: string;
  specs: Record<string, string>;
  inStock: boolean;
  stock?: number;
  createdAt?: string;
}

export const categories = [
  { id: 1, name: "Electronics", icon: "📱", count: 245 },
  { id: 2, name: "Fashion", icon: "👕", count: 532 },
  { id: 3, name: "Home & Living", icon: "🏠", count: 189 },
  { id: 4, name: "Beauty", icon: "💄", count: 312 },
  { id: 5, name: "Sports", icon: "⚽", count: 156 },
  { id: 6, name: "Books", icon: "📚", count: 423 },
  { id: 7, name: "Toys", icon: "🧸", count: 98 },
  { id: 8, name: "Groceries", icon: "🛒", count: 287 },
];

export const testimonials = [
  { id: 1, name: "Sarah M.", text: "Amazing quality products and super fast delivery. Will definitely shop again!", rating: 5, avatar: "SM" },
  { id: 2, name: "James K.", text: "The customer service is outstanding. They resolved my issue within hours.", rating: 5, avatar: "JK" },
  { id: 3, name: "Emily R.", text: "Best prices I've found online. The flash sales are incredible!", rating: 4, avatar: "ER" },
];
