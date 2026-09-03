// TT.6 · Diego 2026-09-03 · Manager Dashboard selectors.
// Pure functions · zero side-effects · consumidas por TeamView.tsx
// y sus sub-components (heatmap, outlier cards, missing-time digest,
// training-gap sparklines, drill-down).
//
// Toda la lógica de detección vive aquí para que sea reutilizable +
// testeable · y para que los components sean puramente presentacionales.

import { DESIGNER_IDS, DESIGNER_CAPACITY_HOURS, sumHours, entriesForDesignerRange, type TimeEntry, type DesignerId } from './timeEntries'
import { getTaskType } from './taskTypes'
import { TODAY_ISO } from './projects'

// ============================================================
// Date helpers (local to keep this file self-contained)
// ============================================================
export function addDaysIso(iso: string, n: number): string {
    const d = new Date(iso)
    d.setDate(d.getDate() + n)
    return d.toISOString().slice(0, 10)
}
export function mondayOf(iso: string): string {
    const d = new Date(iso)
    const dow = d.getDay()
    const offset = dow === 0 ? -6 : 1 - dow
    d.setDate(d.getDate() + offset)
    return d.toISOString().slice(0, 10)
}
/** Week days as ISO array [Mon..Sun]. */
export function weekDays(mondayIso: string): string[] {
    return Array.from({ length: 7 }).map((_, i) => addDaysIso(mondayIso, i))
}

// ============================================================
// Missing-time detection (pain #1)
// ============================================================
export interface MissingTimeInfo {
    designerId: DesignerId
    hoursLogged: number
    capacityTarget: number
    hoursMissing: number
}

/**
 * Detects designers whose weekly hours are < 85% of their capacity.
 * McKinley's mental model: "3 days by Wed EOD, full week by Sunday".
 * Only counts weekdays passed (or the full week if we're past Sunday).
 * `summerFridaysActive` reduces capacity by 4h.
 */
export function detectMissingTime(
    weekMondayIso: string,
    allEntries: TimeEntry[],
    summerFridaysActive = false,
    todayIso: string = TODAY_ISO
): MissingTimeInfo[] {
    const days = weekDays(weekMondayIso)
    const today = new Date(todayIso).getTime()
    const weekStart = new Date(days[0]).getTime()
    const weekEnd = new Date(days[6]).getTime()
    // How many weekdays should have entries by now?
    let weekdaysExpected = 5
    if (today >= weekStart && today <= weekEnd) {
        const dowToday = Math.max(1, Math.min(5, new Date(todayIso).getDay()))
        weekdaysExpected = dowToday
    }
    const result: MissingTimeInfo[] = []
    for (const designerId of DESIGNER_IDS) {
        const baseCapacity = DESIGNER_CAPACITY_HOURS[designerId] ?? 40
        const capacity = summerFridaysActive ? Math.max(0, baseCapacity - 4) : baseCapacity
        const dailyTarget = capacity / 5
        const capacityTarget = dailyTarget * weekdaysExpected
        const hoursLogged = sumHours(entriesForDesignerRange(designerId, days[0], days[6], allEntries))
        if (hoursLogged < capacityTarget * 0.85) {
            result.push({
                designerId,
                hoursLogged,
                capacityTarget,
                hoursMissing: Math.max(0, capacityTarget - hoursLogged),
            })
        }
    }
    return result.sort((a, b) => b.hoursMissing - a.hoursMissing)
}

// ============================================================
// Outlier detection (pain #6)
// ============================================================
export type OutlierTier = 'amber' | 'red'
export interface Outlier {
    entry: TimeEntry
    tier: OutlierTier
    hoursAboveAvg: number
}

/**
 * Detects single entries > 4h (amber) or > 6h (red) in the given week.
 * Also computes "hours above avg" using the designer's 4-week baseline
 * for the same task-type · for coaching copy context.
 */
