export const STANDARD_GARMENT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'] as const

export type GarmentSizeRow = {
    label: string
    quantity: number | ''
}

const STANDARD_SIZE_SET = new Set<string>(STANDARD_GARMENT_SIZES)

function emptyRows(): GarmentSizeRow[] {
    return STANDARD_GARMENT_SIZES.map(label => ({ label, quantity: '' }))
}

function normalizeLabel(label: string): string {
    return label.trim().toUpperCase()
}

function normalizeQuantity(value: unknown): number | '' {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return Math.floor(value)
    }

    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value)
        if (Number.isFinite(parsed) && parsed > 0) {
            return Math.floor(parsed)
        }
    }

    return ''
}

function rowsFromEntries(entries: Array<[string, unknown]>): GarmentSizeRow[] {
    const customRows: GarmentSizeRow[] = []
    const standardRows = new Map<string, GarmentSizeRow>()

    for (const [label, quantity] of entries) {
        const trimmedLabel = label.trim()
        if (!trimmedLabel) continue

        const row = { label: trimmedLabel, quantity: normalizeQuantity(quantity) }
        const normalized = normalizeLabel(trimmedLabel)

        if (STANDARD_SIZE_SET.has(normalized)) {
            standardRows.set(normalized, { label: normalized, quantity: row.quantity })
        } else {
            customRows.push(row)
        }
    }

    return [
        ...STANDARD_GARMENT_SIZES.map(label => standardRows.get(label) ?? ({ label, quantity: '' as const satisfies number | '' })),
        ...customRows,
    ]
}

function parseLegacySizes(value: string): GarmentSizeRow[] {
    const entries: Array<[string, unknown]> = []
    const parts = value.split(/[,\n;]/)

    for (const part of parts) {
        const trimmed = part.trim()
        if (!trimmed) continue

        const match = trimmed.match(/^(.+?)\s*[x×:]\s*(\d+)$/i)
        if (match) {
            entries.push([match[1].trim(), Number(match[2])])
            continue
        }

        const fallbackMatch = trimmed.match(/^(.+?)\s+(\d+)$/i)
        if (fallbackMatch) {
            entries.push([fallbackMatch[1].trim(), Number(fallbackMatch[2])])
            continue
        }

        entries.push([trimmed, ''])
    }

    return rowsFromEntries(entries)
}

export function createEmptyGarmentSizes(): GarmentSizeRow[] {
    return emptyRows()
}

export function parseGarmentSizes(value: string | null | undefined): GarmentSizeRow[] {
    if (!value) return emptyRows()

    const trimmed = value.trim()
    if (!trimmed) return emptyRows()

    try {
        const parsed = JSON.parse(trimmed) as unknown

        if (Array.isArray(parsed)) {
            const entries = parsed
                .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
                .map(item => {
                    const label = typeof item.label === 'string'
                        ? item.label
                        : typeof item.size === 'string'
                            ? item.size
                            : ''
                    return [label, item.quantity] as [string, unknown]
                })

            return rowsFromEntries(entries)
        }

        if (parsed && typeof parsed === 'object') {
            return rowsFromEntries(Object.entries(parsed as Record<string, unknown>))
        }
    } catch {
        // Fall through to legacy parsing.
    }

    return parseLegacySizes(trimmed)
}

export function serializeGarmentSizes(rows: GarmentSizeRow[]): string | null {
    const entries = rows
        .map(row => [row.label.trim(), row.quantity] as const)
        .filter(([label, quantity]) => label.length > 0 && typeof quantity === 'number' && quantity > 0)

    if (entries.length === 0) return null

    return JSON.stringify(Object.fromEntries(entries.map(([label, quantity]) => [label, quantity])))
}

export function formatGarmentSizes(value: string | null | undefined): string {
    if (!value) return '—'

    const rows = parseGarmentSizes(value)
    const parts = rows
        .filter(row => typeof row.quantity === 'number' && row.quantity > 0)
        .map(row => `${row.label} ${row.quantity}`)

    return parts.length > 0 ? parts.join(', ') : value
}