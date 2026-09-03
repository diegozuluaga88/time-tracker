// TT.41 · Diego 2026-09-03 · History tab · pain #4 (Excel manual · McKinley
// + Jimmy corren reports Monday morning). Compone:
// - Multi-week team-wide trend chart (util % + billable ratio · 8 wks)
// - Week-over-week per-designer comparison table
// - Export weekly report button (CSV) + Export trend CSV
//
// Referencias doc:
// - benchmark.md · KPI #12 'WoW Trend Delta · Leadership weekly'
// - benchmark.md · '3 KPI cards must-have · WoW trend delta con sparkline'

import { useMemo, useState } from 'react'
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getTeamMember, avatarGradient } from '../../team/teamMembers'
import { weekTrendToCsv, weekTotalsToCsv } from '../../../data/managerInsights'
import type { WeekTrendPoint, WeekOverWeekRow, DesignerWeekTotals } from '../../../data/managerInsights'
import type { DesignerId } from '../../../data/timeEntries'

interface Props {
    trend: WeekTrendPoint[]
    weekOverWeek: WeekOverWeekRow[]
    weekTotals: DesignerWeekTotals[]  // solo para el CSV del weekly report
    weekMondayIso: string
    onDesignerClick: (designerId: DesignerId) => void
    onExport: (csv: string, filename: string) => void
}

type Metric = 'utilization' | 'total' | 'billable' | 'internal'

const METRICS: Array<{ key: Metric; label: string; unit: string; get: (p: WeekTrendPoint) => number }> = [
    { key: 'utilization', label: 'Utilization %', unit: '%', get: p => p.utilizationPercent },
    { key: 'total',       label: 'Total hours',   unit: 'h', get: p => p.totalHours },
    { key: 'billable',    label: 'Billable',      unit: 'h', get: p => p.billableHours },
    { key: 'internal',    label: 'Internal',      unit: 'h', get: p => p.internalHours },
]

