import RelpagClient from '@/components/relpag-client'
import { listarEventosPagamento } from '@/lib/payment-db'

export const dynamic = 'force-dynamic'

export default async function RelpagPage() {
  try {
    const eventos = await listarEventosPagamento()

    return <RelpagClient eventos={eventos} />
  } catch (error) {
    console.error('Erro ao carregar relatório de pagamentos:', error)

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 md:py-16">
        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-pink-500">Relatório de pagamentos</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-800 md:text-4xl">Controle de vendas</h1>
            <p className="mt-4 text-slate-600">
              Não foi possível carregar os eventos de pagamento agora. Verifique a conexão com o banco de dados no servidor.
            </p>
          </div>
        </div>
      </main>
    )
  }
}
