import { randomInt } from "crypto";
import { noEncontrado } from "../dominio/errores";
import { Album, ItemCatalogo, Paginado, Producto } from "../dominio/modelos";
import { AlbumRepository, FiltroCatalogo } from "../repositorios/mongo/AlbumRepository";
import { FavoritoRepository } from "../repositorios/mysql/FavoritoRepository";
import { ProductoRepository } from "../repositorios/mysql/ProductoRepository";
import { DatosAlbumConProducto } from "./validaciones";

const MAX_CANDIDATOS = 2000;

// Une cada producto (MySQL) con su álbum (MongoDB).
export function armarItems(productos: Producto[], albumes: Album[]): ItemCatalogo[] {
  const porId = new Map(albumes.map((a) => [a.id, a]));
  return productos.filter((p) => porId.has(p.albumId)).map((p) => ({ ...p, album: porId.get(p.albumId)! }));
}

const ordenarPorPrecio = (items: ItemCatalogo[], orden?: "asc" | "desc") =>
  orden ? [...items].sort((a, b) => (orden === "asc" ? a.precio - b.precio : b.precio - a.precio)) : items;

export class CatalogoService {
  constructor(
    private catalogo = new AlbumRepository(),
    private productos = new ProductoRepository(),
    private favoritos = new FavoritoRepository()
  ) {}

  async listar(
    filtro: FiltroCatalogo,
    orden: "asc" | "desc" | undefined,
    pagina: number,
    tamanio: number
  ): Promise<Paginado<ItemCatalogo>> {
    const hayFiltro = !!(filtro.texto || filtro.genero);
    const ids = hayFiltro ? await this.catalogo.buscarIds(filtro, MAX_CANDIDATOS) : undefined;
    const { total, items } = await this.productos.listar({ ids, orden, limite: tamanio, offset: (pagina - 1) * tamanio });
    const albumes = await this.catalogo.obtenerPorIds([...new Set(items.map((p) => p.albumId))]);
    return { pagina, tamanio, total, items: armarItems(items, albumes) };
  }

  async recomendados(idUsuario: number, orden: "asc" | "desc" | undefined, limite: number) {
    const favoritos = (await this.favoritos.listar(idUsuario)).map((f) => f.albumId);
    const albumes = await this.catalogo.recomendarPorFavoritos(favoritos, limite * 2);
    const productos = await this.productos.porAlbumes(albumes.map((a) => a.id));
    const items = armarItems(productos, albumes).slice(0, limite);
    return { basadoEnFavoritos: favoritos.length > 0, items: ordenarPorPrecio(items, orden) };
  }

  async detalle(id: string) {
    const album = await this.catalogo.obtenerPorId(id);
    if (!album) throw noEncontrado("Álbum");
    const [productos, resenias] = await Promise.all([this.productos.porAlbumes([id]), this.catalogo.listarResenias(id)]);
    return { album, productos, resenias };
  }

  async resenias(id: string) {
    if (!(await this.catalogo.obtenerPorId(id))) throw noEncontrado("Álbum");
    return this.catalogo.listarResenias(id);
  }

  // Si falla el producto en MySQL, se deshace el alta del álbum.
  async crear({ album, producto }: DatosAlbumConProducto) {
    const id = await this.nuevoId();
    const creado = await this.catalogo.crear(id, album);
    try {
      await this.productos.guardar(id, producto!.formato, producto!.precio, producto!.stock);
    } catch (e) {
      await this.catalogo.eliminar(id);
      throw e;
    }
    return { album: creado, productos: await this.productos.porAlbumes([id]) };
  }

  async actualizar(id: string, { album, producto }: DatosAlbumConProducto) {
    const actualizado = await this.catalogo.actualizar(id, album);
    if (!actualizado) throw noEncontrado("Álbum");
    if (producto) await this.productos.guardar(id, producto.formato, producto.precio, producto.stock);
    return { album: actualizado, productos: await this.productos.porAlbumes([id]) };
  }

  async eliminar(id: string) {
    if (!(await this.catalogo.eliminar(id))) throw noEncontrado("Álbum");
    await this.productos.desactivarPorAlbum(id);
    await this.favoritos.eliminarPorAlbum(id);
  }

  generos() {
    return this.catalogo.listarGeneros();
  }

  estadisticasPorGenero(limite: number) {
    return this.catalogo.estadisticasPorGenero(limite);
  }

  private async nuevoId(): Promise<string> {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (;;) {
      const id = "N" + Array.from({ length: 9 }, () => chars[randomInt(chars.length)]).join("");
      if (!(await this.catalogo.obtenerPorId(id))) return id;
    }
  }
}
