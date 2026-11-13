import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomeView } from './views/HomeView';
import { PedidosView } from './views/PedidosView';
import { ProfileView } from './views/PerfilView';
import { AlbumDetailView } from './views/AlbumDetalleView';
import { CheckoutView } from './views/FormularioDeCompraView';
import { AddAlbumView } from './views/AgregarAlbumView';
import { EditAlbumView } from './views/EditarAlbumView';
import { LoginView } from './views/LoginView';

export function App() {
  return (
    <Router>
      <div style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' }}>
        <Header />
        <main style={{ padding: '24px' }}>
          <Routes>
            <Route path="/login" element={<LoginView />} />
            <Route path="/" element={<HomeView />} />
            <Route path="/album/:id" element={<AlbumDetailView />} />
            <Route path="/agregar" element={<AddAlbumView />} />
            <Route path="/editar/:id" element={<EditAlbumView />} />
            <Route path="/comprar/:id" element={<CheckoutView />} />
            <Route path="/pedidos" element={<PedidosView />} />
            <Route path="/perfil" element={<ProfileView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;