// TT.41 · Diego 2026-09-03 · Team KPI strip · manager-focused 4 metrics.
// Siempre visible above the fold · Nielsen H1 (visibility of system status).
// Tono adaptivo por umbral · success (green) · warning (amber) · destructive
// (red) via tokens semantic Strata.
//
// KPIs:
// 1. Team utilization %  (avg de buildDesignerWeekTotals.percent)
// 2. Behind target       (count percent < 85 + suma hoursMissing)
// 3. Outliers this week  (count detectOutliers tier=red)
// 4. Training gaps       (count buildTrainingGaps |trend|>=15%)

import { TrendingUp, AlertTriangle, LineChart, Users } from 'lucide-react'
import type { DesignerWeekTotals, MissingTimeInfo, Outlier, TrainingGapRow } from '../../../data/managerInsights'

interface Props {
    weekTotals: DesignerWeekTotals[]
    missing: MissingTimeInfo[]
    outliers: Outlier[]
    trainingGaps: TrainingGapRow[]
    previousWeekTotals?: DesignerWeekTotals[]
}

type Tone = 'success' | 'warning' | 'destructive' | 'neutral'

export default function TeamKpiStrip({ weekTotals, missing, outliers, trainingGaps, previousWeekTotals }: Props) {
    // Team utilization avg
    const activeTotals = weekTotals.filter(t => t.capacity > 0)
    const avgPercent = activeTotals.length > 0
        ? Math.round(activeTotals.reduce((s, t) => s + t.percent, 0) / activeTotals.length)
        : 0
    const prevAvgPercent = previousWeekTotals && previousWeekTotals.length > 0
        ? Math.round(previousWeekTotals.filter(t => t.capacity > 0).reduce((s, t) => s + t.percent, 0) / previousWeekTotals.filter(t => t.capacity > 0).length)
        : null
    const utilDelta = prevAvgPercent != null ? avgPercent - prevAvgPercent : null
    const utilTone: Tone = avgPercent >= 85 && avgPercent <= 105 ? 'success' : avgPercent > 105 ? 'destructive' : 'warning'

    // Behind target
    const behind = missing.length
    const behindHours = missing.reduce((s, m) => s + m.hoursMissing, 0)
    const behindTone: Tone = behind === 0 ? 'success' : behind <= 2 ? 'warning' : 'destructive'

    // Outliers red-tier count
    const redOutliers = outliers.filter(o => o.tier === 'red').length
    const outlierTone: Tone = redOutliers === 0 ? 'success' : redOutliers <= 1 ? 'warning' : 'destructive'

    // Training gaps significant (|trend| >= 15%)
    const gapsCount = trainingGaps.filter(g => Math.abs(g.trendPercent) >= 15).length
    const gapsTone: Tone = gapsCount === 0 ? 'success' : gapsCount <= 3 ? 'warning' : 'destructive'

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
                icon={Users}
                label="Team utilization"
                value={`${avgPercent}%`}
                secondary={utilDelta != null ? `${utilDelta >= 0 ? '↑' : '↓'} ${Math.abs(utilDelta)}pts vs last week` : `${activeTotals.length} active designer${activeTotals.length === 1 ? '' : 's'}`}
                tone={utilTone}
            />
            <KpiCard
                icon={TrendingUp}
                label="Behind target"
                value={`${behind}/${activeTotals.length || 0}`}
                secondary={behind > 0 ? `−${behindHours.toFixed(1)}h combined` : 'All on track'}
                tone={behindTone}
            />
            <KpiCard
                icon={AlertTriangle}
                label="Long sessions"
                value={String(redOutliers)}
                secondary={redOutliers > 0 ? `Entries ≥ 6h · needs coaching` : 'None flagged this week'}
                tone={outlierTone}
            />
            <KpiCard
                icon={LineChart}
                label="Training gaps"
                value={String(gapsCount)}
                secondary={gapsCount > 0 ? `Velocity shift ≥15% vs 4wk` : 'Trending stable'}
                tone={gapsTone}
            />
        </div>
    )
}

function KpiCard({ icon: Icon, label, value, secondary, tone }: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
    secondary: string
    tone: Tone
}) {
    const toneClass = tone === 'success' ? 'bg-success-soft/40 border-success/40 text-success'
        : tone === 'warning' ? 'bg-warning-soft/40 border-warning/40 text-warning'
        : tone === 'destructive' ? 'bg-destructive-soft/40 border-destructive/40 text-destructive'
        : 'bg-card border-border text-foreground'
    return (
        <div className={`rounded-2xl border p-4 ${toneClass.replace(/text-\S+/, '')}`}>
            <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`h-3.5 w-3.5 ${toneClass.match(/text-\S+/)?.[0] ?? 'text-muted-foreground'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
            </div>
            <div className={`text-3xl font-semibold tabular-nums ${toneClass.match(/text-\S+/)?.[0] ?? 'text-foreground'}`}>{value}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{secondary}</div>
        </div>
    )
}
