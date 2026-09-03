// TT.41 · Diego 2026-09-03 · Utilization tab · wrap UtilizationHeatmap +
// nueva tabla per-designer + botón Export CSV. Pain #2 · reemplaza el
// Excel manual que McKinley + Jimmy corren Monday morning.

import { useState } from 'react'
import { Download, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react'
import UtilizationHeatmap from '../UtilizationHeatmap'
import { getTeamMember, avatarGradient } from '../../team/teamMembers'
import { weekTotalsToCsv } from '../../../data/managerInsights'
import type { UtilizationCell, DesignerWeekTotals } from '../../../data/managerInsights'
import type { DesignerId } from '../../../data/timeEntries'

interface Props {
    grid: UtilizationCell[][]
    weekDays: string[]
    todayIso: string
    weekTotals: DesignerWeekTotals[]
    onDesignerClick: (designerId: DesignerId) => void
    onExport: (csv: string, filename: string) => void
    weekMondayIso: string
}

type SortKey = 'name' | 'capacity' | 'billable' | 'internal' | 'total' | 'percent'

export default function UtilizationTab({ grid, weekDays, todayIso, weekTotals, onDesignerClick, onExport, weekMondayIso }: Props) {
    const [sortKey, setSortKey] = useState<SortKey>('percent')
    const [sortDesc, setSortDesc] = useState(true)

    const sorted = [...weekTotals].sort((a, b) => {
        const getName = (id: string) => getTeamMember(id)?.name ?? id
        let cmp = 0
        switch (sortKey) {
            case 'name': cmp = getName(a.designerId).localeCompare(getName(b.designerId)); break
            case 'capacity': cmp = a.capacity - b.capacity; break
            case 'billable': cmp = a.billable - b.billable; break
            case 'internal': cmp = a.internal - b.internal; break
            case 'total': cmp = a.total - b.total; break
            case 'percent': cmp = a.percent - b.percent; break
        }
        return sortDesc ? -cmp : cmp
    })

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortDesc(v => !v)
        else { setSortKey(key); setSortDesc(true) }
    }

    const handleExport = () => {
        const csv = weekTotalsToCsv(weekTotals, (id) => getTeamMember(id)?.name ?? id)
        onExport(csv, `team-week-${weekMondayIso}.csv`)
    }

    // Team-wide totals for the summary strip
    const teamBillable = weekTotals.reduce((s, t) => s + t.billable, 0)
    const teamInternal = weekTotals.reduce((s, t) => s + t.internal, 0)
    const teamTotal = teamBillable + teamInternal
    const teamCap = weekTotals.reduce((s, t) => s + t.capacity, 0)
    const teamPercent = teamCap > 0 ? Math.round((teamTotal / teamCap) * 100) : 0
    const billableRatio = teamTotal > 0 ? Math.round((teamBillable / teamTotal) * 100) : 0

    return (
        <div className="space-y-4">
            {/* Team totals strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniStat label="Team billable" value={`${teamBillable.toFixed(1)}h`} secondary={`${billableRatio}% of total`} />
                <MiniStat label="Team internal" value={`${teamInternal.toFixed(1)}h`} secondary={`${100 - billableRatio}% of total`} />
                <MiniStat label="Team total" value={`${teamTotal.toFixed(1)}h`} secondary={`of ${teamCap}h capacity`} />
                <MiniStat label="Utilization" value={`${teamPercent}%`} secondary={teamPercent >= 85 && teamPercent <= 105 ? 'On target' : teamPercent > 105 ? 'Over capacity' : 'Below target'} tone={teamPercent >= 85 && teamPercent <= 105 ? 'success' : teamPercent > 105 ? 'destructive' : 'warning'} />
            </div>

            {/* Heatmap · reutiliza el componente existente */}
            <UtilizationHeatmap grid={grid} weekDays={weekDays} todayIso={todayIso} onDesignerClick={onDesignerClick} />

            {/* Per-designer table con sort */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Weekly totals per designer</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Click column to sort · click row for drill-down.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleExport}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-input text-xs font-medium text-foreground px-3 py-1.5 hover:bg-muted transition-colors"
                        title="Download team totals as CSV"
                    >
                        <Download className="h-3 w-3" />
                        Export CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <SortableTh label="Designer" sortKey="name" active={sortKey} desc={sortDesc} onSort={handleSort} align="left" />
                                <SortableTh label="Capacity" sortKey="capacity" active={sortKey} desc={sortDesc} onSort={handleSort} />
                                <SortableTh label="Billable" sortKey="billable" active={sortKey} desc={sortDesc} onSort={handleSort} />
                                <SortableTh label="Internal" sortKey="internal" active={sortKey} desc={sortDesc} onSort={handleSort} />
                                <SortableTh label="Total" sortKey="total" active={sortKey} desc={sortDesc} onSort={handleSort} />
                                <SortableTh label="Util %" sortKey="percent" active={sortKey} desc={sortDesc} onSort={handleSort} />
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map(row => {
                                const person = getTeamMember(row.designerId)
                                const tone = row.percent >= 85 && row.percent <= 105 ? 'text-success' : row.percent > 105 ? 'text-destructive' : 'text-warning'
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
                                        <td className="text-center px-2 py-2.5 text-xs tabular-nums text-muted-foreground">{row.capacity}h</td>
                                        <td className="text-center px-2 py-2.5 text-sm tabular-nums text-foreground">{row.billable.toFixed(1)}h</td>
                                        <td className="text-center px-2 py-2.5 text-sm tabular-nums text-muted-foreground">{row.internal.toFixed(1)}h</td>
                                        <td className="text-center px-2 py-2.5 text-sm font-semibold tabular-nums text-foreground">{row.total.toFixed(1)}h</td>
                                        <td className={`text-center px-2 py-2.5 text-sm font-semibold tabular-nums ${tone}`}>{row.percent}%</td>
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

function MiniStat({ label, value, secondary, tone }: { label: string; value: string; secondary: string; tone?: 'success' | 'warning' | 'destructive' }) {
    const toneClass = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : tone === 'destructive' ? 'text-destructive' : 'text-foreground'
    return (
        <div className="rounded-xl border border-border bg-card p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className={`text-2xl font-semibold tabular-nums mt-0.5 ${toneClass}`}>{value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{secondary}</div>
        </div>
    )
}

function SortableTh({ label, sortKey, active, desc, onSort, align = 'center' }: { label: string; sortKey: SortKey; active: SortKey; desc: boolean; onSort: (k: SortKey) => void; align?: 'left' | 'center' }) {
    const isActive = active === sortKey
    const Arrow = isActive ? (desc ? ArrowDown : ArrowUp) : ArrowUpDown
    return (
        <th className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-${align}`}>
            <button type="button" onClick={() => onSort(sortKey)} className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${isActive ? 'text-foreground' : ''}`}>
                {label}
                <Arrow className="h-3 w-3 opacity-70" />
            </button>
        </th>
    )
}
