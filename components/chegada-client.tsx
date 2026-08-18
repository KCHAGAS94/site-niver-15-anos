"use client"

import { useMemo, useState } from "react"
import { AdminPagesHeader } from "@/components/admin-pages-header"
import { AdminGate } from "@/components/admin-gate"

type HistoricoEvento = {
  tipo: "confirmado" | "removido"
  horario: string
}

type Acompanhante = {
  nome?: string
  historico?: HistoricoEvento[]
}

type Confirmacao = {
  id: string
  nomePrincipal?: string
  confirmaPresenca?: string
  historico?: HistoricoEvento[]
  acompanhantes?: Acompanhante[]
}

type EventoRelatorio = {
  key: string
  nome: string
  tipo: "confirmado" | "removido"
  horario: string
}

function formatHora(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(date)
}

function montarEventos(confirmacoes: Confirmacao[]): EventoRelatorio[] {
  const eventos: EventoRelatorio[] = []

  confirmacoes.forEach((confirmacao) => {
    if (confirmacao.confirmaPresenca !== "Sim") return

    const nomePrincipal = confirmacao.nomePrincipal || "-"
    ;(confirmacao.historico || []).forEach((evento, index) => {
      eventos.push({
        key: `${confirmacao.id}-principal-${index}`,
        nome: nomePrincipal,
        tipo: evento.tipo,
        horario: evento.horario,
      })
    })

    const acompanhantes = Array.isArray(confirmacao.acompanhantes) ? confirmacao.acompanhantes : []
    acompanhantes.forEach((acompanhante, acIndex) => {
      ;(acompanhante.historico || []).forEach((evento, index) => {
        eventos.push({
          key: `${confirmacao.id}-ac${acIndex}-${index}`,
          nome: acompanhante.nome || "-",
          tipo: evento.tipo,
          horario: evento.horario,
        })
      })
    })
  })

  return eventos.sort((a, b) => new Date(b.horario).getTime() - new Date(a.horario).getTime())
}

export function ChegadaClient({ confirmacoes = [] }: { confirmacoes: Confirmacao[] }) {
  const [search, setSearch] = useState("")

  const eventos = useMemo(() => montarEventos(confirmacoes), [confirmacoes])

  const eventosFiltrados = useMemo(() => {
    const termo = search.trim().toLowerCase()
    if (!termo) return eventos

    return eventos.filter((evento) => evento.nome.toLowerCase().includes(termo))
  }, [eventos, search])

  const totalConfirmados = useMemo(() => {
    const cronologico = [...eventos].sort((a, b) => new Date(a.horario).getTime() - new Date(b.horario).getTime())
    const presentes = new Set<string>()

    cronologico.forEach((evento) => {
      if (evento.tipo === "confirmado") presentes.add(evento.nome)
      else presentes.delete(evento.nome)
    })

    return presentes.size
  }, [eventos])

  return (
    <AdminGate>
    <main className="min-h-screen bg-slate-50 px-4 py-24 md:py-28">
      <div className="mx-auto w-full max-w-4xl">
        <AdminPagesHeader />

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-pink-500">Relatório</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-800 md:text-4xl">Chegada dos convidados</h1>
            </div>

            <div className="rounded-2xl border border-pink-100 bg-pink-50 px-4 py-3 text-center">
              <div className="text-xs font-semibold uppercase tracking-wide text-pink-500">Presentes agora</div>
              <div className="mt-1 text-2xl font-bold text-pink-700">{totalConfirmados}</div>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Buscar nome</label>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Digite um nome"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100 md:max-w-sm"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Nome</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Evento</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Horário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {eventosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-slate-500">
                      {search.trim() ? "Nenhum registro encontrado." : "Nenhuma movimentação registrada ainda."}
                    </td>
                  </tr>
                ) : (
                  eventosFiltrados.map((evento) => (
                    <tr key={evento.key} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4 font-semibold text-slate-800">{evento.nome}</td>
                      <td className="px-6 py-4">
                        {evento.tipo === "confirmado" ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                            Confirmou chegada
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                            Removeu confirmação
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatHora(evento.horario)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
    </AdminGate>
  )
}
