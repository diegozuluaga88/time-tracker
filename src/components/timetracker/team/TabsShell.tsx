// TT.41 · Diego 2026-09-03 · Team View tabs · segmented control pattern.
// Preserva state del tab activo · pasa el active tab id al children via
// render prop pattern. Uses Nielsen H4 consistency (same interaction as
// mode-switch del Time Tracker header).

import { useState, type ReactNode } from 'react'

export interface TabDef {
    id: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    badge?: number
    badgeTone?: 'muted' | 'warning' | 'destructive'
}

interface Props {
    tabs: TabDef[]
    defaultTabId?: string
    children: (activeTabId: string) => ReactNode
}

export default function TabsShell({ tabs, defaultTabId, children }: Props) {
    const [active, setActive] = useState<string>(defaultTabId ?? tabs[0]?.id ?? '')

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
                {tabs.map(tab => {
                    const Icon = tab.icon
                    const isActive = active === tab.id
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActive(tab.id)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                                isActive
                                    ? 'border-primary text-foreground'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                            }`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                            {tab.badge != null && tab.badge > 0 && (
                                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold tabular-nums ${
                                    tab.badgeTone === 'destructive' ? 'bg-destructive text-destructive-foreground' :
                                    tab.badgeTone === 'warning' ? 'bg-warning text-warning-foreground' :
                                    'bg-muted text-foreground'
                                }`}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
            <div>{children(active)}</div>
        </div>
    )
}
