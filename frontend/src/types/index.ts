export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  format: 'CD' | 'Vinilo';
  price: number;
  genre: string;
  stock: number;
  reviews?: Review[];
}

export interface Pedido {
  id: number;
  albumId: string;
  albumTitle: string;
  quantity: number;
  userId: number;
  address: string;
  status: 'Pendiente' | 'Entregado' | 'Cancelado' | 'En camino';
}