export default function HistoryTab({ trend, weekOverWeek, weekTotals, weekMondayIso, onDesignerClick, onExport }: Props) {
    const [metric, setMetric] = useState<Metric>('utilization')
    const selectedMetric = METRICS.find(m => m.key === metric)!

    const chartWidth = 720
    const chartHeight = 160
    const padding = { top: 12, right: 12, bottom: 24, left: 40 }
    const innerW = chartWidth - padding.left - padding.right
    const innerH = chartHeight - padding.top - padding.bottom

    const values = trend.map(selectedMetric.get)
    const maxValue = Math.max(1, ...values)
    const minValue = 0

    const points = useMemo(() => {
        return trend.map((p, i) => {
            const x = padding.left + (i * innerW) / Math.max(1, trend.length - 1)
            const v = selectedMetric.get(p)
            const y = padding.top + innerH - ((v - minValue) / (maxValue - minValue || 1)) * innerH
            return { x, y, value: v, label: p.weekLabel, isCurrent: i === trend.length - 1 }
        })
    }, [trend, metric, innerW, innerH, padding.left, padding.top, maxValue, minValue, selectedMetric])

    const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
    const areaPath = points.length > 0
        ? `M ${points[0].x},${padding.top + innerH} L ${polyline.split(' ').join(' L ')} L ${points[points.length - 1].x},${padding.top + innerH} Z`
        : ''

    const currentWeek = trend[trend.length - 1]
    const prevWeek = trend[trend.length - 2]
    const wowDelta = currentWeek && prevWeek ? selectedMetric.get(currentWeek) - selectedMetric.get(prevWeek) : 0
    const wowPercent = currentWeek && prevWeek && selectedMetric.get(prevWeek) > 0
        ? Math.round((wowDelta / selectedMetric.get(prevWeek)) * 100)
        : 0

    const handleExportWeekReport = () => {
        const csv = weekTotalsToCsv(weekTotals, id => getTeamMember(id)?.name ?? id)
        onExport(csv, `weekly-report-${weekMondayIso}.csv`)
    }
    const handleExportTrend = () => {
        const csv = weekTrendToCsv(trend)
        onExport(csv, `team-trend-${trend.length}wk-${weekMondayIso}.csv`)
    }

    return (
        <div className="space-y-4">
            {/* Multi-week trend chart */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border gap-3 flex-wrap">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Team trend · last {trend.length} weeks</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Week-over-week delta shown at right · click below to switch metric.</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {currentWeek && prevWeek && (
                            <WoWBadge delta={wowDelta} percent={wowPercent} unit={selectedMetric.unit} />
                        )}
                        <button
                            type="button"
                            onClick={handleExportTrend}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-input text-xs font-medium text-foreground px-2.5 py-1.5 hover:bg-muted transition-colors"
                            title="Download the multi-week trend as CSV"
                        >
                            <Download className="h-3 w-3" />
                            Trend CSV
                        </button>
                    </div>
                </div>

                <div className="px-5 py-4">
                    <div className="flex items-center gap-1 mb-3">
                        {METRICS.map(m => (
                            <button
                                key={m.key}
                                type="button"
                                onClick={() => setMetric(m.key)}
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${metric === m.key ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground border-input hover:text-foreground hover:bg-muted'}`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>

                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-40" role="img" aria-label={`Team ${selectedMetric.label} over the last ${trend.length} weeks`}>
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                            const y = padding.top + innerH - pct * innerH
                            return (
                                <line key={pct} x1={padding.left} y1={y} x2={padding.left + innerW} y2={y} className="stroke-border" strokeWidth={1} />
                            )
                        })}
                        {/* Area */}
                        <path d={areaPath} className="fill-primary/20" />
                        {/* Line */}
                        <polyline points={polyline} className="stroke-primary" strokeWidth={2} fill="none" />
                        {/* Points */}
                        {points.map((p, i) => (
                            <g key={i}>
                                <circle cx={p.x} cy={p.y} r={p.isCurrent ? 4 : 2.5} className={p.isCurrent ? 'fill-primary' : 'fill-primary/70'} />
                                <text x={p.x} y={chartHeight - 6} textAnchor="middle" className="fill-muted-foreground text-[10px] font-mono">{p.label}</text>
                            </g>
                        ))}
                        {/* Y-axis labels */}
                        {[0, 0.5, 1].map(pct => {
                            const y = padding.top + innerH - pct * innerH
                            const v = minValue + pct * (maxValue - minValue)
                            return (
                                <text key={pct} x={padding.left - 8} y={y + 3} textAnchor="end" className="fill-muted-foreground text-[10px] font-mono tabular-nums">
                                    {selectedMetric.unit === '%' ? Math.round(v) : v.toFixed(1)}{selectedMetric.unit}
                                </text>
                            )
                        })}
                    </svg>
                </div>
            </div>

            {/* WoW per-designer table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Week-over-week · per designer</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">This week vs last week · click row for drill-down.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleExportWeekReport}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-input text-xs font-medium text-foreground px-2.5 py-1.5 hover:bg-muted transition-colors"
                        title="Download this week's team report as CSV"
                    >
                        <Download className="h-3 w-3" />
                        Weekly report CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                <th className="text-left px-4 py-2">Designer</th>
                                <th className="text-center px-2 py-2">Last week</th>
                                <th className="text-center px-2 py-2">This week</th>
                                <th className="text-center px-2 py-2">Δ hours</th>
                                <th className="text-center px-2 py-2">Δ %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {weekOverWeek.map(row => {
                                const person = getTeamMember(row.designerId)
                                return (
                                    <tr
                                        key={row.designerId}
                                        onClick={() => onDesignerClick(row.designerId)}
                                        className="border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors cursor-pointer"
                                    >
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${avatarGradient(row.designerId)} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                                                    {person?.initials ?? '?'}
                                                </div>
                                                <span className="text-sm font-medium text-foreground truncate">{person?.name ?? row.designerId}</span>
                                            </div>
                                        </td>
                                        <td className="text-center px-2 py-2.5 text-xs tabular-nums text-muted-foreground">{row.lastWeekHours.toFixed(1)}h</td>
                                        <td className="text-center px-2 py-2.5 text-sm font-semibold tabular-nums text-foreground">{row.thisWeekHours.toFixed(1)}h</td>
                                        <td className={`text-center px-2 py-2.5 text-sm font-semibold tabular-nums ${row.deltaHours > 0 ? 'text-success' : row.deltaHours < 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                                            {row.deltaHours > 0 ? '+' : ''}{row.deltaHours.toFixed(1)}h
                                        </td>
                                        <td className="text-center px-2 py-2.5 text-xs tabular-nums text-muted-foreground">
                                            {row.lastWeekHours > 0 ? `${row.deltaPercent > 0 ? '+' : ''}${row.deltaPercent}%` : '—'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function WoWBadge({ delta, percent, unit }: { delta: number; percent: number; unit: string }) {
    const Icon = delta > 0.01 ? TrendingUp : delta < -0.01 ? TrendingDown : Minus
    const tone = delta > 0.01 ? 'text-success bg-success-soft border-success/40' : delta < -0.01 ? 'text-warning bg-warning-soft border-warning/40' : 'text-muted-foreground bg-muted border-border'
    const sign = delta > 0 ? '+' : ''
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums ${tone}`} title="Week-over-week change">
            <Icon className="h-3 w-3" />
            {sign}{unit === '%' ? Math.round(delta) : delta.toFixed(1)}{unit} · {sign}{percent}%
        </span>
    )
}
