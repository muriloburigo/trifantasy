import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import ImportarStartlist from './ImportarStartlist'
import ImportarResultados from './ImportarResultados'

export default async function ImportarPage() {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: races } = await supabase
    .from('races')
    .select('id, name, date, status')
    .order('date', { ascending: false })

  return (
    <div className="p-8 max-w-5xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-1">Importar Dados</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Cole a URL da página de startlist ou resultados de uma prova. O sistema tenta extrair os dados automaticamente.
        </p>
      </div>

      <ImportarStartlist races={races ?? []} />
      <ImportarResultados races={races ?? []} />
    </div>
  )
}
