import { SessionProvider } from 'next-auth/react';
import './globals.css';

import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'Neleo C4',
  description: 'Admin dashboard'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen w-full flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
      <Analytics />
    </html>
  );
}
