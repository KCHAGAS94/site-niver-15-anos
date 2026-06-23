'use client'

import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { AdminPagesHeader } from '@/components/admin-pages-header'

function formatDate(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date)
}

function formatCurrency(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '-'

  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

function getResultBadgeClass(resultado) {
  const value = String(resultado || '').toLowerCase()

  if (value === 'aprovado') return 'bg-emerald-100 text-emerald-700'
  if (value.includes('erro')) return 'bg-rose-100 text-rose-700'
  if (value.includes('pix')) return 'bg-sky-100 text-sky-700'

  return 'bg-amber-100 text-amber-700'
}

export default function RelpagClient({ eventos = [] }) {
  const [eventosState, setEventosState] = useState(eventos)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [desktopFilters, setDesktopFilters] = useState({
    nome: '',
    email: '',
    metodo: '',
    resultado: '',
    status: '',
    data: ''
  })

  const updateDesktopFilter = (field, value) => {
    setDesktopFilters((current) => ({
      ...current,
      [field]: value
    }))
  }

  const handleDelete = async (id) => {
    if (!id || deletingId) return

    const confirmed = window.confirm('Deseja excluir este registro do relatório?')
    if (!confirmed) return

    setDeletingId(id)

    try {
      const response = await fetch(`/api/payment/events/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível excluir o registro.')
      }

      setEventosState((current) => current.filter((evento) => evento.id !== id))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível excluir o registro.'
      window.alert(message)
    } finally {
      setDeletingId(null)
    }
  }

  const eventosFiltrados = useMemo(() => {
    const termo = search.trim().toLowerCase()
    const filtros = {
      nome: desktopFilters.nome.trim().toLowerCase(),
      email: desktopFilters.email.trim().toLowerCase(),
      metodo: desktopFilters.metodo.trim().toLowerCase(),
      resultado: desktopFilters.resultado.trim().toLowerCase(),
      status: desktopFilters.status.trim().toLowerCase(),
      data: desktopFilters.data.trim().toLowerCase()
    }

    return eventosState.filter((evento) => {
      const nome = String(evento.nome || '').toLowerCase()
      const email = String(evento.email || '').toLowerCase()
      const metodo = String(evento.metodo || '').toLowerCase()
      const resultado = String(evento.resultado || '').toLowerCase()
      const status = String(evento.status || '').toLowerCase()
      const erroMensagem = String(evento.erroMensagem || '').toLowerCase()
      const data = formatDate(evento.dataEvento).toLowerCase()

      const matchBusca = !termo || nome.includes(termo) || email.includes(termo) || erroMensagem.includes(termo)
      const matchNome = !filtros.nome || nome.includes(filtros.nome)
      const matchEmail = !filtros.email || email.includes(filtros.email)
      const matchMetodo = !filtros.metodo || metodo.includes(filtros.metodo)
      const matchResultado = !filtros.resultado || resultado.includes(filtros.resultado)
      const matchStatus = !filtros.status || status.includes(filtros.status)
      const matchData = !filtros.data || data.includes(filtros.data)

      return matchBusca && matchNome && matchEmail && matchMetodo && matchResultado && matchStatus && matchData
    })
  }, [desktopFilters, eventosState, search])

  const totais = useMemo(() => {
    return eventosState.reduce(
      (accumulator, evento) => {
        const metodo = String(evento.metodo || '').toLowerCase()
        const resultado = String(evento.resultado || '').toLowerCase()
        const status = String(evento.status || '').toLowerCase()
        const aprovado = resultado === 'aprovado' || status === 'approved' || status === 'paid'
        const aguardando = status === 'pending' || resultado === 'pix_gerado' || resultado === 'processado'

        if (metodo === 'pix' && aprovado) {
          accumulator.aprovadoPix += 1
        }

        if ((metodo === 'credit' || metodo === 'card') && aprovado) {
          accumulator.aprovadoCredito += 1
        }

        if (aguardando) {
          accumulator.aguardandoPagamento += 1
        }

        return accumulator
      },
      { aprovadoPix: 0, aprovadoCredito: 0, aguardandoPagamento: 0 }
    )
  }, [eventosState])

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-24 md:py-28">
      <div className="mx-auto w-full max-w-7xl">
        <AdminPagesHeader />

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-pink-500">Relatório de pagamentos</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-800 md:text-4xl">Controle de vendas</h1>
            </div>

            <div className="w-full md:max-w-sm">
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Buscar</label>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome, e-mail ou erro"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Aprovado PIX</div>
                <div className="mt-1 text-2xl font-bold text-emerald-700">{totais.aprovadoPix}</div>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-center">
                <div className="text-xs font-semibold uppercase tracking-wide text-sky-500">Aprovado Crédito</div>
                <div className="mt-1 text-2xl font-bold text-sky-700">{totais.aprovadoCredito}</div>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-center">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-500">Aguardando pagamento</div>
                <div className="mt-1 text-2xl font-bold text-amber-700">{totais.aguardandoPagamento}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Nome</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">E-mail</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Método</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Valor</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Resultado</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Erro</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Data</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Ação</th>
                </tr>
                <tr className="border-t border-slate-200 bg-white">
                  <th className="px-4 py-3">
                    <input
                      type="text"
                      value={desktopFilters.nome}
                      onChange={(event) => updateDesktopFilter('nome', event.target.value)}
                      placeholder="Filtrar nome"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100"
                    />
                  </th>
                  <th className="px-4 py-3">
                    <input
                      type="text"
                      value={desktopFilters.email}
                      onChange={(event) => updateDesktopFilter('email', event.target.value)}
                      placeholder="Filtrar e-mail"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100"
                    />
                  </th>
                  <th className="px-4 py-3">
                    <input
                      type="text"
                      value={desktopFilters.metodo}
                      onChange={(event) => updateDesktopFilter('metodo', event.target.value)}
                      placeholder="Filtrar método"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100"
                    />
                  </th>
                  <th className="px-4 py-3" />
                  <th className="px-4 py-3">
                    <input
                      type="text"
                      value={desktopFilters.resultado}
                      onChange={(event) => updateDesktopFilter('resultado', event.target.value)}
                      placeholder="Filtrar resultado"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100"
                    />
                  </th>
                  <th className="px-4 py-3">
                    <input
                      type="text"
                      value={desktopFilters.status}
                      onChange={(event) => updateDesktopFilter('status', event.target.value)}
                      placeholder="Filtrar status"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100"
                    />
                  </th>
                  <th className="px-4 py-3" />
                  <th className="px-4 py-3">
                    <input
                      type="text"
                      value={desktopFilters.data}
                      onChange={(event) => updateDesktopFilter('data', event.target.value)}
                      placeholder="Filtrar data"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100"
                    />
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {eventosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-slate-500">
                      {search.trim() ? 'Nenhum registro encontrado.' : 'Nenhum evento de pagamento registrado ainda.'}
                    </td>
                  </tr>
                ) : (
                  eventosFiltrados.map((evento) => (
                    <tr key={evento.id} className="align-top hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{evento.nome || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{evento.email || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">{evento.metodo || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">{formatCurrency(evento.valor)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getResultBadgeClass(evento.resultado)}`}>
                          {evento.resultado || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{evento.status || '-'}</td>
                      <td className="max-w-xs px-6 py-4 text-slate-600">{evento.erroMensagem || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(evento.dataEvento)}</td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleDelete(evento.id)}
                          disabled={deletingId === evento.id}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label="Excluir registro"
                          title="Excluir registro"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4 md:hidden">
          {eventosFiltrados.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
              {search.trim() ? 'Nenhum registro encontrado.' : 'Nenhum evento de pagamento registrado ainda.'}
            </div>
          ) : (
            eventosFiltrados.map((evento) => (
              <article key={evento.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{evento.nome || '-'}</h2>
                    <p className="mt-1 text-sm text-slate-500">{evento.email || '-'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getResultBadgeClass(evento.resultado)}`}>
                      {evento.resultado || '-'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(evento.id)}
                      disabled={deletingId === evento.id}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Excluir registro"
                      title="Excluir registro"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
                    <dt className="font-medium text-slate-500">Método</dt>
                    <dd>{evento.metodo || '-'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
                    <dt className="font-medium text-slate-500">Valor</dt>
                    <dd>{formatCurrency(evento.valor)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
                    <dt className="font-medium text-slate-500">Status</dt>
                    <dd>{evento.status || '-'}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4 border-t border-slate-100 pt-3">
                    <dt className="font-medium text-slate-500">Erro</dt>
                    <dd className="max-w-[70%] text-right">{evento.erroMensagem || '-'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
                    <dt className="font-medium text-slate-500">Data</dt>
                    <dd>{formatDate(evento.dataEvento)}</dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
