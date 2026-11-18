import { RowDataPacket } from "mysql2/promise";
import { pool } from "../../db/mysql";

export interface Usuario {
  idUsuario: number;
  nombre: string;
  email: string;
}

const aUsuario = (f: RowDataPacket): Usuario => ({ idUsuario: f.id_usuario, nombre: f.nombre, email: f.email });

export class UsuarioRepository {
  async obtener(idUsuario: number): Promise<Usuario | null> {
    const [filas] = await pool.query<RowDataPacket[]>(`SELECT id_usuario, nombre, email FROM usuario WHERE id_usuario = ?`, [
      idUsuario,
    ]);
    return filas.length ? aUsuario(filas[0]) : null;
  }

  async obtenerConHash(email: string): Promise<(Usuario & { hash: string }) | null> {
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT id_usuario, nombre, email, contrasenia_hash FROM usuario WHERE email = ?`,
      [email]
    );
    return filas.length ? { ...aUsuario(filas[0]), hash: filas[0].contrasenia_hash } : null;
  }
}
