'use client'
import { MessageCircle } from 'lucide-react'

interface WhatsAppShareProps {
  text: string
  url?: string
  label?: string
  variant?: 'primary' | 'outline' | 'ghost'
}

export default function WhatsAppShare({ text, url, label, variant = 'primary' }: WhatsAppShareProps) {
  function handleShare() {
    const shareUrl = url || typeof window !== 'undefined' ? window.location.href : ''
    const fullText = `${text}\n\n${shareUrl}`
    const waUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`
    window.open(waUrl, '_blank')
  }

  const styles = {
    primary: 'bg-[#25D366] hover:bg-[#20bd5a] text-white',
    outline: 'bg-transparent border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10',
    ghost: 'bg-transparent text-[#25D366] hover:bg-[#25D366]/10',
  }

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${styles[variant]}`}
    >
      <MessageCircle size={16} />
      {label || 'WhatsApp'}
    </button>
  )
}
