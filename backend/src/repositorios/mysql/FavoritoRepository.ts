import { RowDataPacket } from "mysql2/promise";
import { pool } from "../../db/mysql";
import { Favorito } from "../../dominio/modelos";

export class FavoritoRepository {
  async listar(idUsuario: number): Promise<Favorito[]> {
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT amazon_id, fecha_agregado FROM favorito WHERE id_usuario = ? ORDER BY fecha_agregado DESC`,
      [idUsuario]
    );
    return filas.map((f) => ({ albumId: f.amazon_id, fechaAgregado: f.fecha_agregado }));
  }

  async agregar(idUsuario: number, albumId: string) {
    await pool.query(`INSERT INTO favorito (id_usuario, amazon_id) VALUES (?, ?)`, [idUsuario, albumId]);
  }

  async eliminar(idUsuario: number, albumId: string) {
    const [res] = await pool.query<any>(`DELETE FROM favorito WHERE id_usuario = ? AND amazon_id = ?`, [idUsuario, albumId]);
    return res.affectedRows > 0;
  }

  async eliminarTodos(idUsuario: number) {
    const [res] = await pool.query<any>(`DELETE FROM favorito WHERE id_usuario = ?`, [idUsuario]);
    return res.affectedRows as number;
  }

  async eliminarPorAlbum(albumId: string) {
    await pool.query(`DELETE FROM favorito WHERE amazon_id = ?`, [albumId]);
  }
}
