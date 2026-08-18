"use client"

import { useMemo, useState } from "react"
import { Search, Users, UserCheck } from "lucide-react"
import { AdminPagesHeader } from "@/components/admin-pages-header"

type Acompanhante = {
  nome?: string
  idade?: string | number
}

type Confirmacao = {
  id: string
  nomePrincipal?: string
  idadePrincipal?: string | number
  confirmaPresenca?: string
  acompanhantes?: Acompanhante[]
}

function contarPessoas(confirmacoes: Confirmacao[]) {
  return confirmacoes.reduce((total, confirmacao) => {
    const acompanhantes = Array.isArray(confirmacao.acompanhantes) ? confirmacao.acompanhantes : []
    return total + 1 + acompanhantes.length
  }, 0)
}

export function ConvidadosClient({ confirmacoes = [] }: { confirmacoes: Confirmacao[] }) {
  const [search, setSearch] = useState("")

  const confirmados = useMemo(
    () => confirmacoes.filter((confirmacao) => confirmacao.confirmaPresenca === "Sim"),
    [confirmacoes]
  )

  const confirmadosFiltrados = useMemo(() => {
    const termo = search.trim().toLowerCase()
    if (!termo) return confirmados

    return confirmados.filter((confirmacao) => {
      const nomePrincipal = String(confirmacao.nomePrincipal || "").toLowerCase()
      const acompanhantes = Array.isArray(confirmacao.acompanhantes) ? confirmacao.acompanhantes : []

      return (
        nomePrincipal.includes(termo) ||
        acompanhantes.some((acompanhante) => String(acompanhante.nome || "").toLowerCase().includes(termo))
      )
    })
  }, [confirmados, search])

  const totalPessoas = useMemo(() => contarPessoas(confirmados), [confirmados])

  return (
    <main className="min-h-screen bg-background px-4 pb-24 pt-20 md:pb-28 md:pt-24">
      <AdminPagesHeader />
      <div className="mx-auto w-full max-w-3xl">
        <div className="sticky top-16 z-40 -mx-4 bg-background px-4 pb-4 pt-2 md:top-18">
          <div className="mb-6 text-center">
            {/* <span className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              Quem vai estar lá
            </span> */}
            <h1 className="font-serif text-4xl text-foreground md:text-5xl">
              Lista de Convidados
            </h1>
            <div className="mx-auto mt-4 flex items-center justify-center gap-3">
              <span className="h-px w-12 bg-primary md:w-20" />
              <UserCheck className="h-5 w-5 text-primary" />
              <span className="h-px w-12 bg-primary md:w-20" />
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {totalPessoas} {totalPessoas === 1 ? "convidado confirmado" : "convidados confirmados"}
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar nome..."
              className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="space-y-3">
          {confirmadosFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground shadow-sm">
              {search.trim() ? "Nenhum nome encontrado." : "Ainda não temos confirmações."}
            </div>
          ) : (
            confirmadosFiltrados.map((confirmacao) => {
              const acompanhantes = Array.isArray(confirmacao.acompanhantes) ? confirmacao.acompanhantes : []

              return (
                <div
                  key={confirmacao.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
                >
                  <p className="font-serif text-xl text-card-foreground">
                    {confirmacao.nomePrincipal || "-"}
                  </p>

                  {acompanhantes.length > 0 && (
                    <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm text-muted-foreground">
                      {acompanhantes.map((acompanhante, index) => (
                        <li key={`${confirmacao.id}-ac-${index}`}>
                          + {acompanhante.nome || "-"}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </main>
  )
}
