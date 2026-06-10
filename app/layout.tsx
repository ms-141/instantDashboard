import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { createClient } from '@/utils/supabase/server'
import Nav from '@/components/Nav'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Embroidery Order Tracker',
  description: 'Track orders for the embroidery business',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50 text-gray-900" style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}>
        {user ? (
          <div className="flex min-h-screen">
            <Nav />
            <main className="flex-1 pl-56">
              <div className="p-8 max-w-6xl">{children}</div>
            </main>
          </div>
        ) : (
          <>{children}</>
        )}
      </body>
    </html>
  )
}
