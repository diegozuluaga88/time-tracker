// TT.1 · Diego 2026-09-03 · Weekly grid · Toggl "Timesheet view" pattern.
// Rows = days (Mon–Sun) · cols = projects worked that week · cells show
// entries with duration + task chip. Today ring per refactoring-ui blur test.
// Click empty cell → open TimeEntryForm (via onAddEntry).
// Click existing entry → open TimeEntryForm to edit.

import { useMemo } from 'react'
import { Plus, Circle } from 'lucide-react'
import { getProject } from '../../data/projects'
import { getTaskType, formatTaskLabel } from '../../data/taskTypes'
import { entriesForDesignerRange, DESIGNER_CAPACITY_HOURS, sumHours, type TimeEntry, type DesignerId } from '../../data/timeEntries'

interface Props {
    designerId: DesignerId
    /** ISO date of Monday of the week to show. */
    weekMondayIso: string
    /** All entries (from app state). */
    allEntries: TimeEntry[]
    onAddEntry: (dateIso: string) => void
    onEditEntry: (entry: TimeEntry) => void
    /** ISO of "today" · highlights that column. */
    todayIso: string
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function WeeklyGrid({ designerId, weekMondayIso, allEntries, onAddEntry, onEditEntry, todayIso }: Props) {
    const week = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => addDays(weekMondayIso, i))
    }, [weekMondayIso])

    const weekEntries = useMemo(() => {
        return entriesForDesignerRange(designerId, week[0], week[6], allEntries)
    }, [designerId, week, allEntries])

    const totalHours = sumHours(weekEntries)
    const billableHours = sumHours(weekEntries.filter(e => e.billable))
    const internalHours = sumHours(weekEntries.filter(e => !e.billable))
    const capacity = DESIGNER_CAPACITY_HOURS[designerId] ?? 40
    const pct = Math.round((totalHours / capacity) * 100)

    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Week header */}
            <div className="flex items-baseline justify-between px-5 py-4 border-b border-border gap-4 flex-wrap">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Week of</div>
                    <h3 className="text-lg font-semibold text-foreground">
                        {formatWeekRange(week[0], week[6])}
                    </h3>
                </div>
                <div className="flex items-center gap-6 text-sm">
                    <SummaryStat label="Billable" hours={billableHours} tone="success" />
                    <SummaryStat label="Internal" hours={internalHours} tone="info" />
                    <SummaryStat label="Total" hours={totalHours} tone="foreground" />
                    <SummaryStat label={`Capacity (${capacity}h)`} value={`${pct}%`} tone={pct >= 110 ? 'ai' : pct >= 80 ? 'success' : pct >= 70 ? 'warning' : 'destructive'} />
                </div>
            </div>

            {/* Day rows */}
            <div className="divide-y divide-border">
                {week.map((iso, i) => {
                    const isToday = iso === todayIso
                    const isWeekend = i === 5 || i === 6
                    const dayEntries = weekEntries.filter(e => e.date === iso)
                    const dayHours = sumHours(dayEntries)
                    return (
                        <div
                            key={iso}
                            className={`grid grid-cols-[110px_1fr_auto] gap-4 px-5 py-3 items-start transition-colors ${isToday ? 'bg-primary-soft ring-1 ring-inset ring-primary/40' : isWeekend ? 'opacity-60' : ''}`}
                        >
                            {/* Day label */}
                            <div className="pt-0.5">
                                <div className={`text-[11px] uppercase tracking-wider ${isToday ? 'font-bold text-foreground' : 'font-semibold text-muted-foreground'}`}>{DAYS[i]}</div>
                                <div className={`text-lg tabular-nums ${isToday ? 'font-bold text-foreground' : 'font-semibold text-foreground'}`}>
                                    {new Date(iso).getDate()}
                                </div>
                            </div>

                            {/* Entries */}
                            <div className="flex flex-wrap gap-2 pt-0.5">
                                {dayEntries.length === 0 ? (
                                    <button
                                        type="button"
                                        onClick={() => onAddEntry(iso)}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-dashed border-input hover:border-primary hover:bg-muted rounded-md px-2.5 py-1.5 transition-colors"
                                    >
                                        <Plus className="h-3 w-3" />
                                        Add entry
                                    </button>
                                ) : (
                                    <>
                                        {dayEntries.map(e => (
                                            <EntryChip key={e.id} entry={e} onClick={() => onEditEntry(e)} />
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => onAddEntry(iso)}
                                            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2 py-1.5 transition-colors"
                                            title="Add entry to this day"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Day total */}
                            <div className="text-right pt-1 whitespace-nowrap">
                                {dayHours > 0 ? (
                                    <div className="text-sm font-semibold tabular-nums text-foreground">
                                        {dayHours.toFixed(1)}<span className="text-muted-foreground font-normal">h</span>
                                    </div>
                                ) : (
                                    <div className="text-xs text-muted-foreground">—</div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

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

function EntryChip({ entry, onClick }: { entry: TimeEntry; onClick: () => void }) {
    const project = getProject(entry.projectId)
    const taskType = getTaskType(entry.taskTypeId)
    const hours = (entry.durationMinutes / 60).toFixed(2).replace(/\.?0+$/, '')
    const toneClass = entry.billable
        ? 'bg-success-soft border-success/30 hover:bg-success/15'
        : 'bg-info-soft border-info/30 hover:bg-info/15'
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group inline-flex items-center gap-2 border rounded-md px-2.5 py-1.5 text-left transition-colors ${toneClass}`}
            title={entry.memo}
        >
            <Circle className={`h-2 w-2 shrink-0 fill-current ${entry.billable ? 'text-success' : 'text-info'}`} />
            <span className="text-xs font-medium text-foreground truncate max-w-[240px]">
                {taskType ? formatTaskLabel(taskType, entry.completionState) : 'Untagged'}
                <span className="text-muted-foreground font-normal">
                    {project ? ` · ${project.name}` : ''}
                </span>
            </span>
            <span className="text-xs font-semibold tabular-nums text-foreground shrink-0">
                {hours}h
            </span>
            {entry.deliverableComplete && (
                <span className="text-[9px] uppercase tracking-wider font-bold text-success bg-success/10 px-1 py-0.5 rounded" title="Deliverable marked complete">✓ done</span>
            )}
        </button>
    )
}

// Helpers -----------------------------------------------------
function addDays(iso: string, n: number): string {
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

/** Given an ISO date, return the Monday of that week. */
export function mondayOf(iso: string): string {
    const d = new Date(iso)
    const dow = d.getDay() // 0=Sun
    const offset = dow === 0 ? -6 : 1 - dow
    d.setDate(d.getDate() + offset)
    return d.toISOString().slice(0, 10)
}
