// TT.1 · Diego 2026-09-03 · Deterministic mock time entries.
// Generator produces the same output every load · seeded PRNG.
// ~10 designers × 4 weeks × 5-8 entries/week ≈ 200-320 entries.
//
// Includes intentional patterns to demo:
// - 3 designers WITH complete week (billable heavy)
// - 3 designers MID · missing 1-2 days (missing-time alert candidates)
// - 1 designer WITH OUTLIER · single entry 5.5h on Block Plan Onboarding
// - 1 designer AT OVERWORK · >45h / week
// - 2 designers WITH TRAINING GAP · velocity trending up on Block plan
// - 1 designer WITH DELIVERABLE COMPLETED · fired email last week

import type { CompletionState } from './taskTypes'
import { PROJECTS, TODAY_ISO } from './projects'

export interface TimeEntry {
    id: string
    designerId: string
    /** ISO date YYYY-MM-DD. */
    date: string
    projectId: string
    taskTypeId: string
    completionState?: CompletionState
    memo: string
    /** Minutes · granularity 15 (matches Wurkwel SOT). */
    durationMinutes: number
    billable: boolean
    deliverableComplete?: boolean
    /** ISO timestamp when the email fired (if deliverableComplete). */
    deliverableSentAt?: string
}

// Deterministic PRNG (Mulberry32). Same seed → same sequence.
function mulberry32(seed: number) {
    return function () {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0
        let t = seed
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

const rng = mulberry32(20260903) // seeded on "today"
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]
const round15 = (mins: number) => Math.max(15, Math.round(mins / 15) * 15)

// Designers (map to TEAM_MEMBERS ids in the existing app).
export const DESIGNER_IDS = ['me', 'carlos', 'christian', 'daniela', 'jennifer', 'sarah', 'marcus', 'priya', 'daniel', 'elena'] as const
export type DesignerId = typeof DESIGNER_IDS[number]

// Per-designer weekly capacity (hours). Handles part-timers per Clockify pattern.
export const DESIGNER_CAPACITY_HOURS: Record<DesignerId, number> = {
    me: 40,          // Diego · 5-day full-time
    carlos: 40,
    christian: 40,
    daniela: 32,     // 4-day week
    jennifer: 40,
    sarah: 40,
    marcus: 40,
    priya: 40,
    daniel: 40,
    elena: 24,       // part-time 3 days
}

// Baseline task-type velocity per designer (avg minutes for the task).
// Used to generate outlier + training-gap patterns deterministically.
const BASELINE_VELOCITY_MINUTES: Record<DesignerId, Record<string, number>> = {
    me: { 'block-plan': 90, 'powerpoint': 120, 'renderings': 180 },
    carlos: { 'block-plan': 105, 'powerpoint': 90, 'renderings': 165 },
    christian: { 'block-plan': 120, 'powerpoint': 135, 'renderings': 200 },
    daniela: { 'block-plan': 100, 'powerpoint': 105, 'renderings': 180 },
    jennifer: { 'block-plan': 95, 'powerpoint': 105, 'renderings': 150 },
    sarah: { 'block-plan': 110, 'powerpoint': 115, 'renderings': 170 },
    marcus: { 'block-plan': 130, 'powerpoint': 120, 'renderings': 190 },
    priya: { 'block-plan': 100, 'powerpoint': 110, 'renderings': 170 },
    daniel: { 'block-plan': 85, 'powerpoint': 100, 'renderings': 150 }, // fastest on block-plan
    elena: { 'block-plan': 145, 'powerpoint': 130, 'renderings': 210 },
}

const MEMOS_DESIGN = [
    'Iterating on furniture layout for east wing',
    'Client feedback pass · adjusting seating cluster',
    'Adding dimensioning + FF&E callouts',
    'Reviewing product specs against budget',
    'Rendering client presentation view',
    'Fine-tuning color palette per feedback',
    'Prepping deliverables for tomorrow review',
    'Cross-checking spec sheet w/ vendor pricing',
    'Reflecting punch-list items into revision',
    'Building out the 3D walk-through',
]
const MEMOS_MEETING = [
    'Kickoff w/ client stakeholders',
    'Internal design review',
    'Site visit + measurements',
    'Weekly sync w/ McKinley',
]
const MEMOS_ADMIN = ['Training module', 'Team standup', 'Onboarding new hire', 'Admin catch-up']

// Get the ISO date for `daysAgo` from TODAY_ISO.
function isoDate(daysAgo: number): string {
    const t = new Date(TODAY_ISO)
    t.setDate(t.getDate() - daysAgo)
    return t.toISOString().slice(0, 10)
}

/** Is `date` a Saturday or Sunday? */
export function isWeekend(iso: string): boolean {
    const d = new Date(iso).getDay()
    return d === 0 || d === 6
}

const ACTIVE_PROJECT_IDS = PROJECTS.filter(p => p.status === 'active').map(p => p.id)

function generateEntries(): TimeEntry[] {
    const entries: TimeEntry[] = []
    let seq = 1

    // Iterate 4 weeks back → today (28 days).
    for (let daysAgo = 27; daysAgo >= 0; daysAgo--) {
        const date = isoDate(daysAgo)
        if (isWeekend(date)) continue

        for (const designerId of DESIGNER_IDS) {
            const weekNumber = Math.floor(daysAgo / 7) // 0 = current, 3 = 4 wks ago

            // Missing-time pattern: last 3 days (this week), carlos + christian miss some
            if (daysAgo <= 2 && (designerId === 'carlos' || designerId === 'christian' || designerId === 'priya')) {
                if (rng() < 0.55) continue // 55% chance skip a recent day
            }

            // Elena part-time: 3 days a week only
            if (designerId === 'elena') {
                const dow = new Date(date).getDay() // 1..5
                if (dow !== 1 && dow !== 3 && dow !== 5) continue
            }
            // Daniela 4-day: skip Fridays
            if (designerId === 'daniela' && new Date(date).getDay() === 5) continue

            // 3-5 entries per day per designer (mix of design + meetings)
            const entryCount = 3 + Math.floor(rng() * 3)
            for (let i = 0; i < entryCount; i++) {
                const isDesign = rng() < 0.75
                const isMeeting = !isDesign && rng() < 0.6
                const isAdmin = !isDesign && !isMeeting

                let taskTypeId: string
                let billable: boolean
                let memo: string
                let durationMinutes: number
                let completionState: CompletionState | undefined

                if (isDesign) {
                    const designTasks = ['block-plan', 'floor-plan', 'powerpoint', 'renderings', 'spec-sheets', 'client-review']
                    taskTypeId = pick(designTasks)
                    billable = true
                    memo = pick(MEMOS_DESIGN)
                    const baseline = BASELINE_VELOCITY_MINUTES[designerId]?.[taskTypeId] ?? 90
                    // Training-gap pattern: marcus + priya trending UP on block-plan across weeks
                    let velocityMult = 1
                    if (taskTypeId === 'block-plan' && (designerId === 'marcus' || designerId === 'priya')) {
                        velocityMult = 1 + (3 - weekNumber) * 0.15 // 1.0 → 1.45 over 4 weeks
                    }
                    durationMinutes = round15(baseline * velocityMult * (0.85 + rng() * 0.3))
                    if (['block-plan', 'floor-plan', 'powerpoint', 'renderings', 'spec-sheets'].includes(taskTypeId)) {
                        completionState = pick(['v1', 'v1', 'v2', 'complete'] as CompletionState[])
                    }
                } else if (isMeeting) {
                    taskTypeId = pick(['internal-mtg', 'client-mtg', 'kickoff'])
                    billable = taskTypeId !== 'internal-mtg'
                    memo = pick(MEMOS_MEETING)
                    durationMinutes = round15(30 + rng() * 60)
                } else {
                    taskTypeId = pick(['training', 'admin', 'downtime'])
                    billable = false
                    memo = pick(MEMOS_ADMIN)
                    durationMinutes = round15(30 + rng() * 45)
                }

                entries.push({
                    id: `TE-${String(seq++).padStart(5, '0')}`,
                    designerId,
                    date,
                    projectId: billable ? pick(ACTIVE_PROJECT_IDS) : ACTIVE_PROJECT_IDS[0],
                    taskTypeId,
                    completionState,
                    memo,
                    durationMinutes,
                    billable,
                })
            }
        }
    }

    // Intentional outlier: sarah, this week, 5.5h single entry on Block plan Onboarding.
    entries.push({
        id: `TE-${String(seq++).padStart(5, '0')}`,
        designerId: 'sarah',
        date: isoDate(1),
        projectId: 'PRJ-RS-2401',
        taskTypeId: 'block-plan',
        completionState: 'v1',
        memo: 'Onboarding block plan for Whittier · working through the whole east wing in one sitting',
        durationMinutes: 330,
        billable: true,
    })

    // Intentional deliverable-complete last week: jennifer marked complete on floor-plan.
    entries.push({
        id: `TE-${String(seq++).padStart(5, '0')}`,
        designerId: 'jennifer',
        date: isoDate(6),
        projectId: 'PRJ-OFC-3115',
        taskTypeId: 'floor-plan',
        completionState: 'complete',
        memo: 'Final floor plan · Ferris showroom + offices · signed off by client review',
        durationMinutes: 210,
        billable: true,
        deliverableComplete: true,
        deliverableSentAt: isoDate(6) + 'T15:47:00',
    })

    return entries
}

export const TIME_ENTRIES: TimeEntry[] = generateEntries()

/** Convenience: entries for a designer within a date range (inclusive). */
export function entriesForDesignerRange(
    designerId: string,
    startIso: string,
    endIso: string,
    all: TimeEntry[] = TIME_ENTRIES
): TimeEntry[] {
    return all.filter(e => e.designerId === designerId && e.date >= startIso && e.date <= endIso)
}

/** Total minutes for a project (baseline + all logged entries). */
export function projectCumulativeMinutes(projectId: string, all: TimeEntry[] = TIME_ENTRIES): number {
    return all.filter(e => e.projectId === projectId).reduce((sum, e) => sum + e.durationMinutes, 0)
}

/** Sum of an entry set in hours (2-decimal). */
export function sumHours(entries: TimeEntry[]): number {
    const mins = entries.reduce((s, e) => s + e.durationMinutes, 0)
    return Math.round((mins / 60) * 100) / 100
}
