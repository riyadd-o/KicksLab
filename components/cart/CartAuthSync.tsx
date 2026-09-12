'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useCartStore, useWishlistStore } from '@/lib/store';

export default function CartAuthSync() {
  const pathname = usePathname();
  const lastCheckedUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // Only check in browser
    if (typeof window === 'undefined') return;

    let isMounted = true;

    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        const currentId: string | null = data?.user?.id || null;

        if (lastCheckedUserId.current !== currentId) {
          lastCheckedUserId.current = currentId;
          useCartStore.getState().syncUser(currentId);
          useWishlistStore.getState().syncUser(currentId);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        if (lastCheckedUserId.current !== null) {
          lastCheckedUserId.current = null;
          useCartStore.getState().syncUser(null);
          useWishlistStore.getState().syncUser(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  return null;
}
