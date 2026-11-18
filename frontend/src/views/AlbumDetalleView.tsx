import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, ApiError, onErrorPortada } from '../services/api';
import type { AlbumDetalle } from '../types';
import {
  Box,
  Flex,
  Heading,
  Text,
  Image,
  Button,
  VStack,
  HStack,
  Spinner
} from '@chakra-ui/react';
import { FiHeart, FiStar } from 'react-icons/fi';

export const AlbumDetailView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<AlbumDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [idProducto, setIdProducto] = useState<number | null>(null);

  useEffect(() => {
    const loadAlbumDetail = async () => {
      if (!id) return;
      try {
        const data = await api.getAlbumById(id);
        setAlbum(data || null);
        setIdProducto(data?.productos[0]?.idProducto ?? null);
        if (data) {
          const savedFavorites = await api.getFavorites();
          setIsFavorite(savedFavorites.includes(data.id));
        }
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No se pudo cargar el álbum.');
      } finally {
        setLoading(false);
      }
    };

    loadAlbumDetail();
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!album) return;
    if (!(await api.getCurrentUser())) {
      navigate('/login');
      return;
    }
    try {
      if (isFavorite) {
        await api.removeFavorite(album.id);
      } else {
        await api.addFavorite(album.id);
      }
      setIsFavorite(!isFavorite);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo actualizar favoritos.');
    }
  };

  const producto = album?.productos.find(p => p.idProducto === idProducto);

  if (loading) {
    return (
      <Flex justify="center" align="center" mt="40px">
        <Spinner color="green.400" size="xl" />
      </Flex>
    );
  }

  if (!album) {
    return (
      <Box textAlign="center" mt="40px">
        <Text color={error ? '#ff4d4f' : '#b3b3b3'}>{error || 'Álbum no encontrado.'}</Text>
      </Box>
    );
  }

  return (
    <Box maxW="1000px" mx="auto">
      {/* Contenedor Superior: Portada y Datos */}
      <Flex direction={{ base: 'column', md: 'row' }} gap="40px" mb="40px" align="start">
        <Image
          src={album.coverUrl}
          onError={onErrorPortada}
          alt={album.title}
          boxSize={{ base: '100%', md: '380px' }}
          borderRadius="md"
          objectFit="cover"
          border="1px solid"
          borderColor="#282828"
        />

        <Box flex="1">
          <Flex justify="space-between" align="start">
            <Box>
              <Heading size="xl" color="#fff" mb="8px">{album.title}</Heading>
              <Text fontSize="lg" color="#b3b3b3" mb="8px">{album.artist}</Text>
              <Text fontSize="sm" color="#888" mb="24px">{album.genre}</Text>
            </Box>
            <Box
              as="button"
              cursor="pointer"
              onClick={handleToggleFavorite}
              title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              _hover={{ transform: 'scale(1.1)' }}
              transition="transform 0.15s"
            >
              <FiHeart
                size="24px"
                color={isFavorite ? '#ff4d4f' : '#fff'}
                fill={isFavorite ? '#ff4d4f' : 'none'}
              />
            </Box>
          </Flex>

          <Text fontSize="xs" color="#888" mb="6px">Formato</Text>
          <HStack mb="24px">
            {album.productos.length === 0 ? (
              <Text fontSize="sm" color="#b3b3b3">No disponible a la venta</Text>
            ) : (
              <select
                value={idProducto ?? ''}
                onChange={(e) => setIdProducto(Number(e.target.value))}
                style={{
                  backgroundColor: '#242424',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '14px',
                  border: '1px solid #333',
                  cursor: 'pointer'
                }}
              >
                {album.productos.map(p => (
                  <option key={p.idProducto} value={p.idProducto}>{p.format}</option>
                ))}
              </select>
            )}
          </HStack>

          {producto && (
            <>
              <Text fontSize="2xl" fontWeight="bold" color="#fff" mb="4px">
                ${producto.price.toLocaleString('es-AR')}
              </Text>
              <Text fontSize="xs" color={producto.stock > 0 ? '#888' : '#ff4d4f'} mb="24px">
                {producto.stock > 0 ? `${producto.stock} unidades disponibles` : 'Sin stock'}
              </Text>
            </>
          )}

          {error && <Text color="#ff4d4f" fontSize="sm" mb="12px">{error}</Text>}

          <Button
            disabled={!producto || producto.stock === 0}
            onClick={() => producto && navigate(`/comprar/${album.id}?producto=${producto.idProducto}`)}
            bg="#5e35b1"
            color="#fff"
            size="lg"
            px="32px"
            borderRadius="md"
            fontWeight="bold"
            _hover={{ opacity: 0.9 }}
          >
            COMPRAR AHORA
          </Button>
        </Box>
      </Flex>

      {/* Sección de Reseñas */}
      <Box borderTop="1px solid" borderColor="#282828" pt="32px">
        <Heading size="md" color="#fff" mb="20px">Reseñas</Heading>
        {album.reviews && album.reviews.length > 0 ? (
          <VStack gap="16px" align="stretch">
            {album.reviews.map(review => (
              <Box
                key={review.id}
                bg="#181818"
                p="16px"
                borderRadius="md"
                border="1px solid"
                borderColor="#282828"
              >
                <HStack mb="8px" gap="10px">
                  <Text fontSize="sm" fontWeight="bold" color="#fff">Review by {review.author}</Text>
                  {review.title && <Text fontSize="sm" color="#b3b3b3">· {review.title}</Text>}
                  <HStack gap="2px">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        size="14px"
                        color={i < review.rating ? '#198754' : '#444'}
                        fill={i < review.rating ? '#198754' : 'none'}
                      />
                    ))}
                  </HStack>
                </HStack>
                <Text fontSize="sm" color="#b3b3b3">{review.comment}</Text>
              </Box>
            ))}
          </VStack>
        ) : (
          <Text fontSize="sm" color="#888">Este álbum aún no tiene reseñas.</Text>
        )}
      </Box>
    </Box>
  );
};