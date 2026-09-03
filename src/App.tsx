// TT.33 · Diego 2026-09-03 · standalone Time Tracker · las 4 páginas
// heredadas del template (OCR/Feedback/Transactions/Comparisons) fueron
// eliminadas · el app es 100% Time Tracker post-login.

import { useAuth } from './context/AuthContext'
import Login from "./Login"
import TimeTracker from "./TimeTracker"
import SessionExpiryModal from "./components/SessionExpiryModal"

function App() {
  const { user, initialLoading, signOut, showSessionWarning, refreshSession } = useAuth()

  const handleLogout = () => {
    signOut()
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TimeTracker onLogout={handleLogout} />
      <SessionExpiryModal
        isOpen={showSessionWarning}
        onExtend={refreshSession}
        onLogout={handleLogout}
      />
    </div>
  )
}

export default App
