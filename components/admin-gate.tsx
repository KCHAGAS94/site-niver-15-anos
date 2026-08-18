'use client'

import { useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'admin-painel-autenticado'

export function AdminGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setUnlocked(localStorage.getItem(STORAGE_KEY) === 'true')
    setChecking(false)
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Senha incorreta')
        return
      }

      localStorage.setItem(STORAGE_KEY, 'true')
      setUnlocked(true)
    } catch {
      setError('Não foi possível verificar a senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return null
  }

  if (!unlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
        >
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-pink-500">Painel</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-800">Acesso restrito</h1>
          <p className="mt-2 text-sm text-slate-600">Digite a senha para acessar esta página.</p>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha"
            autoFocus
            className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-pink-400"
          />

          {error && <p className="mt-2 text-sm font-medium text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password}
            className="mt-4 w-full rounded-xl bg-pink-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-pink-600 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </main>
    )
  }

  return <>{children}</>
}
