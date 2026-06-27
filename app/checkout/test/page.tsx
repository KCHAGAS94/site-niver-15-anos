"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import type { CSSProperties } from "react"

export default function CheckoutModalTestPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogState, setDialogState] = useState<'approved' | 'processing' | 'error'>('approved')

  const openDialog = (state: 'approved' | 'processing' | 'error') => {
    setDialogState(state)
    setDialogOpen(true)
  }

  const title = dialogState === 'approved'
    ? 'Pagamento aprovado'
    : dialogState === 'processing'
      ? 'Processando pagamento'
      : 'Erro no pagamento'

  const description = dialogState === 'approved'
    ? 'O pagamento foi aprovado com sucesso.'
    : dialogState === 'processing'
      ? 'Aguarde enquanto confirmamos o pagamento com o banco. Este modal permanecerá aberto até que a transação seja processada.'
      : 'Ocorreu um problema ao processar o pagamento. Verifique os dados e tente novamente.'

  const badge = dialogState === 'approved' ? '✓' : dialogState === 'processing' ? '⏳' : '✕'
  const badgeBg = dialogState === 'approved' ? '#dcfce7' : dialogState === 'processing' ? '#eff6ff' : '#fee2e2'
  const badgeBorder = dialogState === 'approved' ? '2px solid #22c55e' : dialogState === 'processing' ? '2px solid #3b82f6' : '2px solid #ef4444'
  const badgeColor = dialogState === 'approved' ? '#16a34a' : dialogState === 'processing' ? '#1d4ed8' : '#b91c1c'
  const statusLabel = dialogState === 'approved' ? 'Aprovado' : dialogState === 'processing' ? 'Em processamento' : 'Pagamento não aprovado'
  const statusColor = dialogState === 'approved' ? '#166534' : dialogState === 'processing' ? '#1d4ed8' : '#991b1b'
  const messageText = dialogState === 'approved'
    ? 'Pagamento aprovado com sucesso!'
    : dialogState === 'processing'
      ? 'Aguarde a confirmação do banco. O modal será fechado manualmente quando a operação terminar.'
      : 'Ocorreu um erro ao processar o pagamento de teste.'

  return (
    <>
      <Navigation />
      <div style={{ display: 'flex', justifyContent: 'center', padding: 36, paddingTop: 120 }}>
        <div style={{ width: '100%', maxWidth: 820 }}>
          <h2 style={{ textAlign: 'center', color: 'var(--color-primary)', marginBottom: 18 }}>Página de teste de modal</h2>
          <div style={{ background: 'var(--color-card)', padding: 24, borderRadius: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.06)', display: 'grid', gap: 20 }}>
            <p style={{ margin: 0, color: 'var(--color-foreground)' }}>
              Esta página abre o modal de resultado sem precisar passar o cartão. Use os botões abaixo para testar os estados de aprovação, processamento e erro.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => openDialog('approved')} style={buttonStyle(true)}>
                Abrir modal aprovado
              </button>
              <button type="button" onClick={() => openDialog('processing')} style={buttonStyle(false)}>
                Abrir modal em processamento
              </button>
              <button type="button" onClick={() => openDialog('error')} style={secondaryButtonStyle()}>
                Abrir modal de erro
              </button>
            </div>
            <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-background)' }}>
              <strong style={{ display: 'block', marginBottom: 8 }}>Dica:</strong>
              <span style={{ color: 'var(--color-muted-foreground)' }}>
                Você pode abrir o modal quantas vezes quiser. No estado de "processando", ele mantém o botão de fechar desabilitado para simular o processamento.
              </span>
            </div>
          </div>
        </div>
      </div>

      {dialogOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(0,0,0,0.45)',
          padding: 24,
          zIndex: 9999
        }}>
          <div style={{
            width: '100%',
            maxWidth: 560,
            borderRadius: 24,
            padding: 24,
            background: 'white',
            boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
            display: 'grid',
            gap: 24,
            textAlign: 'center'
          }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-foreground)' }}>{title}</h3>
              <p style={{ margin: 0, color: 'var(--color-muted-foreground)', lineHeight: 1.6 }}>{description}</p>
            </div>

            <div style={{ display: 'grid', gap: 18, textAlign: 'center', alignItems: 'center' }}>
              <div style={{ display: 'grid', placeItems: 'center', gap: 12 }}>
                <div style={{
                  width: 92,
                  height: 92,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background: badgeBg,
                  border: badgeBorder,
                  margin: '0 auto'
                }}>
                  <span style={{ fontSize: 42, color: badgeColor }}>{badge}</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: statusColor }}>{statusLabel}</div>
              </div>

              <div style={{ fontSize: 14, color: 'var(--color-foreground)', lineHeight: 1.6 }}>
                {messageText}
              </div>
            </div>

            {dialogState !== 'processing' && (
              <button type="button" onClick={() => setDialogOpen(false)} style={buttonStyle(true)}>
                Fechar
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function buttonStyle(primary = false): CSSProperties {
  return {
    padding: '12px 24px',
    borderRadius: 8,
    border: 'none',
    background: primary ? 'var(--color-primary)' : 'var(--color-background)',
    color: primary ? 'white' : 'var(--color-foreground)',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 14,
    minWidth: 170
  }
}

function secondaryButtonStyle(): CSSProperties {
  return {
    padding: '12px 24px',
    borderRadius: 8,
    border: '1px solid var(--color-border)',
    background: 'var(--color-card)',
    color: 'var(--color-foreground)',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 14,
    minWidth: 170
  }
}
