import type {
  Album,
  AlbumDetalle,
  AlbumForm,
  EstadoPedido,
  NuevoPedido,
  Pedido,
  Producto,
  Review,
} from '../types';

// Cliente de la API del backend (MongoDB para el catálogo, MySQL para el resto).
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const PORTADA_GENERICA =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#282828"/>' +
      '<circle cx="100" cy="100" r="70" fill="#121212"/><circle cx="100" cy="100" r="22" fill="#5e35b1"/>' +
      '<circle cx="100" cy="100" r="4" fill="#121212"/></svg>'
  );

// Si la imagen del dataset ya no existe, muestra la portada genérica.
export const onErrorPortada = (e: React.SyntheticEvent<HTMLImageElement>) => {
  if (e.currentTarget.src !== PORTADA_GENERICA) e.currentTarget.src = PORTADA_GENERICA;
};

const AVATAR_GENERICO =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

export const TAMANIO_PAGINA = 24;

export interface PaginaAlbums {
  items: Album[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface User {
  id?: number;
  name: string;
  email: string;
  avatarUrl: string;
}

// Error de la API; `errores` trae el detalle por campo de los formularios.
export class ApiError extends Error {
  status: number;
  errores?: Record<string, string>;

  constructor(message: string, status: number, errores?: Record<string, string>) {
    super(message);
    this.status = status;
    this.errores = errores;
  }
}

// ---------- sesión (guardada en el navegador) ----------

const CLAVE_SESION = 'logged_user';

const leerSesion = (): User | null => {
  try {
    const guardado = localStorage.getItem(CLAVE_SESION);
    return guardado ? (JSON.parse(guardado) as User) : null;
  } catch {
    return null;
  }
};

let currentUser: User | null = leerSesion();

// ---------- request genérico ----------

async function pedir<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (currentUser?.id) headers['X-Usuario-Id'] = String(currentUser.id);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, { ...init, headers: { ...headers, ...init.headers } });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. ¿Está levantado el backend?', 0);
  }

  if (respuesta.status === 204) return undefined as T;
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new ApiError(datos.error ?? `Error ${respuesta.status}`, respuesta.status, datos.errores);
  }
  return datos as T;
}

const usuarioId = () => currentUser?.id;

// ---------- conversión de las respuestas del backend ----------

