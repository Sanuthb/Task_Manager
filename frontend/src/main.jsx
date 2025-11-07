import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'

const theme = createTheme({
  shape: { borderRadius: 12 },
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1' },
    secondary: { main: '#06b6d4' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    success: { main: '#22c55e' },
    background: { default: '#0f172a', paper: '#111827' },
    text: { primary: '#ffffff', secondary: 'rgba(255,255,255,0.72)' },
    divider: 'rgba(255,255,255,0.12)'
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 800 },
    subtitle1: { fontWeight: 700 },
    button: { fontWeight: 700 }
  },
  components: {
    MuiPaper: { styleOverrides: { root: { borderRadius: 16, backgroundImage: 'none', backgroundColor: '#111827' } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 16, boxShadow: '0 10px 24px rgba(0,0,0,0.35)', backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.08)' } } },
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 700, borderRadius: 10 } } },
    MuiAppBar: { styleOverrides: { root: { borderRadius: 0, backgroundColor: '#0f172a' } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundColor: '#0f172a', color: '#ffffff', borderRight: '1px solid rgba(255,255,255,0.08)' } } },
    MuiListItemButton: { styleOverrides: { root: { borderRadius: 8, margin: '4px 8px' } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 700 } } }
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
