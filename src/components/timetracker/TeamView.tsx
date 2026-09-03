// TT.6 · Diego 2026-09-03 · Manager Dashboard (Surface B) root.
// Composes: AttentionNeededCard (hero) + UtilizationHeatmap +
// OutlierCoachingCard + MissingTimeDigest + TrainingGapSparklines +
// DesignerDrilldown modal. Max 6 tiles arriba del fold per Harvest
// complaint (benchmark).
//
// Layout: 2-col grid en desktop (attention + missing digest a la
// izquierda · heatmap dominante a la derecha · outlier + training-gap
// full-width abajo). Collapses a 1-col en mobile · aunque doc dice
// creative teams work desk-bound (mobile-first no aplica).

import { useMemo, useState } from 'react'
import AttentionNeededCard from './AttentionNeededCard'
import UtilizationHeatmap from './UtilizationHeatmap'
import OutlierCoachingCard from './OutlierCoachingCard'
import MissingTimeDigest from './MissingTimeDigest'
import TrainingGapSparklines from './TrainingGapSparklines'
import DesignerDrilldown from './DesignerDrilldown'
import {
    buildAttentionItems,
    buildUtilizationGrid,
    detectMissingTime,
    detectOutliers,
    buildTrainingGaps,
    weekDays,
} from '../../data/managerInsights'
import { getTeamMember } from '../team/teamMembers'
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

    const days = useMemo(() => weekDays(weekMondayIso), [weekMondayIso])
    const missing = useMemo(() => detectMissingTime(weekMondayIso, allEntries, summerFridaysActive, todayIso), [weekMondayIso, allEntries, summerFridaysActive, todayIso])
    const outliers = useMemo(() => detectOutliers(weekMondayIso, allEntries), [weekMondayIso, allEntries])
    const utilGrid = useMemo(() => buildUtilizationGrid(weekMondayIso, allEntries, summerFridaysActive), [weekMondayIso, allEntries, summerFridaysActive])
    const trainingGaps = useMemo(() => buildTrainingGaps(weekMondayIso, allEntries), [weekMondayIso, allEntries])
    const attention = useMemo(() => buildAttentionItems(
        weekMondayIso,
        allEntries,
        summerFridaysActive,
        (id) => getTeamMember(id)?.name ?? id
    ), [weekMondayIso, allEntries, summerFridaysActive])

    const openDrilldown = (designerId: string) => setDrilldownDesignerId(designerId as DesignerId)

    return (
        <div className="space-y-6">
            {/* Row 1: hero attention (left col) + missing-time digest (right col) */}
            <div className="grid gap-6 lg:grid-cols-2">
                <AttentionNeededCard items={attention} onItemClick={openDrilldown} />
                <MissingTimeDigest missing={missing} weekMondayIso={weekMondayIso} onSendDigest={onSendDigest ?? (() => {})} />
            </div>

            {/* Row 2: utilization heatmap (full width, is dense) */}
            <UtilizationHeatmap grid={utilGrid} weekDays={days} todayIso={todayIso} onDesignerClick={openDrilldown} />

            {/* Row 3: outlier coaching (left) + training-gap sparklines (right) */}
            <div className="grid gap-6 lg:grid-cols-2">
                <OutlierCoachingCard outliers={outliers} onSendMessage={onSendCoachingMessage} />
                <TrainingGapSparklines rows={trainingGaps} onDesignerClick={openDrilldown} />
            </div>

            {/* Drill-down modal */}
            <DesignerDrilldown
                isOpen={drilldownDesignerId !== null}
                onClose={() => setDrilldownDesignerId(null)}
                designerId={drilldownDesignerId}
                weekMondayIso={weekMondayIso}
                allEntries={allEntries}
                summerFridaysActive={summerFridaysActive}
            />
        </div>
    )
}