// Algunos textos del dataset traen entidades HTML (&amp;, &quot;...).
const decodificar = (texto: string) => {
  if (!texto || !texto.includes('&')) return texto;
  const t = document.createElement('textarea');
  t.innerHTML = texto;
  return t.value;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const aAlbumBase = (a: any) => ({
  id: a.id,
  title: decodificar(a.titulo),
  artist: decodificar(a.artista?.nombre ?? 'Desconocido'),
  coverUrl: a.imgUrl || PORTADA_GENERICA,
  genres: a.generos ?? [],
  genre: (a.generos ?? []).join(', '),
});

const aProducto = (p: any): Producto => ({
  idProducto: p.idProducto,
  format: p.formato,
  price: p.precio,
  stock: p.stock,
});

const aCard = (item: any): Album => ({
  ...aAlbumBase(item.album),
  ...aProducto(item),
});

const aReview = (r: any): Review => ({
  id: r.id,
  author: decodificar(r.reviewerName || 'Anónimo'),
  rating: Math.round(r.puntaje),
  title: r.titulo ? decodificar(r.titulo) : null,
  comment: decodificar(r.texto),
});

const aDetalle = (album: any, productos: any[], resenias: any[] = []): AlbumDetalle => ({
  ...aAlbumBase(album),
  productos: productos.map(aProducto),
  reviews: resenias.map(aReview),
});

const ESTADOS: Record<string, EstadoPedido> = {
  pendiente: 'Pendiente',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const aPedido = (p: any): Pedido => ({
  id: p.idPedido,
  albumId: p.albumId,
  albumTitle: decodificar(p.tituloAlbum ?? p.albumId),
  format: p.formato,
  quantity: p.cantidad,
  total: p.total,
  userId: p.idUsuario,
  userName: p.usuario,
  address: p.domicilio,
  status: ESTADOS[p.estado] ?? 'Pendiente',
});

const aBodyAlbum = (d: AlbumForm) => ({
  titulo: d.title,
  artista: d.artist,
  imgUrl: d.coverUrl.trim() || null,
  generos: d.genre.split(',').map((g) => g.trim()).filter(Boolean),
  formato: d.format,
  precio: d.price,
  ...(d.stock !== undefined ? { stock: d.stock } : {}),
});
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------- API ----------

export const api = {
  // --- CATÁLOGO ---
  // Inicio: según los favoritos del usuario, o al azar si no hay sesión.
  async getRecommendations(orden: 'asc' | 'desc'): Promise<Album[]> {
    const datos = await pedir<{ items: unknown[] }>(`/recomendados?orden=${orden}&limite=24`);
    return datos.items.map(aCard);
  },

  // Catálogo paginado; con texto busca por título o género.
  async getCatalog(texto: string, orden: 'asc' | 'desc', pagina: number): Promise<PaginaAlbums> {
    const q = new URLSearchParams({ orden, pagina: String(pagina), tamanio: String(TAMANIO_PAGINA) });
    if (texto) q.set('texto', texto);
    const datos = await pedir<{ items: unknown[]; total: number; pagina: number }>(`/catalogo?${q}`);
    return {
      items: datos.items.map(aCard),
      total: datos.total,
      pagina: datos.pagina,
      totalPaginas: Math.max(1, Math.ceil(datos.total / TAMANIO_PAGINA)),
    };
  },

  async getAlbumById(id: string): Promise<AlbumDetalle | undefined> {
    try {
      const d = await pedir<{ album: unknown; productos: unknown[]; resenias: unknown[] }>(
        `/albumes/${encodeURIComponent(id)}`
      );
      return aDetalle(d.album, d.productos, d.resenias);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return undefined;
      throw e;
    }
  },

  async createAlbum(datos: AlbumForm): Promise<string> {
    const r = await pedir<{ album: { id: string } }>('/albumes', { method: 'POST', body: JSON.stringify(aBodyAlbum(datos)) });
    return r.album.id;
  },

  async updateAlbum(id: string, datos: AlbumForm): Promise<void> {
    await pedir(`/albumes/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(aBodyAlbum(datos)) });
  },

  async deleteAlbum(id: string): Promise<void> {
    await pedir(`/albumes/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // --- FAVORITOS (del usuario logueado) ---
  async getFavoriteAlbums(): Promise<AlbumDetalle[]> {
    const id = usuarioId();
    if (!id) return [];
    const favs = await pedir<{ album: unknown; productos: unknown[] }[]>(`/usuarios/${id}/favoritos`);
    return favs.map((f) => aDetalle(f.album, f.productos));
  },

  async getFavorites(): Promise<string[]> {
    return (await this.getFavoriteAlbums()).map((a) => a.id);
  },

  async addFavorite(albumId: string): Promise<void> {
    await pedir(`/usuarios/${usuarioId()}/favoritos`, { method: 'POST', body: JSON.stringify({ albumId }) });
  },

  async removeFavorite(albumId: string): Promise<void> {
    await pedir(`/usuarios/${usuarioId()}/favoritos/${encodeURIComponent(albumId)}`, { method: 'DELETE' });
  },

  async clearFavorites(): Promise<void> {
    await pedir(`/usuarios/${usuarioId()}/favoritos`, { method: 'DELETE' });
  },

  // --- PEDIDOS ---
  async createOrder(datos: NuevoPedido): Promise<Pedido> {
    const p = await pedir<unknown>('/pedidos', { method: 'POST', body: JSON.stringify(datos) });
    return aPedido(p);
  },

  async getOrders(): Promise<Pedido[]> {
    const id = usuarioId();
    if (!id) return [];
    const pedidos = await pedir<unknown[]>(`/pedidos?usuario=${id}`);
    return pedidos.map(aPedido);
  },

  async updateOrderStatus(id: number, status: EstadoPedido): Promise<Pedido> {
    const p = await pedir<unknown>(`/pedidos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: status.toLowerCase() }),
    });
    return aPedido(p);
  },

  // --- SESIÓN ---
  async login(email: string, password: string): Promise<User> {
    const u = await pedir<{ idUsuario: number; nombre: string; email: string }>('/sesion', {
      method: 'POST',
      body: JSON.stringify({ email, contrasenia: password }),
    });
    currentUser = { id: u.idUsuario, name: u.nombre, email: u.email, avatarUrl: AVATAR_GENERICO };
    try {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(currentUser));
    } catch {
      // sin localStorage la sesión dura hasta recargar la página
    }
    return currentUser;
  },

  async getCurrentUser(): Promise<User | null> {
    return currentUser;
  },

  async logout(): Promise<void> {
    currentUser = null;
    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch {
      // nada que limpiar
    }
  },
};
