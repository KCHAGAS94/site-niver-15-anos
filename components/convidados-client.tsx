"use client"

import { useMemo, useState } from "react"
import { AdminPagesHeader } from "@/components/admin-pages-header"

type Acompanhante = {
  nome?: string
  idade?: string | number
  presente?: boolean
}

type Confirmacao = {
  id: string
  nomePrincipal?: string
  idadePrincipal?: string | number
  confirmaPresenca?: string
  presente?: boolean
  acompanhantes?: Acompanhante[]
}

export function ConvidadosClient({ confirmacoes = [] }: { confirmacoes: Confirmacao[] }) {
  const [search, setSearch] = useState("")
  const [data, setData] = useState(confirmacoes)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

  const confirmados = useMemo(
    () => data.filter((confirmacao) => confirmacao.confirmaPresenca === "Sim"),
    [data]
  )

  const handleTogglePresente = async (confirmacao: Confirmacao, acompanhanteIndex: number | null = null) => {
    const key = `${confirmacao.id}-${acompanhanteIndex ?? "principal"}`
    setTogglingKey(key)

    const atualizado: Confirmacao = { ...confirmacao }

    if (acompanhanteIndex === null) {
      atualizado.presente = !confirmacao.presente
    } else {
      const acompanhantes = Array.isArray(confirmacao.acompanhantes) ? [...confirmacao.acompanhantes] : []
      acompanhantes[acompanhanteIndex] = {
        ...acompanhantes[acompanhanteIndex],
        presente: !acompanhantes[acompanhanteIndex]?.presente,
      }
      atualizado.acompanhantes = acompanhantes
    }

    try {
      const response = await fetch("/api/rsvp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(atualizado),
      })

      if (response.ok) {
        setData((current) => current.map((item) => (item.id === confirmacao.id ? atualizado : item)))
      } else {
        alert("Erro ao atualizar a presença")
      }
    } catch (error) {
      console.error("Erro ao atualizar presença:", error)
      alert("Erro ao atualizar a presença")
    } finally {
      setTogglingKey(null)
    }
  }

  const confirmadosFiltrados = useMemo(() => {
    const termo = search.trim().toLowerCase()

    return confirmados
      .filter((confirmacao) => {
        if (!termo) return true

        const nomePrincipal = String(confirmacao.nomePrincipal || "").toLowerCase()
        const acompanhantes = Array.isArray(confirmacao.acompanhantes) ? confirmacao.acompanhantes : []

        return (
          nomePrincipal.includes(termo) ||
          acompanhantes.some((acompanhante) => String(acompanhante.nome || "").toLowerCase().includes(termo))
        )
      })
      .sort((a, b) => {
        const presenteA = Boolean(a.presente)
        const presenteB = Boolean(b.presente)
        if (presenteA !== presenteB) return presenteA ? 1 : -1

        const nomeA = String(a.nomePrincipal || "").toLowerCase()
        const nomeB = String(b.nomePrincipal || "").toLowerCase()
        return nomeA.localeCompare(nomeB, "pt-BR")
      })
  }, [confirmados, search])

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-24 md:py-28">
      <div className="mx-auto w-full max-w-7xl">
        <AdminPagesHeader />

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-pink-500">Convidados</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-800 md:text-4xl">Lista de convidados</h1>
            </div>

            <div className="w-full md:max-w-sm">
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Buscar nome</label>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Digite um nome"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100"
              />
            </div>
          </div>
        </div>

        <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Nome</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Idade</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Acompanhantes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {confirmadosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-slate-500">
                      {search.trim() ? "Nenhum nome encontrado." : "Nenhuma confirmação registrada ainda."}
                    </td>
                  </tr>
                ) : (
                  confirmadosFiltrados.map((confirmacao) => {
                    const acompanhantes = Array.isArray(confirmacao.acompanhantes) ? confirmacao.acompanhantes : []

                    return (
                      <tr key={confirmacao.id} className="align-top hover:bg-slate-50/80">
                        <td className="px-6 py-4">
                          <label className="flex cursor-pointer items-start gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(confirmacao.presente)}
                              disabled={togglingKey === `${confirmacao.id}-principal`}
                              onChange={() => handleTogglePresente(confirmacao)}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-pink-500 focus:ring-pink-300"
                            />
                            <span className="font-semibold text-slate-800">{confirmacao.nomePrincipal || "-"}</span>
                          </label>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{confirmacao.idadePrincipal || "-"}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {acompanhantes.length > 0 ? (
                            <ul className="space-y-1">
                              {acompanhantes.map((acompanhante, index) => (
                                <li key={`${confirmacao.id}-ac-${index}`}>
                                  <label className="flex cursor-pointer items-start gap-2">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(acompanhante.presente)}
                                      disabled={togglingKey === `${confirmacao.id}-${index}`}
                                      onChange={() => handleTogglePresente(confirmacao, index)}
                                      className="mt-1 h-4 w-4 rounded border-slate-300 text-pink-500 focus:ring-pink-300"
                                    />
                                    <span>
                                      {index + 1}. {acompanhante.nome || "-"} {acompanhante.idade ? `(${acompanhante.idade} anos)` : ""}
                                    </span>
                                  </label>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4 md:hidden">
          {confirmadosFiltrados.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
              {search.trim() ? "Nenhum nome encontrado." : "Nenhuma confirmação registrada ainda."}
            </div>
          ) : (
            confirmadosFiltrados.map((confirmacao) => {
              const acompanhantes = Array.isArray(confirmacao.acompanhantes) ? confirmacao.acompanhantes : []

              return (
                <article key={confirmacao.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(confirmacao.presente)}
                      disabled={togglingKey === `${confirmacao.id}-principal`}
                      onChange={() => handleTogglePresente(confirmacao)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-pink-500 focus:ring-pink-300"
                    />
                    <h2 className="text-lg font-bold text-slate-800">{confirmacao.nomePrincipal || "-"}</h2>
                  </label>

                  <dl className="mt-4 grid gap-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
                      <dt className="font-medium text-slate-500">Idade</dt>
                      <dd>{confirmacao.idadePrincipal || "-"}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4 border-t border-slate-100 pt-3">
                      <dt className="font-medium text-slate-500">Acompanhantes</dt>
                      <dd className="mt-2 text-left text-slate-700">
                        {acompanhantes.length > 0 ? (
                          <ol className="space-y-1 pl-4">
                            {acompanhantes.map((acompanhante, index) => (
                              <li key={`${confirmacao.id}-mobile-${index}`}>
                                <label className="flex cursor-pointer items-start gap-2">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(acompanhante.presente)}
                                    disabled={togglingKey === `${confirmacao.id}-${index}`}
                                    onChange={() => handleTogglePresente(confirmacao, index)}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-pink-500 focus:ring-pink-300"
                                  />
                                  <span>
                                    <span className="font-medium text-slate-700">{index + 1}.</span>{" "}
                                    {String(acompanhante.nome || "-").toUpperCase()}{" "}
                                    {acompanhante.idade ? `(${acompanhante.idade} anos)` : ""}
                                  </span>
                                </label>
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="text-slate-400">-</p>
                        )}
                      </dd>
                    </div>
                  </dl>
                </article>
              )
            })
          )}
        </div>
      </div>
    </main>
  )
}
