// TT.43 · Diego 2026-09-08 · Project budget status table.
// Progress bar hours-vs-budget + variance % · reusa el pattern de
// CumulativeHoursInline.tsx (severity locked ok/warn/over).
// pain #4 (analysis:38) + benchmark:65.

import { Briefcase } from 'lucide-react'
import type { ProjectBudgetRow } from '../../../data/managerInsights'

interface Props {
    rows: ProjectBudgetRow[]
}

export default function BudgetStatusTable({ rows }: Props) {
    if (rows.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
                <div className="text-sm font-semibold text-foreground">No projects match these filters</div>
                <p className="text-xs text-muted-foreground mt-1">Try widening the filter selections.</p>
            </div>
        )
    }

    const overCount = rows.filter(r => r.tone === 'over').length
    const warnCount = rows.filter(r => r.tone === 'warn').length

    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-foreground">Project budget status</h4>
                        <p className="text-[11px] text-muted-foreground">Cumulative hours logged vs contracted budget · over-budget on top.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                    {overCount > 0 && <Chip tone="destructive" label={`${overCount} over`} />}
                    {warnCount > 0 && <Chip tone="warning" label={`${warnCount} nearing`} />}
                    <span className="text-muted-foreground tabular-nums">· {rows.length} total</span>
                </div>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-border">
                {rows.map(row => (
                    <BudgetRow key={row.projectId} row={row} />
                ))}
            </div>
        </div>
    )
}

function BudgetRow({ row }: { row: ProjectBudgetRow }) {
    const barClass = row.tone === 'over' ? 'bg-destructive' : row.tone === 'warn' ? 'bg-warning' : 'bg-success'
    const percentClass = row.tone === 'over' ? 'text-destructive' : row.tone === 'warn' ? 'text-warning' : 'text-success'
    const variance = row.loggedHours - row.budgetHours

    return (
        <div className="px-5 py-3 hover:bg-muted/30 transition-colors">
            <div className="flex items-baseline justify-between gap-3 mb-1.5 flex-wrap">
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">{row.projectName}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{row.client} · {row.company}</div>
                </div>
                <div className="text-right shrink-0">
                    <div className="text-sm font-semibold tabular-nums text-foreground">
                        {row.loggedHours.toFixed(1)}h <span className="text-muted-foreground font-normal">/ {row.budgetHours}h</span>
                    </div>
                    <div className={`text-[11px] tabular-nums ${percentClass}`}>
                        {Math.round(row.percent)}% · {row.tone === 'over' ? `+${variance.toFixed(1)}h over` : row.tone === 'warn' ? 'nearing' : 'on track'}
                    </div>
                </div>
            </div>
            <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                    className={`absolute inset-y-0 left-0 ${barClass} transition-[width] duration-300`}
                    style={{ width: `${Math.min(row.percent, 100)}%` }}
                />
                {row.percent > 100 && (
                    <div
                        className="absolute inset-y-0 right-0 bg-destructive/40 border-l border-destructive"
                        style={{ width: `${Math.min(row.percent - 100, 30)}%` }}
                    />
                )}
            </div>
        </div>
    )
}

function Chip({ tone, label }: { tone: 'destructive' | 'warning'; label: string }) {
    const cls = tone === 'destructive'
        ? 'bg-destructive-soft text-destructive border-destructive/40'
        : 'bg-warning-soft text-warning border-warning/40'
    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider tabular-nums ${cls}`}>
            {label}
        </span>
    )
}
