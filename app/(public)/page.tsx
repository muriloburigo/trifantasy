// Root page is handled by app/page.tsx
// This file is intentionally unused — Next.js prefers app/page.tsx over (group)/page.tsx
import { redirect } from 'next/navigation'
export default function Page() { redirect('/') }