export function detectOutliers(
    weekMondayIso: string,
    allEntries: TimeEntry[]
): Outlier[] {
    const days = weekDays(weekMondayIso)
    const weekEntries = allEntries.filter(e => e.date >= days[0] && e.date <= days[6])
    const AMBER_MIN = 4 * 60
    const RED_MIN = 6 * 60
    const outliers: Outlier[] = []
    for (const entry of weekEntries) {
        if (entry.durationMinutes < AMBER_MIN) continue
        const tier: OutlierTier = entry.durationMinutes >= RED_MIN ? 'red' : 'amber'
        // 4-week baseline for same designer × task-type
        const baselineStart = addDaysIso(weekMondayIso, -28)
        const baselineEnd = addDaysIso(weekMondayIso, -1)
        const baseline = allEntries.filter(e =>
            e.designerId === entry.designerId &&
            e.taskTypeId === entry.taskTypeId &&
            e.date >= baselineStart && e.date <= baselineEnd
        )
        const avgMinutes = baseline.length > 0
            ? baseline.reduce((s, e) => s + e.durationMinutes, 0) / baseline.length
            : entry.durationMinutes
        const hoursAboveAvg = Math.max(0, (entry.durationMinutes - avgMinutes) / 60)
        outliers.push({ entry, tier, hoursAboveAvg })
    }
    return outliers.sort((a, b) => (b.tier === 'red' ? 1 : 0) - (a.tier === 'red' ? 1 : 0) || b.entry.durationMinutes - a.entry.durationMinutes)
}

// ============================================================
// Parallel-work detection (TT.5 · postergado a Fase 5)
// ============================================================
export interface ParallelPair {
    designerId: DesignerId
    date: string
    entries: TimeEntry[]  // 2+ entries that overlap
}

/** Groups of entries by same designer + same day that overlap in time. */
export function detectParallelWork(
    weekMondayIso: string,
    allEntries: TimeEntry[]
): ParallelPair[] {
    const days = weekDays(weekMondayIso)
    const groups: Map<string, TimeEntry[]> = new Map()
    for (const e of allEntries) {
        if (e.date < days[0] || e.date > days[6]) continue
        const k = `${e.designerId}::${e.date}`
        if (!groups.has(k)) groups.set(k, [])
        groups.get(k)!.push(e)
    }
    const pairs: ParallelPair[] = []
    for (const [k, dayEntries] of groups) {
        if (dayEntries.length < 2) continue
        // Find entries with startMinutesFromMidnight that overlap
        const withStart = dayEntries.filter(e => e.startMinutesFromMidnight != null)
        const overlapping: TimeEntry[] = []
        for (let i = 0; i < withStart.length; i++) {
            const a = withStart[i]
            const aStart = a.startMinutesFromMidnight!
            const aEnd = aStart + a.durationMinutes
            for (let j = i + 1; j < withStart.length; j++) {
                const b = withStart[j]
                const bStart = b.startMinutesFromMidnight!
                const bEnd = bStart + b.durationMinutes
                if (aStart < bEnd && bStart < aEnd) {
                    if (!overlapping.includes(a)) overlapping.push(a)
                    if (!overlapping.includes(b)) overlapping.push(b)
                }
            }
        }
        if (overlapping.length >= 2) {
            const [designerId, date] = k.split('::')
            pairs.push({ designerId: designerId as DesignerId, date, entries: overlapping })
        }
    }
    return pairs
}

// ============================================================
// Utilization heatmap data (day × designer)
// ============================================================
export interface UtilizationCell {
    designerId: DesignerId
    dateIso: string
    hoursLogged: number
    dailyCapacity: number
    percent: number  // 0..∞ (>100 = over)
    /** Color tier per Toggl thresholds. */
    tier: 'over' | 'ok' | 'watch' | 'below' | 'nodata'
}

/**
 * Builds a full day × designer grid.
 * Thresholds per benchmark:
 *  - > 110% overwork (over/purple)
 *  - ≥ 80% on-target (ok/green)
 *  - 70-79% watch (amber)
 *  - < 70% below (red)
 *  - 0h · no data (muted)
 */
