import type { Album } from '../types/index';
import type { Pedido } from '../types/index';

let mockAlbums: Album[] = [
  {
    id: '1',
    title: 'Compass: A new Mili symphony',
    artist: 'Mili',
    coverUrl: 'https://i.imgur.com/34X4h0n.jpg',
    format: 'Vinilo',
    price: 20000,
    genre: 'Rock',
    stock: 10,
    reviews: [
      { id: 'r1', author: 'aggreen', rating: 5, comment: 'Cried so hard I heard the people in the row behind me commenting on it' },
      { id: 'r2', author: 'z', rating: 4, comment: 'Ivy stars!!!!!! i love this' }
    ]
  },
  {
    id: '2',
    title: 'Losing My Religion',
    artist: 'Miranda',
    coverUrl: 'https://i.imgur.com/qY7vN5h.jpg',
    format: 'CD',
    price: 18000,
    genre: 'Pop',
    stock: 5
  }
];

let mockPedidos: Pedido[] = [
  { id: 4431, albumId: '2', albumTitle: 'Losing My Religion', quantity: 3, userId: 1, address: 'Los cerros 2432', status: 'Entregado' },
  { id: 4338, albumId: '1', albumTitle: 'Compass: A new Mili symphony', quantity: 2, userId: 2, address: 'Los cerros 2432', status: 'Pendiente' }
];

// Base de datos mock de usuarios con ID para relacionar con los pedidos
const mockUsers = [
  { 
    id: 1,
    name: 'Julieta', 
    email: 'julieta@mail.com', 
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' 
  },
  { 
    id: 2,
    name: 'Luz', 
    email: 'luzquispe1999@gmail.com', 
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' 
  }
];

export interface User {
  id?: number;
  name: string;
  email: string;
  avatarUrl: string;
}

let currentUser: User | null = null;

export const api = {
  async getAlbums(): Promise<Album[]> {
    return mockAlbums;
  },

  async getAlbumById(id: string): Promise<Album | undefined> {
    return mockAlbums.find(a => a.id === id);
  },

  async createOrder(orderData: Omit<Pedido, 'id' | 'userId'>): Promise<Pedido> {
    const user = await this.getCurrentUser();
    const userId = user && user.id ? user.id : 99; // ID por defecto si es invitado
    
    const savedOrders = localStorage.getItem('app_orders');
    const orders: Pedido[] = savedOrders ? JSON.parse(savedOrders) : mockPedidos;

    const newOrder: Pedido = { 
      ...orderData, 
      id: Math.floor(1000 + Math.random() * 9000),
      userId 
    };

    orders.unshift(newOrder);
    localStorage.setItem('app_orders', JSON.stringify(orders));
    return newOrder;
  },

  async getOrders(): Promise<Pedido[]> {
    const user = await this.getCurrentUser();
    if (!user) return []; // Si no hay sesión iniciada, no muestra pedidos personales

    const savedOrders = localStorage.getItem('app_orders');
    const orders: Pedido[] = savedOrders ? JSON.parse(savedOrders) : mockPedidos;

    // Filtra los pedidos que pertenecen exclusivamente al ID del usuario logueado
    return orders.filter(o => o.userId === user.id);
  },

  async updateOrderStatus(id: number, status: Pedido['status']): Promise<void> {
    const savedOrders = localStorage.getItem('app_orders');
    const orders: Pedido[] = savedOrders ? JSON.parse(savedOrders) : mockPedidos;
    const order = orders.find(o => o.id === id);
    if (order) {
      order.status = status;
      localStorage.setItem('app_orders', JSON.stringify(orders));
    }
  },

  // --- FAVORITOS POR USUARIO ---
  async getFavorites(): Promise<string[]> {
    const user = await this.getCurrentUser();
    const key = user ? `favorite_albums_${user.email}` : 'favorite_albums_guest';
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  async saveFavorites(albumIds: string[]): Promise<void> {
    const user = await this.getCurrentUser();
    const key = user ? `favorite_albums_${user.email}` : 'favorite_albums_guest';
    localStorage.setItem(key, JSON.stringify(albumIds));
  },

  // --- RECOMENDACIONES (Inicio) ---
  // Si hay sesión y favoritos, prioriza recomendaciones basadas en sus géneros/artistas. Si no, aleatorias.
  async getRecommendations(allAlbums: Album[]): Promise<Album[]> {
    const favoriteIds = await this.getFavorites();

    if (favoriteIds.length > 0) {
      const favoriteAlbums = allAlbums.filter(a => favoriteIds.includes(a.id));
      const favoriteGenres = favoriteAlbums.map(a => a.genre);
      const favoriteArtists = favoriteAlbums.map(a => a.artist);

      const recommended = allAlbums.filter(a => 
        !favoriteIds.includes(a.id) && 
        (favoriteGenres.includes(a.genre) || favoriteArtists.includes(a.artist))
      );

      if (recommended.length > 0) {
        return recommended;
      }
    }

    // Comportamiento por defecto (Invitado o sin favoritos): Selección aleatoria
    return [...allAlbums].sort(() => 0.5 - Math.random());
  },

  // --- GESTIÓN DE SESIÓN ---
  async login(name: string = '', email: string): Promise<User> {
    const found = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    currentUser = found ? { ...found, name: name || found.name } : {
      id: Math.floor(100 + Math.random() * 900),
      name: name || 'Usuario',
      email,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    };

    localStorage.setItem('logged_user', JSON.stringify(currentUser));
    return currentUser;
  },

  async getCurrentUser(): Promise<User | null> {
    if (currentUser) return currentUser;
    const saved = localStorage.getItem('logged_user');
    if (saved) {
      currentUser = JSON.parse(saved) as User;
      return currentUser;
    }
    return null;
  },

  async logout(): Promise<void> {
    currentUser = null;
    localStorage.removeItem('logged_user');
  }
};