// TT.1 · Diego 2026-09-03 · Time Entry Form.
// Composes the 4 atomic components + adds the save-state indicator +
// prompt-before-save (Timely pattern · never hard-block · pain #4).
// Cmd+Enter saves · Esc closes.

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition, DialogPanel, TransitionChild } from '@headlessui/react'
import { X, Save, Clock } from 'lucide-react'
import ProjectSelector from './ProjectSelector'
import TaskTypeDropdown from './TaskTypeDropdown'
import CumulativeHoursInline from './CumulativeHoursInline'
import DeliverableCompleteCheckbox from './DeliverableCompleteCheckbox'
import { getTaskType, type CompletionState } from '../../data/taskTypes'
import { coachingCopy } from '../../data/coachingCopy'
import type { TimeEntry } from '../../data/timeEntries'

interface Props {
    isOpen: boolean
    onClose: () => void
    /** Pre-fill date · required · comes from the cell clicked in the grid. */
    date: string
    /** Existing entry to edit; new entry when null. */
    entry?: TimeEntry | null
    /** All entries (for cumulative math). */
    allEntries: TimeEntry[]
    /** Called on save · parent decides how to persist. */
    onSave: (entry: Omit<TimeEntry, 'id'>) => void
    onDelete?: (entryId: string) => void
    /** Called when the deliverable email actually fires (after undo window). */
    onDeliverableDispatched?: (info: { entryId: string | null; projectId: string; salesRepName: string; timestampIso: string }) => void
    // TT.2 · Diego 2026-09-03 · pre-fill duration + start time from drag-create.
    initialDurationMinutes?: number
    initialStartMinutes?: number
}

type SaveState = 'idle' | 'saving' | 'saved'

