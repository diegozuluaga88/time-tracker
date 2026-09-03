// TT.33 · Diego 2026-09-03 · Navbar simplificado · versión standalone
// Time Tracker. Del template expert-hub original se quitaron:
//   - TENANT selector (dropdown de dealers)
//   - Nav tabs Feedback / OCR / Transactions / Comparisons
//   - Bell notifications (sin handler)
//   - Role label "Expert" en avatar
// Queda: logo Strata · title Time Tracker · theme toggle · avatar + sign out.

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from 'strata-design-system'
import { Moon, Sun, LogOut, ChevronDown, KeyRound, Clock } from 'lucide-react'
import logoLightBrand from '../assets/logo-light-brand.png'
import logoDarkBrand from '../assets/logo-dark-brand.png'
import ChangePasswordModal from './auth/ChangePasswordModal'

interface NavbarProps {
    onLogout: () => void
}

export default function Navbar({ onLogout }: NavbarProps) {
    const { theme, toggleTheme } = useTheme()
    const { user } = useAuth()
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const [showChangePassword, setShowChangePassword] = useState(false)

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Designer'

    return (
        <>
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 min-w-[60vw] max-w-fit lg:min-w-0 lg:max-w-7xl lg:w-[80vw]">
                <div className="relative flex items-center justify-between px-3 py-2 rounded-full gap-3 bg-card/80 backdrop-blur-xl border border-border shadow-lg dark:shadow-glow-md">

                    {/* Left · Logo + Time Tracker title */}
                    <div className="flex items-center gap-3">
                        <div className="px-2 shrink-0">
                            <img src={logoLightBrand} alt="Strata" className="h-8 w-20 object-contain block dark:hidden" />
                            <img src={logoDarkBrand} alt="Strata" className="h-8 w-20 object-contain hidden dark:block" />
                        </div>
                        <div className="w-px h-6 bg-border"></div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="text-sm font-bold text-foreground">Time Tracker</span>
                        </div>
                    </div>

                    {/* Right · Theme toggle + user menu */}
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={toggleTheme}
                            className="flex items-center justify-center h-9 w-9 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>

                        <div className="w-px h-6 bg-border mx-1"></div>

                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-muted transition-colors"
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face"
                                    alt={displayName}
                                    className="w-8 h-8 rounded-full object-cover border-2 border-border"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                                <div className="w-8 h-8 rounded-full bg-ai flex items-center justify-center text-white text-xs font-bold hidden">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="hidden md:block text-left">
                                    <div className="text-xs font-semibold text-foreground leading-tight truncate max-w-[120px]">{displayName}</div>
                                </div>
                                <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
                            </button>

                            {isUserMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 p-1">
                                        <div className="px-3 py-2 border-b border-border mb-1">
                                            <div className="text-sm font-medium text-foreground">{displayName}</div>
                                            <div className="text-xs text-muted-foreground">{user?.email || 'designer@wurkwel.com'}</div>
                                        </div>
                                        <button
                                            onClick={() => { setIsUserMenuOpen(false); setShowChangePassword(true); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                                        >
                                            <KeyRound className="h-4 w-4" />
                                            Change Password
                                        </button>
                                        <button
                                            onClick={() => { setIsUserMenuOpen(false); onLogout(); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive-soft rounded-lg transition-colors"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ChangePasswordModal
                isOpen={showChangePassword}
                onClose={() => setShowChangePassword(false)}
            />
        </>
    )
}
