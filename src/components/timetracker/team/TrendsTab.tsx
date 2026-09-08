// TT.43.1 · Diego 2026-09-08 · Trends tab · summary chips + threshold
// filter + team velocity mini-chart + TrainingGapSparklines existente.
// Antes: solo la tabla · sin visión agregada del team.

import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
import TrainingGapSparklines from '../TrainingGapSparklines'
import { buildTrendsSummary, buildTeamVelocityTrend } from '../../../data/managerInsights'
import type { TrainingGapRow } from '../../../data/managerInsights'
import type { DesignerId } from '../../../data/timeEntries'

interface Props {
    rows: TrainingGapRow[]
    onDesignerClick: (designerId: DesignerId) => void
}

const THRESHOLDS = [10, 15, 30] as const

export default function TrendsTab({ rows, onDesignerClick }: Props) {
    const [threshold, setThreshold] = useState<number>(15)

    const summary = useMemo(() => buildTrendsSummary(rows, threshold), [rows, threshold])
    const teamTrend = useMemo(() => buildTeamVelocityTrend(rows), [rows])
    const filtered = useMemo(() => rows.filter(r => Math.abs(r.trendPercent) >= threshold), [rows, threshold])

    return (
        <div className="space-y-4">
            {/* Summary row · 4 mini KPIs */}
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

            {/* Team velocity chart + filter · lado a lado */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 rounded-2xl border border-border bg-card p-4">
                <TeamVelocityChart points={teamTrend} />
                <div className="flex flex-col items-start gap-2 lg:border-l lg:border-border lg:pl-4">
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
                    <p className="text-[11px] text-muted-foreground max-w-[220px]">Filters the table below · lower threshold surfaces more subtle shifts.</p>
                </div>
            </div>

            {/* Table (existente · filtrada por threshold) */}
            <TrainingGapSparklines rows={filtered} onDesignerClick={onDesignerClick} />
        </div>
    )
}

// -------------------- Sub-components --------------------

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

function TeamVelocityChart({ points }: { points: { weekOffset: number; avgMinutes: number }[] }) {
    const w = 480
    const h = 100
    const pad = { top: 8, right: 8, bottom: 22, left: 40 }
    const iw = w - pad.left - pad.right
    const ih = h - pad.top - pad.bottom
    const values = points.map(p => p.avgMinutes)
    const maxV = Math.max(1, ...values)
    const minV = 0
    const coords = points.map((p, i) => {
        const x = pad.left + (points.length > 1 ? (i * iw) / (points.length - 1) : iw / 2)
        const y = pad.top + ih - ((p.avgMinutes - minV) / (maxV - minV || 1)) * ih
        return { x, y, value: p.avgMinutes, isCurrent: i === points.length - 1 }
    })
    const line = coords.map(c => `${c.x},${c.y}`).join(' ')
    const area = coords.length > 0
        ? `M ${coords[0].x},${pad.top + ih} L ${coords.map(c => `${c.x},${c.y}`).join(' L ')} L ${coords[coords.length - 1].x},${pad.top + ih} Z`
        : ''
    const current = points[points.length - 1]?.avgMinutes ?? 0
    const previous = points[points.length - 2]?.avgMinutes ?? 0
    const deltaPct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0
    const deltaTone = deltaPct > 5 ? 'text-warning' : deltaPct < -5 ? 'text-success' : 'text-muted-foreground'

    return (
        <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-2 mb-1 flex-wrap">
                <div>
                    <h4 className="text-sm font-semibold text-foreground">Team velocity · last 4 weeks</h4>
                    <p className="text-[11px] text-muted-foreground">Average minutes per task-type entry (all designers, all tasks). Higher = slower.</p>
                </div>
                <div className="text-right">
                    <div className="text-lg font-semibold tabular-nums text-foreground">{Math.round(current)} min</div>
                    <div className={`text-[11px] tabular-nums ${deltaTone}`}>
                        {deltaPct > 0 ? '↑' : deltaPct < 0 ? '↓' : '·'} {Math.abs(deltaPct)}% vs last week
                    </div>
                </div>
            </div>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" role="img" aria-label="Team velocity trend last 4 weeks">
                {[0, 0.5, 1].map(pct => {
                    const y = pad.top + ih - pct * ih
                    return <line key={pct} x1={pad.left} y1={y} x2={pad.left + iw} y2={y} className="stroke-border" strokeWidth={1} />
                })}
                <path d={area} className="fill-primary/20" />
                <polyline points={line} className="stroke-primary" strokeWidth={2} fill="none" />
                {coords.map((c, i) => (
                    <g key={i}>
                        <circle cx={c.x} cy={c.y} r={c.isCurrent ? 3.5 : 2.5} className={c.isCurrent ? 'fill-primary' : 'fill-primary/70'} />
                        <text x={c.x} y={h - 6} textAnchor="middle" className="fill-muted-foreground text-[10px] font-mono">
                            {i === 0 ? '4wk' : i === points.length - 1 ? 'now' : `${points.length - 1 - i}wk`}
                        </text>
                    </g>
                ))}
                {[0, 0.5, 1].map(pct => {
                    const y = pad.top + ih - pct * ih
                    const v = minV + pct * (maxV - minV)
                    return (
                        <text key={pct} x={pad.left - 6} y={y + 3} textAnchor="end" className="fill-muted-foreground text-[10px] font-mono tabular-nums">
                            {Math.round(v)}m
                        </text>
                    )
                })}
            </svg>
        </div>
    )
}
