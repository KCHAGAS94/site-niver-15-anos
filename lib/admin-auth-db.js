import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
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
		CREATE TABLE IF NOT EXISTS admin_auth (
			id TEXT PRIMARY KEY,
			password_hash TEXT NOT NULL,
			salt TEXT NOT NULL,
			criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
		)
	`)
}

async function withSchema() {
	if (!schemaPromise) {
		schemaPromise = ensureSchema()
	}

	await schemaPromise
}

function hashPassword(password, salt) {
	return crypto.scryptSync(password, salt, 64).toString('hex')
}

export async function verificarOuDefinirSenha(password) {
	if (!password || typeof password !== 'string' || password.length < 4) {
		throw new Error('Senha deve ter ao menos 4 caracteres')
	}

	await withSchema()
	const activePool = ensurePool()

	const { rows } = await activePool.query(
		'SELECT password_hash, salt FROM admin_auth WHERE id = $1',
		['painel']
	)

	if (rows.length === 0) {
		const salt = crypto.randomBytes(16).toString('hex')
		const hash = hashPassword(password, salt)

		await activePool.query(
			'INSERT INTO admin_auth (id, password_hash, salt) VALUES ($1, $2, $3)',
			['painel', hash, salt]
		)

		return { success: true, created: true }
	}

	const { password_hash: storedHash, salt } = rows[0]
	const hash = hashPassword(password, salt)

	const valid = crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'))

	if (!valid) {
		return { success: false, created: false }
	}

	return { success: true, created: false }
}
