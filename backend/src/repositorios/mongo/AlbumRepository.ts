import { randomUUID } from "crypto";
import { Collection, Filter } from "mongodb";
import { mongoDb } from "../../db/mongo";
import { Album, DatosAlbum, EstadisticaGenero, Resenia } from "../../dominio/modelos";

interface AlbumDoc {
  _id: string;
  titulo: string;
  img_url?: string;
  artista: { nombre: string; mbid: string };
  generos: string[];
}

interface ReseniaDoc {
  _id?: unknown;
  album_id: string;
  reviewer_name: string | null;
  puntaje: number;
  titulo: string | null;
  texto: string;
  fecha: string | null;
}

const aAlbum = (d: AlbumDoc): Album => ({
  id: d._id,
  titulo: d.titulo,
  imgUrl: d.img_url ?? null,
  artista: { nombre: d.artista?.nombre, mbid: d.artista?.mbid },
  generos: d.generos ?? [],
});

export interface FiltroCatalogo {
  texto?: string; // título o género
  genero?: string;
}

const ordenarComo = (ids: string[], albumes: Album[]): Album[] => {
  const porId = new Map(albumes.map((a) => [a.id, a]));
  return ids.map((id) => porId.get(id)).filter((a): a is Album => !!a);
};

const escaparRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Catálogo en MongoDB: colecciones albumes y resenas.
export class AlbumRepository {
  private async albumes(): Promise<Collection<AlbumDoc>> {
    return (await mongoDb()).collection<AlbumDoc>("albumes");
  }
  private async resenias(): Promise<Collection<ReseniaDoc>> {
    return (await mongoDb()).collection<ReseniaDoc>("resenas");
  }

  async obtenerPorId(id: string) {
    const doc = await (await this.albumes()).findOne({ _id: id });
    return doc ? aAlbum(doc) : null;
  }

  async obtenerPorIds(ids: string[]) {
    if (!ids.length) return [];
    const docs = await (await this.albumes()).find({ _id: { $in: ids } }).toArray();
    return ordenarComo(ids, docs.map(aAlbum));
  }

  async buscarIds(filtro: FiltroCatalogo, limite: number) {
    const condiciones: Filter<AlbumDoc>[] = [];
    if (filtro.texto) {
      const re = new RegExp(escaparRegex(filtro.texto), "i");
      condiciones.push({ $or: [{ titulo: re }, { generos: re }] });
    }
    if (filtro.genero) condiciones.push({ generos: filtro.genero });
    const consulta: Filter<AlbumDoc> = condiciones.length ? { $and: condiciones } : {};
    const docs = await (await this.albumes())
      .find(consulta, { projection: { _id: 1 } })
      .sort({ titulo: 1 })
      .limit(limite)
      .toArray();
    return docs.map((d) => d._id);
  }

  // Reutiliza el mbid si el artista ya existe; si no, genera uno.
  private async resolverArtista(artista: DatosAlbum["artista"]) {
    if (artista.mbid) return { nombre: artista.nombre, mbid: artista.mbid };
    const existente = await (await this.albumes()).findOne(
      { "artista.nombre": artista.nombre },
      { projection: { artista: 1 } }
    );
    return { nombre: artista.nombre, mbid: existente?.artista.mbid ?? randomUUID() };
  }

  async crear(id: string, datos: DatosAlbum) {
    const doc: AlbumDoc = {
      _id: id,
      titulo: datos.titulo,
      ...(datos.imgUrl ? { img_url: datos.imgUrl } : {}),
      artista: await this.resolverArtista(datos.artista),
      generos: [...new Set(datos.generos)],
    };
    await (await this.albumes()).insertOne(doc);
    return aAlbum(doc);
  }

  async actualizar(id: string, datos: DatosAlbum) {
    const doc = await (await this.albumes()).findOneAndUpdate(
      { _id: id },
      {
        $set: {
          titulo: datos.titulo,
          ...(datos.imgUrl ? { img_url: datos.imgUrl } : {}),
          artista: await this.resolverArtista(datos.artista),
          generos: [...new Set(datos.generos)],
        },
        ...(datos.imgUrl ? {} : { $unset: { img_url: "" } }),
      },
      { returnDocument: "after" }
    );
    return doc ? aAlbum(doc) : null;
  }

  async eliminar(id: string) {
    // Sin FK: las reseñas se borran desde el backend.
    const res = await (await this.albumes()).deleteOne({ _id: id });
    if (res.deletedCount) await (await this.resenias()).deleteMany({ album_id: id });
    return res.deletedCount > 0;
  }

  async listarResenias(albumId: string): Promise<Resenia[]> {
    const docs = await (await this.resenias()).find({ album_id: albumId }).sort({ fecha: -1 }).toArray();
    return docs.map((d) => ({
      id: String(d._id),
      albumId: d.album_id,
      reviewerName: d.reviewer_name ?? null,
      puntaje: Number(d.puntaje),
      titulo: d.titulo ?? null,
      texto: d.texto,
      fecha: d.fecha ?? null,
    }));
  }

  async listarGeneros() {
    const generos = await (await this.albumes()).distinct("generos");
    return (generos as string[]).sort((a, b) => a.localeCompare(b));
  }

  async recomendarPorFavoritos(idsFavoritos: string[], limite: number) {
    if (!idsFavoritos.length) return this.aleatorios(limite);
    const col = await this.albumes();
    const [{ generos = [] } = {}] = await col
      .aggregate<{ generos: string[] }>([
        { $match: { _id: { $in: idsFavoritos } } },
        { $unwind: "$generos" },
        { $group: { _id: null, generos: { $addToSet: "$generos" } } },
      ])
      .toArray();
    if (!generos.length) return this.aleatorios(limite);

    const docs = await col
      .aggregate<AlbumDoc>([
        { $match: { _id: { $nin: idsFavoritos }, generos: { $in: generos } } },
        { $addFields: { coincidencias: { $size: { $setIntersection: ["$generos", generos] } }, azar: { $rand: {} } } },
        { $sort: { coincidencias: -1, azar: 1 } },
        { $limit: limite },
        { $project: { coincidencias: 0, azar: 0 } },
      ])
      .toArray();
    return docs.map(aAlbum);
  }

  async aleatorios(limite: number) {
    const docs = await (await this.albumes()).aggregate<AlbumDoc>([{ $sample: { size: limite } }]).toArray();
    return docs.map(aAlbum);
  }

  async estadisticasPorGenero(limite: number): Promise<EstadisticaGenero[]> {
    const filas = await (await this.albumes())
      .aggregate<{ _id: string; cantidad: number; suma: number; n: number }>([
        {
          $lookup: {
            from: "resenas",
            localField: "_id",
            foreignField: "album_id",
            pipeline: [{ $project: { _id: 0, puntaje: 1 } }],
            as: "resenas",
          },
        },
        { $unwind: "$generos" },
        {
          $group: {
            _id: "$generos",
            cantidad: { $sum: 1 },
            suma: { $sum: { $sum: "$resenas.puntaje" } },
            n: { $sum: { $size: "$resenas" } },
          },
        },
        { $sort: { cantidad: -1 } },
        { $limit: limite },
      ])
      .toArray();
    return filas.map((f) => ({
      genero: f._id,
      cantidadAlbumes: f.cantidad,
      puntajePromedio: f.n ? Math.round((f.suma / f.n) * 100) / 100 : null,
    }));
  }
}
