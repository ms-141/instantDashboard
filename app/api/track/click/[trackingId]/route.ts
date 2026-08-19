import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

function isSafeRedirectTarget(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Logs a link click then redirects to the original destination. Emails sent
 * via sendEmail() have their http(s) links rewritten to point here first
 * (see lib/emailTracking.ts).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params
  const targetUrl = request.nextUrl.searchParams.get('u')

  if (!targetUrl || !isSafeRedirectTarget(targetUrl)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    const supabase = createAdminClient()

    const { data: message } = await supabase
      .from('email_messages')
      .select('id, customer_id, order_id, first_clicked_at, click_count, subject')
      .eq('tracking_id', trackingId)
      .maybeSingle()

    if (message) {
      const now = new Date().toISOString()

      await supabase
        .from('email_messages')
        .update({
          click_count: (message.click_count || 0) + 1,
          first_clicked_at: message.first_clicked_at || now,
          last_clicked_at: now,
        })
        .eq('id', message.id)

      await supabase.from('email_events').insert({
        email_message_id: message.id,
        event_type: 'click',
        url: targetUrl,
        user_agent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for'),
      })

      await supabase.from('activity_events').insert({
        customer_id: message.customer_id,
        order_id: message.order_id,
        email_message_id: message.id,
        type: 'email_clicked',
        title: `Link clicked in email: ${message.subject}`,
        description: targetUrl,
        metadata: { url: targetUrl },
      })
    }
  } catch {
    // Never block the redirect on logging failures.
  }

  return NextResponse.redirect(targetUrl)
}
