import mysql, { Pool, PoolConnection } from "mysql2/promise";
import { config } from "../config/env";

export const pool: Pool = mysql.createPool({
  ...config.mysql,
  connectionLimit: 10,
  charset: "utf8mb4",
  decimalNumbers: true,
  dateStrings: true,
});

// Ejecuta fn en una transacción: COMMIT si sale bien, ROLLBACK si falla.
export async function enTransaccion<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
