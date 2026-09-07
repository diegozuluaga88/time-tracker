// TT.42 · Diego 2026-09-07 · Team View sub-tabs · Utilization default landing.
// Antes: 5 cards apiladas en 3 filas · Utilization escondida en el medio.
// Ahora: 3 tabs · Utilization por default (matches benchmark:177 "default landing").
//
// - Tab 1 · Utilization (default) · pain #2 · heatmap
// - Tab 2 · Attention (badge) · pain #1 missing + pain #6 outliers + parallel
// - Tab 3 · Trends (badge) · whitespace #3 velocity sparklines
//
// Selectors calculados 1 sola vez y pasados a los tabs · fixes el doble-run
// silencioso que corría en el AttentionNeededCard aggregate deprecado.

import { useMemo, useState } from 'react'
import { BarChart3, AlertCircle, LineChart } from 'lucide-react'
import TabsShell, { type TabDef } from './team/TabsShell'
import UtilizationHeatmap from './UtilizationHeatmap'
import MissingTimeDigest from './MissingTimeDigest'
import OutlierCoachingCard from './OutlierCoachingCard'
import TrainingGapSparklines from './TrainingGapSparklines'
import DesignerDrilldown from './DesignerDrilldown'
import {
    buildUtilizationGrid,
    detectMissingTime,
    detectOutliers,
    buildTrainingGaps,
    weekDays,
} from '../../data/managerInsights'
import type { TimeEntry, DesignerId } from '../../data/timeEntries'

interface Props {
    weekMondayIso: string
    allEntries: TimeEntry[]
    todayIso: string
    summerFridaysActive?: boolean
    onSendDigest?: (designerIds: string[]) => void
    onSendCoachingMessage?: (designerId: string, entryId: string) => void
}

export default function TeamView({
    weekMondayIso, allEntries, todayIso, summerFridaysActive = false, onSendDigest, onSendCoachingMessage,
}: Props) {
    const [drilldownDesignerId, setDrilldownDesignerId] = useState<DesignerId | null>(null)

    // Selectors · 1 sola vez · pasados como props a los tabs (no duplicación).
    const days = useMemo(() => weekDays(weekMondayIso), [weekMondayIso])
    const missing = useMemo(() => detectMissingTime(weekMondayIso, allEntries, summerFridaysActive, todayIso), [weekMondayIso, allEntries, summerFridaysActive, todayIso])
    const outliers = useMemo(() => detectOutliers(weekMondayIso, allEntries), [weekMondayIso, allEntries])
    const utilGrid = useMemo(() => buildUtilizationGrid(weekMondayIso, allEntries, summerFridaysActive), [weekMondayIso, allEntries, summerFridaysActive])
    const trainingGaps = useMemo(() => buildTrainingGaps(weekMondayIso, allEntries), [weekMondayIso, allEntries])

    const openDrilldown = (designerId: string) => setDrilldownDesignerId(designerId as DesignerId)

    const attentionCount = missing.length + outliers.length
    const trendsCount = trainingGaps.filter(g => Math.abs(g.trendPercent) >= 15).length

    const tabs: TabDef[] = [
        { id: 'utilization', label: 'Utilization', icon: BarChart3 },
        { id: 'attention',   label: 'Attention',   icon: AlertCircle, badge: attentionCount, badgeTone: attentionCount > 5 ? 'destructive' : attentionCount > 0 ? 'warning' : 'muted' },
        { id: 'trends',      label: 'Trends',      icon: LineChart,   badge: trendsCount,    badgeTone: trendsCount > 3 ? 'warning' : 'muted' },
    ]

    return (
        <>
            <TabsShell tabs={tabs} defaultTabId="utilization">
                {(active) => {
                    if (active === 'utilization') {
                        return (
                            <UtilizationHeatmap
                                grid={utilGrid}
                                weekDays={days}
                                todayIso={todayIso}
                                onDesignerClick={openDrilldown}
                            />
                        )
                    }
                    if (active === 'attention') {
                        if (missing.length === 0 && outliers.length === 0) {
                            return (
                                <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                                    <div className="text-sm font-semibold text-foreground">All good this week</div>
                                    <p className="text-xs text-muted-foreground mt-1">Nobody's behind target · no long sessions flagged.</p>
                                </div>
                            )
                        }
                        return (
                            <div className="space-y-4">
                                {missing.length > 0 && (
                                    <MissingTimeDigest missing={missing} weekMondayIso={weekMondayIso} onSendDigest={onSendDigest ?? (() => {})} />
                                )}
                                {outliers.length > 0 && (
                                    <OutlierCoachingCard outliers={outliers} onSendMessage={onSendCoachingMessage} />
                                )}
                            </div>
                        )
                    }
                    if (active === 'trends') {
                        return <TrainingGapSparklines rows={trainingGaps} onDesignerClick={openDrilldown} />
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
                summerFridaysActive={summerFridaysActive}
            />
        </>
    )
}
