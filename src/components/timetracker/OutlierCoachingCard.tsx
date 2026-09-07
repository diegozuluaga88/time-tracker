// TT.6 · Diego 2026-09-03 · Outlier coaching cards.
// 3-tier severity (amber ≥4h · red ≥6h) · pain #6.
// Copy tone locked as coaching per doc: "Kate logged 5.5h on Block Plan
// Onboarding — worth a check-in?" NEVER "Flagged: unusual entry".
// Copy library en coachingCopy.ts.

import { AlertTriangle, Send, MessageCircle } from 'lucide-react'
import { getProject } from '../../data/projects'
import { getTaskType } from '../../data/taskTypes'
import { getTeamMember, avatarGradient } from '../team/teamMembers'
import { coachingCopy } from '../../data/coachingCopy'
import type { Outlier } from '../../data/managerInsights'

interface Props {
    outliers: Outlier[]
    onSendMessage?: (designerId: string, entryId: string) => void
}

export default function OutlierCoachingCard({ outliers, onSendMessage }: Props) {
    if (outliers.length === 0) return null
    return (
        <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Long sessions to check in on</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Coaching signal, not a policing tool · single entries over 4h.</p>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">{outliers.length}</span>
            </div>
            <ul className="space-y-2">
                {outliers.slice(0, 5).map(o => <OutlierRow key={o.entry.id} outlier={o} onSendMessage={onSendMessage} />)}
                {outliers.length > 5 && (
                    <li className="px-3 py-2 text-center text-xs text-muted-foreground">+ {outliers.length - 5} more</li>
                )}
            </ul>
        </div>
    )
}

function OutlierRow({ outlier, onSendMessage }: { outlier: Outlier; onSendMessage?: (designerId: string, entryId: string) => void }) {
    const { entry, tier, hoursAboveAvg } = outlier
    const person = getTeamMember(entry.designerId)
    const project = getProject(entry.projectId)
    const taskType = getTaskType(entry.taskTypeId)
    const hours = entry.durationMinutes / 60
    const toneBg = tier === 'red' ? 'bg-destructive-soft border-destructive/40' : 'bg-warning-soft border-warning/40'
    const toneChip = tier === 'red' ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'
    const iconTone = tier === 'red' ? 'text-destructive' : 'text-warning'
    const copy = coachingCopy.outlierDetected({
        designerName: person?.name ?? entry.designerId,
        hoursLogged: hours,
        projectName: taskType?.label ?? 'a task',
        hoursAboveAvg: hoursAboveAvg,
    })
    return (
        <li>
            <div className={`rounded-lg border ${toneBg} p-3 flex items-start gap-3`}>
                <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center shrink-0">
                    <AlertTriangle className={`h-4 w-4 ${iconTone}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${toneChip}`}>
                            {tier === 'red' ? 'Long' : 'Above avg'}
                        </span>
                        <span className="text-sm font-semibold text-foreground truncate">{person?.name ?? entry.designerId}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{hours.toFixed(1)}h on {taskType?.label ?? 'task'}</span>
                        {project && <>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground truncate">{project.client}</span>
                        </>}
                    </div>
                    <p className="text-xs text-foreground leading-snug">{copy}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${avatarGradient(entry.designerId)} flex items-center justify-center text-white text-[9px] font-bold`}>
                        {person?.initials}
                    </div>
                    {onSendMessage && (
                        <button
                            type="button"
                            onClick={() => onSendMessage(entry.designerId, entry.id)}
                            className="p-1.5 rounded-md text-foreground bg-background border border-border hover:bg-muted transition-colors"
                            title={`Send a check-in message to ${person?.name ?? 'this designer'}`}
                            aria-label="Send check-in message"
                        >
                            <MessageCircle className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </li>
    )
}
