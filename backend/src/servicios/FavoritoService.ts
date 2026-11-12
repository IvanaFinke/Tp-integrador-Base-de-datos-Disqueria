import { conflicto, noEncontrado } from "../dominio/errores";
import { AlbumRepository } from "../repositorios/mongo/AlbumRepository";
import { FavoritoRepository } from "../repositorios/mysql/FavoritoRepository";
import { ProductoRepository } from "../repositorios/mysql/ProductoRepository";
import { UsuarioRepository } from "../repositorios/mysql/UsuarioRepository";

export class FavoritoService {
  constructor(
    private catalogo = new AlbumRepository(),
    private favoritos = new FavoritoRepository(),
    private productos = new ProductoRepository(),
    private usuarios = new UsuarioRepository()
  ) {}

  private async verificarUsuario(idUsuario: number) {
    if (!(await this.usuarios.obtener(idUsuario))) throw noEncontrado("Usuario");
  }

  async listar(idUsuario: number) {
    await this.verificarUsuario(idUsuario);
    const favoritos = await this.favoritos.listar(idUsuario);
    const ids = favoritos.map((f) => f.albumId);
    const [albumes, productos] = await Promise.all([this.catalogo.obtenerPorIds(ids), this.productos.porAlbumes(ids)]);
    const porId = new Map(albumes.map((a) => [a.id, a]));
    return favoritos
      .filter((f) => porId.has(f.albumId))
      .map((f) => ({ ...f, album: porId.get(f.albumId)!, productos: productos.filter((p) => p.albumId === f.albumId) }));
  }

  async agregar(idUsuario: number, albumId: string) {
    await this.verificarUsuario(idUsuario);
    if (!(await this.catalogo.obtenerPorId(albumId))) throw noEncontrado("Álbum");
    try {
      await this.favoritos.agregar(idUsuario, albumId);
    } catch (e: any) {
      if (e?.code === "ER_DUP_ENTRY") throw conflicto("El álbum ya está en favoritos");
      throw e;
    }
  }

  async eliminar(idUsuario: number, albumId: string) {
    if (!(await this.favoritos.eliminar(idUsuario, albumId))) throw noEncontrado("Favorito");
  }

  async eliminarTodos(idUsuario: number) {
    await this.verificarUsuario(idUsuario);
    return { eliminados: await this.favoritos.eliminarTodos(idUsuario) };
  }
}
