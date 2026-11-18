import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError, onErrorPortada } from '../services/api';
import type { AlbumDetalle } from '../types';
import {
  Box,
  Flex,
  Heading,
  Text,
  Image,
  Button,
  VStack
} from '@chakra-ui/react';
import { FaHeart } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';

export const ProfileView = () => {
  const [favoriteAlbums, setFavoriteAlbums] = useState<AlbumDetalle[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfileData = async () => {
      const currentUser = await api.getCurrentUser();
      setIsLoggedIn(!!currentUser);
      try {
        if (currentUser) setFavoriteAlbums(await api.getFavoriteAlbums());
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los favoritos.');
      } finally {
        setCargando(false);
      }
    };

    loadProfileData();
  }, []);

  // Borrar todos los favoritos del usuario actual
  const handleClearAllFavorites = async () => {
    try {
      await api.clearFavorites();
      setFavoriteAlbums([]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudieron borrar los favoritos.');
    }
  };

  // Quitar un álbum específico de los favoritos del usuario actual
  const handleRemoveFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.removeFavorite(id);
      setFavoriteAlbums(prev => prev.filter(album => album.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo quitar el favorito.');
    }
  };

  if (cargando) return null;

  if (!isLoggedIn) {
    return (
      <Flex direction="column" align="center" mt="60px" gap="16px">
        <Text color="#b3b3b3">Iniciá sesión para ver tus favoritos.</Text>
        <Button onClick={() => navigate('/login?volver=/perfil')} bg="#6f42c1" color="#fff" size="sm">
          Iniciar sesión
        </Button>
      </Flex>
    );
  }

  // Cerrar sesión
  const handleLogout = async () => {
    await api.logout();
    navigate('/');
  };

  return (
    <Box maxW="950px" mx="auto" mt="16px">
      {/* El botón de Cerrar sesión aparece ÚNICAMENTE si hay una sesión activa */}
      {isLoggedIn && (
        <Flex justify="flex-end" mb="24px">
          <Button
            onClick={handleLogout}
            bg="transparent"
            color="#ff4d4f"
            border="1px solid"
            borderColor="#ff4d4f"
            size="sm"
            px="16px"
            borderRadius="sm"
            fontWeight="bold"
            display="flex"
            alignItems="center"
            gap="8px"
            _hover={{ bg: 'rgba(255, 77, 79, 0.1)' }}
          >
            <FiLogOut size="16px" />
            Cerrar sesión
          </Button>
        </Flex>
      )}

      {/* Cabecera: Título "Mis favoritos" y botón rojo "Borrar favoritos" */}
      <Flex justify="space-between" align="center" mb="24px">
        <Heading size="lg" color="#fff" fontWeight="bold">
          Mis favoritos
        </Heading>
        <Button
          onClick={handleClearAllFavorites}
          bg="#c81010"
          color="#fff"
          size="sm"
          px="16px"
          borderRadius="sm"
          fontWeight="bold"
          _hover={{ bg: '#a30d0d' }}
        >
          Borrar favoritos
        </Button>
      </Flex>

      {error && <Text color="#ff4d4f" mb="16px">{error}</Text>}

      {/* Lista vertical de tarjetas horizontales */}
      {favoriteAlbums.length === 0 ? (
        <Text color="#b3b3b3" textAlign="center" mt="40px">
          No tenés álbumes en tu lista de favoritos.
        </Text>
      ) : (
        <VStack gap="16px" align="stretch">
          {favoriteAlbums.map((album) => (
            <Flex
              key={album.id}
              onClick={() => navigate(`/album/${album.id}`)}
              bg="#242424"
              p="16px 24px"
              borderRadius="md"
              align="center"
              justify="space-between"
              cursor="pointer"
              transition="background 0.2s"
              _hover={{ bg: '#2c2c2c' }}
            >
              {/* Izquierda: Portada + Info + Formato fijo */}
              <Flex align="center" gap="24px">
                <Image
                  src={album.coverUrl}
                  onError={onErrorPortada}
                  alt={album.title}
                  boxSize="110px"
                  borderRadius="24px"
                  objectFit="cover"
                />

                <Box>
                  <Heading size="sm" color="#fff" mb="6px" fontWeight="bold">
                    {album.title}
                  </Heading>
                  <Text fontSize="sm" color="#e0e0e0" fontWeight="semibold" mb="6px">
                    {album.artist}
                  </Text>
                  <Text fontSize="xs" color="#b3b3b3" mb="2px">
                    Formato
                  </Text>
                  
                  <Text fontSize="sm" color="#fff" fontWeight="bold">
                    {album.productos.map(p => p.format).join(' / ') || 'No disponible'}
                  </Text>
                </Box>
              </Flex>

              {/* Derecha: Corazón arriba y Precio abajo */}
              <Flex
                direction="column"
                align="flex-end"
                justify="space-between"
                h="105px"
              >
                <Box
                  as="button"
                  onClick={(e) => handleRemoveFavorite(e, album.id)}
                  color="#ff4d4f"
                  _hover={{ transform: 'scale(1.1)' }}
                  transition="all 0.15s"
                  title="Quitar de favoritos"
                >
                  <FaHeart size="20px" />
                </Box>

                {album.productos.length > 0 && (
                  <Text fontSize="xl" fontWeight="extrabold" color="#fff">
                    ${Math.min(...album.productos.map(p => p.price)).toLocaleString('es-AR')}
                  </Text>
                )}
              </Flex>
            </Flex>
          ))}
        </VStack>
      )}
    </Box>
  );
};