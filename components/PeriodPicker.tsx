'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const PERIODS = [
    { value: 'month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
]

export default function PeriodPicker() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const current = searchParams.get('period') ?? 'month'

    function select(value: string) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('period', value)
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex flex-wrap gap-2">
            {PERIODS.map(p => (
                <button
                    key={p.value}
                    onClick={() => select(p.value)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${current === p.value
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400 hover:text-indigo-600'
                        }`}
                >
                    {p.label}
                </button>
            ))}
        </div>
    )
}
