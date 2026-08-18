"use client"

import { useMemo, useState } from "react"
import { AdminPagesHeader } from "@/components/admin-pages-header"

type HistoricoEvento = {
  tipo: "confirmado" | "removido"
  horario: string
}

type Acompanhante = {
  nome?: string
  idade?: string | number
  presente?: boolean
  presenteEm?: string
  historico?: HistoricoEvento[]
}

type Confirmacao = {
  id: string
  nomePrincipal?: string
  idadePrincipal?: string | number
  confirmaPresenca?: string
  presente?: boolean
  presenteEm?: string
  historico?: HistoricoEvento[]
  acompanhantes?: Acompanhante[]
}

type PendingToggle = {
  confirmacao: Confirmacao
  acompanhanteIndex: number | null
  nome: string
  novoPresente: boolean
}

function formatHora(value?: string) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date)
}

export function ConvidadosClient({ confirmacoes = [] }: { confirmacoes: Confirmacao[] }) {
  const [search, setSearch] = useState("")
  const [data, setData] = useState(confirmacoes)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingToggle | null>(null)

  const confirmados = useMemo(
    () => data.filter((confirmacao) => confirmacao.confirmaPresenca === "Sim"),
    [data]
  )

  const requestToggle = (confirmacao: Confirmacao, acompanhanteIndex: number | null = null) => {
    const jaPresente =
      acompanhanteIndex === null
        ? Boolean(confirmacao.presente)
        : Boolean(confirmacao.acompanhantes?.[acompanhanteIndex]?.presente)

    const nome =
      acompanhanteIndex === null
        ? confirmacao.nomePrincipal || "-"
        : confirmacao.acompanhantes?.[acompanhanteIndex]?.nome || "-"

    setPending({
      confirmacao,
      acompanhanteIndex,
      nome,
      novoPresente: !jaPresente,
    })
  }

  const handleConfirmToggle = async () => {
    if (!pending) return

    const { confirmacao, acompanhanteIndex, novoPresente } = pending
    const key = `${confirmacao.id}-${acompanhanteIndex ?? "principal"}`
    setTogglingKey(key)
    setPending(null)

    const atualizado: Confirmacao = { ...confirmacao }
    const agora = new Date().toISOString()
    const evento: HistoricoEvento = { tipo: novoPresente ? "confirmado" : "removido", horario: agora }

    if (acompanhanteIndex === null) {
      atualizado.presente = novoPresente
      atualizado.presenteEm = novoPresente ? agora : undefined
      atualizado.historico = [...(confirmacao.historico || []), evento]
    } else {
      const acompanhantes = Array.isArray(confirmacao.acompanhantes) ? [...confirmacao.acompanhantes] : []
      const atual = acompanhantes[acompanhanteIndex]
      acompanhantes[acompanhanteIndex] = {
        ...atual,
        presente: novoPresente,
        presenteEm: novoPresente ? agora : undefined,
        historico: [...(atual?.historico || []), evento],
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
        alert("Erro ao atualizar a chegada")
      }
    } catch (error) {
      console.error("Erro ao atualizar chegada:", error)
      alert("Erro ao atualizar a chegada")
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
    <main className="min-h-screen bg-slate-50 px-3 pb-10 pt-20 sm:px-4 md:pb-14 md:pt-24">
      <div className="mx-auto w-full max-w-7xl">
        <AdminPagesHeader />

        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:mb-6 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-500">Convidados</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-800 md:text-3xl">Lista de convidados</h1>
            </div>

            <div className="w-full md:max-w-sm">
              <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Buscar nome</label>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Digite um nome"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100"
              />
            </div>
          </div>
        </div>

        <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Nome</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Idade</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Acompanhantes</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Chegada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {confirmadosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                      {search.trim() ? "Nenhum nome encontrado." : "Nenhuma confirmação registrada ainda."}
                    </td>
                  </tr>
                ) : (
                  confirmadosFiltrados.map((confirmacao) => {
                    const acompanhantes = Array.isArray(confirmacao.acompanhantes) ? confirmacao.acompanhantes : []
                    const horaPrincipal = formatHora(confirmacao.presenteEm)

                    return (
                      <tr key={confirmacao.id} className="align-top hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <label className="flex cursor-pointer items-start gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(confirmacao.presente)}
                              disabled={togglingKey === `${confirmacao.id}-principal`}
                              onChange={() => requestToggle(confirmacao)}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-pink-500 focus:ring-pink-300"
                            />
                            <span
                              onClick={() => requestToggle(confirmacao)}
                              className="font-semibold text-slate-800 hover:text-pink-600"
                            >
                              {confirmacao.nomePrincipal || "-"}
                            </span>
                          </label>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{confirmacao.idadePrincipal || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {acompanhantes.length > 0 ? (
                            <ul className="space-y-1">
                              {acompanhantes.map((acompanhante, index) => (
                                <li key={`${confirmacao.id}-ac-${index}`}>
                                  <label className="flex cursor-pointer items-start gap-2">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(acompanhante.presente)}
                                      disabled={togglingKey === `${confirmacao.id}-${index}`}
                                      onChange={() => requestToggle(confirmacao, index)}
                                      className="mt-1 h-4 w-4 rounded border-slate-300 text-pink-500 focus:ring-pink-300"
                                    />
                                    <span
                                      onClick={() => requestToggle(confirmacao, index)}
                                      className="hover:text-pink-600"
                                    >
                                      {index + 1}. {acompanhante.nome || "-"} {acompanhante.idade ? `(${acompanhante.idade} anos)` : ""}
                                      {formatHora(acompanhante.presenteEm) && (
                                        <span className="ml-2 text-xs font-semibold text-emerald-600">
                                          {formatHora(acompanhante.presenteEm)}
                                        </span>
                                      )}
                                    </span>
                                  </label>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {horaPrincipal ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                              {horaPrincipal}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
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

        <div className="grid gap-3 md:hidden">
          {confirmadosFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500 shadow-sm">
              {search.trim() ? "Nenhum nome encontrado." : "Nenhuma confirmação registrada ainda."}
            </div>
          ) : (
            confirmadosFiltrados.map((confirmacao) => {
              const acompanhantes = Array.isArray(confirmacao.acompanhantes) ? confirmacao.acompanhantes : []
              const horaPrincipal = formatHora(confirmacao.presenteEm)

              return (
                <article key={confirmacao.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(confirmacao.presente)}
                        disabled={togglingKey === `${confirmacao.id}-principal`}
                        onChange={() => requestToggle(confirmacao)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-pink-500 focus:ring-pink-300"
                      />
                      <h2
                        onClick={() => requestToggle(confirmacao)}
                        className="text-base font-bold text-slate-800"
                      >
                        {confirmacao.nomePrincipal || "-"}
                      </h2>
                    </label>
                    {horaPrincipal && (
                      <span className="inline-flex shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        {horaPrincipal}
                      </span>
                    )}
                  </div>

                  <dl className="mt-3 grid gap-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-2">
                      <dt className="font-medium text-slate-500">Idade</dt>
                      <dd>{confirmacao.idadePrincipal || "-"}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4 border-t border-slate-100 pt-2">
                      <dt className="font-medium text-slate-500">Acompanhantes</dt>
                      <dd className="mt-1 text-left text-slate-700">
                        {acompanhantes.length > 0 ? (
                          <ol className="space-y-1 pl-4">
                            {acompanhantes.map((acompanhante, index) => (
                              <li key={`${confirmacao.id}-mobile-${index}`}>
                                <label className="flex cursor-pointer items-start gap-2">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(acompanhante.presente)}
                                    disabled={togglingKey === `${confirmacao.id}-${index}`}
                                    onChange={() => requestToggle(confirmacao, index)}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-pink-500 focus:ring-pink-300"
                                  />
                                  <span onClick={() => requestToggle(confirmacao, index)}>
                                    <span className="font-medium text-slate-700">{index + 1}.</span>{" "}
                                    {String(acompanhante.nome || "-").toUpperCase()}{" "}
                                    {acompanhante.idade ? `(${acompanhante.idade} anos)` : ""}
                                    {formatHora(acompanhante.presenteEm) && (
                                      <span className="ml-2 text-xs font-semibold text-emerald-600">
                                        {formatHora(acompanhante.presenteEm)}
                                      </span>
                                    )}
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

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                pending.novoPresente ? "bg-emerald-100" : "bg-rose-100"
              }`}
            >
              <span className={`text-2xl ${pending.novoPresente ? "text-emerald-600" : "text-rose-600"}`}>
                {pending.novoPresente ? "✓" : "✕"}
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-800">
              {pending.novoPresente ? "Confirmar chegada?" : "Remover confirmação?"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {pending.novoPresente ? "Deseja confirmar a chegada de" : "Deseja remover a confirmação de chegada de"}
              <br />
              <span className="font-semibold text-slate-800">{pending.nome}?</span>
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
              >
                Cancelar
              </button>
              {pending.novoPresente ? (
                <button
                  type="button"
                  onClick={handleConfirmToggle}
                  className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600"
                >
                  Sim
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmToggle}
                  className="flex-1 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-600"
                >
                  Sim
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