export function buildUtilizationGrid(
    weekMondayIso: string,
    allEntries: TimeEntry[],
    summerFridaysActive = false
): UtilizationCell[][] {
    const days = weekDays(weekMondayIso)
    return DESIGNER_IDS.map(designerId => {
        const baseCapacity = DESIGNER_CAPACITY_HOURS[designerId] ?? 40
        const capacity = summerFridaysActive ? Math.max(0, baseCapacity - 4) : baseCapacity
        const dailyCapacity = capacity / 5
        return days.map(dateIso => {
            const entries = allEntries.filter(e => e.designerId === designerId && e.date === dateIso)
            const hoursLogged = sumHours(entries)
            const percent = dailyCapacity > 0 ? (hoursLogged / dailyCapacity) * 100 : 0
            let tier: UtilizationCell['tier'] = 'nodata'
            if (hoursLogged === 0) tier = 'nodata'
            else if (percent > 110) tier = 'over'
            else if (percent >= 80) tier = 'ok'
            else if (percent >= 70) tier = 'watch'
            else tier = 'below'
            return { designerId, dateIso, hoursLogged, dailyCapacity, percent, tier }
        })
    })
}

// ============================================================
// Weekly billable vs internal split (per designer)
// ============================================================
export interface DesignerWeekTotals {
    designerId: DesignerId
    billable: number
    internal: number
    total: number
    capacity: number
    percent: number
}
export function buildDesignerWeekTotals(
    weekMondayIso: string,
    allEntries: TimeEntry[],
    summerFridaysActive = false
): DesignerWeekTotals[] {
    const days = weekDays(weekMondayIso)
    return DESIGNER_IDS.map(designerId => {
        const baseCapacity = DESIGNER_CAPACITY_HOURS[designerId] ?? 40
        const capacity = summerFridaysActive ? Math.max(0, baseCapacity - 4) : baseCapacity
        const weekEntries = entriesForDesignerRange(designerId, days[0], days[6], allEntries)
        const billable = sumHours(weekEntries.filter(e => e.billable))
        const internal = sumHours(weekEntries.filter(e => !e.billable))
        const total = billable + internal
        const percent = capacity > 0 ? Math.round((total / capacity) * 100) : 0
        return { designerId, billable, internal, total, capacity, percent }
    })
}

// ============================================================
// Training-gap sparklines (whitespace #3)
// ============================================================
export interface VelocityPoint {
    weekOffset: number  // 0 = 4 weeks ago, 3 = this week
    avgMinutes: number  // avg for this designer × task-type in that week
    sampleCount: number
}
export interface TrainingGapRow {
    designerId: DesignerId
    taskTypeId: string
    points: VelocityPoint[]  // 4 points (4 weeks)
    /** Delta % from oldest week to newest (positive = slower / negative = faster). */
    trendPercent: number
    teamAvgLatest: number  // avg minutes across all designers for this task in current week
}

/**
 * For a set of task-types (usually the design-heavy ones), build a 4-week
 * velocity table per designer showing trend. Positive trend = designer taking
 * longer on the task · potential training gap signal.
 */
export function buildTrainingGaps(
    weekMondayIso: string,
    allEntries: TimeEntry[],
    taskTypeIds: string[] = ['block-plan', 'floor-plan', 'powerpoint', 'renderings']
): TrainingGapRow[] {
    const rows: TrainingGapRow[] = []
    for (const designerId of DESIGNER_IDS) {
        for (const taskTypeId of taskTypeIds) {
            const points: VelocityPoint[] = []
            for (let wk = 3; wk >= 0; wk--) {
                const weekStart = addDaysIso(weekMondayIso, -7 * wk)
                const weekEnd = addDaysIso(weekStart, 6)
                const entries = allEntries.filter(e =>
                    e.designerId === designerId &&
                    e.taskTypeId === taskTypeId &&
                    e.date >= weekStart && e.date <= weekEnd
                )
                const avgMinutes = entries.length > 0
                    ? entries.reduce((s, e) => s + e.durationMinutes, 0) / entries.length
                    : 0
                // weekOffset · 3 = current, 0 = oldest
                points.push({ weekOffset: 3 - wk, avgMinutes, sampleCount: entries.length })
            }
            // Trend: compare first non-zero week to last non-zero week
            const first = points.find(p => p.sampleCount > 0)
            const last = [...points].reverse().find(p => p.sampleCount > 0)
            const trendPercent = first && last && first.avgMinutes > 0
                ? Math.round(((last.avgMinutes - first.avgMinutes) / first.avgMinutes) * 100)
                : 0
            // Team avg for this task in current week
            const currentWeekEnd = addDaysIso(weekMondayIso, 6)
            const currentTeamEntries = allEntries.filter(e =>
                e.taskTypeId === taskTypeId &&
                e.date >= weekMondayIso && e.date <= currentWeekEnd
            )
            const teamAvgLatest = currentTeamEntries.length > 0
                ? currentTeamEntries.reduce((s, e) => s + e.durationMinutes, 0) / currentTeamEntries.length
                : 0
            // Only include rows where designer actually has data
            const anyData = points.some(p => p.sampleCount > 0)
            if (anyData) rows.push({ designerId, taskTypeId, points, trendPercent, teamAvgLatest })
        }
    }
    // Rank by absolute trend (largest change first · positive or negative)
    return rows.sort((a, b) => Math.abs(b.trendPercent) - Math.abs(a.trendPercent))
}

