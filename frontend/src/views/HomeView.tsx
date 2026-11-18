import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError, onErrorPortada } from '../services/api';
import type { Album } from '../types';
import { Paginacion } from '../components/Paginacion';
import {
  Box,
  Flex,
  Heading,
  Text,
  Image,
  Button,
  SimpleGrid,
  Spinner
} from '@chakra-ui/react';
import { FiTrash2, FiSettings, FiHeart } from 'react-icons/fi';

export const HomeView = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [claveCargada, setClaveCargada] = useState('');
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const recomendadosRef = useRef<Album[] | null>(null);

  const searchQuery = (searchParams.get('q') || '').trim();
  const verTodo = searchParams.get('ver') === 'todo';
  const paginado = !!searchQuery || verTodo;
  const pagina = Math.max(1, Number(searchParams.get('pagina')) || 1);

  // Hasta que llegan los datos de la consulta actual se muestra "cargando"
  const clave = `${searchQuery}|${verTodo}|${pagina}|${sortOrder}`;
  const loading = claveCargada !== clave;

  // Recomendados por defecto; búsqueda o catálogo completo con páginas (espera a que se deje de tipear).
  useEffect(() => {
    let vigente = true;
    const espera = setTimeout(async () => {
      try {
        if (paginado) {
          const datos = await api.getCatalog(searchQuery, sortOrder, pagina);
          if (vigente) {
            setAlbums(datos.items);
            setTotal(datos.total);
            setTotalPaginas(datos.totalPaginas);
          }
        } else {
          // Se guardan para que, al borrar la búsqueda, vuelvan los mismos recomendados
          const datos = recomendadosRef.current ?? (await api.getRecommendations('asc'));
          recomendadosRef.current = datos;
          const ordenados = [...datos].sort((a, b) => (sortOrder === 'asc' ? a.price - b.price : b.price - a.price));
          if (vigente) setAlbums(ordenados);
        }
        if (vigente) setError('');
      } catch (e) {
        console.error(e);
        if (vigente) {
          setAlbums([]);
          setError(e instanceof Error ? e.message : 'No se pudieron cargar los álbumes.');
        }
      } finally {
        if (vigente) setClaveCargada(clave);
      }
    }, searchQuery ? 300 : 0);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [clave, searchQuery, paginado, pagina, sortOrder]);

  // Cambia de página conservando la búsqueda o el modo catálogo
  const cambiarPagina = (nueva: number) => {
    const params = new URLSearchParams(searchParams);
    if (nueva > 1) params.set('pagina', String(nueva));
    else params.delete('pagina');
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    api.getFavorites().then(setFavorites).catch(() => setFavorites([]));
  }, []);

  const handleDeleteAlbum = async (e: React.MouseEvent, album: Album) => {
    e.stopPropagation();
    if (!window.confirm(`¿Eliminar "${album.title}" del catálogo?`)) return;
    try {
      await api.deleteAlbum(album.id);
      setAlbums(prev => prev.filter(a => a.id !== album.id));
      recomendadosRef.current = recomendadosRef.current?.filter(a => a.id !== album.id) ?? null;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar el álbum.');
    }
  };

  const handleEditAlbum = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/editar/${id}`);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Evita que abra el detalle del álbum
    if (!(await api.getCurrentUser())) {
      navigate('/login');
      return;
    }
    try {
      if (favorites.includes(id)) {
        await api.removeFavorite(id);
        setFavorites(prev => prev.filter(favId => favId !== id));
      } else {
        await api.addFavorite(id);
        setFavorites(prev => [...prev, id]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar favoritos.');
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    if (pagina > 1) cambiarPagina(1);
  };

  // El backend ya devuelve los álbumes filtrados y ordenados por precio
  const sortedAlbums = albums;

  return (
    <Box maxW="1200px" mx="auto">
      {/* Cabecera de la sección */}
      <Flex justify="space-between" align="center" mb="16px">
        <Box>
          <Heading size="lg" color="#fff">
            {searchQuery ? `Resultados para "${searchQuery}"` : verTodo ? 'Catálogo completo' : 'Recomendados'}
          </Heading>
          {paginado && !loading && total > 0 && (
            <Text fontSize="xs" color="#888" mt="4px">
              {total.toLocaleString('es-AR')} resultados · página {pagina} de {totalPaginas.toLocaleString('es-AR')}
            </Text>
          )}
        </Box>
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

      {/* Botón de ordenamiento por precio y cambio entre recomendados y catálogo completo */}
      <Flex mb="20px" gap="8px">
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
        {!searchQuery && (
          <Button
            onClick={() => setSearchParams(verTodo ? {} : { ver: 'todo' })}
            bg="#242424"
            color="#fff"
            size="sm"
            border="1px solid"
            borderColor="#333"
            _hover={{ bg: '#2a2a2a' }}
          >
            {verTodo ? 'Ver recomendados' : 'Ver catálogo completo'}
          </Button>
        )}
      </Flex>

      {error && (
        <Text color="#ff4d4f" mb="16px">{error}</Text>
      )}

      {/* Grilla de álbumes o mensaje si no hay coincidencias */}
      {loading ? (
        <Flex justify="center" mt="40px">
          <Spinner color="green.400" size="xl" />
        </Flex>
      ) : sortedAlbums.length === 0 ? (
        <Text color="#b3b3b3" textAlign="center" mt="40px">
          {searchQuery ? `No se encontraron álbumes para "${searchQuery}".` : 'No hay álbumes para mostrar.'}
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 6 }} gap="16px">
          {sortedAlbums.map((album) => {
            const isFav = favorites.includes(album.id);
            return (
              <Box
                key={album.idProducto}
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
                      onError={onErrorPortada}
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
                        onClick={(e) => handleDeleteAlbum(e, album)}
                        title="Eliminar álbum"
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
                        title="Modificar álbum"
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
                  <Heading size="xs" color="#fff" mb="4px" lineClamp={2} title={album.title}>
                    {album.title}
                  </Heading>
                  <Text fontSize="xs" color="#b3b3b3" mb="4px" lineClamp={1}>
                    {album.artist}
                  </Text>
                  <Text fontSize="xs" color="#888" mb="8px" lineClamp={1}>
                    {album.format} · {album.genre}
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" color="#fff">
                    ${album.price.toLocaleString('es-AR')}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </SimpleGrid>
      )}

      {paginado && !loading && (
        <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={cambiarPagina} />
      )}
    </Box>
  );
};