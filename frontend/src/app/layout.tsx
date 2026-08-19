import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PharmaLaunch — Enterprise Launch Forecasting Platform',
  description: 'Pharmaceutical launch decision support platform powered by Bass diffusion and Gower similarity models.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-100">
      <body className={`${inter.className} h-full flex antialiased`}>
        <Sidebar />
        <main className="flex-1 flex flex-col min-h-screen bg-slate-50 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
