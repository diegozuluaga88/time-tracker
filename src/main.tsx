import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TenantProvider } from './TenantContext'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from 'strata-design-system'

// Split note · Catalog/Quote movidos al repo expert-catalog (snapshot en
// branch `backup/with-catalog` y tag `v-with-catalog-snapshot` de este repo).
// El QuoteProvider vivía aquí porque catálogo lo consumía; ya no aplica.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <TenantProvider>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <App />
        </ThemeProvider>
      </TenantProvider>
    </AuthProvider>
  </StrictMode>,
)
