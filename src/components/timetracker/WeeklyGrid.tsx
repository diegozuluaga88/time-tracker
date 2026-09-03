// TT.2 · Diego 2026-09-03 · WeeklyGrid rewrite · Google Calendar-style
// week view. Time-axis vertical (7am-7pm · 15-min slots) + 7 day cols
// + absolutely-positioned entry blocks + drag-to-create, drag-to-move,
// drag-to-resize. Skills applied: ux-heuristics + minimalist-ui +
// refactoring-ui. See plan file for full analysis + references.
//
// Interactions:
//   - Click empty area on day col → drag downward → ghost block →
//     release → TimeEntryForm opens pre-filled with date + duration +
//     startMinutes.
//   - Click existing entry → edit (opens form).
//   - Drag existing entry → move to new time/day (snap 15 min).
//   - Drag bottom edge of entry → resize duration (snap 15 min).
//   - Current-time indicator (red line) on today's column.
//
// No external DnD lib · custom Pointer Events API handlers.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GripVertical } from 'lucide-react'
import { getProject } from '../../data/projects'
import { getTaskType, formatTaskLabel } from '../../data/taskTypes'
import {
    entriesForDesignerRange,
    DESIGNER_CAPACITY_HOURS,
    sumHours,
    CALENDAR_DAY_START_HOUR,
    CALENDAR_DAY_END_HOUR,
    CELL_HEIGHT_PX,
    MINUTES_PER_SLOT,
    formatTimeOfDay,
    formatTimeOfDayShort,
    type TimeEntry,
    type DesignerId,
} from '../../data/timeEntries'

