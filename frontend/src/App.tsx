import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { api } from './services/api';
import { Header } from './components/Header';
import { HomeView } from './views/HomeView';
import { PedidosView } from './views/PedidosView';
import { ProfileView } from './views/PerfilView';
import { AlbumDetailView } from './views/AlbumDetalleView';
import { CheckoutView } from './views/FormularioDeCompraView';
import { AddAlbumView } from './views/AgregarAlbumView';
import { EditAlbumView } from './views/EditarAlbumView';
import { LoginView } from './views/LoginView';
import { Box, Button } from '@chakra-ui/react';
import { FiUser } from 'react-icons/fi';

const FloatingLoginButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Cada vez que cambia la ruta, verificamos si hay un usuario logueado
    api.getCurrentUser().then((user) => {
      setIsLoggedIn(!!user);
    });
  }, [location]);

  // Si ya inició sesión o si ya está en la pantalla de login, no mostramos el botón
  if (isLoggedIn || location.pathname === '/login') {
    return null;
  }

  return (
    <Box
      position="fixed"
      bottom="24px"
      left="24px"
      zIndex="9999"
    >
      <Button
        onClick={() => navigate('/login')}
        bg="#161616"
        color="#fff"
        borderRadius="full"
        px="20px"
        py="16px"
        fontSize="sm"
        fontWeight="bold"
        display="flex"
        alignItems="center"
        gap="8px"
        border="1px solid"
        borderColor="#282828"
        boxShadow="0 4px 12px rgba(0,0,0,0.5)"
        _hover={{ bg: '#222', transform: 'scale(1.05)' }}
        transition="all 0.2s"
      >
        <FiUser size="16px" />
        Iniciar sesión
      </Button>
    </Box>
  );
};

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
        
        <FloatingLoginButton />
      </div>
    </Router>
  );
}

export default App;