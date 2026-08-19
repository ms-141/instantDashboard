import { NextRequest } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { TRANSPARENT_PIXEL_GIF } from '@/lib/emailTracking'

function pixelResponse() {
  return new Response(TRANSPARENT_PIXEL_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(TRANSPARENT_PIXEL_GIF.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
    },
  })
}

/**
 * Serves the 1x1 open-tracking pixel embedded in sent emails. Always returns
 * the pixel image even if logging fails — a broken tracking pixel must never
 * show up as a broken image in the recipient's inbox.
 *
 * Note: many email clients (Apple Mail Privacy Protection, Gmail image
 * proxies) pre-fetch this pixel immediately on delivery regardless of
 * whether the recipient actually opened/read the email, so "opened" is a
 * soft signal, not proof of reading.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params
    const supabase = createAdminClient()

    const { data: message } = await supabase
      .from('email_messages')
      .select('id, customer_id, order_id, first_opened_at, open_count, subject')
      .eq('tracking_id', trackingId)
      .maybeSingle()

    if (message) {
      const isFirstOpen = !message.first_opened_at
      const now = new Date().toISOString()

      await supabase
        .from('email_messages')
        .update({
          open_count: (message.open_count || 0) + 1,
          first_opened_at: message.first_opened_at || now,
          last_opened_at: now,
        })
        .eq('id', message.id)

      await supabase.from('email_events').insert({
        email_message_id: message.id,
        event_type: 'open',
        user_agent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for'),
      })

      // Only log the first open to the customer timeline to avoid noise from
      // repeated privacy-proxy pre-fetches of the same pixel.
      if (isFirstOpen) {
        await supabase.from('activity_events').insert({
          customer_id: message.customer_id,
          order_id: message.order_id,
          email_message_id: message.id,
          type: 'email_opened',
          title: `Email opened: ${message.subject}`,
        })
      }
    }
  } catch {
    // Swallow errors — the pixel must always render.
  }

  return pixelResponse()
}
