// TT.1 · Diego 2026-09-03 · Time Tracker root page.
// Two role-aware surfaces via segmented control: My Timesheet (designer)
// + Team View (manager · shell only in TT.1 · Manager Dashboard lives in
// TT.2). Designer default landing = My Timesheet.
//
// Header + tabs card matches OCRTracking pattern (bg-card rounded-2xl
// border shadow-sm) for consistency with the rest of expert-hub.

import { useMemo, useState } from 'react'
import { Clock, ChevronLeft, ChevronRight, User, Users } from 'lucide-react'
import Navbar from './components/Navbar'
import Breadcrumbs from './components/Breadcrumbs'
import { ToastContainer, useToast } from './components/AuthToast'
import WeeklyGrid, { mondayOf } from './components/timetracker/WeeklyGrid'
import TimeEntryForm from './components/timetracker/TimeEntryForm'
import { TIME_ENTRIES, type TimeEntry, type DesignerId } from './data/timeEntries'
import { TODAY_ISO } from './data/projects'
import { coachingCopy } from './data/coachingCopy'

interface Props {
    onLogout: () => void
    onNavigate: (page: string) => void
}

type Mode = 'my-timesheet' | 'team-view'

export default function TimeTracker({ onLogout, onNavigate }: Props) {
    // TT.1 · single designer scope (designer role default = 'me').
    // TT.2 · Team View will unlock manager surface.
    const [mode, setMode] = useState<Mode>('my-timesheet')
    const [designerId] = useState<DesignerId>('me')
    const [weekMonday, setWeekMonday] = useState(() => mondayOf(TODAY_ISO))
    const [entries, setEntries] = useState<TimeEntry[]>(TIME_ENTRIES)
    const [formOpen, setFormOpen] = useState(false)
    const [formDate, setFormDate] = useState<string>(TODAY_ISO)
    const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
    // TT.2 · pre-fill from drag-create
    const [formInitialDurationMin, setFormInitialDurationMin] = useState<number | undefined>()
    const [formInitialStartMin, setFormInitialStartMin] = useState<number | undefined>()
    const { toasts, addToast, dismissToast } = useToast()

    const handleAddEntry = (date: string, durationMinutes?: number, startMinutes?: number) => {
        setFormDate(date)
        setEditingEntry(null)
        setFormInitialDurationMin(durationMinutes)
        setFormInitialStartMin(startMinutes)
        setFormOpen(true)
    }
    const handleEditEntry = (e: TimeEntry) => {
        setFormDate(e.date)
        setEditingEntry(e)
        setFormOpen(true)
    }
    const handleSave = (draft: Omit<TimeEntry, 'id'>) => {
        if (editingEntry) {
            setEntries(prev => prev.map(e => e.id === editingEntry.id ? { ...editingEntry, ...draft } : e))
        } else {
            const newEntry: TimeEntry = { ...draft, id: `TE-NEW-${Date.now()}` }
            setEntries(prev => [...prev, newEntry])
        }
    }
    const handleDelete = (entryId: string) => {
        setEntries(prev => prev.filter(e => e.id !== entryId))
        addToast('info', 'Entry deleted')
    }
    // TT.2 · drag-to-move handler
    const handleMoveEntry = (entryId: string, newDateIso: string, newStartMinutes: number) => {
        setEntries(prev => prev.map(e => e.id === entryId ? { ...e, date: newDateIso, startMinutesFromMidnight: newStartMinutes } : e))
        addToast('success', `Moved to ${formatDayShort(newDateIso)}, ${formatTime(newStartMinutes)}`)
    }
    // TT.2 · drag-to-resize handler
    const handleResizeEntry = (entryId: string, newDurationMinutes: number) => {
        setEntries(prev => prev.map(e => e.id === entryId ? { ...e, durationMinutes: newDurationMinutes } : e))
        addToast('info', `Duration updated to ${(newDurationMinutes / 60).toFixed(2).replace(/\.?0+$/, '')}h`)
    }
    const handleDeliverableDispatched = (info: { entryId: string | null; projectId: string; salesRepName: string; timestampIso: string }) => {
        // Persist deliverableSentAt on the entry (if we can find it).
        if (info.entryId) {
            setEntries(prev => prev.map(e => e.id === info.entryId ? { ...e, deliverableComplete: true, deliverableSentAt: info.timestampIso } : e))
        }
        addToast('success', coachingCopy.deliverableSent({
            salesRepName: info.salesRepName,
            projectName: '', // covered by the checkbox toast · this one is the global confirm
            undoWindowSeconds: 0,
        }))
    }

    const goPrevWeek = () => setWeekMonday(shiftMonday(weekMonday, -7))
    const goNextWeek = () => setWeekMonday(shiftMonday(weekMonday, 7))
    const goToday = () => setWeekMonday(mondayOf(TODAY_ISO))

    const currentWeekLabel = useMemo(() => formatMondayLabel(weekMonday), [weekMonday])
    const isCurrentWeek = weekMonday === mondayOf(TODAY_ISO)

    return (
        <div className="min-h-screen bg-background font-sans text-foreground pb-10">
            <Navbar onLogout={onLogout} activeTab="Time Tracker" onNavigateToWorkspace={() => onNavigate('time-tracker')} onNavigate={onNavigate} />

            {/* Breadcrumb below navbar (align with expert-hub pattern) */}
            <div className="pt-24 px-4 max-w-screen-2xl mx-auto">
                <div className="text-xs">
                    <Breadcrumbs items={[
                        { label: 'Expert Hub', onClick: () => onNavigate('ocr-tracking') },
                        { label: 'Time Tracker', active: true },
                    ]} />
                </div>
            </div>

            <div className="pt-4 px-4 max-w-screen-2xl mx-auto space-y-6">
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    {/* Header: title + mode switch + week nav */}
                    <div className="p-6 border-b border-border">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
                                <h3 className="text-lg font-semibold text-foreground whitespace-nowrap">Time Tracker</h3>

                                {/* Mode switch · segmented control */}
                                <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
                                    <ModeButton active={mode === 'my-timesheet'} onClick={() => setMode('my-timesheet')} icon={User} label="My Timesheet" />
                                    <ModeButton active={mode === 'team-view'} onClick={() => setMode('team-view')} icon={Users} label="Team View" hint="Coming in TT.2 · Manager Dashboard" />
                                </div>

                                {/* Week nav on the right */}
                                <div className="ml-auto flex items-center gap-2">
                                    <button onClick={goPrevWeek} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Previous week">
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <div className="text-sm font-medium text-foreground min-w-[130px] text-center tabular-nums">
                                        {currentWeekLabel}
                                    </div>
                                    <button onClick={goNextWeek} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Next week">
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={goToday}
                                        disabled={isCurrentWeek}
                                        className="ml-1 text-xs font-semibold text-foreground border border-input rounded-md px-2.5 py-1.5 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Today
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content area */}
                    <div className="p-6">
                        {mode === 'my-timesheet' ? (
                            <WeeklyGrid
                                designerId={designerId}
                                weekMondayIso={weekMonday}
                                allEntries={entries}
                                onAddEntry={handleAddEntry}
                                onEditEntry={handleEditEntry}
                                onMoveEntry={handleMoveEntry}
                                onResizeEntry={handleResizeEntry}
                                todayIso={TODAY_ISO}
                            />
                        ) : (
                            <TeamViewPlaceholder />
                        )}
                    </div>
                </div>
            </div>

            {/* Entry form modal */}
            <TimeEntryForm
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                date={formDate}
                entry={editingEntry}
                allEntries={entries}
                onSave={handleSave}
                onDelete={handleDelete}
                onDeliverableDispatched={handleDeliverableDispatched}
                initialDurationMinutes={formInitialDurationMin}
                initialStartMinutes={formInitialStartMin}
            />

            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
    )
}

function ModeButton({ active, onClick, icon: Icon, label, hint }: { active: boolean; onClick: () => void; icon: any; label: string; hint?: string }) {
    return (
        <button
            onClick={onClick}
            title={hint}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 outline-none ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
            <Icon className="h-3.5 w-3.5" />
            {label}
        </button>
    )
}

function TeamViewPlaceholder() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Clock className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">Team View coming in TT.2</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Utilization heatmap, missing-time digest, outlier coaching cards, and training-gap sparklines land in the next iteration.
            </p>
        </div>
    )
}

function shiftMonday(iso: string, days: number): string {
    const d = new Date(iso)
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
}
function formatMondayLabel(iso: string): string {
    const d = new Date(iso)
    const end = new Date(d); end.setDate(d.getDate() + 6)
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    return `${d.toLocaleDateString('en-US', opts)}–${end.getDate()}`
}
function formatDayShort(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
function formatTime(min: number): string {
    const h = Math.floor(min / 60)
    const m = min % 60
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}
