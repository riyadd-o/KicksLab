import { products } from './products';

export const INITIAL_PRODUCTS = products;

export const INITIAL_CATEGORIES = [
  { id: 'c1', name: 'Sneakers', count: 142 },
  { id: 'c2', name: 'Heels', count: 45 },
  { id: 'c3', name: 'Boots', count: 38 },
  { id: 'c4', name: 'Loafers', count: 24 },
  { id: 'c5', name: 'Sandals', count: 56 },
];

export const INITIAL_COUPONS: any[] = [];

export const INITIAL_MESSAGES = [
  { id: 'm1', name: 'Abebe Kebede', email: 'abebe@example.com', subject: 'Order Delay', date: 'Oct 15, 2025', read: false, content: 'My order KL-123456 is taking longer than expected. Can you check?' },
  { id: 'm2', name: 'Sara Yilma', email: 'sara@example.com', subject: 'Product Restock', date: 'Oct 14, 2025', read: true, content: 'When will the Jordan 1s be restocked in size 38?' },
];

export function getMockData(key: string, initialData: any) {
  if (typeof window === 'undefined') return initialData;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return initialData;
    }
  }
  localStorage.setItem(key, JSON.stringify(initialData));
  return initialData;
}
