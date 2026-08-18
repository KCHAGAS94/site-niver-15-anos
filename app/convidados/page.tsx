import { ConvidadosClient } from "@/components/convidados-client"
import { AdminPagesHeader } from "@/components/admin-pages-header"
import { listarConfirmacoes } from "@/lib/rsvp-db"

export const dynamic = "force-dynamic"

export default async function ConvidadosPage() {
  try {
    const confirmacoes = await listarConfirmacoes()

    return <ConvidadosClient confirmacoes={confirmacoes} />
  } catch (error) {
    console.error("Erro ao carregar convidados:", error)

    return (
      <main className="min-h-screen bg-background px-4 py-24 md:py-28">
        <AdminPagesHeader />
        <div className="mx-auto w-full max-w-3xl text-center">
          {/* <span className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Quem vai estar lá
          </span> */}
          <h1 className="mt-4 font-serif text-4xl text-foreground md:text-5xl">
            Lista de Convidados
          </h1>
          <p className="mt-4 text-muted-foreground">
            Não foi possível carregar a lista agora. Tente novamente mais tarde.
          </p>
        </div>
      </main>
    )
  }
}
