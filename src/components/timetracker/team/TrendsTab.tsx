// TT.41 · Diego 2026-09-03 · Trends tab · wrap TrainingGapSparklines +
// filtro por threshold. Whitespace #3 · differentiator vs Harvest/Toggl.

import { useState, useMemo } from 'react'
import TrainingGapSparklines from '../TrainingGapSparklines'
import type { TrainingGapRow } from '../../../data/managerInsights'
import type { DesignerId } from '../../../data/timeEntries'

interface Props {
    rows: TrainingGapRow[]
    onDesignerClick: (designerId: DesignerId) => void
}

const THRESHOLDS = [10, 15, 30] as const

export default function TrendsTab({ rows, onDesignerClick }: Props) {
    const [threshold, setThreshold] = useState<number>(15)

    const filtered = useMemo(() => rows.filter(r => Math.abs(r.trendPercent) >= threshold), [rows, threshold])
    const slowerCount = filtered.filter(r => r.trendPercent > 0).length
    const fasterCount = filtered.filter(r => r.trendPercent < 0).length

    return (
        <div className="space-y-4">
            {/* Filter + summary strip */}
            <div className="flex items-center justify-between gap-3 flex-wrap rounded-2xl border border-border bg-card px-4 py-3">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Training gaps · 4-week velocity</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {filtered.length > 0
                            ? <>Showing <span className="tabular-nums">{filtered.length}</span> rows · <span className="text-warning tabular-nums">{slowerCount} slower</span> · <span className="text-success tabular-nums">{fasterCount} faster</span></>
                            : `No trends past ${threshold}% this window.`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Threshold</span>
                    <div className="inline-flex rounded-lg border border-input p-0.5 bg-background">
                        {THRESHOLDS.map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setThreshold(t)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md tabular-nums transition-colors ${threshold === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                            >
                                ±{t}%
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sparklines · reutiliza el componente existente */}
            <TrainingGapSparklines rows={filtered} onDesignerClick={onDesignerClick} />
        </div>
    )
}
