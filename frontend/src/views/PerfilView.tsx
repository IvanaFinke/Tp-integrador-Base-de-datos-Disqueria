import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Album } from '../types';
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

export const ProfileView = () => {
  const [favoriteAlbums, setFavoriteAlbums] = useState<Album[]>([]);
  const [formats, setFormats] = useState<Record<string, 'Vinilo' | 'CD'>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const loadFavorites = async () => {
      const allAlbums = await api.getAlbums();
      const savedIds: string[] = JSON.parse(localStorage.getItem('favorite_albums') || '[]');
      const favs = allAlbums.filter(album => savedIds.includes(album.id));
      
      setFavoriteAlbums(favs);

      // Inicializar el selector de formato de cada álbum con su formato actual
      const initialFormats: Record<string, 'Vinilo' | 'CD'> = {};
      favs.forEach(album => {
        initialFormats[album.id] = album.format;
      });
      setFormats(initialFormats);
    };

    loadFavorites();
  }, []);

  // Borrar todos los favoritos
  const handleClearAllFavorites = () => {
    localStorage.setItem('favorite_albums', JSON.stringify([]));
    setFavoriteAlbums([]);
  };

  // Quitar un álbum específico de favoritos al hacer clic en su corazón
  const handleRemoveFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const savedIds: string[] = JSON.parse(localStorage.getItem('favorite_albums') || '[]');
    const updatedIds = savedIds.filter(favId => favId !== id);
    localStorage.setItem('favorite_albums', JSON.stringify(updatedIds));
    setFavoriteAlbums(prev => prev.filter(album => album.id !== id));
  };

  // Cambiar el formato en el selector blanco de la tarjeta
  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>, id: string) => {
    e.stopPropagation();
    const newFormat = e.target.value as 'Vinilo' | 'CD';
    setFormats(prev => ({ ...prev, [id]: newFormat }));
  };

  return (
    <Box maxW="950px" mx="auto" mt="16px">
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
              {/* Izquierda: Portada + Info + Selector de formato */}
              <Flex align="center" gap="24px">
                <Image
                  src={album.coverUrl}
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
                  <Text fontSize="xs" color="#b3b3b3" mb="4px">
                    Formato
                  </Text>

                  {/* Selector blanco redondeado como en el mockup */}
                  <Box onClick={(e) => e.stopPropagation()}>
                    <select
                      value={formats[album.id] || album.format}
                      onChange={(e) => handleFormatChange(e, album.id)}
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#121212',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        padding: '3px 12px',
                        borderRadius: '9999px',
                        border: 'none',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="Vinilo">Vinilo</option>
                      <option value="CD">CD</option>
                    </select>
                  </Box>
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
                  color="#b3b3b3"
                  _hover={{ color: '#ff4d4f', transform: 'scale(1.1)' }}
                  transition="all 0.15s"
                  title="Quitar de favoritos"
                >
                  <FaHeart size="20px" />
                </Box>

                <Text fontSize="xl" fontWeight="extrabold" color="#fff">
                  ${album.price}
                </Text>
              </Flex>
            </Flex>
          ))}
        </VStack>
      )}
    </Box>
  );
};