'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const links = [
  { href: '/', label: '📊 Dashboard' },
  { href: '/orders', label: '📋 Orders' },
  { href: '/customers', label: '👥 Customers' },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="fixed left-0 top-0 h-full w-56 bg-indigo-900 text-white flex flex-col z-10">
      <div className="p-6 border-b border-indigo-800">
        <span className="text-lg font-bold leading-tight">🧵 Embroidery<br />Orders</span>
      </div>
      <ul className="flex-1 p-3 space-y-1">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
      <div className="p-4 border-t border-indigo-800">
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-indigo-300 hover:text-white px-3 py-2 rounded-lg hover:bg-indigo-800 transition-colors"
        >
          Sign out →
        </button>
      </div>
    </nav>
  )
}
