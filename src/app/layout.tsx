// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import CssBaseline from '@mui/material/CssBaseline';
import CustomThemeProvider from './providers/CustomThemeProvider';
import { FeedbackProvider } from './providers/FeedbackProvider'; // Ensure path is correct

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'My Anime List',
  description: 'Organize your anime list with a modern style using Next.js and MUI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CustomThemeProvider>
          <FeedbackProvider>
            {/* CssBaseline must be inside the ThemeProvider to work correctly */}
            <CssBaseline />
            {children}
          </FeedbackProvider>
        </CustomThemeProvider>
      </body>
    </html>
  );
}