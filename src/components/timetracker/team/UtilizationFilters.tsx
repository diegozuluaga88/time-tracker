// TT.43 · Diego 2026-09-08 · Utilization tab · filter strip.
// 4 filtros basados en pain #2 (Excel replacement) · matches el mental
// model de McKinley/Jimmy en el weekly rollup manual.
//
// Layout: 2 segmented pills (Company · Billable) + 2 dropdowns (Size · Sales rep).

import { Building2, Wallet, TrendingUp, User, X } from 'lucide-react'
import type { UtilizationFilters, FilterOptions, SizeBucket } from '../../../data/managerInsights'
import { DEFAULT_FILTERS } from '../../../data/managerInsights'
import type { Company } from '../../../data/projects'

interface Props {
    value: UtilizationFilters
    onChange: (next: UtilizationFilters) => void
    options: FilterOptions
}

export default function UtilizationFiltersStrip({ value, onChange, options }: Props) {
    const set = <K extends keyof UtilizationFilters>(key: K, v: UtilizationFilters[K]) => {
        onChange({ ...value, [key]: v })
    }
    const reset = () => onChange(DEFAULT_FILTERS)
    const isFiltered = value.company !== 'all' || value.billable !== 'all' || value.sizeBucket !== 'all' || value.salesRep !== 'all'

    return (
        <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Applies to the heatmap and all charts below.</p>
                </div>
                {isFiltered && (
                    <button
                        type="button"
                        onClick={reset}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
                    >
                        <X className="h-3 w-3" />
                        Reset all
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Company · segmented pill */}
                <FilterField icon={Building2} label="Company">
                    <Segmented
                        value={value.company}
                        onChange={(v) => set('company', v as Company | 'all')}
                        options={[
                            { value: 'all', label: 'All' },
                            { value: 'Rightsize', label: 'Rightsize' },
                            { value: 'Office Furniture Center', label: 'OFC' },
                            { value: 'Mac Relocations', label: 'Mac' },
                        ]}
                    />
                </FilterField>

                {/* Billable vs Internal · segmented pill */}
                <FilterField icon={Wallet} label="Billable">
                    <Segmented
                        value={value.billable}
                        onChange={(v) => set('billable', v as 'all' | 'billable' | 'internal')}
                        options={[
                            { value: 'all', label: 'All' },
                            { value: 'billable', label: 'Billable' },
                            { value: 'internal', label: 'Internal' },
                        ]}
                    />
                </FilterField>

                {/* Project size bucket · dropdown */}
                <FilterField icon={TrendingUp} label="Project size">
                    <select
                        value={value.sizeBucket}
                        onChange={(e) => set('sizeBucket', e.target.value as SizeBucket | 'all')}
                        className="w-full px-2.5 py-1.5 text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                        <option value="all">All sizes</option>
                        <option value="small">$0-10K</option>
                        <option value="medium">$10-100K</option>
                        <option value="large">$100K+</option>
                    </select>
                </FilterField>

                {/* Sales rep · dropdown */}
                <FilterField icon={User} label="Sales rep">
                    <select
                        value={value.salesRep}
                        onChange={(e) => set('salesRep', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                        <option value="all">All reps</option>
                        {options.salesReps.map(rep => (
                            <option key={rep} value={rep}>{rep}</option>
                        ))}
                    </select>
                </FilterField>
            </div>
        </div>
    )
}

function FilterField({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                <Icon className="h-3 w-3" />
                {label}
            </label>
            {children}
        </div>
    )
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
    return (
        <div className="inline-flex rounded-md border border-input p-0.5 bg-background overflow-x-auto">
            {options.map(opt => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap transition-colors ${
                        value === opt.value
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}
