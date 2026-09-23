import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from '../components/Providers.js';

export const metadata: Metadata = {
  title: 'Arghya — puja samagri, havan kits & festival essentials',
  description:
    'Puja kits, havan samagri, ghee and festival essentials — pandit-verified contents, delivered before your muhurat.',
};

export const viewport: Viewport = {
  themeColor: '#B7322A',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Marcellus&family=Karla:wght@400;500;700&family=Tiro+Devanagari+Hindi&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
