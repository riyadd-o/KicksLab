import { create } from 'zustand';
import { Product } from './products';

export interface CartItem {
  product: Product;
  size: number;
  quantity: number;
}

export interface ShippingZoneItem {
  id: string;
  name: string;
  city: string;
  fee: number;
}

export interface StoredCartData {
  cart: CartItem[];
  couponCode: string | null;
  discountPercentage: number;
  couponDiscountType: 'percentage' | 'fixed' | null;
  couponDiscountValue: number;
  selectedZone: ShippingZoneItem | null;
  shippingMethod: string | null;
  shippingCost: number;
}

function getCartStorageKey(userId: string | null): string {
  return userId ? `kickslab_cart_user_${userId}` : `kickslab_cart_guest`;
}

function getWishlistStorageKey(userId: string | null): string {
  return userId ? `kickslab_wishlist_user_${userId}` : `kickslab_wishlist_guest`;
}

function readStoredCart(userId: string | null): StoredCartData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getCartStorageKey(userId));
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function writeStoredCart(userId: string | null, data: StoredCartData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getCartStorageKey(userId), JSON.stringify(data));
  } catch (e) {}
}

function readStoredWishlist(userId: string | null): Product[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getWishlistStorageKey(userId));
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function writeStoredWishlist(userId: string | null, items: Product[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getWishlistStorageKey(userId), JSON.stringify(items));
  } catch (e) {}
}

interface CartState {
  currentUserId: string | null;
  cart: CartItem[];
  couponCode: string | null;
  discountPercentage: number;
  couponDiscountType: 'percentage' | 'fixed' | null;
  couponDiscountValue: number;
  selectedZone: ShippingZoneItem | null;
  shippingMethod: string | null;
  shippingCost: number;

  addToCart: (product: Product, size: number, quantity: number) => void;
  removeFromCart: (productId: string, size: number) => void;
  updateQuantity: (productId: string, size: number, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, percentage: number, type?: 'percentage' | 'fixed', value?: number) => void;
  removeCoupon: () => void;
  setSelectedZone: (zone: ShippingZoneItem | null, computedFee?: number) => void;
  setShippingMethod: (method: string | null, fee?: number) => void;
  setShipping: (method: string, fee?: number) => void;

  syncUser: (userId: string | null) => void;
  detachUser: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  currentUserId: null,
  cart: [],
  couponCode: null,
  discountPercentage: 0,
  couponDiscountType: null,
  couponDiscountValue: 0,
  selectedZone: null,
  shippingMethod: null,
  shippingCost: 0,

  setSelectedZone: (zone, computedFee) =>
    set((state) => {
      const next = {
        selectedZone: zone,
        shippingMethod: zone ? zone.name : null,
        shippingCost: computedFee !== undefined ? computedFee : zone ? zone.fee : 0,
      };
      writeStoredCart(state.currentUserId, { ...state, ...next });
      return next;
    }),

  setShippingMethod: (method, fee = 0) =>
    set((state) => {
      const next = {
        shippingMethod: method,
        shippingCost: fee,
      };
      writeStoredCart(state.currentUserId, { ...state, ...next });
      return next;
    }),

  setShipping: (method, fee = 0) =>
    set((state) => {
      const next = {
        shippingMethod: method,
        shippingCost: fee,
      };
      writeStoredCart(state.currentUserId, { ...state, ...next });
      return next;
    }),

