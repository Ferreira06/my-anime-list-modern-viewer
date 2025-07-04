// app/providers/CustomThemeProvider.tsx
'use client';

import React, { useState, useMemo, createContext, useContext } from 'react';
import { ThemeProvider, createTheme, PaletteMode } from '@mui/material';
import { getDesignTokens } from '@/app/theme/theme';

// Create a context for the color mode
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

export default function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>('dark');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode: PaletteMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  // Update the theme only when the mode changes
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export const useColorMode = () => useContext(ColorModeContext);