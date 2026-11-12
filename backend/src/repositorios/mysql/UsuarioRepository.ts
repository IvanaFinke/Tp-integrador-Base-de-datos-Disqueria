import { RowDataPacket } from "mysql2/promise";
import { pool } from "../../db/mysql";

export class UsuarioRepository {
  async obtener(idUsuario: number): Promise<{ idUsuario: number; nombre: string; email: string } | null> {
    const [filas] = await pool.query<RowDataPacket[]>(`SELECT id_usuario, nombre, email FROM usuario WHERE id_usuario = ?`, [
      idUsuario,
    ]);
    return filas.length ? { idUsuario: filas[0].id_usuario, nombre: filas[0].nombre, email: filas[0].email } : null;
  }
}
