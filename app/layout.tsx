import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import { AppNav } from '@/components/app-nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Steel Inventory',
  description: 'Material master and inward (MRN) for steel trading',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Weighbridge operators work on phones; keep pinch-zoom available.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AppNav />
        <main className="mx-auto max-w-[1400px] px-4 py-5">{children}</main>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
