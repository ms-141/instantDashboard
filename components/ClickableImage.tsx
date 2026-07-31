'use client'

import { useState } from 'react'

interface Props {
    src: string
    alt: string
    thumbnailClassName?: string
}

export default function ClickableImage({ src, alt, thumbnailClassName }: Props) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-md"
                aria-label={`View ${alt}`}
            >
                <img src={src} alt={alt} className={thumbnailClassName} />
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                            <p className="text-sm font-medium text-gray-700">{alt}</p>
                            <div className="flex items-center gap-3">
                                <a href={src} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                                    Open in new tab ↗
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 text-xl leading-none font-light"
                                    aria-label="Close"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        <div className="overflow-auto p-4">
                            <img src={src} alt={alt} className="w-full h-auto object-contain" />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
