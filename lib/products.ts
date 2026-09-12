export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: 'Sneakers' | 'Heels' | 'Boots' | 'Loafers' | 'Sandals' | string;
  sizes: number[] | string[];
  images: string[];
  rating: number;
  reviewsCount?: number;
  description: string;
  features?: string[];
  isNew?: boolean;
  featured?: boolean;
  topSelling?: boolean;
  onSale?: boolean;
  originalPrice?: number | null;
  stock?: number;
  gender: 'Men' | 'Women' | 'Unisex' | string;
  isLimitedDrop?: boolean;
  isDropItem?: boolean;
  dropPrice?: number;
  dropDiscountBadge?: string;
}

// All products are now managed strictly through the admin panel / database.
export const products: Product[] = [];