// ============================================================
// Attention-needed hero card (priority summary)
// ============================================================
export interface AttentionItem {
    kind: 'missing-time' | 'outlier' | 'training-gap' | 'parallel-work'
    designerName: string
    designerId: DesignerId
    summary: string
}

/**
 * Builds the "Attention needed" list ordered by priority per plan:
 * missing-time > outlier > training-gap > parallel-work.
 * Takes only top 3 items for the hero card.
 */
export function buildAttentionItems(
    weekMondayIso: string,
    allEntries: TimeEntry[],
    summerFridaysActive: boolean,
    getName: (id: string) => string
): AttentionItem[] {
    const items: AttentionItem[] = []
    // 1. Missing time
    const missing = detectMissingTime(weekMondayIso, allEntries, summerFridaysActive)
    for (const m of missing.slice(0, 3)) {
        items.push({
            kind: 'missing-time',
            designerId: m.designerId,
            designerName: getName(m.designerId),
            summary: `${m.hoursMissing.toFixed(1)}h behind target this week`,
        })
    }
    // 2. Red outliers (only red-tier for hero)
    const outliers = detectOutliers(weekMondayIso, allEntries).filter(o => o.tier === 'red')
    for (const o of outliers.slice(0, 2)) {
        const taskType = getTaskType(o.entry.taskTypeId)
        items.push({
            kind: 'outlier',
            designerId: o.entry.designerId as DesignerId,
            designerName: getName(o.entry.designerId),
            summary: `${(o.entry.durationMinutes / 60).toFixed(1)}h on ${taskType?.label ?? 'a task'} · ${o.hoursAboveAvg.toFixed(1)}h above avg`,
        })
    }
    // 3. Training-gap (only trends > 30% or < -30%)
    const gaps = buildTrainingGaps(weekMondayIso, allEntries)
        .filter(g => Math.abs(g.trendPercent) >= 30 && g.points[3].sampleCount > 0)
    for (const g of gaps.slice(0, 2)) {
        const taskType = getTaskType(g.taskTypeId)
        items.push({
            kind: 'training-gap',
            designerId: g.designerId,
            designerName: getName(g.designerId),
            summary: `${taskType?.label ?? 'task'} velocity ${g.trendPercent > 0 ? '+' : ''}${g.trendPercent}% over 4 weeks`,
        })
    }
    // 4. Parallel-work (postergado a Fase 5 · TT.5 · aparece si hay pairs)
    const parallel = detectParallelWork(weekMondayIso, allEntries)
    for (const p of parallel.slice(0, 1)) {
        items.push({
            kind: 'parallel-work',
            designerId: p.designerId,
            designerName: getName(p.designerId),
            summary: `${p.entries.length} entries logged in the same time slot on ${new Date(p.date).toLocaleDateString('en-US', { weekday: 'short' })}`,
        })
    }
    return items.slice(0, 6)
}

// ============================================================
// TT.41 · Historical team trend (weeks back) para HistoryTab
// ============================================================
export interface WeekTrendPoint {
    weekMondayIso: string
    weekLabel: string      // 'Aug 24' etc.
    totalHours: number     // team total
    billableHours: number
    internalHours: number
    capacity: number       // suma capacities · afectado por summer fri
    utilizationPercent: number
    activeDesigners: number  // designers con >0h esa semana
}