  addToCart: (product, size, quantity) =>
    set((state) => {
      const existingIndex = state.cart.findIndex(
        (item) => item.product.id === product.id && item.size === size
      );
      let newCart: CartItem[];
      if (existingIndex > -1) {
        newCart = [...state.cart];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + quantity,
        };
      } else {
        newCart = [...state.cart, { product, size, quantity }];
      }
      writeStoredCart(state.currentUserId, { ...state, cart: newCart });
      return { cart: newCart };
    }),

  removeFromCart: (productId, size) =>
    set((state) => {
      const newCart = state.cart.filter(
        (item) => !(item.product.id === productId && item.size === size)
      );
      writeStoredCart(state.currentUserId, { ...state, cart: newCart });
      return { cart: newCart };
    }),

  updateQuantity: (productId, size, quantity) =>
    set((state) => {
      let newCart: CartItem[];
      if (quantity <= 0) {
        newCart = state.cart.filter(
          (item) => !(item.product.id === productId && item.size === size)
        );
      } else {
        newCart = state.cart.map((item) =>
          item.product.id === productId && item.size === size
            ? { ...item, quantity }
            : item
        );
      }
      writeStoredCart(state.currentUserId, { ...state, cart: newCart });
      return { cart: newCart };
    }),

  clearCart: () =>
    set((state) => {
      const next = {
        cart: [],
        couponCode: null,
        discountPercentage: 0,
        couponDiscountType: null,
        couponDiscountValue: 0,
        selectedZone: null,
        shippingMethod: null,
        shippingCost: 0,
      };

      if (typeof window !== 'undefined') {
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('kickslab_cart_') || key === 'kickslab-cart-storage')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));
        } catch (e) {}
      }

      writeStoredCart(state.currentUserId, { ...state, ...next });
      writeStoredCart(null, { ...state, ...next });
      return next;
    }),

  applyCoupon: (code, percentage, type = 'percentage', value = percentage) =>
    set((state) => {
      const next = {
        couponCode: code,
        discountPercentage: percentage,
        couponDiscountType: type,
        couponDiscountValue: value,
      };
      writeStoredCart(state.currentUserId, { ...state, ...next });
      return next;
    }),

  removeCoupon: () =>
    set((state) => {
      const next = {
        couponCode: null,
        discountPercentage: 0,
        couponDiscountType: null,
        couponDiscountValue: 0,
      };
      writeStoredCart(state.currentUserId, { ...state, ...next });
      return next;
    }),

  syncUser: (userId: string | null) => {
    set((state) => {
      // If already synchronized with this user ID, do nothing
      if (state.currentUserId === userId) return state;

      // Save previous state to previous user key
      writeStoredCart(state.currentUserId, {
        cart: state.cart,
        couponCode: state.couponCode,
        discountPercentage: state.discountPercentage,
        couponDiscountType: state.couponDiscountType,
        couponDiscountValue: state.couponDiscountValue,
        selectedZone: state.selectedZone,
        shippingMethod: state.shippingMethod,
        shippingCost: state.shippingCost,
      });

      // If transition from Guest (null) to Authenticated User (userId):
      // Intentionally merge guest items into the authenticated customer's cart
      if (state.currentUserId === null && userId !== null) {
        const guestData = readStoredCart(null);
        const userData = readStoredCart(userId) || {
          cart: [],
          couponCode: null,
          discountPercentage: 0,
          couponDiscountType: null,
          couponDiscountValue: 0,
          selectedZone: null,
          shippingMethod: null,
          shippingCost: 0,
        };

        const mergedCart = [...userData.cart];
        if (guestData && Array.isArray(guestData.cart) && guestData.cart.length > 0) {
          for (const gItem of guestData.cart) {
            const idx = mergedCart.findIndex(
              (item) => item.product.id === gItem.product.id && item.size === gItem.size
            );
            if (idx > -1) {
              mergedCart[idx] = {
                ...mergedCart[idx],
                quantity: mergedCart[idx].quantity + gItem.quantity,
              };
            } else {
              mergedCart.push(gItem);
            }
          }
          // Clear guest cart from storage so it does not linger for other users
          try {
            localStorage.removeItem(getCartStorageKey(null));
          } catch (e) {}
        }

        const mergedData: StoredCartData = {
          cart: mergedCart,
          couponCode: userData.couponCode || guestData?.couponCode || null,
          discountPercentage: userData.discountPercentage || guestData?.discountPercentage || 0,
          couponDiscountType: userData.couponDiscountType || guestData?.couponDiscountType || null,
          couponDiscountValue: userData.couponDiscountValue || guestData?.couponDiscountValue || 0,
          selectedZone: userData.selectedZone || guestData?.selectedZone || null,
          shippingMethod: userData.shippingMethod || guestData?.shippingMethod || null,
          shippingCost: userData.shippingCost || guestData?.shippingCost || 0,
        };

        writeStoredCart(userId, mergedData);

        return {
          ...state,
          currentUserId: userId,
          ...mergedData,
        };
      }

      // Normal load of target user's cart (or target guest cart)
      const targetData = readStoredCart(userId) || {
        cart: [],
        couponCode: null,
        discountPercentage: 0,
        couponDiscountType: null,
        couponDiscountValue: 0,
        selectedZone: null,
        shippingMethod: null,
        shippingCost: 0,
      };

      return {
        ...state,
        currentUserId: userId,
        ...targetData,
      };
    });
  },

  detachUser: () => {
    set((state) => {
      // Save current user state before detaching
      if (state.currentUserId) {
        writeStoredCart(state.currentUserId, {
          cart: state.cart,
          couponCode: state.couponCode,
          discountPercentage: state.discountPercentage,
          couponDiscountType: state.couponDiscountType,
          couponDiscountValue: state.couponDiscountValue,
          selectedZone: state.selectedZone,
          shippingMethod: state.shippingMethod,
          shippingCost: state.shippingCost,
        });
      }

      // Remove legacy shared storage key if still present in browser
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('kickslab-cart-storage');
        } catch (e) {}
      }

      // Detach and clear active memory immediately
      return {
        ...state,
        currentUserId: null,
        cart: [],
        couponCode: null,
        discountPercentage: 0,
        couponDiscountType: null,
        couponDiscountValue: 0,
        selectedZone: null,
        shippingMethod: null,
        shippingCost: 0,
      };
    });
  },
}));

