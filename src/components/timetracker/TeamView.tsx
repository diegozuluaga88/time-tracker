// TT.42 + TT.43 · Diego 2026-09-07/08 · Team View sub-tabs.
// - Tab Utilization (default) · pain #2 · heatmap + 4 filtros + 4 charts de valor.
// - Tab Attention (badge) · pain #1 missing + pain #6 outliers.
// - Tab Trends (badge) · whitespace #3 velocity sparklines.
//
// Selectors calculados 1 sola vez y pasados a los tabs. TT.43 agrega
// filtros locales al Utilization tab · state managed aquí para que aplique
// tanto al heatmap como a los 4 charts (single source of truth).

import { useMemo, useState } from 'react'
import { BarChart3, AlertCircle, LineChart } from 'lucide-react'
import TabsShell, { type TabDef } from './team/TabsShell'
import UtilizationHeatmap from './UtilizationHeatmap'
import MissingTimeDigest from './MissingTimeDigest'
import OutlierCoachingCard from './OutlierCoachingCard'
import TrainingGapSparklines from './TrainingGapSparklines'
import DesignerDrilldown from './DesignerDrilldown'
import UtilizationFiltersStrip from './team/UtilizationFilters'
import HoursVsSoldCard from './team/HoursVsSoldCard'
import ProductionRateCard from './team/ProductionRateCard'
import BillableDonut from './team/BillableDonut'
import BudgetStatusTable from './team/BudgetStatusTable'
import {
    buildUtilizationGrid,
    detectMissingTime,
    detectOutliers,
    buildTrainingGaps,
    weekDays,
    DEFAULT_FILTERS,
    buildFilterOptions,
    buildHoursVsSold,
    buildProductionRateByBucket,
    buildBillableDonut,
    buildProjectBudgetStatus,
    filterUtilizationEntries,
    type UtilizationFilters,
} from '../../data/managerInsights'
import type { TimeEntry, DesignerId } from '../../data/timeEntries'

interface Props {
    weekMondayIso: string
    allEntries: TimeEntry[]
    todayIso: string
    summerFridaysActive?: boolean
    onSendDigest?: (designerIds: string[]) => void
    onSendCoachingMessage?: (designerId: string, entryId: string, message?: string) => void
}

export default function TeamView({
    weekMondayIso, allEntries, todayIso, summerFridaysActive = false, onSendDigest, onSendCoachingMessage,
}: Props) {
    const [drilldownDesignerId, setDrilldownDesignerId] = useState<DesignerId | null>(null)

    // TT.43 · filtros state para el Utilization tab.
    const [filters, setFilters] = useState<UtilizationFilters>(DEFAULT_FILTERS)
    const filterOptions = useMemo(() => buildFilterOptions(), [])

    // Selectors · 1 sola vez · pasados como props a los tabs (no duplicación).
    const days = useMemo(() => weekDays(weekMondayIso), [weekMondayIso])
    const missing = useMemo(() => detectMissingTime(weekMondayIso, allEntries, summerFridaysActive, todayIso), [weekMondayIso, allEntries, summerFridaysActive, todayIso])
    const outliers = useMemo(() => detectOutliers(weekMondayIso, allEntries), [weekMondayIso, allEntries])
    const trainingGaps = useMemo(() => buildTrainingGaps(weekMondayIso, allEntries), [weekMondayIso, allEntries])

    // TT.43 · filtered entries + selectors del Utilization tab (respetan filters).
    const filteredEntries = useMemo(() => filterUtilizationEntries(allEntries, filters), [allEntries, filters])
    const utilGrid = useMemo(() => buildUtilizationGrid(weekMondayIso, filteredEntries, summerFridaysActive), [weekMondayIso, filteredEntries, summerFridaysActive])
    const hoursVsSold = useMemo(() => buildHoursVsSold(weekMondayIso, allEntries, filters), [weekMondayIso, allEntries, filters])
    const productionRate = useMemo(() => buildProductionRateByBucket(weekMondayIso, allEntries, filters), [weekMondayIso, allEntries, filters])
    const billableSplit = useMemo(() => buildBillableDonut(weekMondayIso, allEntries, filters), [weekMondayIso, allEntries, filters])
    const budgetRows = useMemo(() => buildProjectBudgetStatus(allEntries, filters), [allEntries, filters])

    const openDrilldown = (designerId: string) => setDrilldownDesignerId(designerId as DesignerId)

    const attentionCount = missing.length + outliers.length
    const trendsCount = trainingGaps.filter(g => Math.abs(g.trendPercent) >= 15).length

    const tabs: TabDef[] = [
        {
            id: 'utilization',
            label: 'Utilization',
            icon: BarChart3,
            description: 'Daily hours + budget status + billable split · filter by company / billable / project size / sales rep.',
        },
        {
            id: 'attention',
            label: 'Attention',
            icon: AlertCircle,
            badge: attentionCount,
            badgeTone: attentionCount > 5 ? 'destructive' : attentionCount > 0 ? 'warning' : 'muted',
            description: 'Designers behind target (send digest) + long sessions (write a check-in inline). Action-focused.',
        },
        {
            id: 'trends',
            label: 'Trends',
            icon: LineChart,
            badge: trendsCount,
            badgeTone: trendsCount > 3 ? 'warning' : 'muted',
            description: '4-week velocity sparklines per designer × task type · spot training gaps early.',
        },
    ]

    return (
        <>
            <TabsShell tabs={tabs} defaultTabId="utilization">
                {(active) => {
                    if (active === 'utilization') {
                        return (
                            <div className="space-y-4">
                                <UtilizationFiltersStrip value={filters} onChange={setFilters} options={filterOptions} />
                                <UtilizationHeatmap
                                    grid={utilGrid}
                                    weekDays={days}
                                    todayIso={todayIso}
                                    onDesignerClick={openDrilldown}
                                />
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <HoursVsSoldCard data={hoursVsSold} />
                                    <ProductionRateCard buckets={productionRate} />
                                    <BillableDonut split={billableSplit} />
                                </div>
                                <BudgetStatusTable rows={budgetRows} />
                            </div>
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
