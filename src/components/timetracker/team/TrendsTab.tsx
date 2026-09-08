// TT.43.2 · Diego 2026-09-08 · Trends tab.
// Reorden · training-gap sparklines PRIMERO (whitespace #3 · headline
// differentiator) · charts must-have DESPUÉS · consolidados y
// justificados por doc:
//   - Hours vs Sold  · benchmark:225 · 3 KPI must-have
//   - Production Rate · benchmark:223 · KPI must-have C-level
// Eliminados de este flujo (Diego · 'solo los más relevantes'):
//   BillableDonut · BudgetStatusTable · Team velocity chart.

import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
import TrainingGapSparklines from '../TrainingGapSparklines'
import HoursVsSoldCard from './HoursVsSoldCard'
import ProductionRateCard from './ProductionRateCard'
import { buildTrendsSummary } from '../../../data/managerInsights'
import type { TrainingGapRow, HoursVsSold, BucketRate } from '../../../data/managerInsights'
import type { DesignerId } from '../../../data/timeEntries'

interface Props {
    rows: TrainingGapRow[]
    onDesignerClick: (designerId: DesignerId) => void
    hoursVsSold: HoursVsSold
    productionRate: BucketRate[]
}

const THRESHOLDS = [10, 15, 30] as const

export default function TrendsTab({ rows, onDesignerClick, hoursVsSold, productionRate }: Props) {
    const [threshold, setThreshold] = useState<number>(15)

    const summary = useMemo(() => buildTrendsSummary(rows, threshold), [rows, threshold])
    const filtered = useMemo(() => rows.filter(r => Math.abs(r.trendPercent) >= threshold), [rows, threshold])

    return (
        <div className="space-y-4">
            {/* Summary strip · 4 mini KPIs del training-gap */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniKpi
                    icon={Activity}
                    label="Total rows"
                    value={String(summary.total)}
                    secondary={`across ${rows.length > 0 ? new Set(rows.map(r => r.designerId)).size : 0} designers`}
                    tone="neutral"
                />
                <MiniKpi
                    icon={TrendingUp}
                    label="Slowing down"
                    value={String(summary.slower)}
                    secondary={`|trend| ≥ ${threshold}%`}
                    tone={summary.slower > 3 ? 'warning' : 'neutral'}
                />
                <MiniKpi
                    icon={TrendingDown}
                    label="Getting faster"
                    value={String(summary.faster)}
                    secondary={`|trend| ≥ ${threshold}%`}
                    tone={summary.faster > 0 ? 'success' : 'neutral'}
                />
                <MiniKpi
                    icon={Minus}
                    label="Stable"
                    value={String(summary.stable)}
                    secondary={`avg change ${summary.avgAbsChange}%`}
                    tone="neutral"
                />
            </div>

            {/* Threshold filter · 1 row compact */}
            <div className="flex items-center gap-3 flex-wrap px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Threshold</span>
                <div className="inline-flex rounded-md border border-input p-0.5 bg-background">
                    {THRESHOLDS.map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setThreshold(t)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded tabular-nums transition-colors ${threshold === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                        >
                            ±{t}%
                        </button>
                    ))}
                </div>
                <span className="text-[11px] text-muted-foreground">Lower threshold surfaces more subtle shifts.</span>
            </div>

            {/* Training-gap sparklines · headline whitespace #3 */}
            <TrainingGapSparklines rows={filtered} onDesignerClick={onDesignerClick} />

            {/* Charts must-have debajo · benchmark:223 + benchmark:225 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <HoursVsSoldCard data={hoursVsSold} />
                <ProductionRateCard buckets={productionRate} />
            </div>
        </div>
    )
}

function MiniKpi({ icon: Icon, label, value, secondary, tone }: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
    secondary: string
    tone: 'success' | 'warning' | 'neutral'
}) {
    const toneCls = tone === 'success' ? 'text-success bg-success-soft/40 border-success/40'
        : tone === 'warning' ? 'text-warning bg-warning-soft/40 border-warning/40'
        : 'text-foreground bg-card border-border'
    return (
        <div className={`rounded-xl border p-3 ${toneCls}`}>
            <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`h-3 w-3 ${tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-muted-foreground'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
            </div>
            <div className={`text-2xl font-semibold tabular-nums ${tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-foreground'}`}>{value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{secondary}</div>
        </div>
    )
}
