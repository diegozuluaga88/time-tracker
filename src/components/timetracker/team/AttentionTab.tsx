// TT.41 · Diego 2026-09-03 · Attention tab · consolida MissingTime + Outliers
// + Parallel-work en 3 secciones colapsables con action buttons visibles.
// Reemplaza MissingTimeDigest.tsx + OutlierCoachingCard.tsx + AttentionNeededCard.tsx
// (data duplicada 2-3 veces en cards separadas). Nielsen H4 consistency +
// H8 minimalist · un pattern de row para todo.

import { useState, Fragment } from 'react'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { ChevronDown, Clock, AlertTriangle, GitBranch, Send, MessageCircle, X, User } from 'lucide-react'
import { getTeamMember, avatarGradient } from '../../team/teamMembers'
import { getProject } from '../../../data/projects'
import { getTaskType } from '../../../data/taskTypes'
import { coachingCopy } from '../../../data/coachingCopy'
import type { MissingTimeInfo, Outlier, ParallelPair } from '../../../data/managerInsights'

interface Props {
    missing: MissingTimeInfo[]
    outliers: Outlier[]
    parallel: ParallelPair[]
    onDesignerClick: (designerId: string) => void
    onSendDigest: (designerIds: string[]) => void
    onSendCoaching?: (designerId: string, entryId: string) => void
}

