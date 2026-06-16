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
		CREATE TABLE IF NOT EXISTS rsvp_confirmacoes (
			id TEXT PRIMARY KEY,
			data_envio TIMESTAMPTZ NOT NULL,
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
		dataEnvio: row.data_envio instanceof Date ? row.data_envio.toISOString() : new Date(row.data_envio).toISOString(),
		...payload,
	}
}

export async function listarConfirmacoes() {
	await withSchema()

	const activePool = ensurePool()
	const result = await activePool.query('SELECT id, data_envio, payload FROM rsvp_confirmacoes ORDER BY data_envio DESC')

	return result.rows.map(mapRow)
}

export async function salvarConfirmacao(confirmacao) {
	await withSchema()

	const activePool = ensurePool()
	const id = String(confirmacao?.id ?? randomUUID())
	const dataEnvio = confirmacao?.dataEnvio ?? new Date().toISOString()
	const payload = { ...confirmacao }

	delete payload.id
	delete payload.dataEnvio

	await activePool.query(
		'INSERT INTO rsvp_confirmacoes (id, data_envio, payload) VALUES ($1, $2, $3::jsonb) ON CONFLICT (id) DO UPDATE SET data_envio = EXCLUDED.data_envio, payload = EXCLUDED.payload',
		[id, dataEnvio, JSON.stringify(payload)]
	)

	return {
		id,
		dataEnvio,
		...payload,
	}
}