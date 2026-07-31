'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

interface Props {
    href: string
    className?: string
    children: ReactNode
}

export default function ClickableRow({ href, className, children }: Props) {
    const router = useRouter()

    return (
        <tr
            className={className}
            onClick={e => {
                // Ignore clicks on interactive elements so buttons/links still work normally
                if ((e.target as HTMLElement).closest('a, button, input, select, textarea')) return
                router.push(href)
            }}
        >
            {children}
        </tr>
    )
}
