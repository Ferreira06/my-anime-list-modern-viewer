// app/theme/theme.ts
import { PaletteMode } from '@mui/material';
import { amber, deepOrange, grey } from '@mui/material/colors';
import { Property } from 'csstype'; // Import the Property type

export const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Palette values for light mode
          primary: {
            main: '#6366F1', // Indigo
          },
          secondary: {
            main: '#EC4899', // Pink
          },
          divider: 'rgba(0, 0, 0, 0.12)',
          background: {
            default: '#F9FAFB', // Cooler, lighter grey
            paper: '#FFFFFF',
          },
          text: {
            primary: grey[900],
            secondary: grey[700],
          },
        }
      : {
          // Palette values for dark mode
          primary: {
            main: '#818CF8', // Lighter Indigo
          },
          secondary: {
            main: '#F472B6', // Lighter Pink
          },
          divider: 'rgba(255, 255, 255, 0.12)',
          background: {
            default: '#111827', // Dark blue-grey
            paper: '#1F2937',   // Lighter blue-grey for cards
          },
          text: {
            primary: '#FFFFFF',
            secondary: grey[400],
          },
        }),
  },
  shape: {
    borderRadius: 12, // Softer, more modern border radius
  },
  typography: {
    fontFamily: ['Inter', 'sans-serif'].join(','),
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          // ✅ FIX: Explicitly type the CSS property
          textTransform: 'none' as Property.TextTransform,
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Reset ugly default gradients in some cases
        },
        elevation1: {
           boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
        },
        elevation2: {
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.05)',
        }
      },
    },
     MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
     MuiLinearProgress: {
        styleOverrides: {
            root: {
                height: 8,
                borderRadius: 4,
            }
        }
     },
     MuiTooltip: {
        styleOverrides: {
            tooltip: {
                backgroundColor: grey[mode === 'light' ? 800 : 700],
            },
            arrow: {
                color: grey[mode === 'light' ? 800 : 700],
            }
        }
     }
  },
});