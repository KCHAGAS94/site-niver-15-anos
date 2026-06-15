'use client'

import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'

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

		return confirmacoes.filter((confirmacao) => {
			const nomePrincipal = String(confirmacao.nomePrincipal || '').toLowerCase()
			const telefone = String(confirmacao.telefone || '').toLowerCase()
			const idadePrincipal = String(confirmacao.idadePrincipal || '').toLowerCase()
			const presenca = String(confirmacao.confirmaPresenca || '').toLowerCase()
			const data = formatDate(confirmacao.dataEnvio).toLowerCase()
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
			const matchData = !filtros.data || data.includes(filtros.data)

			return matchBuscaGeral && matchNome && matchTelefone && matchIdade && matchAcompanhantes && matchPresenca && matchData
		})
	}, [confirmacoes, desktopFilters, search])

	const totais = useMemo(() => {
		return confirmacoes.reduce(
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
	}, [confirmacoes])

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
		<main className="min-h-screen bg-slate-50 px-4 py-10 md:py-16">
			<div className="mx-auto w-full max-w-7xl">
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
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 bg-white">
								{confirmacoesFiltradas.length === 0 ? (
									<tr>
										<td colSpan={6} className="px-6 py-10 text-center text-slate-500">
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
											<dd className="text-right">
												{acompanhantes.length > 0 ? (
													<ul className="space-y-1">
														{acompanhantes.map((acompanhante, index) => (
															<li key={`${confirmacao.id}-mobile-${index}`}>
																{acompanhante.nome || '-'} {acompanhante.idade ? `(${acompanhante.idade} anos)` : ''}
															</li>
														))}
													</ul>
												) : (
													'-'
												)}
											</dd>
										</div>
										<div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
											<dt className="font-medium text-slate-500">Data</dt>
											<dd>{formatDate(confirmacao.dataEnvio)}</dd>
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