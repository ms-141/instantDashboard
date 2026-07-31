'use client'

import { useState } from 'react'

interface Props {
    src: string
    alt: string
    thumbnailClassName?: string
}

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zm7 1.5L18.5 9H13V3.5zM8.5 13h1.75c.97 0 1.75.78 1.75 1.75S11.22 16.5 10.25 16.5H9.5V18H8.5v-5zm1 2.5h.75c.41 0 .75-.34.75-.75s-.34-.75-.75-.75H9.5v1.5zm3.5-2.5h1.5c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2H13v-5zm1 4h.5c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1H14v3zm3.5-4h3v1h-2v1h1.5v1H18.5v2h-1v-5z" />
    </svg>
)

export default function ClickableImage({ src, alt, thumbnailClassName }: Props) {
    const [open, setOpen] = useState(false)
    const u = src.toLowerCase()
    const isPdf = u.includes('.pdf')
    // HEIC can't be rendered by browsers — link out directly
    const isHeic = u.includes('.heic') || u.includes('.heif')

    if (isHeic) {
        return (
            <a href={src} target="_blank" rel="noreferrer" aria-label={`Open ${alt}`}>
                <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    <FileIcon />
                    <div>
                        <p className="text-sm font-medium text-gray-700">{alt}</p>
                        <p className="text-xs text-gray-400 mt-0.5">HEIC — click to open in new tab ↗</p>
                    </div>
                </div>
            </a>
        )
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-md block w-full text-left"
                aria-label={`View ${alt}`}
            >
                {isPdf ? (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                        <FileIcon />
                        <div>
                            <p className="text-sm font-medium text-gray-700">{alt}</p>
                            <p className="text-xs text-gray-400 mt-0.5">PDF — click to view</p>
                        </div>
                    </div>
                ) : (
                    <img src={src} alt={alt} className={thumbnailClassName} />
                )}
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
                        <div className="flex-1 overflow-auto min-h-0">
                            {isPdf ? (
                                <iframe src={src} title={alt} className="w-full h-full min-h-[70vh]" />
                            ) : (
                                <img src={src} alt={alt} className="w-full h-auto object-contain" />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
