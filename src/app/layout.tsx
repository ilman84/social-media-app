import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import ClientProviders from '@/components/ClientProviders';
import FlashOnRoute from '@/components/FlashOnRoute';

export const metadata: Metadata = {
  title: 'Sociality - Social Media App',
  description: 'Connect and share with friends on Sociality',
  icons: {
    icon: '/images/like-icon.svg',
    shortcut: '/images/like-icon.svg',
    apple: '/images/like-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className='antialiased'>
        <ClientProviders>
          {children}
          <Toaster richColors closeButton position='top-center' />
          <FlashOnRoute />
        </ClientProviders>
      </body>
    </html>
  );
}