export default function TimeEntryForm({ isOpen, onClose, date, entry, allEntries, onSave, onDelete, onDeliverableDispatched, initialDurationMinutes, initialStartMinutes }: Props) {
    const isEdit = !!entry
    const [projectId, setProjectId] = useState<string | null>(entry?.projectId ?? null)
    const [taskTypeId, setTaskTypeId] = useState<string | null>(entry?.taskTypeId ?? null)
    const [completionState, setCompletionState] = useState<CompletionState | undefined>(entry?.completionState)
    const [memo, setMemo] = useState(entry?.memo ?? '')
    const [durationHHMM, setDurationHHMM] = useState(entry ? minutesToHHMM(entry.durationMinutes) : minutesToHHMM(initialDurationMinutes ?? 60))
    const [billable, setBillable] = useState(entry?.billable ?? true)
    const [deliverableComplete, setDeliverableComplete] = useState(entry?.deliverableComplete ?? false)
    // TT.12 · Diego 2026-09-03 · start time editable · viene del drag o
    // del entry existente · undefined = sin franja definida (auto-stack).
    const [startMin, setStartMin] = useState<number | undefined>(entry?.startMinutesFromMidnight ?? initialStartMinutes)
    const [saveState, setSaveState] = useState<SaveState>('idle')
    const [savedAt, setSavedAt] = useState<number | null>(null)
    const [savedSecondsAgo, setSavedSecondsAgo] = useState(0)
    const [showTaskTypePrompt, setShowTaskTypePrompt] = useState(false)

    const draftMinutes = hhmmToMinutes(durationHHMM)

    // Re-init when opened w/ a different entry
    useEffect(() => {
        if (!isOpen) return
        setProjectId(entry?.projectId ?? null)
        setTaskTypeId(entry?.taskTypeId ?? null)
        setCompletionState(entry?.completionState)
        setMemo(entry?.memo ?? '')
        setDurationHHMM(entry ? minutesToHHMM(entry.durationMinutes) : minutesToHHMM(initialDurationMinutes ?? 60))
        setBillable(entry?.billable ?? true)
        setDeliverableComplete(entry?.deliverableComplete ?? false)
        setStartMin(entry?.startMinutesFromMidnight ?? initialStartMinutes)
        setSaveState('idle')
        setSavedAt(null)
        setShowTaskTypePrompt(false)
    }, [isOpen, entry?.id, initialDurationMinutes, initialStartMinutes]) // eslint-disable-line react-hooks/exhaustive-deps

    // Live "Saved Xs ago" ticker.
    useEffect(() => {
        if (saveState !== 'saved' || !savedAt) return
        const iv = window.setInterval(() => {
            setSavedSecondsAgo(Math.max(0, Math.floor((Date.now() - savedAt) / 1000)))
        }, 1000)
        return () => window.clearInterval(iv)
    }, [saveState, savedAt])

    // Task-type default billable when picked (respect explicit override).
    // TT.5 · Diego 2026-09-03 · Holiday/PTO/Sick auto-fill duration a 8h
    // (doc lit: "Holidays se loguean como 8h internal" sot.md:90).
    // McKinley: "no quiero que tengan que log-on just to log holiday hours".
    // Solo aplica en new entry para no sobrescribir edits del user.
    useEffect(() => {
        const t = getTaskType(taskTypeId)
        if (!t || entry) return
        setBillable(t.defaultBillable)
        // Auto-fill 8h for time-off types (holiday, PTO, sick) on new entries.
        if (t.group === 'time-off') {
            setDurationHHMM('8:00')
        }
    }, [taskTypeId, entry])

    // Keyboard shortcuts (Cmd+Enter save, Esc close).
    useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); tryToSave() }
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isOpen, projectId, taskTypeId, memo, durationHHMM, billable, deliverableComplete]) // eslint-disable-line react-hooks/exhaustive-deps

    const canSave = !!projectId && draftMinutes > 0

    const tryToSave = () => {
        if (!canSave) return
        // Prompt-before-submit (Timely pattern) if task type is empty.
        if (!taskTypeId && !showTaskTypePrompt) {
            setShowTaskTypePrompt(true)
            return
        }
        doSave()
    }

    const doSave = () => {
        if (!projectId) return
        setSaveState('saving')
        window.setTimeout(() => {
            onSave({
                designerId: entry?.designerId ?? 'me',
                date,
                projectId,
                taskTypeId: taskTypeId ?? 'admin',
                completionState,
                memo,
                durationMinutes: draftMinutes,
                billable,
                deliverableComplete,
                deliverableSentAt: undefined,
                // TT.2 · preserve existing start (edit) or use drag-create pre-fill.
                // TT.12 · usar el startMin editado (state) · fallback al entry o al drag.
                startMinutesFromMidnight: startMin ?? entry?.startMinutesFromMidnight ?? initialStartMinutes,
            })
            setSaveState('saved')
            setSavedAt(Date.now())
            setSavedSecondsAgo(0)
        }, 350) // simulated latency
    }

    const saveStateLabel = useMemo(() => {
        if (saveState === 'idle') return coachingCopy.saveStateIdle()
        if (saveState === 'saving') return coachingCopy.saveStateSaving()
        return coachingCopy.saveStateSaved(savedSecondsAgo)
    }, [saveState, savedSecondsAgo])

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[120]" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-md" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-start justify-center p-6 pt-24">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-260" enterFrom="opacity-0 translate-y-2 scale-[0.995]" enterTo="opacity-100 translate-y-0 scale-100"
                            leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-[0.995]"
                        >
                            <DialogPanel className="w-full max-w-[560px] rounded-2xl bg-card border border-border shadow-lg overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Time entry</div>
                                        <h3 className="text-lg font-semibold text-foreground">{formatDateLong(date)}</h3>
                                    </div>
                                    <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Close">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="p-6 space-y-4">
                                    {/* TT.12 · Time range · start + end editable cuando la franja
                                        viene del drag (o del entry existente). Fuente de verdad =
                                        start · end se deriva de duration · si el user edita end,
                                        se recalcula duration (start queda fijo). */}
                                    {startMin !== undefined ? (
                                        <div>
                                            <div className="flex items-end justify-between gap-4 mb-1.5">
                                                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Time range</label>
                                                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                                                    <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} className="h-4 w-4 accent-success" />
                                                    Billable
                                                </label>
                                            </div>
                                            <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] gap-2 items-center">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <input
                                                    type="time"
                                                    step={900}
                                                    value={minutesToTimeInput(startMin)}
                                                    onChange={(e) => {
                                                        const newStart = timeInputToMinutes(e.target.value)
                                                        if (newStart !== null) setStartMin(newStart)
                                                    }}
                                                    className="px-3 py-2 text-sm tabular-nums font-semibold bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                                                    aria-label="Start time"
                                                />
                                                <span className="text-xs text-muted-foreground px-1">to</span>
                                                <input
                                                    type="time"
                                                    step={900}
                                                    value={minutesToTimeInput(startMin + draftMinutes)}
                                                    onChange={(e) => {
                                                        const newEnd = timeInputToMinutes(e.target.value)
                                                        if (newEnd === null) return
                                                        const newDuration = Math.max(15, newEnd - startMin)
                                                        setDurationHHMM(minutesToHHMM(Math.round(newDuration / 15) * 15))
                                                    }}
                                                    className="px-3 py-2 text-sm tabular-nums font-semibold bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                                                    aria-label="End time"
                                                />
                                                <span className="text-xs text-muted-foreground tabular-nums">{durationHHMM} h</span>
                                            </div>
                                            <p className="mt-1.5 text-[11px] text-muted-foreground">15-min steps · edítalo si el arrastre no fue preciso</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Duration</label>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <input
                                                        type="text"
                                                        value={durationHHMM}
                                                        onChange={(e) => setDurationHHMM(e.target.value)}
                                                        placeholder="1:00"
                                                        className="w-24 px-3 py-2 text-lg tabular-nums font-semibold bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                                                    />
                                                    <span className="text-xs text-muted-foreground">hh:mm · 15-min steps</span>
                                                </div>
                                            </div>
                                            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                                                <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} className="h-4 w-4 accent-success" />
                                                Billable
                                            </label>
                                        </div>
                                    )}

                                    {/* Project */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Project</label>
                                        <ProjectSelector value={projectId} onChange={setProjectId} />
                                    </div>

                                    {/* Cumulative hours (whitespace #2) */}
                                    <div className="rounded-lg border border-border bg-muted/40 p-3">
                                        <CumulativeHoursInline projectId={projectId} draftDurationMinutes={draftMinutes} entries={allEntries} />
                                    </div>

                                    {/* Task Type */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                                            Task type
                                            <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground">
                                                (helps team spot trends · optional)
                                            </span>
                                        </label>
                                        <TaskTypeDropdown value={taskTypeId} completionState={completionState} onChange={(id, cs) => { setTaskTypeId(id); setCompletionState(cs) }} />
                                    </div>

                                    {/* Memo */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Memo</label>
                                        <textarea
                                            value={memo}
                                            onChange={(e) => setMemo(e.target.value)}
                                            rows={2}
                                            placeholder="What did you work on?"
                                            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                                        />
                                    </div>

                                    {/* Deliverable (whitespace #1) */}
                                    <DeliverableCompleteCheckbox
                                        checked={deliverableComplete}
                                        onChange={setDeliverableComplete}
                                        projectId={projectId}
                                        onDispatched={(info) => onDeliverableDispatched?.({ entryId: entry?.id ?? null, ...info })}
                                    />

                                    {/* Prompt-before-save */}
                                    {showTaskTypePrompt && (
                                        <div className="rounded-lg border border-warning/40 bg-warning-soft p-3 space-y-2">
                                            <p className="text-sm text-foreground">{coachingCopy.promptTaskTypeMissing()}</p>
                                            <div className="flex items-center justify-end gap-2">
                                                <button type="button" onClick={() => setShowTaskTypePrompt(false)} className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors">
                                                    Add task type
                                                </button>
                                                <button type="button" onClick={doSave} className="text-xs font-semibold text-foreground bg-warning/20 hover:bg-warning/30 px-3 py-1.5 rounded-md transition-colors">
                                                    Save anyway
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-border bg-muted/30">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className={`h-1.5 w-1.5 rounded-full ${saveState === 'saved' ? 'bg-success' : saveState === 'saving' ? 'bg-warning animate-pulse' : 'bg-muted-foreground/40'}`} />
                                        <span className="tabular-nums">{saveStateLabel}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isEdit && onDelete && entry && (
                                            <button type="button" onClick={() => { onDelete(entry.id); onClose() }} className="text-xs font-medium text-destructive hover:bg-destructive-soft px-3 py-2 rounded-md transition-colors">
                                                Delete
                                            </button>
                                        )}
                                        <button type="button" onClick={onClose} className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-muted transition-colors">
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={tryToSave}
                                            disabled={!canSave || saveState === 'saving'}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Save className="h-4 w-4" />
                                            {isEdit ? 'Update' : 'Save'}
                                            <kbd className="text-[10px] font-mono opacity-70">⌘↵</kbd>
                                        </button>
                                    </div>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}

// Helpers -----------------------------------------------------
function hhmmToMinutes(s: string): number {
    const [h = '0', m = '0'] = s.split(':')
    const hn = parseInt(h, 10) || 0
    const mn = parseInt(m, 10) || 0
    const total = hn * 60 + mn
    return Math.max(0, Math.round(total / 15) * 15)
}
function minutesToHHMM(min: number): string {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${h}:${m.toString().padStart(2, '0')}`
}
function formatDateLong(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}
// TT.12 · <input type="time"> value ↔ minutes-from-midnight.
function minutesToTimeInput(min: number): string {
    const clamped = Math.max(0, Math.min(24 * 60 - 1, min))
    const h = Math.floor(clamped / 60)
    const m = clamped % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}
function timeInputToMinutes(v: string): number | null {
    const [hStr, mStr] = v.split(':')
    if (!hStr || !mStr) return null
    const h = parseInt(hStr, 10)
    const m = parseInt(mStr, 10)
    if (isNaN(h) || isNaN(m)) return null
    return h * 60 + m
}
