import { ChegadaClient } from "@/components/chegada-client"
import { AdminPagesHeader } from "@/components/admin-pages-header"
import { listarConfirmacoes } from "@/lib/rsvp-db"

export const dynamic = "force-dynamic"

export default async function ChegadaPage() {
  try {
    const confirmacoes = await listarConfirmacoes()

    return <ChegadaClient confirmacoes={confirmacoes} />
  } catch (error) {
    console.error("Erro ao carregar relatório de chegada:", error)

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-24 md:py-28">
        <div className="mx-auto w-full max-w-4xl">
          <AdminPagesHeader />
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-pink-500">Relatório</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-800 md:text-4xl">Chegada dos convidados</h1>
            <p className="mt-4 text-slate-600">
              Não foi possível carregar o relatório agora. Tente novamente mais tarde.
            </p>
          </div>
        </div>
      </main>
    )
  }
}