export default function AttentionTab({ missing, outliers, parallel, onDesignerClick, onSendDigest, onSendCoaching }: Props) {
    const [missingOpen, setMissingOpen] = useState(true)
    const [outliersOpen, setOutliersOpen] = useState(true)
    const [parallelOpen, setParallelOpen] = useState(parallel.length > 0)
    const [digestPreviewOpen, setDigestPreviewOpen] = useState(false)

    const totalItems = missing.length + outliers.length + parallel.length

    if (totalItems === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-success-soft mb-3">
                    <Clock className="h-5 w-5 text-success" />
                </div>
                <div className="text-base font-semibold text-foreground">All good this week</div>
                <p className="text-sm text-muted-foreground mt-1">Nobody's behind target · no long sessions · no parallel entries.</p>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-4">
                {/* Missing time */}
                <CollapsibleSection
                    isOpen={missingOpen}
                    onToggle={() => setMissingOpen(v => !v)}
                    icon={Clock}
                    tone="warning"
                    title="Missing time"
                    subtitle={`${missing.length} designer${missing.length === 1 ? '' : 's'} behind target this week`}
                    count={missing.length}
                    bulkAction={missing.length > 0 && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDigestPreviewOpen(true) }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 shadow-sm hover:bg-primary/90 transition-colors"
                        >
                            <Send className="h-3 w-3" />
                            Send digest to {missing.length}
                        </button>
                    )}
                >
                    <ul className="divide-y divide-border">
                        {missing.map(m => {
                            const person = getTeamMember(m.designerId)
                            return (
                                <li key={m.designerId}>
                                    <button
                                        type="button"
                                        onClick={() => onDesignerClick(m.designerId)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                                    >
                                        <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${avatarGradient(m.designerId)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                            {person?.initials ?? '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-foreground truncate">{person?.name ?? m.designerId}</div>
                                            <div className="text-xs text-muted-foreground tabular-nums">
                                                {m.hoursLogged.toFixed(1)}h logged · target {m.capacityTarget.toFixed(1)}h
                                            </div>
                                        </div>
                                        <div className="text-sm font-semibold text-warning tabular-nums shrink-0">
                                            −{m.hoursMissing.toFixed(1)}h
                                        </div>
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </CollapsibleSection>

                {/* Long sessions (outliers) */}
                <CollapsibleSection
                    isOpen={outliersOpen}
                    onToggle={() => setOutliersOpen(v => !v)}
                    icon={AlertTriangle}
                    tone={outliers.some(o => o.tier === 'red') ? 'destructive' : 'warning'}
                    title="Long sessions"
                    subtitle="Single entries over 4h · coaching signal, not policing"
                    count={outliers.length}
                >
                    <ul className="divide-y divide-border">
                        {outliers.slice(0, 10).map(o => {
                            const person = getTeamMember(o.entry.designerId)
                            const project = getProject(o.entry.projectId)
                            const taskType = getTaskType(o.entry.taskTypeId)
                            const hours = o.entry.durationMinutes / 60
                            const copy = coachingCopy.outlierDetected({
                                designerName: person?.name ?? o.entry.designerId,
                                hoursLogged: hours,
                                projectName: taskType?.label ?? 'a task',
                                hoursAboveAvg: o.hoursAboveAvg,
                            })
                            return (
                                <li key={o.entry.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                                    <button
                                        type="button"
                                        onClick={() => onDesignerClick(o.entry.designerId)}
                                        className="flex items-start gap-3 flex-1 min-w-0 text-left"
                                    >
                                        <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${avatarGradient(o.entry.designerId)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                            {person?.initials ?? '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium text-foreground truncate">{person?.name ?? o.entry.designerId}</span>
                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${o.tier === 'red' ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'}`}>
                                                    {o.tier === 'red' ? 'Long' : 'Above avg'}
                                                </span>
                                                <span className="text-xs text-muted-foreground tabular-nums">{hours.toFixed(1)}h on {taskType?.label ?? 'task'}</span>
                                                {project && <span className="text-xs text-muted-foreground truncate">· {project.client}</span>}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 leading-snug">{copy}</p>
                                        </div>
                                    </button>
                                    {onSendCoaching && (
                                        <button
                                            type="button"
                                            onClick={() => onSendCoaching(o.entry.designerId, o.entry.id)}
                                            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-input text-xs font-medium text-foreground px-2.5 py-1.5 hover:bg-muted transition-colors"
                                            title={`Send a check-in message to ${person?.name ?? 'this designer'}`}
                                        >
                                            <MessageCircle className="h-3 w-3" />
                                            Check in
                                        </button>
                                    )}
                                </li>
                            )
                        })}
                        {outliers.length > 10 && (
                            <li className="px-4 py-2 text-center text-xs text-muted-foreground">+ {outliers.length - 10} more</li>
                        )}
                    </ul>
                </CollapsibleSection>

                {/* Parallel work */}
                {parallel.length > 0 && (
                    <CollapsibleSection
                        isOpen={parallelOpen}
                        onToggle={() => setParallelOpen(v => !v)}
                        icon={GitBranch}
                        tone="warning"
                        title="Parallel work"
                        subtitle="2+ entries logged in the same time slot · double-book or slip?"
                        count={parallel.length}
                    >
                        <ul className="divide-y divide-border">
                            {parallel.map((p, i) => {
                                const person = getTeamMember(p.designerId)
                                const dow = new Date(p.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                                return (
                                    <li key={`${p.designerId}-${p.date}-${i}`}>
                                        <button
                                            type="button"
                                            onClick={() => onDesignerClick(p.designerId)}
                                            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                                        >
                                            <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${avatarGradient(p.designerId)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                                {person?.initials ?? '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-foreground truncate">{person?.name ?? p.designerId}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {p.entries.length} entries on {dow} · worth a check-in?
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground tabular-nums shrink-0">×{p.entries.length}</span>
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    </CollapsibleSection>
                )}
            </div>

            {/* Send digest preview modal */}
            <Transition show={digestPreviewOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[130]" onClose={() => setDigestPreviewOpen(false)}>
                    <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-md" />
                    </TransitionChild>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-6">
                            <TransitionChild as={Fragment} enter="ease-out duration-260" enterFrom="opacity-0 translate-y-2 scale-[0.995]" enterTo="opacity-100 translate-y-0 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-[0.995]">
                                <DialogPanel className="w-full max-w-[600px] rounded-2xl bg-card border border-border shadow-lg overflow-hidden">
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                                        <div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Preview</div>
                                            <h3 className="text-lg font-semibold text-foreground">Send friendly nudge</h3>
                                        </div>
                                        <button onClick={() => setDigestPreviewOpen(false)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="text-sm text-muted-foreground">
                                            Will send an email to <span className="font-semibold text-foreground">{missing.length} designer{missing.length === 1 ? '' : 's'}</span>:
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {missing.map(m => {
                                                const person = getTeamMember(m.designerId)
                                                return (
                                                    <div key={m.designerId} className="inline-flex items-center gap-2 rounded-full border border-border bg-background pl-1 pr-3 py-1">
                                                        <div className={`h-6 w-6 rounded-full bg-gradient-to-br ${avatarGradient(m.designerId)} flex items-center justify-center text-white text-[9px] font-bold`}>
                                                            {person?.initials}
                                                        </div>
                                                        <span className="text-xs font-medium text-foreground">{person?.name ?? m.designerId}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-foreground">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Message</div>
                                            <p className="italic">Hey — friendly reminder that this week's timesheet is due Sunday night. Let me know if anything's blocking you.</p>
                                            <div className="text-xs text-muted-foreground mt-3">— McKinley</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-border bg-muted/30">
                                        <button type="button" onClick={() => setDigestPreviewOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-muted transition-colors">Cancel</button>
                                        <button
                                            type="button"
                                            onClick={() => { onSendDigest(missing.map(m => m.designerId)); setDigestPreviewOpen(false) }}
                                            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 shadow-sm hover:bg-primary/90 transition-colors"
                                        >
                                            <Send className="h-4 w-4" />
                                            Send to {missing.length}
                                        </button>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    )
}

function CollapsibleSection({ isOpen, onToggle, icon: Icon, tone, title, subtitle, count, bulkAction, children }: {
    isOpen: boolean
    onToggle: () => void
    icon: React.ComponentType<{ className?: string }>
    tone: 'warning' | 'destructive' | 'neutral'
    title: string
    subtitle: string
    count: number
    bulkAction?: React.ReactNode
    children: React.ReactNode
}) {
    const toneIconClass = tone === 'destructive' ? 'text-destructive bg-destructive-soft' : tone === 'warning' ? 'text-warning bg-warning-soft' : 'text-muted-foreground bg-muted'
    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20 hover:bg-muted/40 transition-colors"
            >
                <div className={`h-8 w-8 rounded-lg ${toneIconClass} flex items-center justify-center shrink-0`}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 text-left min-w-0">
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-foreground">{title}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">({count})</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{subtitle}</div>
                </div>
                {bulkAction}
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} />
            </button>
            {isOpen && children}
        </div>
    )
}

// Prevent unused-import warning · User se usa como fallback icon si aplica.
void User
