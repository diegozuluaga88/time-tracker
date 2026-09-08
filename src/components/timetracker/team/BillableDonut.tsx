// TT.43 · Diego 2026-09-08 · Billable vs Internal donut.
// benchmark:178 · sot:99,122 · reemplaza el weekly rollup manual del
// per-employee split project vs internal.
//
// SVG-native (no chart library) · 2 arcs + center label.

import { PieChart } from 'lucide-react'
import type { BillableSplit } from '../../../data/managerInsights'

interface Props {
    split: BillableSplit
}

const SIZE = 100
const CX = SIZE / 2
const CY = SIZE / 2
const R = 38
const STROKE_W = 14

/** Convert (0..1) fraction to SVG arc path around center. */
function arcPath(fraction: number, startFraction: number = 0): string {
    if (fraction >= 0.999) {
        // Full circle · draw two half arcs
        return `M ${CX + R} ${CY} A ${R} ${R} 0 1 1 ${CX - R} ${CY} A ${R} ${R} 0 1 1 ${CX + R} ${CY}`
    }
    if (fraction <= 0.001) return ''
    const startAngle = startFraction * 2 * Math.PI - Math.PI / 2
    const endAngle = (startFraction + fraction) * 2 * Math.PI - Math.PI / 2
    const x1 = CX + R * Math.cos(startAngle)
    const y1 = CY + R * Math.sin(startAngle)
    const x2 = CX + R * Math.cos(endAngle)
    const y2 = CY + R * Math.sin(endAngle)
    const largeArc = fraction > 0.5 ? 1 : 0
    return `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`
}

export default function BillableDonut({ split }: Props) {
    const { billableHours, internalHours, total, billablePercent, internalPercent } = split
    const billableFrac = total > 0 ? billableHours / total : 0
    const billablePath = arcPath(billableFrac, 0)
    const internalPath = arcPath(1 - billableFrac, billableFrac)

    return (
        <div className="rounded-2xl border border-border bg-card p-4 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                    <PieChart className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-foreground">Billable split</h4>
                    <p className="text-[11px] text-muted-foreground">Team-wide this week</p>
                </div>
            </div>

            <div className="flex items-center gap-4 flex-1">
                <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-24 w-24 shrink-0" role="img" aria-label={`Billable ${billablePercent}%, internal ${internalPercent}%`}>
                    {total === 0 ? (
                        <circle cx={CX} cy={CY} r={R} className="fill-none stroke-border" strokeWidth={STROKE_W} />
                    ) : (
                        <>
                            <path d={billablePath} className="fill-none stroke-success" strokeWidth={STROKE_W} strokeLinecap="butt" />
                            <path d={internalPath} className="fill-none stroke-muted-foreground/40" strokeWidth={STROKE_W} strokeLinecap="butt" />
                        </>
                    )}
                    <text x={CX} y={CY - 2} textAnchor="middle" className="fill-foreground font-semibold tabular-nums" fontSize="16">
                        {total > 0 ? `${billablePercent}%` : '—'}
                    </text>
                    <text x={CX} y={CY + 12} textAnchor="middle" className="fill-muted-foreground uppercase tracking-wider" fontSize="7">
                        {total > 0 ? 'BILL' : 'no data'}
                    </text>
                </svg>

                <ul className="space-y-2 text-xs flex-1 min-w-0">
                    <li className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-success shrink-0" />
                        <span className="text-foreground">Billable</span>
                        <span className="ml-auto tabular-nums font-medium text-foreground">{billableHours.toFixed(1)}h</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40 shrink-0" />
                        <span className="text-muted-foreground">Internal</span>
                        <span className="ml-auto tabular-nums font-medium text-muted-foreground">{internalHours.toFixed(1)}h</span>
                    </li>
                </ul>
            </div>
        </div>
    )
}
