export type Formato = "CD" | "Vinilo";
export const FORMATOS: Formato[] = ["CD", "Vinilo"];

export type EstadoPedido = "pendiente" | "entregado" | "cancelado";
export const ESTADOS_PEDIDO: EstadoPedido[] = ["pendiente", "entregado", "cancelado"];

export interface Artista {
  nombre: string;
  mbid: string;
}

export interface Album {
  id: string;
  titulo: string;
  imgUrl: string | null;
  artista: Artista;
  generos: string[];
}

export interface DatosAlbum {
  titulo: string;
  imgUrl: string | null;
  artista: { nombre: string; mbid?: string };
  generos: string[];
}

export interface Resenia {
  id: string;
  albumId: string;
  reviewerName: string | null;
  puntaje: number;
  titulo: string | null;
  texto: string;
  fecha: string | null;
}

export interface Producto {
  idProducto: number;
  albumId: string;
  formato: Formato;
  precio: number;
  stock: number;
}

// Card del catálogo: un álbum en un formato.
export interface ItemCatalogo extends Producto {
  album: Album;
}

export interface EstadisticaGenero {
  genero: string;
  cantidadAlbumes: number;
  puntajePromedio: number | null;
}

export interface Pedido {
  idPedido: number;
  fecha: string;
  estado: EstadoPedido;
  cantidad: number;
  precioUnitario: number;
  total: number;
  idUsuario: number;
  usuario: string;
  domicilio: string;
  email: string;
  telefono: string;
  idProducto: number;
  albumId: string;
  formato: Formato;
  tituloAlbum?: string | null;
}

export interface Favorito {
  albumId: string;
  fechaAgregado: string;
}

export interface Paginado<T> {
  pagina: number;
  tamanio: number;
  total: number;
  items: T[];
}
