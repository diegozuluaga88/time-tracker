// TT.1 · Diego 2026-09-03 · Whitespace #1 · Deliverable complete checkbox.
// No competitor has this native · all punt to Zapier/Salesforce Milestone.
// See wurkwel-benchmark-2026-09-03.md · whitespace #1 · headline differentiator.
//
// UX pattern: 5-second undo window before the (mock) webhook fires and
// the sales rep gets the email. Borrowed from Gmail's send undo pattern.
// Toast messaging comes from coachingCopy.ts (locked tone).

import { useEffect, useRef, useState } from 'react'
import { Check, MailCheck, Undo2 } from 'lucide-react'
import { getProject } from '../../data/projects'
import { coachingCopy } from '../../data/coachingCopy'

interface Props {
    checked: boolean
    onChange: (checked: boolean) => void
    projectId: string | null
    /** Fires when the 5s undo window elapses without an Undo. */
    onDispatched?: (info: { projectId: string; salesRepName: string; salesRepEmail: string; timestampIso: string }) => void
    undoWindowSeconds?: number
}

type DispatchState =
    | { kind: 'idle' }
    | { kind: 'pending'; startedAt: number; timerId: number }
    | { kind: 'dispatched'; at: string }

export default function DeliverableCompleteCheckbox({ checked, onChange, projectId, onDispatched, undoWindowSeconds = 5 }: Props) {
    const [dispatch, setDispatch] = useState<DispatchState>({ kind: 'idle' })
    const [remaining, setRemaining] = useState(undoWindowSeconds)
    const tickRef = useRef<number | null>(null)
    const project = getProject(projectId)

    // Clear timers on unmount to avoid orphan dispatches.
    useEffect(() => {
        return () => {
            if (dispatch.kind === 'pending') window.clearTimeout(dispatch.timerId)
            if (tickRef.current !== null) window.clearInterval(tickRef.current)
        }
    }, [dispatch])

    // Reset if project changes or checkbox unchecked.
    useEffect(() => {
        if (!checked && dispatch.kind !== 'idle') cancelPending()
    }, [checked]) // eslint-disable-line react-hooks/exhaustive-deps

    const cancelPending = () => {
        if (dispatch.kind === 'pending') window.clearTimeout(dispatch.timerId)
        if (tickRef.current !== null) window.clearInterval(tickRef.current)
        tickRef.current = null
        setDispatch({ kind: 'idle' })
        setRemaining(undoWindowSeconds)
    }

    const handleToggle = (next: boolean) => {
        onChange(next)
        if (!next) {
            cancelPending()
            return
        }
        if (!project) return
        // Start 5s undo timer
        setRemaining(undoWindowSeconds)
        const startedAt = Date.now()
        const timerId = window.setTimeout(() => {
            const nowIso = new Date().toISOString()
            setDispatch({ kind: 'dispatched', at: nowIso })
            onDispatched?.({
                projectId: project.id,
                salesRepName: project.salesRepName,
                salesRepEmail: project.salesRepEmail,
                timestampIso: nowIso,
            })
            if (tickRef.current !== null) window.clearInterval(tickRef.current)
            tickRef.current = null
        }, undoWindowSeconds * 1000)
        // Countdown tick
        tickRef.current = window.setInterval(() => {
            const elapsed = Math.floor((Date.now() - startedAt) / 1000)
            setRemaining(Math.max(0, undoWindowSeconds - elapsed))
        }, 250)
        setDispatch({ kind: 'pending', startedAt, timerId })
    }

    // TT.20 · disabled visual + hint · el checkbox depende de tener project
    // (sin project no hay salesRep al que mandar el email). Antes no daba
    // feedback visual y parecía que "no cambiaba de estado" al click.
    const isDisabled = !project
    return (
        <div className={`rounded-lg border p-3 space-y-2 ${isDisabled ? 'border-dashed border-border bg-muted/30' : 'border-border bg-card'}`}>
            <label className={`flex items-start gap-3 group ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isDisabled ? 'border-input bg-muted opacity-50' :
                    checked ? 'bg-success border-success' : 'border-input group-hover:border-primary'
                }`}>
                    {checked && !isDisabled && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1">
                    <div className={`text-sm font-medium ${isDisabled ? 'text-muted-foreground' : 'text-foreground'}`}>
                        Mark deliverable complete
                    </div>
                    <p className={`text-xs mt-0.5 ${isDisabled ? 'text-warning' : 'text-muted-foreground'}`}>
                        {project
                            ? <>Fires an email to <span className="font-medium text-foreground">{project.salesRepName}</span> on <span className="font-medium text-foreground">{project.name}</span>.</>
                            : 'Select a project above to enable this action.'}
                    </p>
                </div>
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    disabled={isDisabled}
                    onChange={(e) => handleToggle(e.target.checked)}
                />
            </label>

            {dispatch.kind === 'pending' && project && (
                <div className="flex items-center justify-between gap-3 rounded-md bg-warning-soft border border-warning/30 px-3 py-2">
                    <span className="text-xs text-foreground">
                        {coachingCopy.deliverableMarkedComplete({
                            salesRepName: project.salesRepName,
                            projectName: project.name,
                            undoWindowSeconds: remaining,
                        })}
                    </span>
                    <button
                        type="button"
                        onClick={cancelPending}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-warning hover:text-foreground transition-colors"
                    >
                        <Undo2 className="h-3.5 w-3.5" />
                        Undo
                    </button>
                </div>
            )}

            {dispatch.kind === 'dispatched' && project && (
                <div className="flex items-center gap-2 rounded-md bg-success-soft border border-success/30 px-3 py-2 text-xs text-foreground">
                    <MailCheck className="h-3.5 w-3.5 text-success shrink-0" />
                    <span>
                        {coachingCopy.deliverableSent({
                            salesRepName: project.salesRepName,
                            projectName: project.name,
                            undoWindowSeconds: 0,
                        })}
                    </span>
                </div>
            )}
        </div>
    )
}
