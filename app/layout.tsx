import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { AppNav } from '@/components/app-nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Steel Inventory',
  description: 'Material master and inward (MRN) for steel trading',
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
