'use client'
import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

type Status = 'idle' | 'granted' | 'denied' | 'unsupported' | 'loading'

export default function PushNotificationManager() {
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    // Register SW
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})

    const perm = Notification.permission
    if (perm === 'granted') setStatus('granted')
    else if (perm === 'denied') setStatus('denied')
  }, [])

  async function subscribe() {
    if (!VAPID_PUBLIC_KEY) return
    setStatus('loading')
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setStatus('denied'); return }

      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      })

      const json = sub.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })
      setStatus('granted')
    } catch {
      setStatus('idle')
    }
  }

  async function unsubscribe() {
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setStatus('idle')
    } catch {
      setStatus('granted')
    }
  }

  if (status === 'unsupported') return null

  if (status === 'denied') {
    return (
      <div title="Notificações bloqueadas no navegador" className="p-2 text-[var(--color-muted)] opacity-40 cursor-not-allowed">
        <BellOff size={18} />
      </div>
    )
  }

  if (status === 'granted') {
    return (
      <button
        onClick={unsubscribe}
        title="Desativar notificações"
        className="p-2 text-[var(--color-orange)] hover:opacity-70 transition-opacity"
      >
        <Bell size={18} />
      </button>
    )
  }

  return (
    <button
      onClick={subscribe}
      disabled={status === 'loading'}
      title="Ativar notificações push"
      className="p-2 text-[var(--color-muted)] hover:text-white transition-colors disabled:opacity-40"
    >
      <BellOff size={18} />
    </button>
  )
}