interface Props {
    designerId: DesignerId
    weekMondayIso: string
    allEntries: TimeEntry[]
    onAddEntry: (dateIso: string, durationMinutes: number, startMinutes: number) => void
    onEditEntry: (entry: TimeEntry) => void
    onMoveEntry?: (entryId: string, newDateIso: string, newStartMinutes: number) => void
    onResizeEntry?: (entryId: string, newDurationMinutes: number) => void
    todayIso: string
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_START_MIN = CALENDAR_DAY_START_HOUR * 60
const DAY_END_MIN = CALENDAR_DAY_END_HOUR * 60
const TOTAL_MINUTES = DAY_END_MIN - DAY_START_MIN
const TOTAL_HEIGHT = (TOTAL_MINUTES / MINUTES_PER_SLOT) * CELL_HEIGHT_PX
const HOUR_HEIGHT = CELL_HEIGHT_PX * 4 // 4 × 15-min = 1 hour = 48px

type DragState =
    | { kind: 'idle' }
    | { kind: 'create'; dayIndex: number; startMin: number; currentMin: number }
    | { kind: 'move'; entryId: string; originDayIndex: number; originStartMin: number; grabOffsetMin: number; currentDayIndex: number; currentStartMin: number }
    | { kind: 'resize'; entryId: string; originDurationMin: number; currentDurationMin: number; dayIndex: number; startMin: number }

interface PositionedEntry extends TimeEntry {
    /** Start minutes (resolved · uses field or auto-stacked). */
    resolvedStart: number
    /** Column index (0..colCount-1) inside overlap group. */
    colIndex: number
    /** Total columns in the overlap group. */
    colCount: number
}

export default function WeeklyGrid({
    designerId, weekMondayIso, allEntries, onAddEntry, onEditEntry, onMoveEntry, onResizeEntry, todayIso,
}: Props) {
    const gridRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const [dragState, setDragState] = useState<DragState>({ kind: 'idle' })
    const [nowMinutes, setNowMinutes] = useState(getCurrentMinutes())

    // Refresh current-time indicator every 60s
    useEffect(() => {
        const t = window.setInterval(() => setNowMinutes(getCurrentMinutes()), 60_000)
        return () => window.clearInterval(t)
    }, [])

    const week = useMemo(
        () => Array.from({ length: 7 }).map((_, i) => addDaysIso(weekMondayIso, i)),
        [weekMondayIso]
    )

    const weekEntries = useMemo(
        () => entriesForDesignerRange(designerId, week[0], week[6], allEntries),
        [designerId, week, allEntries]
    )

    // Position + overlap-column entries per day
    const positionedByDay = useMemo(() => {
        return week.map(dateIso => {
            const dayEntries = weekEntries.filter(e => e.date === dateIso)
            return positionDay(dayEntries)
        })
    }, [week, weekEntries])

    // Totals (unchanged from TT.1 pattern)
    const totalHours = sumHours(weekEntries)
    const billableHours = sumHours(weekEntries.filter(e => e.billable))
    const internalHours = sumHours(weekEntries.filter(e => !e.billable))
    const capacity = DESIGNER_CAPACITY_HOURS[designerId] ?? 40
    const pct = Math.round((totalHours / capacity) * 100)

    // Hour labels for time-axis
    const hourLabels = useMemo(() => {
        const out: number[] = []
        for (let h = CALENDAR_DAY_START_HOUR; h <= CALENDAR_DAY_END_HOUR; h++) out.push(h)
        return out
    }, [])

    // Convert absolute Y (relative to day col) → snapped minutes
    const yToMinutes = useCallback((y: number): number => {
        const rawMin = DAY_START_MIN + (y / CELL_HEIGHT_PX) * MINUTES_PER_SLOT
        const snapped = Math.round(rawMin / MINUTES_PER_SLOT) * MINUTES_PER_SLOT
        return Math.max(DAY_START_MIN, Math.min(DAY_END_MIN, snapped))
    }, [])

    // Locate day column at pointer X (returns index 0..6 or null)
    const xToDayIndex = useCallback((clientX: number): number | null => {
        const grid = gridRef.current
        if (!grid) return null
        const cols = grid.querySelectorAll('[data-day-index]')
        for (const col of Array.from(cols) as HTMLElement[]) {
            const rect = col.getBoundingClientRect()
            if (clientX >= rect.left && clientX < rect.right) {
                return parseInt(col.dataset.dayIndex ?? '-1', 10)
            }
        }
        return null
    }, [])

    // === Drag: CREATE ===
    const onColPointerDown = (e: React.PointerEvent<HTMLDivElement>, dayIndex: number) => {
        // Ignore if clicked on an existing entry (bubbling won't happen because entries handle their own).
        if ((e.target as HTMLElement).closest('[data-entry-id]')) return
        if (e.button !== 0) return
        const col = e.currentTarget as HTMLElement
        const rect = col.getBoundingClientRect()
        const yLocal = e.clientY - rect.top
        const startMin = yToMinutes(yLocal)
        setDragState({ kind: 'create', dayIndex, startMin, currentMin: startMin + MINUTES_PER_SLOT })
        col.setPointerCapture(e.pointerId)
    }
    const onColPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (dragState.kind !== 'create') return
        const col = e.currentTarget as HTMLElement
        const rect = col.getBoundingClientRect()
        const yLocal = e.clientY - rect.top
        const currentMin = Math.max(dragState.startMin + MINUTES_PER_SLOT, yToMinutes(yLocal))
        setDragState({ ...dragState, currentMin })
    }
    const onColPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (dragState.kind !== 'create') return
        const col = e.currentTarget as HTMLElement
        col.releasePointerCapture(e.pointerId)
        const durationMinutes = dragState.currentMin - dragState.startMin
        if (durationMinutes >= MINUTES_PER_SLOT) {
            onAddEntry(week[dragState.dayIndex], durationMinutes, dragState.startMin)
        }
        setDragState({ kind: 'idle' })
    }

    // === Drag: MOVE + RESIZE ===
    // Uses window-level listeners so the drag survives leaving the block.
    useEffect(() => {
        if (dragState.kind !== 'move' && dragState.kind !== 'resize') return
        const onMove = (e: PointerEvent) => {
            if (dragState.kind === 'move') {
                const dayIdx = xToDayIndex(e.clientX)
                const grid = gridRef.current
                if (!grid || dayIdx == null) return
                const col = grid.querySelector(`[data-day-index="${dayIdx}"]`) as HTMLElement | null
                if (!col) return
                const rect = col.getBoundingClientRect()
                const yLocal = e.clientY - rect.top
                const newStart = yToMinutes(yLocal - (dragState.grabOffsetMin / MINUTES_PER_SLOT) * CELL_HEIGHT_PX)
                setDragState({ ...dragState, currentDayIndex: dayIdx, currentStartMin: newStart })
            } else if (dragState.kind === 'resize') {
                const grid = gridRef.current
                if (!grid) return
                const col = grid.querySelector(`[data-day-index="${dragState.dayIndex}"]`) as HTMLElement | null
                if (!col) return
                const rect = col.getBoundingClientRect()
                const yLocal = e.clientY - rect.top
                const endMin = yToMinutes(yLocal)
                const newDur = Math.max(MINUTES_PER_SLOT, endMin - dragState.startMin)
                setDragState({ ...dragState, currentDurationMin: newDur })
            }
        }
        const onUp = () => {
            if (dragState.kind === 'move') {
                if (onMoveEntry) {
                    onMoveEntry(dragState.entryId, week[dragState.currentDayIndex], dragState.currentStartMin)
                }
            } else if (dragState.kind === 'resize') {
                if (onResizeEntry) {
                    onResizeEntry(dragState.entryId, dragState.currentDurationMin)
                }
            }
            setDragState({ kind: 'idle' })
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
        return () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
        }
    }, [dragState, xToDayIndex, yToMinutes, week, onMoveEntry, onResizeEntry])

    // Auto-scroll to 8am on mount (skip early hours by default)
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = ((8 * 60 - DAY_START_MIN) / MINUTES_PER_SLOT) * CELL_HEIGHT_PX
        }
    }, []) // once

    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Week header · totals summary */}
            <div className="flex items-baseline justify-between px-5 py-4 border-b border-border gap-4 flex-wrap">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Week of</div>
                    <h3 className="text-lg font-semibold text-foreground">{formatWeekRange(week[0], week[6])}</h3>
                </div>
                <div className="flex items-center gap-6 text-sm">
                    <SummaryStat label="Billable" hours={billableHours} tone="success" />
                    <SummaryStat label="Internal" hours={internalHours} tone="info" />
                    <SummaryStat label="Total" hours={totalHours} tone="foreground" />
                    <SummaryStat label={`Capacity (${capacity}h)`} value={`${pct}%`} tone={pct >= 110 ? 'ai' : pct >= 80 ? 'success' : pct >= 70 ? 'warning' : 'destructive'} />
                </div>
            </div>

            {/* Day headers (sticky top when scrolling body) */}
            <div className="grid border-b border-border bg-muted/30" style={{ gridTemplateColumns: `60px repeat(7, minmax(0, 1fr))` }}>
                <div className="border-r border-border" />
                {week.map((iso, i) => {
                    const isToday = iso === todayIso
                    const isWeekend = i >= 5
                    const dayEntries = weekEntries.filter(e => e.date === iso)
                    const dayHours = sumHours(dayEntries)
                    return (
                        <div key={iso} className={`px-3 py-2 text-center border-r border-border last:border-r-0 ${isToday ? 'bg-primary-soft' : ''} ${isWeekend ? 'opacity-60' : ''}`}>
                            <div className={`text-[10px] uppercase tracking-wider ${isToday ? 'font-bold text-foreground' : 'font-semibold text-muted-foreground'}`}>{DAY_LABELS[i]}</div>
                            <div className={`text-xl tabular-nums leading-none mt-1 ${isToday ? 'font-bold text-foreground' : 'font-semibold text-foreground'}`}>{new Date(iso).getDate()}</div>
                            <div className="text-[10px] text-muted-foreground mt-1 tabular-nums">{dayHours > 0 ? `${dayHours.toFixed(1)}h` : '—'}</div>
                        </div>
                    )
                })}
            </div>

            {/* Body: time-axis + day cols · scrollable */}
            <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 'min(70vh, 640px)' }}>
                <div ref={gridRef} className="grid relative" style={{ gridTemplateColumns: `60px repeat(7, minmax(0, 1fr))`, height: TOTAL_HEIGHT }}>
                    {/* Time axis */}
                    <div className="relative border-r border-border">
                        {hourLabels.map(h => (
                            <div
                                key={h}
                                className="absolute right-2 text-[10px] font-mono tabular-nums text-muted-foreground -translate-y-1/2 pr-1"
                                style={{ top: ((h * 60 - DAY_START_MIN) / MINUTES_PER_SLOT) * CELL_HEIGHT_PX }}
                            >
                                {formatTimeOfDayShort(h * 60)}
                            </div>
                        ))}
                    </div>

                    {/* Day columns */}
                    {week.map((iso, dayIndex) => {
                        const isToday = iso === todayIso
                        const isWeekend = dayIndex >= 5
                        const positioned = positionedByDay[dayIndex]
                        return (
                            <div
                                key={iso}
                                data-day-index={dayIndex}
                                onPointerDown={(e) => onColPointerDown(e, dayIndex)}
                                onPointerMove={onColPointerMove}
                                onPointerUp={onColPointerUp}
                                className={`relative border-r border-border last:border-r-0 select-none cursor-crosshair ${isToday ? 'bg-primary-soft/40 ring-2 ring-inset ring-primary/40' : ''} ${isWeekend ? 'opacity-60' : ''}`}
                                style={{ minHeight: TOTAL_HEIGHT }}
                                aria-label={`Day column ${DAY_LABELS[dayIndex]} ${new Date(iso).getDate()}`}
                            >
                                {/* Hour grid lines */}
                                {hourLabels.map(h => (
                                    <div
                                        key={h}
                                        className="absolute inset-x-0 border-t border-border/60 pointer-events-none"
                                        style={{ top: ((h * 60 - DAY_START_MIN) / MINUTES_PER_SLOT) * CELL_HEIGHT_PX }}
                                    />
                                ))}
                                {/* Half-hour tick (fainter) */}
                                {hourLabels.slice(0, -1).map(h => (
                                    <div
                                        key={`half-${h}`}
                                        className="absolute inset-x-0 border-t border-border/25 pointer-events-none"
                                        style={{ top: (((h * 60 + 30) - DAY_START_MIN) / MINUTES_PER_SLOT) * CELL_HEIGHT_PX }}
                                    />
                                ))}

                                {/* Entries */}
                                {positioned.map(entry => {
                                    // If dragging this entry (move), skip · render ghost separately
                                    if (dragState.kind === 'move' && dragState.entryId === entry.id) return null
                                    // If resizing this entry, render with modified height
                                    const isResizing = dragState.kind === 'resize' && dragState.entryId === entry.id
                                    const durationMin = isResizing ? dragState.currentDurationMin : entry.durationMinutes
                                    return (
                                        <EntryBlock
                                            key={entry.id}
                                            entry={entry}
                                            startMin={entry.resolvedStart}
                                            durationMin={durationMin}
                                            colIndex={entry.colIndex}
                                            colCount={entry.colCount}
                                            onEdit={() => onEditEntry(entry)}
                                            onMoveStart={(grabOffsetMin) => {
                                                setDragState({
                                                    kind: 'move',
                                                    entryId: entry.id,
                                                    originDayIndex: dayIndex,
                                                    originStartMin: entry.resolvedStart,
                                                    grabOffsetMin,
                                                    currentDayIndex: dayIndex,
                                                    currentStartMin: entry.resolvedStart,
                                                })
                                            }}
                                            onResizeStart={() => {
                                                setDragState({
                                                    kind: 'resize',
                                                    entryId: entry.id,
                                                    originDurationMin: entry.durationMinutes,
                                                    currentDurationMin: entry.durationMinutes,
                                                    dayIndex,
                                                    startMin: entry.resolvedStart,
                                                })
                                            }}
                                        />
                                    )
                                })}

                                {/* Ghost block during CREATE */}
                                {dragState.kind === 'create' && dragState.dayIndex === dayIndex && (
                                    <GhostBlock startMin={dragState.startMin} endMin={dragState.currentMin} kind="create" />
                                )}

                                {/* Ghost block during MOVE (following pointer) */}
                                {dragState.kind === 'move' && dragState.currentDayIndex === dayIndex && (() => {
                                    const orig = positioned.find(p => p.id === dragState.entryId)
                                    if (!orig) return null
                                    return (
                                        <GhostBlock
                                            startMin={dragState.currentStartMin}
                                            endMin={dragState.currentStartMin + orig.durationMinutes}
                                            kind="move"
                                            label={getTaskType(orig.taskTypeId)?.label ?? 'Entry'}
                                        />
                                    )
                                })()}

                                {/* Current time indicator */}
                                {isToday && nowMinutes >= DAY_START_MIN && nowMinutes <= DAY_END_MIN && (
                                    <div
                                        className="absolute inset-x-0 pointer-events-none z-20"
                                        style={{ top: ((nowMinutes - DAY_START_MIN) / MINUTES_PER_SLOT) * CELL_HEIGHT_PX }}
                                    >
                                        <div className="relative h-0 border-t-2 border-destructive">
                                            <div className="absolute -left-1 -top-1.5 h-3 w-3 rounded-full bg-destructive" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Footer hint */}
            <div className="px-5 py-2 border-t border-border bg-muted/30 text-[11px] text-muted-foreground flex items-center justify-between">
                <span>Drag on empty space to create · click a block to edit · drag a block to move · drag its bottom edge to resize</span>
                <span className="tabular-nums">15-min steps · {CALENDAR_DAY_START_HOUR}:00 – {CALENDAR_DAY_END_HOUR}:00</span>
            </div>
        </div>
    )
}

// ============================================================
// EntryBlock
// ============================================================
interface EntryBlockProps {
    entry: TimeEntry
    startMin: number
    durationMin: number
    colIndex: number
    colCount: number
    onEdit: () => void
    onMoveStart: (grabOffsetMin: number) => void
    onResizeStart: () => void
}

function EntryBlock({ entry, startMin, durationMin, colIndex, colCount, onEdit, onMoveStart, onResizeStart }: EntryBlockProps) {
    const project = getProject(entry.projectId)
    const taskType = getTaskType(entry.taskTypeId)
    const top = ((startMin - DAY_START_MIN) / MINUTES_PER_SLOT) * CELL_HEIGHT_PX
    const height = Math.max(CELL_HEIGHT_PX, (durationMin / MINUTES_PER_SLOT) * CELL_HEIGHT_PX)
    const widthPct = 100 / colCount
    const leftPct = colIndex * widthPct

    const tone = entry.billable
        ? 'bg-success/15 border-success/50 hover:bg-success/25'
        : 'bg-info/15 border-info/50 hover:bg-info/25'
    const accent = entry.billable ? 'text-success' : 'text-info'

    const hours = (durationMin / 60).toFixed(2).replace(/\.?0+$/, '')

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('[data-resize-handle]')) return
        e.stopPropagation()
        // Distinguish click (open edit) vs drag (move). Start move + record threshold.
        const startY = e.clientY
        const startX = e.clientX
        const startTime = Date.now()
        let moved = false
        const onMove = (ev: PointerEvent) => {
            const dx = Math.abs(ev.clientX - startX)
            const dy = Math.abs(ev.clientY - startY)
            if (!moved && (dx > 5 || dy > 5)) {
                moved = true
                // Compute grabOffsetMin (where inside block user grabbed)
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                const grabOffsetMin = ((startY - rect.top) / CELL_HEIGHT_PX) * MINUTES_PER_SLOT
                onMoveStart(Math.round(grabOffsetMin / MINUTES_PER_SLOT) * MINUTES_PER_SLOT)
                window.removeEventListener('pointermove', onMove)
                window.removeEventListener('pointerup', onUp)
            }
        }
        const onUp = () => {
            if (!moved && Date.now() - startTime < 500) onEdit()
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
    }

    const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation()
        e.preventDefault()
        onResizeStart()
    }

    return (
        <div
            data-entry-id={entry.id}
            onPointerDown={handlePointerDown}
            role="button"
            tabIndex={0}
            aria-label={`Time entry ${taskType ? formatTaskLabel(taskType, entry.completionState) : 'Untagged'} · ${hours}h`}
            onKeyDown={(e) => { if (e.key === 'Enter') onEdit() }}
            className={`group absolute rounded-md border ${tone} cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow overflow-hidden`}
            style={{
                top,
                height,
                left: `calc(${leftPct}% + 2px)`,
                width: `calc(${widthPct}% - 4px)`,
                zIndex: 10,
            }}
            title={entry.memo}
        >
            {/* Grip icon (subtle, visible on hover) */}
            <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-40 text-foreground pointer-events-none">
                <GripVertical className="h-3 w-3" />
            </div>

            {/* Deliverable-complete corner overlay */}
            {entry.deliverableComplete && (
                <div className="absolute top-0 right-0 bg-success text-white text-[8px] font-bold px-1 rounded-bl-md pointer-events-none uppercase tracking-wider">
                    ✓
                </div>
            )}

            <div className="p-1.5 pointer-events-none flex flex-col h-full min-h-0">
                <div className="flex items-baseline justify-between gap-1 min-w-0">
                    <div className={`text-[11px] font-semibold truncate ${accent}`}>
                        {taskType ? formatTaskLabel(taskType, entry.completionState) : 'Untagged'}
                    </div>
                    <div className="text-[10px] font-mono tabular-nums text-foreground/80 shrink-0">
                        {hours}h
                    </div>
                </div>
                {height > 34 && project && (
                    <div className="text-[10px] text-muted-foreground truncate mt-0.5">{project.name}</div>
                )}
                {height > 60 && entry.memo && (
                    <div className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 leading-tight">{entry.memo}</div>
                )}
                {height > 30 && (
                    <div className="mt-auto text-[9px] font-mono tabular-nums text-muted-foreground">
                        {formatTimeOfDay(startMin)} – {formatTimeOfDay(startMin + durationMin)}
                    </div>
                )}
            </div>

            {/* Resize handle (bottom edge) */}
            <div
                data-resize-handle="true"
                onPointerDown={handleResizePointerDown}
                className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize hover:bg-foreground/30 rounded-b-md transition-colors"
                aria-label="Resize entry"
            />
        </div>
    )
}

// ============================================================
// GhostBlock (drag preview)
// ============================================================
function GhostBlock({ startMin, endMin, kind, label }: { startMin: number; endMin: number; kind: 'create' | 'move'; label?: string }) {
    const top = ((Math.min(startMin, endMin) - DAY_START_MIN) / MINUTES_PER_SLOT) * CELL_HEIGHT_PX
    const height = Math.abs(endMin - startMin) / MINUTES_PER_SLOT * CELL_HEIGHT_PX
    const durationMin = endMin - startMin
    const hours = (durationMin / 60).toFixed(2).replace(/\.?0+$/, '')
    return (
        <div
            className={`absolute inset-x-0.5 rounded-md pointer-events-none z-30 ${kind === 'create' ? 'bg-primary/30 border-2 border-dashed border-primary' : 'bg-foreground/20 border-2 border-foreground/60 shadow-lg'}`}
            style={{ top, height: Math.max(CELL_HEIGHT_PX, height) }}
        >
            <div className="p-1.5 text-[10px] font-mono tabular-nums text-foreground">
                {label && <div className="text-[11px] font-semibold truncate">{label}</div>}
                <div>{formatTimeOfDay(Math.min(startMin, endMin))} – {formatTimeOfDay(Math.max(startMin, endMin))}</div>
                <div>{hours}h</div>
            </div>
        </div>
    )
}

// ============================================================
// SummaryStat (reuse TT.1 pattern)
// ============================================================
function SummaryStat({ label, hours, value, tone }: { label: string; hours?: number; value?: string; tone: 'foreground' | 'success' | 'info' | 'warning' | 'destructive' | 'ai' }) {
    const toneClass = tone === 'foreground' ? 'text-foreground'
        : tone === 'success' ? 'text-success'
        : tone === 'info' ? 'text-info'
        : tone === 'warning' ? 'text-warning'
        : tone === 'destructive' ? 'text-destructive'
        : 'text-ai'
    return (
        <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className={`text-sm font-semibold tabular-nums ${toneClass}`}>
                {value ?? `${(hours ?? 0).toFixed(1)}h`}
            </div>
        </div>
    )
}

// ============================================================
// Helpers
// ============================================================
function addDaysIso(iso: string, n: number): string {
    const d = new Date(iso)
    d.setDate(d.getDate() + n)
    return d.toISOString().slice(0, 10)
}

function formatWeekRange(mondayIso: string, sundayIso: string): string {
    const s = new Date(mondayIso)
    const e = new Date(sundayIso)
    const sameMonth = s.getMonth() === e.getMonth()
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    const startStr = s.toLocaleDateString('en-US', opts)
    const endStr = sameMonth ? e.getDate().toString() : e.toLocaleDateString('en-US', opts)
    return `${startStr}–${endStr}, ${e.getFullYear()}`
}

export function mondayOf(iso: string): string {
    const d = new Date(iso)
    const dow = d.getDay()
    const offset = dow === 0 ? -6 : 1 - dow
    d.setDate(d.getDate() + offset)
    return d.toISOString().slice(0, 10)
}

function getCurrentMinutes(): number {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
}

// Position entries within a day column · resolves start times + assigns
// overlap columns (side-by-side rendering).
function positionDay(dayEntries: TimeEntry[]): PositionedEntry[] {
    if (dayEntries.length === 0) return []
    // Auto-stack any entry that's missing an explicit start time.
    let cursor = DAY_START_MIN
    const resolved: (TimeEntry & { resolvedStart: number })[] = []
    // Explicit-start entries first (sorted)
    const withStart = [...dayEntries].filter(e => e.startMinutesFromMidnight != null).sort((a, b) => (a.startMinutesFromMidnight ?? 0) - (b.startMinutesFromMidnight ?? 0))
    const withoutStart = dayEntries.filter(e => e.startMinutesFromMidnight == null)
    for (const e of withStart) {
        resolved.push({ ...e, resolvedStart: e.startMinutesFromMidnight! })
        cursor = Math.max(cursor, e.startMinutesFromMidnight! + e.durationMinutes + 15)
    }
    for (const e of withoutStart) {
        const start = cursor
        resolved.push({ ...e, resolvedStart: start })
        cursor = start + e.durationMinutes + 15
    }

    // Assign overlap columns via greedy sweep
    resolved.sort((a, b) => a.resolvedStart - b.resolvedStart)
    // Each item tracked as { start, end, col }
    const active: { end: number; col: number }[] = []
    const cols: number[] = []
    for (const e of resolved) {
        const start = e.resolvedStart
        const end = start + e.durationMinutes
        // Remove ended
        for (let i = active.length - 1; i >= 0; i--) if (active[i].end <= start) active.splice(i, 1)
        // Find lowest free col
        const usedCols = new Set(active.map(a => a.col))
        let col = 0
        while (usedCols.has(col)) col++
        active.push({ end, col })
        cols.push(col)
    }

    // Group into overlap sets to compute colCount for each entry.
    // Simple approach: for each entry, colCount = max col seen among entries
    // whose interval overlaps its interval.
    return resolved.map((e, i) => {
        const start = e.resolvedStart
        const end = start + e.durationMinutes
        let maxCol = cols[i]
        for (let j = 0; j < resolved.length; j++) {
            const other = resolved[j]
            const otherEnd = other.resolvedStart + other.durationMinutes
            if (other.resolvedStart < end && otherEnd > start) {
                maxCol = Math.max(maxCol, cols[j])
            }
        }
        return { ...e, colIndex: cols[i], colCount: maxCol + 1 }
    })
}
