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

// Base de datos mock de usuarios
const mockUsers = [
  { 
    name: 'Julieta', 
    email: 'julieta@mail.com', 
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' 
  },
  { 
    name: 'Luz', 
    email: 'luzquispe1999@gmail.com', 
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' 
  }
];

// Definimos la interfaz del usuario para que TypeScript no se queje de las propiedades
export interface User {
  name: string;
  email: string;
  avatarUrl: string;
}


let currentUser: User | null = null;

// let currentUser: { name: string; email: string } | null = {
//   name: 'Usuario',
//   email: 'usuario@mail.com'
// }; 

export const api = {
  async getAlbums(): Promise<Album[]> {
    return mockAlbums;
  },
  async getAlbumById(id: string): Promise<Album | undefined> {
    return mockAlbums.find(a => a.id === id);
  },
  async createOrder(orderData: Omit<Pedido, 'id'>): Promise<Pedido> {
    const newOrder: Pedido = { ...orderData, id: Math.floor(1000 + Math.random() * 9000) };
    mockPedidos.unshift(newOrder);
    return newOrder;
  },
  async getOrders(): Promise<Pedido[]> {
    return mockPedidos;
  },
  async updateOrderStatus(id: number, status: Pedido['status']): Promise<void> {
    const order = mockPedidos.find(o => o.id === id);
    if (order) order.status = status;
  },


///////////////////////////////////
 async login(name: string = '', email: string): Promise<User> {
    // Busca en la "base de datos" mock si el email ya existe
    const found = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // Si existe, trae su información; si es nuevo, le asigna un avatar por defecto
    currentUser = found ? { ...found, name: name || found.name } : {
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
    return null; // Devuelve null si no hay sesión iniciada
  },

  async logout(): Promise<void> {
    currentUser = null;
    localStorage.removeItem('logged_user');
  }



  
};