import { RowDataPacket } from "mysql2/promise";
import { enTransaccion, pool } from "../../db/mysql";
import { conflicto, noEncontrado } from "../../dominio/errores";
import { EstadoPedido, Pedido } from "../../dominio/modelos";

export interface NuevoPedido {
  idUsuario: number;
  idProducto: number;
  cantidad: number;
  email: string;
  telefono: string;
  domicilio: string;
}

const aPedido = (f: RowDataPacket): Pedido => ({
  idPedido: f.id_pedido,
  fecha: f.fecha,
  estado: f.estado,
  cantidad: f.cantidad,
  precioUnitario: Number(f.precio_unitario),
  total: Number(f.total),
  idUsuario: f.id_usuario,
  usuario: f.usuario,
  domicilio: f.domicilio_envio,
  email: f.email_contacto,
  telefono: f.telefono_contacto,
  idProducto: f.id_producto,
  albumId: f.amazon_id,
  formato: f.formato,
});

export class PedidoRepository {
  async listar(idUsuario?: number): Promise<Pedido[]> {
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM v_pedidos ${idUsuario ? "WHERE id_usuario = ?" : ""} ORDER BY fecha DESC, id_pedido DESC`,
      idUsuario ? [idUsuario] : []
    );
    return filas.map(aPedido);
  }

  async obtener(idPedido: number): Promise<Pedido | null> {
    const [filas] = await pool.query<RowDataPacket[]>(`SELECT * FROM v_pedidos WHERE id_pedido = ?`, [idPedido]);
    return filas.length ? aPedido(filas[0]) : null;
  }

  // Compra en una transacción: bloquea el producto, verifica y descuenta stock, inserta el pedido.
  async crear(p: NuevoPedido): Promise<number> {
    return enTransaccion(async (conn) => {
      const [prod] = await conn.query<RowDataPacket[]>(
        `SELECT precio, stock FROM producto WHERE id_producto = ? AND activo = TRUE FOR UPDATE`,
        [p.idProducto]
      );
      if (!prod.length) throw noEncontrado("Producto");
      if (prod[0].stock < p.cantidad) throw conflicto(`Stock insuficiente: quedan ${prod[0].stock} unidades`);

      await conn.query(`UPDATE producto SET stock = stock - ? WHERE id_producto = ?`, [p.cantidad, p.idProducto]);
      const [res] = await conn.query<any>(
        `INSERT INTO pedido (id_usuario, id_producto, cantidad, precio_unitario, email_contacto, telefono_contacto, domicilio_envio)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [p.idUsuario, p.idProducto, p.cantidad, prod[0].precio, p.email, p.telefono, p.domicilio]
      );
      return res.insertId as number;
    });
  }

  // Cambia el estado; cancelar devuelve el stock y reactivar lo vuelve a descontar.
  async cambiarEstado(idPedido: number, nuevo: EstadoPedido): Promise<void> {
    await enTransaccion(async (conn) => {
      const [filas] = await conn.query<RowDataPacket[]>(
        `SELECT estado, cantidad, id_producto FROM pedido WHERE id_pedido = ? FOR UPDATE`,
        [idPedido]
      );
      if (!filas.length) throw noEncontrado("Pedido");
      const { estado: anterior, cantidad, id_producto } = filas[0];
      if (anterior === nuevo) return;

      if (nuevo === "cancelado") {
        await conn.query(`UPDATE producto SET stock = stock + ? WHERE id_producto = ?`, [cantidad, id_producto]);
      } else if (anterior === "cancelado") {
        const [prod] = await conn.query<RowDataPacket[]>(`SELECT stock FROM producto WHERE id_producto = ? FOR UPDATE`, [
          id_producto,
        ]);
        if (prod[0].stock < cantidad) throw conflicto("No hay stock suficiente para reactivar el pedido");
        await conn.query(`UPDATE producto SET stock = stock - ? WHERE id_producto = ?`, [cantidad, id_producto]);
      }
      await conn.query(`UPDATE pedido SET estado = ? WHERE id_pedido = ?`, [nuevo, idPedido]);
    });
  }
}
