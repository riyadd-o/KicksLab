'use client';

import { usePathname } from 'next/navigation';

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminOrStaff = pathname.startsWith('/admin') || pathname.startsWith('/staff');
  const isHomepage = pathname === '/';

  return (
    <main className={`flex-1 flex flex-col ${isAdminOrStaff ? '' : isHomepage ? '-mt-[76px]' : ''}`}>
      {children}
    </main>
  );
}
