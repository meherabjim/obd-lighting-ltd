import mysql from 'mysql2/promise';
import { config } from '../config.js';

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',

  // TiDB Serverless requires TLS; a local MySQL/MariaDB usually has none at
  // all, and asking for it there makes the connection fail. So it follows the
  // host: any TiDB Cloud address (or DB_SSL=true) gets a verified TLS
  // connection, anything else connects plain.
  ...(config.db.ssl ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {}),

  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,

  decimalNumbers: true,
});


/** Run a query, get the rows. */
export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}


/** Run a query, get the first row or null. */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length ? rows[0] : null;
}


/** Run an INSERT/UPDATE/DELETE, get the result metadata. */
export async function execute(sql, params = []) {
  const [result] = await pool.query(sql, params);
  return result;
}


/**
 * Run several statements as one unit.
 */
export async function withTransaction(callback) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;

  } catch (err) {
    await conn.rollback();
    throw err;

  } finally {
    conn.release();
  }
}


export async function assertDbConnection() {
  const conn = await pool.getConnection();

  try {
    await conn.ping();

  } finally {
    conn.release();
  }
}