'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

const links = [
  { href: '/', label: '📊 Dashboard' },
  { href: '/orders', label: '📋 Orders' },
  { href: '/imports', label: '📥 Imported' },
  { href: '/customers', label: '👥 Customers' },
]

function getMobileTitle(pathname: string) {
  if (pathname.startsWith('/orders')) return 'Orders'
  if (pathname.startsWith('/imports')) return 'Imported Orders'
  if (pathname.startsWith('/customers')) return 'Customers'
  return 'Dashboard'
}

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const mobileTitle = getMobileTitle(pathname)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setIsOpen(false)
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-indigo-800 bg-indigo-900 px-3 text-white md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(v => !v)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-800"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <p className="text-sm font-semibold tracking-wide">{mobileTitle}</p>
      </div>

      {isOpen && (
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      <nav
        className={`fixed left-0 top-0 z-40 flex h-full w-56 flex-col bg-indigo-900 text-white transition-transform duration-200 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between border-b border-indigo-800 p-6">
          <span className="text-lg font-bold leading-tight">Embroidery<br />Orders</span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="text-indigo-200 hover:text-white md:hidden"
          >
            X
          </button>
        </div>
        <ul className="flex-1 space-y-1 p-3">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setIsOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'bg-indigo-700 text-white'
                    : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="border-t border-indigo-800 p-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-indigo-300 transition-colors hover:bg-indigo-800 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </nav>
    </>
  )
}
