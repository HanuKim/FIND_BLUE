/**
 * Snowflake Centralized Connection Module
 * 
 * 모든 API Route에서 이 모듈을 import하여 쿼리를 실행합니다.
 * Connection은 싱글턴으로 관리되어 매 요청마다 새로 생성하지 않습니다.
 * 
 * 사용법:
 *   import { query } from '@/lib/snowflake';
 *   const rows = await query('SELECT * FROM MY_TABLE LIMIT 10');
 */

import snowflake from 'snowflake-sdk';

// ── Types ──
export interface SnowflakeRow {
  [key: string]: unknown;
}

// ── Singleton Connection ──
let connection: snowflake.Connection | null = null;
let isConnected = false;

function getConnection(): snowflake.Connection {
  if (!connection) {
    const account = process.env.SNOWFLAKE_ACCOUNT;
    const username = process.env.SNOWFLAKE_USERNAME;
    const password = process.env.SNOWFLAKE_PASSWORD;

    if (!account || !username || !password) {
      throw new Error(
        'Missing Snowflake credentials. Set SNOWFLAKE_ACCOUNT, SNOWFLAKE_USERNAME, SNOWFLAKE_PASSWORD in .env.local'
      );
    }

    connection = snowflake.createConnection({
      account,
      username,
      password,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
      database: process.env.SNOWFLAKE_DATABASE || 'URBAN_MISMATCH_AI',
      schema: process.env.SNOWFLAKE_SCHEMA || 'ANALYTICS',
      // 연결 유지 옵션
      clientSessionKeepAlive: true,
      clientSessionKeepAliveHeartbeatFrequency: 3600,
    });
  }
  return connection;
}

function ensureConnected(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isConnected) {
      resolve();
      return;
    }

    const conn = getConnection();
    conn.connect((err) => {
      if (err) {
        console.error('[Snowflake] Connection failed:', err.message);
        // Reset so next attempt creates a fresh connection
        connection = null;
        isConnected = false;
        reject(new Error(`Snowflake connection failed: ${err.message}`));
        return;
      }
      console.log('[Snowflake] Connected successfully');
      isConnected = true;
      resolve();
    });
  });
}

/**
 * Execute a SQL query and return rows.
 * 
 * @param sql - SQL statement to execute
 * @param binds - Optional bind parameters for parameterized queries
 * @returns Array of row objects
 * 
 * @example
 * const rows = await query(
 *   "SELECT * FROM LATEST_MISMATCH_REPORT WHERE GU_NAME = ?",
 *   ['서초구']
 * );
 */
export async function query<T = SnowflakeRow>(
  sql: string,
  binds?: snowflake.Binds
): Promise<T[]> {
  await ensureConnected();

  return new Promise((resolve, reject) => {
    const conn = getConnection();

    conn.execute({
      sqlText: sql,
      binds: binds,
      complete: (err, _stmt, rows) => {
        if (err) {
          console.error('[Snowflake] Query error:', err.message);
          // If connection lost, reset state for auto-reconnect
          if (err.message.includes('not connected') || err.message.includes('gone away')) {
            isConnected = false;
            connection = null;
          }
          reject(new Error(`Snowflake query failed: ${err.message}`));
          return;
        }
        resolve((rows || []) as T[]);
      },
    });
  });
}

/**
 * Check if Snowflake credentials are configured.
 * Use this to decide whether to use live data or fallback to mock data.
 */
export function isSnowflakeConfigured(): boolean {
  return !!(
    process.env.SNOWFLAKE_ACCOUNT &&
    process.env.SNOWFLAKE_USERNAME &&
    process.env.SNOWFLAKE_PASSWORD
  );
}

/**
 * Gracefully destroy the connection (e.g. on server shutdown).
 */
export function destroyConnection(): Promise<void> {
  return new Promise((resolve) => {
    if (connection && isConnected) {
      connection.destroy((err) => {
        if (err) {
          console.error('[Snowflake] Destroy error:', err.message);
        }
        connection = null;
        isConnected = false;
        resolve();
      });
    } else {
      resolve();
    }
  });
}
