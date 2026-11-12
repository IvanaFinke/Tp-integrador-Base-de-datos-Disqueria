import { noEncontrado, solicitudInvalida } from "../dominio/errores";
import { ESTADOS_PEDIDO, EstadoPedido } from "../dominio/modelos";
import { AlbumRepository } from "../repositorios/mongo/AlbumRepository";
import { PedidoRepository } from "../repositorios/mysql/PedidoRepository";
import { UsuarioRepository } from "../repositorios/mysql/UsuarioRepository";
import { validarCompra } from "./validaciones";

export class PedidoService {
  constructor(
    private catalogo = new AlbumRepository(),
    private pedidos = new PedidoRepository(),
    private usuarios = new UsuarioRepository()
  ) {}

  async listar(idUsuario?: number) {
    const pedidos = await this.pedidos.listar(idUsuario);
    const albumes = await this.catalogo.obtenerPorIds([...new Set(pedidos.map((p) => p.albumId))]);
    const titulos = new Map(albumes.map((a) => [a.id, a.titulo]));
    return pedidos.map((p) => ({ ...p, tituloAlbum: titulos.get(p.albumId) ?? null }));
  }

  async comprar(idUsuario: number, body: unknown) {
    const datos = validarCompra(body);
    if (!(await this.usuarios.obtener(idUsuario))) throw noEncontrado("Usuario");
    const idPedido = await this.pedidos.crear({ idUsuario, ...datos });
    return this.pedidos.obtener(idPedido);
  }

  async cambiarEstado(idPedido: number, estado: unknown) {
    if (!ESTADOS_PEDIDO.includes(estado as EstadoPedido))
      throw solicitudInvalida(`'estado' debe ser ${ESTADOS_PEDIDO.join(", ")}`);
    await this.pedidos.cambiarEstado(idPedido, estado as EstadoPedido);
    return this.pedidos.obtener(idPedido);
  }
}
