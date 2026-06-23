import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }

  const fileContent = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of fileContent.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    if (!key || process.env[key]) {
      continue
    }

    let value = line.slice(separatorIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}

const projectRoot = process.cwd()
loadEnvFile(path.join(projectRoot, '.env.local'))
loadEnvFile(path.join(projectRoot, '.env'))

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? ''
const sslEnabled = process.env.POSTGRES_SSL === 'true'

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
    })
  : null

let schemaPromise = null

function ensurePool() {
  if (!pool) {
    throw new Error('DATABASE_URL ou POSTGRES_URL não configurado')
  }

  return pool
}

async function ensureSchema() {
  const activePool = ensurePool()

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS payment_eventos (
      id TEXT PRIMARY KEY,
      data_evento TIMESTAMPTZ NOT NULL,
      payload JSONB NOT NULL
    )
  `)
}

async function withSchema() {
  if (!schemaPromise) {
    schemaPromise = ensureSchema()
  }

  await schemaPromise
}

function mapRow(row) {
  const payload = row.payload && typeof row.payload === 'object' ? row.payload : {}

  return {
    id: row.id,
    dataEvento: row.data_evento instanceof Date ? row.data_evento.toISOString() : new Date(row.data_evento).toISOString(),
    ...payload,
  }
}

export async function listarEventosPagamento() {
  await withSchema()

  const activePool = ensurePool()
  const result = await activePool.query('SELECT id, data_evento, payload FROM payment_eventos ORDER BY data_evento DESC')

  return result.rows.map(mapRow)
}

export async function registrarEventoPagamento(evento) {
  await withSchema()

  const activePool = ensurePool()
  const id = String(evento?.id ?? randomUUID())
  const dataEvento = evento?.dataEvento ?? new Date().toISOString()
  const payload = { ...evento }

  delete payload.id
  delete payload.dataEvento

  await activePool.query(
    'INSERT INTO payment_eventos (id, data_evento, payload) VALUES ($1, $2, $3::jsonb) ON CONFLICT (id) DO UPDATE SET data_evento = EXCLUDED.data_evento, payload = EXCLUDED.payload',
    [id, dataEvento, JSON.stringify(payload)]
  )

  return {
    id,
    dataEvento,
    ...payload,
  }
}