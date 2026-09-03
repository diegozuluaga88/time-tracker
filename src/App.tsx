import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import Login from "./Login"
import OCRTracking from "./OCRTracking"
import FeedbackBoard from "./FeedbackBoard"
import Transactions from "./Transactions"
import Comparisons from "./Comparisons"
import Navbar from "./components/Navbar"
import SessionExpiryModal from "./components/SessionExpiryModal"

// Split note · Catalog/Quote section movida al repo expert-catalog.
// Para retomar el state previo · `git checkout backup/with-catalog` o
// `git checkout v-with-catalog-snapshot`.
// OrderDetail/AckDetail full pages removidos · Transactions ahora usa
// DocumentReviewModal (de OCR) para todos los previews.

type Page = 'ocr-tracking' | 'feedback' | 'transactions' | 'comparisons'

export interface ConvertedDocument {
  id: string
  vendor: string
  name: string
  type: 'po' | 'ack'
  tab: 'orders' | 'acknowledgments'
}

function App() {
  const { user, initialLoading, signOut, showSessionWarning, refreshSession } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('ocr-tracking')
  const [convertedDoc, setConvertedDoc] = useState<ConvertedDocument | null>(null)

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page)
  }

  const handleLogout = () => {
    signOut()
  }

  const handleConvertFromOCR = (doc: ConvertedDocument) => {
    setConvertedDoc(doc)
    setCurrentPage('transactions')
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'feedback':
        return <FeedbackBoard onLogout={handleLogout} onNavigate={handleNavigate} />
      case 'comparisons':
        return <Comparisons onLogout={handleLogout} onNavigate={handleNavigate} />
      case 'transactions':
        return (
          <>
            <Navbar
              onLogout={handleLogout}
              activeTab="Transactions"
              onNavigateToWorkspace={() => setCurrentPage('transactions')}
              onNavigate={handleNavigate}
            />
            <Transactions
              onLogout={handleLogout}
              onNavigateToWorkspace={() => setCurrentPage('transactions')}
              onNavigate={handleNavigate}
              convertedDoc={convertedDoc}
            />
          </>
        )
      default:
        return (
          <OCRTracking
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            onConvertDocument={handleConvertFromOCR}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {renderPage()}
      <SessionExpiryModal
        isOpen={showSessionWarning}
        onExtend={refreshSession}
        onLogout={handleLogout}
      />
    </div>
  )
}

export default App
