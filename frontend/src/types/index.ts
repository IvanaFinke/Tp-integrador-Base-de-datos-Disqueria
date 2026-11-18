export interface Review {
  id: string;
  author: string;
  rating: number;
  title: string | null;
  comment: string;
}

export type Formato = 'CD' | 'Vinilo';

// Un formato a la venta de un álbum (producto en MySQL).
export interface Producto {
  idProducto: number;
  format: Formato;
  price: number;
  stock: number;
}

// Card del catálogo: un álbum en un formato.
export interface Album {
  id: string;
  idProducto: number;
  title: string;
  artist: string;
  coverUrl: string;
  format: Formato;
  price: number;
  stock: number;
  genres: string[];
  genre: string;
}

// Álbum completo con todos sus formatos y reseñas.
export interface AlbumDetalle {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  genres: string[];
  genre: string;
  productos: Producto[];
  reviews: Review[];
}

// Datos del formulario de alta y modificación.
export interface AlbumForm {
  title: string;
  artist: string;
  coverUrl: string;
  genre: string;
  format: Formato;
  price: number;
  stock?: number;
}

export type EstadoPedido = 'Pendiente' | 'Entregado' | 'Cancelado';

export interface Pedido {
  id: number;
  albumId: string;
  albumTitle: string;
  format: Formato;
  quantity: number;
  total: number;
  userId: number;
  userName: string;
  address: string;
  status: EstadoPedido;
}

export interface NuevoPedido {
  idProducto: number;
  cantidad: number;
  email: string;
  telefono: string;
  calle: string;
  altura: string;
}
