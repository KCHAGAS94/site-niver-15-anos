Configuração de Pagamento (Mercado Pago)

- Variáveis de ambiente (crie um arquivo `.env.local` na raiz do projeto):

  NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=SEU_PUBLIC_KEY_AQUI
  MP_ACCESS_TOKEN=SEU_ACCESS_TOKEN_AQUI

- Instalar dependências:

```
pnpm install
```

- Fluxo implementado:
  - Ao clicar em finalizar na UI, abre-se a página de checkout em `/checkout`.
  - Opção `pix`: o servidor cria um pagamento PIX via API do Mercado Pago e devolve o QR code (base64). O cliente mostra a imagem do QR.
  - Opção `card`: o cliente tenta tokenizar o cartão usando o SDK JS do Mercado Pago e envia o token ao endpoint `/api/payment`.

- Observações importantes:
  - Para reduzir o escopo de PCI, recomenda-se sempre tokenizar o cartão no cliente usando o SDK do Mercado Pago antes de enviar qualquer dado ao servidor.
  - Nunca deixe suas chaves privadas (`MP_ACCESS_TOKEN`) em front-end ou repositório público.
  - Teste inicialmente com as credenciais de sandbox do Mercado Pago.
