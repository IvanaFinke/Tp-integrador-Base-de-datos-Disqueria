import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import type { Album } from '../types';
import {
  Box,
  Flex,
  Heading,
  Text,
  Image,
  Button,
  SimpleGrid
} from '@chakra-ui/react';
import { FiTrash2, FiSettings, FiHeart } from 'react-icons/fi';

export const HomeView = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = (searchParams.get('q') || '').toLowerCase().trim();

  const loadHomeData = async () => {
    const data = await api.getAlbums();
    // Obtiene las recomendaciones: basadas en favoritos si hay sesión, o aleatorias si es invitado
    const recommendedAlbums = await api.getRecommendations(data);
    setAlbums(recommendedAlbums);

    // Carga los favoritos específicos del usuario actual (o invitado) desde la API
    const userFavorites = await api.getFavorites();
    setFavorites(userFavorites);
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const handleDeleteAlbum = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const currentAlbums = await api.getAlbums();
    const filtered = currentAlbums.filter(a => a.id !== id);
    setAlbums(filtered);
    // Nota: Si luego deseas persistir la eliminación en el catálogo general, puedes actualizar el localStorage de 'catalog_albums' aquí.
  };

  const handleEditAlbum = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/editar/${id}`);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Evita que abra el detalle del álbum
    let updated: string[];
    if (favorites.includes(id)) {
      updated = favorites.filter(favId => favId !== id);
    } else {
      updated = [...favorites, id];
    }
    
    setFavorites(updated);
    // Guarda los favoritos vinculados al usuario actual en la API / localStorage
    await api.saveFavorites(updated);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  // 1. Filtrar por nombre de álbum o género
  const filteredAlbums = albums.filter((album) => {
    if (!searchQuery) return true;
    return (
      album.title.toLowerCase().includes(searchQuery) ||
      album.genre.toLowerCase().includes(searchQuery)
    );
  });

  // 2. Ordenar los álbumes filtrados según el precio
  const sortedAlbums = [...filteredAlbums].sort((a, b) => {
    return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
  });

  return (
    <Box maxW="1200px" mx="auto">
      {/* Cabecera de la sección */}
      <Flex justify="space-between" align="center" mb="16px">
        <Heading size="lg" color="#fff">Recomendados</Heading>
        <Button
          onClick={() => navigate('/agregar')}
          bg="#198754"
          color="#fff"
          size="sm"
          px="20px"
          borderRadius="md"
          fontWeight="bold"
          _hover={{ opacity: 0.9 }}
        >
          Agregar álbum
        </Button>
      </Flex>

      {/* Botón de ordenamiento por precio */}
      <Flex mb="20px">
        <Button
          onClick={toggleSortOrder}
          bg="#242424"
          color="#fff"
          size="sm"
          border="1px solid"
          borderColor="#333"
          _hover={{ bg: '#2a2a2a' }}
        >
          Precio {sortOrder === 'asc' ? '↑' : '↓'}
        </Button>
      </Flex>

      {/* Grilla de álbumes o mensaje si no hay coincidencias */}
      {sortedAlbums.length === 0 ? (
        <Text color="#b3b3b3" textAlign="center" mt="40px">
          No se encontraron álbumes para "{searchParams.get('q')}".
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 6 }} gap="16px">
          {sortedAlbums.map((album) => {
            const isFav = favorites.includes(album.id);
            return (
              <Box
                key={album.id}
                onClick={() => navigate(`/album/${album.id}`)}
                bg="#181818"
                borderRadius="md"
                overflow="hidden"
                cursor="pointer"
                border="1px solid"
                borderColor="#282828"
                position="relative"
                transition="all 0.2s"
                _hover={{ borderColor: '#404040' }}
              >
                {/* Contenedor de la imagen con margen interior */}
                <Box p="10px" pb="0">
                  <Box position="relative" borderRadius="sm" overflow="hidden">
                    <Image
                      src={album.coverUrl}
                      alt={album.title}
                      w="100%"
                      h="160px"
                      objectFit="cover"
                      borderRadius="sm"
                    />
                    {/* Botones superiores (Eliminar y Editar a la izquierda) */}
                    <Flex position="absolute" top="6px" left="6px" gap="4px" zIndex="2">
                      <Box
                        as="button"
                        onClick={(e) => handleDeleteAlbum(e, album.id)}
                        bg="#dc3545"
                        color="#fff"
                        p="5px"
                        borderRadius="sm"
                        _hover={{ opacity: 0.8 }}
                      >
                        <FiTrash2 size="13px" />
                      </Box>
                      <Box
                        as="button"
                        onClick={(e) => handleEditAlbum(e, album.id)}
                        bg="#0d6efd"
                        color="#fff"
                        p="5px"
                        borderRadius="sm"
                        _hover={{ opacity: 0.8 }}
                      >
                        <FiSettings size="13px" />
                      </Box>
                    </Flex>

                    {/* Botón de Favorito (Corazón a la derecha) */}
                    <Box
                      as="button"
                      onClick={(e) => handleToggleFavorite(e, album.id)}
                      position="absolute"
                      top="6px"
                      right="6px"
                      bg="rgba(0,0,0,0.6)"
                      color={isFav ? '#ff4d4f' : '#fff'}
                      p="5px"
                      borderRadius="sm"
                      zIndex="2"
                      _hover={{ opacity: 0.9 }}
                    >
                      <FiHeart size="15px" fill={isFav ? '#ff4d4f' : 'none'} />
                    </Box>
                  </Box>
                </Box>

                {/* Información del álbum */}
                <Box p="12px">
                  <Heading size="xs" color="#fff" mb="4px">
                    {album.title}
                  </Heading>
                  <Text fontSize="xs" color="#b3b3b3" mb="4px">
                    {album.artist}
                  </Text>
                  <Text fontSize="xs" color="#888" mb="8px">
                    {album.genre} {album.format}
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" color="#fff">
                    ${album.price.toLocaleString()}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
};