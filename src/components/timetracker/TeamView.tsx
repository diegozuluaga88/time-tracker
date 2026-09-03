// TT.41 · Diego 2026-09-03 · Manager Dashboard root (rediseño completo).
// Antes: 5 cards stack-eadas con data duplicada (missing-time en 2 lugares,
// outliers en 2 lugares, training-gaps en 2 lugares, heatmap "escondido" en
// row 2). Ahora: KPI strip siempre visible + 4 tabs [Attention · Utilization
// · Trends · History] · cada dato vive en 1 lugar · action buttons con label
// visible · pain #1-6 cubiertos y export CSV para pain #4.
//
// Heurísticas aplicadas:
// - Krug L1 · titles action-oriented (Needs attention · Utilization · Trends)
// - Nielsen H1 · KPI strip = system status siempre visible
// - Nielsen H4 · consistency · rows/actions con mismo pattern
// - Nielsen H8 · minimalist · 4 tabs vs 5 cards stack-eadas

import { useMemo, useState } from 'react'
import { AlertCircle, BarChart3, LineChart, History } from 'lucide-react'
import TabsShell, { type TabDef } from './team/TabsShell'
import TeamKpiStrip from './team/TeamKpiStrip'
import AttentionTab from './team/AttentionTab'
import UtilizationTab from './team/UtilizationTab'
import TrendsTab from './team/TrendsTab'
import HistoryTab from './team/HistoryTab'
import DesignerDrilldown from './DesignerDrilldown'
import {
    buildUtilizationGrid,
    detectMissingTime,
    detectOutliers,
    detectParallelWork,
    buildTrainingGaps,
    buildDesignerWeekTotals,
    buildTeamWeeklyTrend,
    buildWeekOverWeek,
    weekDays,
    addDaysIso,
} from '../../data/managerInsights'
import type { TimeEntry, DesignerId } from '../../data/timeEntries'

interface Props {
    weekMondayIso: string
    allEntries: TimeEntry[]
    todayIso: string
    summerFridaysActive?: boolean
    onSendDigest?: (designerIds: string[]) => void
    onSendCoachingMessage?: (designerId: string, entryId: string) => void
    onExportCsv?: (csv: string, filename: string) => void
}

export default function TeamView({
    weekMondayIso, allEntries, todayIso, summerFridaysActive = false, onSendDigest, onSendCoachingMessage, onExportCsv,
}: Props) {
    const [drilldownDesignerId, setDrilldownDesignerId] = useState<DesignerId | null>(null)

    // Selectors · calculados 1 sola vez y pasados a los tabs (no duplicación).
    const days = useMemo(() => weekDays(weekMondayIso), [weekMondayIso])
    const missing = useMemo(() => detectMissingTime(weekMondayIso, allEntries, summerFridaysActive, todayIso), [weekMondayIso, allEntries, summerFridaysActive, todayIso])
    const outliers = useMemo(() => detectOutliers(weekMondayIso, allEntries), [weekMondayIso, allEntries])
    const parallel = useMemo(() => detectParallelWork(weekMondayIso, allEntries), [weekMondayIso, allEntries])
    const utilGrid = useMemo(() => buildUtilizationGrid(weekMondayIso, allEntries, summerFridaysActive), [weekMondayIso, allEntries, summerFridaysActive])
    const trainingGaps = useMemo(() => buildTrainingGaps(weekMondayIso, allEntries), [weekMondayIso, allEntries])
    const weekTotals = useMemo(() => buildDesignerWeekTotals(weekMondayIso, allEntries, summerFridaysActive), [weekMondayIso, allEntries, summerFridaysActive])
    const previousWeekTotals = useMemo(() => buildDesignerWeekTotals(addDaysIso(weekMondayIso, -7), allEntries, summerFridaysActive), [weekMondayIso, allEntries, summerFridaysActive])
    const trend = useMemo(() => buildTeamWeeklyTrend(weekMondayIso, allEntries, 8, summerFridaysActive), [weekMondayIso, allEntries, summerFridaysActive])
    const wow = useMemo(() => buildWeekOverWeek(weekMondayIso, allEntries, summerFridaysActive), [weekMondayIso, allEntries, summerFridaysActive])

    const attentionCount = missing.length + outliers.length + parallel.length
    const utilizationBadge = weekTotals.filter(t => t.percent > 105).length  // over-capacity count
    const trendsCount = trainingGaps.filter(g => Math.abs(g.trendPercent) >= 15).length

    const openDrilldown = (designerId: string) => setDrilldownDesignerId(designerId as DesignerId)

    // CSV export helper (fallback si el parent no provee)
    const handleExport = onExportCsv ?? ((csv: string, filename: string) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    })

    const tabs: TabDef[] = [
        { id: 'attention',   label: 'Needs attention', icon: AlertCircle, badge: attentionCount, badgeTone: attentionCount > 5 ? 'destructive' : attentionCount > 0 ? 'warning' : 'muted' },
        { id: 'utilization', label: 'Utilization',     icon: BarChart3,   badge: utilizationBadge, badgeTone: utilizationBadge > 0 ? 'warning' : 'muted' },
        { id: 'trends',      label: 'Trends',          icon: LineChart,   badge: trendsCount,      badgeTone: trendsCount > 3 ? 'warning' : 'muted' },
        { id: 'history',     label: 'History',         icon: History },
    ]

    return (
        <div className="space-y-4">
            <TeamKpiStrip
                weekTotals={weekTotals}
                missing={missing}
                outliers={outliers}
                trainingGaps={trainingGaps}
                previousWeekTotals={previousWeekTotals}
            />

            <TabsShell tabs={tabs} defaultTabId="attention">
                {(active) => {
                    if (active === 'attention') {
                        return (
                            <AttentionTab
                                missing={missing}
                                outliers={outliers}
                                parallel={parallel}
                                onDesignerClick={openDrilldown}
                                onSendDigest={onSendDigest ?? (() => {})}
                                onSendCoaching={onSendCoachingMessage}
                            />
                        )
                    }
                    if (active === 'utilization') {
                        return (
                            <UtilizationTab
                                grid={utilGrid}
                                weekDays={days}
                                todayIso={todayIso}
                                weekTotals={weekTotals}
                                onDesignerClick={openDrilldown}
                                onExport={handleExport}
                                weekMondayIso={weekMondayIso}
                            />
                        )
                    }
                    if (active === 'trends') {
                        return <TrendsTab rows={trainingGaps} onDesignerClick={openDrilldown} />
                    }
                    if (active === 'history') {
                        return (
                            <HistoryTab
                                trend={trend}
                                weekOverWeek={wow}
                                weekTotals={weekTotals}
                                weekMondayIso={weekMondayIso}
                                onDesignerClick={openDrilldown}
                                onExport={handleExport}
                            />
                        )
                    }
                    return null
                }}
            </TabsShell>

            <DesignerDrilldown
                isOpen={drilldownDesignerId !== null}
                onClose={() => setDrilldownDesignerId(null)}
                designerId={drilldownDesignerId}
                weekMondayIso={weekMondayIso}
                allEntries={allEntries}
                summerFridaysActive={summerFridasFallback(summerFridaysActive)}
            />
        </div>
    )
}

// Alias explícito para evitar shadowing en la prop del drilldown (paranoia dev).
function summerFridasFallback(v: boolean): boolean { return v }
