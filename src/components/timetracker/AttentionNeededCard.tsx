// TT.6 · Diego 2026-09-03 · Manager Dashboard hero card.
// Priority-ranked: missing-time > outlier > training-gap > parallel-work.
// Applies Krug's trunk test · manager knows en 3 segundos qué designers
// necesitan attention hoy sin drilling.

import { AlertCircle, TrendingUp, Clock, GitBranch } from 'lucide-react'
import { avatarGradient } from '../team/teamMembers'
import type { AttentionItem } from '../../data/managerInsights'

interface Props {
    items: AttentionItem[]
    onItemClick?: (designerId: string) => void
}

const KIND_META: Record<AttentionItem['kind'], { icon: any; label: string; toneBg: string; toneText: string }> = {
    'missing-time': { icon: Clock, label: 'Missing time', toneBg: 'bg-warning-soft', toneText: 'text-warning' },
    'outlier': { icon: AlertCircle, label: 'Outlier', toneBg: 'bg-destructive-soft', toneText: 'text-destructive' },
    'training-gap': { icon: TrendingUp, label: 'Training gap', toneBg: 'bg-ai-soft', toneText: 'text-ai' },
    'parallel-work': { icon: GitBranch, label: 'Parallel entries', toneBg: 'bg-muted', toneText: 'text-muted-foreground' },
}

export default function AttentionNeededCard({ items, onItemClick }: Props) {
    if (items.length === 0) {
        return (
            <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-baseline justify-between mb-3">
                    <h3 className="text-lg font-semibold text-foreground">Attention needed</h3>
                    <span className="text-xs text-muted-foreground">This week</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground py-6">
                    <div className="h-10 w-10 rounded-full bg-success/15 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-success" />
                    </div>
                    <div>
                        <div className="font-medium text-foreground">Nothing needs attention right now.</div>
                        <div>Team is on-target · no outliers · no missing time.</div>
                    </div>
                </div>
            </div>
        )
    }
    return (
        <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Attention needed</h3>
                <span className="text-xs text-muted-foreground tabular-nums">{items.length} item{items.length === 1 ? '' : 's'}</span>
            </div>
            <ul className="space-y-2">
                {items.map((item, i) => {
                    const meta = KIND_META[item.kind]
                    const Icon = meta.icon
                    return (
                        <li key={`${item.kind}-${item.designerId}-${i}`}>
                            <button
                                type="button"
                                onClick={() => onItemClick?.(item.designerId)}
                                className="w-full flex items-start gap-3 rounded-lg border border-border bg-background hover:bg-muted transition-colors p-3 text-left"
                            >
                                <div className={`h-8 w-8 rounded-lg ${meta.toneBg} flex items-center justify-center shrink-0`}>
                                    <Icon className={`h-4 w-4 ${meta.toneText}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{meta.label}</span>
                                        <span className="text-sm font-semibold text-foreground truncate">{item.designerName}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground line-clamp-2">{item.summary}</div>
                                </div>
                                <div
                                    className={`h-7 w-7 rounded-full bg-gradient-to-br ${avatarGradient(item.designerId)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}
                                >
                                    {item.designerName.split(' ').map(w => w[0]).slice(0, 2).join('')}
                                </div>
                            </button>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
