'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/materials', label: 'Materials' },
  { href: '/inward', label: 'Inward' },
  { href: '/settings/is808', label: 'IS 808' },
  { href: '/settings/di-classes', label: 'DI classes' },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-[--background]">
      <div className="mx-auto flex h-12 max-w-[1400px] items-center gap-1 px-4">
        <Link href="/materials" className="mr-4 text-sm font-semibold tracking-tight">
          Steel<span className="text-[--muted-foreground]">/Inventory</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap transition-colors',
                  active
                    ? 'bg-[--secondary] font-medium text-[--secondary-foreground]'
                    : 'text-[--muted-foreground] hover:text-[--foreground]',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
