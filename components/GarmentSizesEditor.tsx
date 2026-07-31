'use client'

import { createEmptyGarmentSizes, STANDARD_GARMENT_SIZES, type GarmentSizeRow } from '@/utils/garmentSizes'

interface Props {
    value: GarmentSizeRow[]
    onChange: (next: GarmentSizeRow[]) => void
}

function isStandardSize(label: string) {
    return STANDARD_GARMENT_SIZES.includes(label.toUpperCase() as (typeof STANDARD_GARMENT_SIZES)[number])
}

export default function GarmentSizesEditor({ value, onChange }: Props) {
    const rows = value.length > 0 ? value : createEmptyGarmentSizes()

    const updateRow = (index: number, patch: Partial<GarmentSizeRow>) => {
        onChange(rows.map((row, idx) => (idx === index ? { ...row, ...patch } : row)))
    }

    const setStandardQuantity = (label: string, quantity: number | '') => {
        const index = rows.findIndex(row => row.label.toUpperCase() === label)
        if (index >= 0) {
            updateRow(index, { label, quantity })
            return
        }

        onChange([...rows, { label, quantity }])
    }

    const addCustomSize = () => {
        onChange([...rows, { label: '', quantity: '' }])
    }

    const removeCustomSize = (index: number) => {
        onChange(rows.filter((_, idx) => idx !== index))
    }

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {STANDARD_GARMENT_SIZES.map(label => {
                    const row = rows.find(item => item.label.toUpperCase() === label)

                    return (
                        <div key={label}>
                            <label className="block text-[11px] font-medium text-gray-600 mb-1">{label}</label>
                            <input
                                type="number"
                                min="0"
                                value={row?.quantity ?? ''}
                                onChange={e => setStandardQuantity(label, e.target.value ? parseInt(e.target.value, 10) : '')}
                                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    )
                })}
            </div>

            {rows.some(row => !isStandardSize(row.label) || row.label.trim().length === 0) && (
                <div className="space-y-2">
                    {rows
                        .map((row, index) => ({ row, index }))
                        .filter(({ row }) => !isStandardSize(row.label) || row.label.trim().length === 0)
                        .map(({ row, index }) => (
                            <div key={`${index}-${row.label}`} className="grid grid-cols-[minmax(0,1fr)_110px_auto] gap-3 items-end">
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Custom Size</label>
                                    <input
                                        type="text"
                                        value={row.label}
                                        onChange={e => updateRow(index, { label: e.target.value })}
                                        placeholder="e.g. Youth M"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Qty</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={row.quantity ?? ''}
                                        onChange={e => updateRow(index, { quantity: e.target.value ? parseInt(e.target.value, 10) : '' })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeCustomSize(index)}
                                    className="h-9 text-xs text-red-500 hover:text-red-700 font-medium"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                </div>
            )}

            <button
                type="button"
                onClick={addCustomSize}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
                + Add Custom Size
            </button>
        </div>
    )
}