/** Team-wide utilization + billable ratio · últimas N semanas (default 8). */
export function buildTeamWeeklyTrend(
    currentMondayIso: string,
    allEntries: TimeEntry[],
    weeksBack = 8,
    summerFridaysActive = false
): WeekTrendPoint[] {
    const out: WeekTrendPoint[] = []
    for (let w = weeksBack - 1; w >= 0; w--) {
        const monday = addDaysIso(currentMondayIso, -7 * w)
        const sunday = addDaysIso(monday, 6)
        let total = 0, billable = 0, internal = 0
        const activeSet = new Set<string>()
        for (const e of allEntries) {
            if (e.date < monday || e.date > sunday) continue
            total += e.durationMinutes
            if (e.billable) billable += e.durationMinutes; else internal += e.durationMinutes
            activeSet.add(e.designerId)
        }
        const baseCapPerDesigner = summerFridaysActive ? 36 : 40
        const capacity = DESIGNER_IDS.length * baseCapPerDesigner
        const totalH = total / 60
        const percent = capacity > 0 ? Math.round((totalH / capacity) * 100) : 0
        const d = new Date(monday)
        out.push({
            weekMondayIso: monday,
            weekLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            totalHours: totalH,
            billableHours: billable / 60,
            internalHours: internal / 60,
            capacity,
            utilizationPercent: percent,
            activeDesigners: activeSet.size,
        })
    }
    return out
}

// ============================================================
// TT.41 · Week-over-week per-designer comparison
// ============================================================
export interface WeekOverWeekRow {
    designerId: DesignerId
    thisWeekHours: number
    lastWeekHours: number
    deltaHours: number
    deltaPercent: number   // 0 si lastWeek === 0
    thisWeekBillable: number
    lastWeekBillable: number
    thisWeekPercent: number    // vs capacity
    lastWeekPercent: number
}

export function buildWeekOverWeek(
    currentMondayIso: string,
    allEntries: TimeEntry[],
    summerFridaysActive = false
): WeekOverWeekRow[] {
    const prevMonday = addDaysIso(currentMondayIso, -7)
    const currTotals = buildDesignerWeekTotals(currentMondayIso, allEntries, summerFridaysActive)
    const prevTotals = buildDesignerWeekTotals(prevMonday, allEntries, summerFridaysActive)
    const prevMap = new Map(prevTotals.map(t => [t.designerId, t]))
    return currTotals.map(curr => {
        const prev = prevMap.get(curr.designerId)
        const lastHours = prev?.total ?? 0
        const delta = curr.total - lastHours
        const deltaPct = lastHours > 0 ? Math.round((delta / lastHours) * 100) : 0
        return {
            designerId: curr.designerId,
            thisWeekHours: curr.total,
            lastWeekHours: lastHours,
            deltaHours: delta,
            deltaPercent: deltaPct,
            thisWeekBillable: curr.billable,
            lastWeekBillable: prev?.billable ?? 0,
            thisWeekPercent: curr.percent,
            lastWeekPercent: prev?.percent ?? 0,
        }
    })
}

// ============================================================
// TT.41 · CSV export helpers para reports
// ============================================================
export function weekTotalsToCsv(rows: DesignerWeekTotals[], getName: (id: string) => string): string {
    const header = ['Designer', 'Capacity (h)', 'Billable (h)', 'Internal (h)', 'Total (h)', 'Utilization %']
    const lines = rows.map(r => [
        getName(r.designerId),
        r.capacity.toFixed(1),
        r.billable.toFixed(1),
        r.internal.toFixed(1),
        r.total.toFixed(1),
        r.percent,
    ].join(','))
    return [header.join(','), ...lines].join('\n')
}

export function weekTrendToCsv(rows: WeekTrendPoint[]): string {
    const header = ['Week', 'Active designers', 'Capacity (h)', 'Total (h)', 'Billable (h)', 'Internal (h)', 'Utilization %']
    const lines = rows.map(r => [
        r.weekMondayIso,
        r.activeDesigners,
        r.capacity,
        r.totalHours.toFixed(1),
        r.billableHours.toFixed(1),
        r.internalHours.toFixed(1),
        r.utilizationPercent,
    ].join(','))
    return [header.join(','), ...lines].join('\n')
}
