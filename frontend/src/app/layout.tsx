import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/providers/query-provider';

export const metadata: Metadata = {
  title: 'Babnunur - AI Productivity Platform',
  description: 'Enterprise AI SaaS platform with chat, documents, search, and automation.',
  keywords: ['AI', 'productivity', 'chat', 'documents', 'automation'],
  authors: [{ name: 'Babnunur' }],
  openGraph: {
    title: 'Babnunur - AI Productivity Platform',
    description: 'Enterprise AI SaaS platform with chat, documents, search, and automation.',
    type: 'website',
    siteName: 'Babnunur',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Babnunur - AI Productivity Platform',
    description: 'Enterprise AI SaaS platform with chat, documents, search, and automation.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
