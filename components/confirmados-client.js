'use client'

import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
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

function getAge(value) {
	const age = Number.parseInt(String(value ?? ''), 10)
	return Number.isFinite(age) ? age : null
}

export default function ConfirmadosClient({ confirmacoes = [] }) {
	const [search, setSearch] = useState('')
	const [data, setData] = useState(confirmacoes)
	const [editingId, setEditingId] = useState(null)
	const [editingData, setEditingData] = useState(null)
	const [desktopFilters, setDesktopFilters] = useState({
		nome: '',
		telefone: '',
		idade: '',
		acompanhantes: '',
		presenca: '',
		data: ''
	})

	const updateDesktopFilter = (field, value) => {
		setDesktopFilters((current) => ({
			...current,
			[field]: value
		}))
	}

	const handleDeleteConfirmacao = async (id) => {
		if (!confirm('Tem certeza que deseja deletar esta confirmação?')) return

		try {
			const response = await fetch(`/api/rsvp?id=${id}`, {
				method: 'DELETE'
			})

			if (response.ok) {
				setData((current) => current.filter((item) => item.id !== id))
				alert('Confirmação deletada com sucesso!')
			} else {
				alert('Erro ao deletar a confirmação')
			}
		} catch (error) {
			console.error('Erro ao deletar:', error)
			alert('Erro ao deletar a confirmação')
		}
	}

	const handleEditConfirmacao = (confirmacao) => {
		setEditingId(confirmacao.id)
		setEditingData({ ...confirmacao })
	}

	const handleSaveEdit = async () => {
		if (!editingData) return

		try {
			const response = await fetch('/api/rsvp', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editingData)
			})

			if (response.ok) {
				setData((current) =>
					current.map((item) => (item.id === editingId ? editingData : item))
				)
				setEditingId(null)
				setEditingData(null)
				alert('Confirmação atualizada com sucesso!')
			} else {
				alert('Erro ao atualizar a confirmação')
			}
		} catch (error) {
			console.error('Erro ao atualizar:', error)
			alert('Erro ao atualizar a confirmação')
		}
	}

	const confirmacoesFiltradas = useMemo(() => {
		const termo = search.trim().toLowerCase()
		const filtros = {
			nome: desktopFilters.nome.trim().toLowerCase(),
			telefone: desktopFilters.telefone.trim().toLowerCase(),
			idade: desktopFilters.idade.trim().toLowerCase(),
			acompanhantes: desktopFilters.acompanhantes.trim().toLowerCase(),
			presenca: desktopFilters.presenca.trim().toLowerCase(),
			data: desktopFilters.data.trim().toLowerCase()
		}

		return data.filter((confirmacao) => {
			const nomePrincipal = String(confirmacao.nomePrincipal || '').toLowerCase()
			const telefone = String(confirmacao.telefone || '').toLowerCase()
			const idadePrincipal = String(confirmacao.idadePrincipal || '').toLowerCase()
			const presenca = String(confirmacao.confirmaPresenca || '').toLowerCase()
			const dataStr = formatDate(confirmacao.dataEnvio).toLowerCase()
			const acompanhantes = Array.isArray(confirmacao.acompanhantes) ? confirmacao.acompanhantes : []
			const acompanhantesTexto = acompanhantes
				.map((acompanhante) => `${acompanhante.nome || ''} ${acompanhante.idade || ''}`.trim().toLowerCase())
				.join(' ')

			const matchBuscaGeral = !termo || nomePrincipal.includes(termo) || acompanhantes.some((acompanhante) => String(acompanhante.nome || '').toLowerCase().includes(termo))

			const matchNome = !filtros.nome || nomePrincipal.includes(filtros.nome)
			const matchTelefone = !filtros.telefone || telefone.includes(filtros.telefone)
			const matchIdade = !filtros.idade || idadePrincipal.includes(filtros.idade)
			const matchAcompanhantes = !filtros.acompanhantes || acompanhantesTexto.includes(filtros.acompanhantes)
			const matchPresenca = !filtros.presenca || presenca.includes(filtros.presenca)
			const matchData = !filtros.data || dataStr.includes(filtros.data)

			return matchBuscaGeral && matchNome && matchTelefone && matchIdade && matchAcompanhantes && matchPresenca && matchData
		})
	}, [data, desktopFilters, search])

	const totais = useMemo(() => {
		return data.reduce(
			(accumulator, confirmacao) => {
				const principalAge = getAge(confirmacao.idadePrincipal)
				if (principalAge !== null) {
					if (principalAge > 13) accumulator.adultos += 1
					else accumulator.criancas += 1
				}

				const acompanhantes = Array.isArray(confirmacao.acompanhantes) ? confirmacao.acompanhantes : []
				acompanhantes.forEach((acompanhante) => {
					const acompanhanteAge = getAge(acompanhante.idade)
					if (acompanhanteAge !== null) {
						if (acompanhanteAge > 13) accumulator.adultos += 1
						else accumulator.criancas += 1
					}
				})

				return accumulator
			},
			{ adultos: 0, criancas: 0 }
		)
	}, [data])

	const handleExportExcel = () => {
		const rows = confirmacoesFiltradas.map((confirmacao) => {
			const acompanhantes = Array.isArray(confirmacao.acompanhantes) ? confirmacao.acompanhantes : []

			return {
				Nome: confirmacao.nomePrincipal || '-',
				Telefone: confirmacao.telefone || '-',
				Idade: confirmacao.idadePrincipal || '-',
				Acompanhantes: acompanhantes.length
					? acompanhantes
						.map((acompanhante, index) => `${index + 1}. ${acompanhante.nome || '-'}${acompanhante.idade ? ` (${acompanhante.idade} anos)` : ''}`)
						.join(' | ')
					: '-',
				Presença: confirmacao.confirmaPresenca || '-',
				Data: formatDate(confirmacao.dataEnvio)
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(rows)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Convidados')
		XLSX.writeFile(workbook, 'lista-de-convidados.xlsx')
	}

	return (
		<main className="min-h-screen bg-slate-50 px-4 py-24 md:py-28">
			<div className="mx-auto w-full max-w-7xl">
				<AdminPagesHeader />

				<div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
					<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
						<div>
							<p className="text-xs font-bold uppercase tracking-[0.24em] text-pink-500">Confirmados</p>
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

						<div className="md:self-end">
							<button
								type="button"
								onClick={handleExportExcel}
								className="w-full rounded-2xl border border-pink-200 bg-pink-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-pink-600 md:w-auto"
							>
								Baixar Excel
							</button>
						</div>

						<div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
							<div className="rounded-2xl border border-pink-100 bg-pink-50 px-4 py-3 text-center">
								<div className="text-xs font-semibold uppercase tracking-wide text-pink-500">Adultos</div>
								<div className="mt-1 text-2xl font-bold text-pink-700">{totais.adultos}</div>
							</div>
							<div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-center">
								<div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Crianças</div>
								<div className="mt-1 text-2xl font-bold text-slate-700">{totais.criancas}</div>
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
									<th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Telefone</th>
									<th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Idade</th>
									<th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Acompanhantes</th>
									<th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Presença</th>
									<th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Data</th>
									<th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Ações</th>
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
											value={desktopFilters.telefone}
											onChange={(event) => updateDesktopFilter('telefone', event.target.value)}
											placeholder="Filtrar telefone"
											className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100"
										/>
									</th>
									<th className="px-4 py-3">
										<input
											type="text"
											value={desktopFilters.idade}
											onChange={(event) => updateDesktopFilter('idade', event.target.value)}
											placeholder="Filtrar idade"
											className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100"
										/>
									</th>
									<th className="px-4 py-3">
										<input
											type="text"
											value={desktopFilters.acompanhantes}
											onChange={(event) => updateDesktopFilter('acompanhantes', event.target.value)}
											placeholder="Filtrar acompanhante"
											className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100"
										/>
									</th>
									<th className="px-4 py-3">
										<input
											type="text"
											value={desktopFilters.presenca}
											onChange={(event) => updateDesktopFilter('presenca', event.target.value)}
											placeholder="Filtrar presença"
											className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100"
										/>
									</th>
									<th className="px-4 py-3">
										<input
											type="text"
											value={desktopFilters.data}
											onChange={(event) => updateDesktopFilter('data', event.target.value)}
											placeholder="Filtrar data"
											className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-2 focus:ring-pink-100"
										/>
									</th>
									<th className="px-4 py-3"></th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 bg-white">
								{confirmacoesFiltradas.length === 0 ? (
									<tr>
										<td colSpan={7} className="px-6 py-10 text-center text-slate-500">
											{search.trim() ? 'Nenhum nome encontrado.' : 'Nenhuma confirmação registrada ainda.'}
										</td>
									</tr>
								) : (
									confirmacoesFiltradas.map((confirmacao) => {
										const acompanhantes = Array.isArray(confirmacao.acompanhantes) ? confirmacao.acompanhantes : []

										return (
											<tr key={confirmacao.id} className="align-top hover:bg-slate-50/80">
												<td className="px-6 py-4">
													<div className="font-semibold text-slate-800">{confirmacao.nomePrincipal || '-'}</div>
												</td>
												<td className="px-6 py-4 text-slate-600">{confirmacao.telefone || '-'}</td>
												<td className="px-6 py-4 text-slate-600">{confirmacao.idadePrincipal || '-'}</td>
												<td className="px-6 py-4 text-slate-600">
													{acompanhantes.length > 0 ? (
														<ul className="space-y-1">
															{acompanhantes.map((acompanhante, index) => (
																<li key={`${confirmacao.id}-ac-${index}`}>
																	{index + 1}. {acompanhante.nome || '-'} {acompanhante.idade ? `(${acompanhante.idade} anos)` : ''}
																</li>
															))}
														</ul>
													) : (
														'-'
													)}
												</td>
												<td className="px-6 py-4">
													<span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${confirmacao.confirmaPresenca === 'Sim' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
														{confirmacao.confirmaPresenca || '-'}
													</span>
												</td>
												<td className="px-6 py-4 text-slate-600">{formatDate(confirmacao.dataEnvio)}</td>
												<td className="px-6 py-4">
													<div className="flex gap-2">
														<button
															onClick={() => handleEditConfirmacao(confirmacao)}
															className="rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200 transition"
															title="Editar"
														>
															<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
																<path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
															</svg>
														</button>
														<button
															onClick={() => handleDeleteConfirmacao(confirmacao.id)}
															className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200 transition"
															title="Deletar"
														>
															<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
																<path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
															</svg>
														</button>
													</div>
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
					{confirmacoesFiltradas.length === 0 ? (
						<div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
							{search.trim() ? 'Nenhum nome encontrado.' : 'Nenhuma confirmação registrada ainda.'}
						</div>
					) : (
						confirmacoesFiltradas.map((confirmacao) => {
							const acompanhantes = Array.isArray(confirmacao.acompanhantes) ? confirmacao.acompanhantes : []

							return (
								<article key={confirmacao.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
									<div className="flex items-start justify-between gap-4">
										<div>
											<h2 className="text-lg font-bold text-slate-800">{confirmacao.nomePrincipal || '-'}</h2>
											<p className="mt-1 text-sm text-slate-500">{confirmacao.telefone || '-'}</p>
										</div>
										<span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${confirmacao.confirmaPresenca === 'Sim' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
											{confirmacao.confirmaPresenca || '-'}
										</span>
									</div>

									<dl className="mt-4 grid gap-3 text-sm text-slate-600">
										<div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
											<dt className="font-medium text-slate-500">Idade</dt>
											<dd>{confirmacao.idadePrincipal || '-'}</dd>
										</div>
										<div className="flex items-start justify-between gap-4 border-t border-slate-100 pt-3">
											<dt className="font-medium text-slate-500">Acompanhantes</dt>
											<dd className="mt-2 text-left text-slate-700">
												{acompanhantes.length > 0 ? (
													<ol className="space-y-1 pl-4">
														{acompanhantes.map((acompanhante, index) => (
															<li key={`${confirmacao.id}-mobile-${index}`}>
																<span className="font-medium text-slate-700">{index + 1}.</span>{' '}
																{String(acompanhante.nome || '-').toUpperCase()}{' '}
																{acompanhante.idade ? `(${acompanhante.idade} anos)` : ''}
															</li>
														))}
													</ol>
												) : (
													<p className="text-slate-400">-</p>
												)}
											</dd>
										</div>
										<div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
											<dt className="font-medium text-slate-500">Data</dt>
											<dd>{formatDate(confirmacao.dataEnvio)}</dd>
										</div>
										<div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
											<dt className="font-medium text-slate-500">Ações</dt>
											<dd className="flex gap-2">
												<button
													onClick={() => handleEditConfirmacao(confirmacao)}
													className="rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200 transition"
													title="Editar"
												>
													<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
														<path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
													</svg>
												</button>
												<button
													onClick={() => handleDeleteConfirmacao(confirmacao.id)}
													className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200 transition"
													title="Deletar"
												>
													<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
														<path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
													</svg>
												</button>
											</dd>
										</div>
									</dl>
								</article>
							)
						})
					)}
				</div>
			</div>

			{editingId && editingData && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
						<div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
							<h2 className="text-xl font-bold text-slate-800">Editar Confirmação</h2>
							<button
								onClick={() => {
									setEditingId(null)
									setEditingData(null)
								}}
								className="text-slate-400 hover:text-slate-600"
							>
								✕
							</button>
						</div>
						
						<div className="p-6 space-y-4">
							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1">Nome Principal</label>
								<input
									type="text"
									value={editingData.nomePrincipal || ''}
									onChange={(e) => setEditingData({ ...editingData, nomePrincipal: e.target.value })}
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
								<input
									type="text"
									value={editingData.telefone || ''}
									onChange={(e) => setEditingData({ ...editingData, telefone: e.target.value })}
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1">Idade</label>
								<input
									type="number"
									value={editingData.idadePrincipal || ''}
									onChange={(e) => setEditingData({ ...editingData, idadePrincipal: e.target.value })}
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1">Presença</label>
								<select
									value={editingData.confirmaPresenca || ''}
									onChange={(e) => setEditingData({ ...editingData, confirmaPresenca: e.target.value })}
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none"
								>
									<option value="">Selecione</option>
									<option value="Sim">Sim</option>
									<option value="Não">Não</option>
								</select>
							</div>

							<div className="flex gap-3 pt-4">
								<button
									onClick={handleSaveEdit}
									className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg transition"
								>
									Salvar
								</button>
								<button
									onClick={() => {
										setEditingId(null)
										setEditingData(null)
									}}
									className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg transition"
								>
									Cancelar
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</main>
	)
}