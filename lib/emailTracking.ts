import { getAppBaseUrl } from '@/utils/mailer'

/** Builds the 1x1 tracking-pixel URL for a given email's tracking id. */
export function buildOpenTrackingUrl(trackingId: string) {
  return `${getAppBaseUrl()}/api/track/open/${trackingId}`
}

/** Builds a click-tracking redirect URL that wraps `targetUrl`. */
export function buildClickTrackingUrl(trackingId: string, targetUrl: string) {
  return `${getAppBaseUrl()}/api/track/click/${trackingId}?u=${encodeURIComponent(targetUrl)}`
}

/**
 * Rewrites every http(s) href in the HTML body to route through the
 * click-tracking redirect endpoint, and appends an invisible 1x1 tracking
 * pixel just before </body> (or at the very end if there's no </body> tag).
 * Mailto/tel links and anchors are left untouched.
 */
export function prepareTrackableHtml(html: string, trackingId: string): string {
  const withTrackedLinks = html.replace(
    /href=(["'])(https?:\/\/[^"']+)\1/gi,
    (_match, quote: string, url: string) => `href=${quote}${buildClickTrackingUrl(trackingId, url)}${quote}`
  )

  const pixelTag = `<img src="${buildOpenTrackingUrl(trackingId)}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />`

  if (/<\/body>/i.test(withTrackedLinks)) {
    return withTrackedLinks.replace(/<\/body>/i, `${pixelTag}</body>`)
  }
  return `${withTrackedLinks}${pixelTag}`
}

/** A fully transparent 1x1 GIF, served by the open-tracking route. */
export const TRANSPARENT_PIXEL_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7',
  'base64'
)
