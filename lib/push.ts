import webpush from 'web-push'
import { createAdminClient } from '~/lib/supabase/server'

function initVapid() {
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return false
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL ?? 'mailto:contato@trixer.app',
    pub,
    priv,
  )
  return true
}

export interface PushPayload {
  title: string
  body: string
  url: string
  tag: string
}

export interface PushSubscription {
  endpoint: string
  p256dh: string
  auth: string
}

/** Send to one subscription. Returns false if subscription is expired/invalid. */
export async function sendOne(sub: PushSubscription, payload: PushPayload): Promise<boolean> {
  if (!initVapid()) return false
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 86400 }
    )
    return true
  } catch (err: any) {
    // 404/410 = subscription expired — remove it
    if (err.statusCode === 404 || err.statusCode === 410) {
      const admin = createAdminClient()
      await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    }
    return false
  }
}

/** Send to all subscriptions of a user. */
export async function sendToUser(userId: string, payload: PushPayload) {
  const admin = createAdminClient()
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)
  if (!subs?.length) return
  await Promise.all(subs.map(s => sendOne(s as PushSubscription, payload)))
}

/**
 * Check dedup log — returns true if this notification was already sent.
 * If not, logs it and returns false (caller should send).
 */
export async function alreadySent(userId: string, type: string, refId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { error } = await admin.from('push_notification_log').insert({ user_id: userId, type, ref_id: refId })
  // unique constraint violation = already sent
  return !!error
}
