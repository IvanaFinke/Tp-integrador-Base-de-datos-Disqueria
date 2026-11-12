import { RowDataPacket } from "mysql2/promise";
import { pool } from "../../db/mysql";
import { Formato, Producto } from "../../dominio/modelos";

const aProducto = (f: RowDataPacket): Producto => ({
  idProducto: f.id_producto,
  albumId: f.amazon_id,
  formato: f.formato,
  precio: Number(f.precio),
  stock: f.stock,
});

export interface OpcionesListado {
  ids?: string[];
  orden?: "asc" | "desc";
  limite: number;
  offset: number;
}

export class ProductoRepository {
  async listar({ ids, orden, limite, offset }: OpcionesListado): Promise<{ total: number; items: Producto[] }> {
    if (ids && !ids.length) return { total: 0, items: [] };
    const where = `WHERE activo = TRUE ${ids ? "AND amazon_id IN (?)" : ""}`;
    const params: unknown[] = ids ? [ids] : [];
    const orderBy = orden ? `ORDER BY precio ${orden === "desc" ? "DESC" : "ASC"}, id_producto` : "ORDER BY id_producto";
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT id_producto, amazon_id, formato, precio, stock FROM producto ${where} ${orderBy} LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );
    const [[{ total }]] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM producto ${where}`, params);
    return { total: Number(total), items: filas.map(aProducto) };
  }

  async porAlbumes(ids: string[]): Promise<Producto[]> {
    if (!ids.length) return [];
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT id_producto, amazon_id, formato, precio, stock FROM producto
       WHERE activo = TRUE AND amazon_id IN (?) ORDER BY amazon_id, formato`,
      [ids]
    );
    return filas.map(aProducto);
  }

  async obtener(idProducto: number): Promise<Producto | null> {
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT id_producto, amazon_id, formato, precio, stock FROM producto WHERE id_producto = ? AND activo = TRUE`,
      [idProducto]
    );
    return filas.length ? aProducto(filas[0]) : null;
  }

  // Crea el producto o actualiza precio y stock si ya existe.
  async guardar(albumId: string, formato: Formato, precio: number, stock: number) {
    await pool.query(
      `INSERT INTO producto (amazon_id, formato, precio, stock) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE precio = VALUES(precio), stock = VALUES(stock), activo = TRUE`,
      [albumId, formato, precio, stock]
    );
  }

  // Baja lógica: los pedidos existentes siguen referenciando el producto.
  async desactivarPorAlbum(albumId: string) {
    await pool.query(`UPDATE producto SET activo = FALSE WHERE amazon_id = ?`, [albumId]);
  }
}