interface WishlistState {
  currentUserId: string | null;
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  syncUser: (userId: string | null) => void;
  detachUser: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  currentUserId: null,
  wishlist: [],

  toggleWishlist: (product) =>
    set((state) => {
      const exists = state.wishlist.some((item) => item.id === product.id);
      const newWishlist = exists
        ? state.wishlist.filter((item) => item.id !== product.id)
        : [...state.wishlist, product];
      writeStoredWishlist(state.currentUserId, newWishlist);
      return { wishlist: newWishlist };
    }),

  removeFromWishlist: (productId) =>
    set((state) => {
      const newWishlist = state.wishlist.filter((item) => item.id !== productId);
      writeStoredWishlist(state.currentUserId, newWishlist);
      return { wishlist: newWishlist };
    }),

  isInWishlist: (productId) => {
    return get().wishlist.some((item) => item.id === productId);
  },

  syncUser: (userId: string | null) => {
    set((state) => {
      if (state.currentUserId === userId) return state;

      writeStoredWishlist(state.currentUserId, state.wishlist);

      // If transition from guest to user: merge guest wishlist into user's wishlist
      if (state.currentUserId === null && userId !== null) {
        const guestItems = readStoredWishlist(null) || [];
        const userItems = readStoredWishlist(userId) || [];

        const merged = [...userItems];
        for (const gItem of guestItems) {
          if (!merged.some((item) => item.id === gItem.id)) {
            merged.push(gItem);
          }
        }

        try {
          localStorage.removeItem(getWishlistStorageKey(null));
        } catch (e) {}

        writeStoredWishlist(userId, merged);
        return {
          ...state,
          currentUserId: userId,
          wishlist: merged,
        };
      }

      const targetItems = readStoredWishlist(userId) || [];
      return {
        ...state,
        currentUserId: userId,
        wishlist: targetItems,
      };
    });
  },

  detachUser: () => {
    set((state) => {
      if (state.currentUserId) {
        writeStoredWishlist(state.currentUserId, state.wishlist);
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('kickslab-wishlist-storage');
        } catch (e) {}
      }
      return {
        ...state,
        currentUserId: null,
        wishlist: [],
      };
    });
  },
}));

interface UiState {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  wishlistOpen: boolean;
  setWishlistOpen: (open: boolean) => void;
  bannerVisible: boolean;
  setBannerVisible: (visible: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  cartOpen: false,
  setCartOpen: (open) => set({ cartOpen: open }),
  wishlistOpen: false,
  setWishlistOpen: (open) => set({ wishlistOpen: open }),
  bannerVisible: true,
  setBannerVisible: (visible) => set({ bannerVisible: visible }),
}));
