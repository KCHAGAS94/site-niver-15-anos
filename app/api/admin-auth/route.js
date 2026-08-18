import { NextResponse } from 'next/server'
import { verificarOuDefinirSenha } from '@/lib/admin-auth-db'

export async function POST(request) {
	try {
		const { password } = await request.json()

		const resultado = await verificarOuDefinirSenha(password)

		if (!resultado.success) {
			return NextResponse.json({ success: false, error: 'Senha incorreta' }, { status: 401 })
		}

		return NextResponse.json(resultado)
	} catch (error) {
		console.error('Erro ao verificar senha do painel:', error)
		const message = error instanceof Error ? error.message : 'Erro interno.'

		return NextResponse.json({ success: false, error: message }, { status: 500 })
	}
}
