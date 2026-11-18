import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import type { Producto } from '../types';
import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  Button,
  VStack,
  Spinner
} from '@chakra-ui/react';

export const EditAlbumView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [format, setFormat] = useState<'Vinilo' | 'CD'>('Vinilo');
  const [price, setPrice] = useState('');
  const [genre, setGenre] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [encontrado, setEncontrado] = useState(false);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getAlbumById(id)
      .then(album => {
        if (album) {
          setEncontrado(true);
          setTitle(album.title);
          setArtist(album.artist);
          setCoverUrl(album.coverUrl.startsWith('data:') ? '' : album.coverUrl);
          setGenre(album.genre);
          setProductos(album.productos);
          const primero = album.productos[0];
          if (primero) {
            setFormat(primero.format);
            setPrice(String(primero.price));
          }
        }
      })
      .catch(e => setError(e instanceof ApiError ? e.message : 'No se pudo cargar el álbum.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Al cambiar el formato muestra el precio de ese formato, si ya existe
  const handleFormatChange = (nuevo: 'Vinilo' | 'CD') => {
    setFormat(nuevo);
    const existente = productos.find(p => p.format === nuevo);
    setPrice(existente ? String(existente.price) : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setGuardando(true);
    setError('');
    try {
      const stock = productos.find(p => p.format === format)?.stock;
      await api.updateAlbum(id, { title, artist, coverUrl, format, price: Number(price), genre, stock });
      navigate(`/album/${id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el álbum.');
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" mt="40px">
        <Spinner color="green.400" size="xl" />
      </Flex>
    );
  }

  if (!encontrado) {
    return (
      <Text color={error ? '#ff4d4f' : '#b3b3b3'} textAlign="center" mt="40px">
        {error || 'Álbum no encontrado.'}
      </Text>
    );
  }

  return (
    <Box maxW="600px" mx="auto">
      <Heading size="lg" color="#fff" mb="24px">Modificar álbum</Heading>

      <Box
        as="form"
        onSubmit={handleSubmit}
        bg="#181818"
        p="24px"
        borderRadius="md"
        border="1px solid"
        borderColor="#282828"
      >
        <VStack gap="16px" align="stretch">
          <Box>
            <Text fontSize="sm" color="#fff" mb="6px">Título</Text>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              bg="#242424"
              border="1px solid"
              borderColor="#333"
              color="#fff"
              p="10px"
            />
          </Box>

          <Box>
            <Text fontSize="sm" color="#fff" mb="6px">Artista</Text>
            <Input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              bg="#242424"
              border="1px solid"
              borderColor="#333"
              color="#fff"
              p="10px"
            />
          </Box>

          <Box>
            <Text fontSize="sm" color="#fff" mb="6px">URL de la imagen</Text>
            <Input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              bg="#242424"
              border="1px solid"
              borderColor="#333"
              color="#fff"
              p="10px"
            />
          </Box>

          <Box>
            <Text fontSize="sm" color="#fff" mb="6px">Formato</Text>
            <select
              value={format}
              onChange={(e) => handleFormatChange(e.target.value as 'Vinilo' | 'CD')}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: '#242424',
                color: '#fff',
                border: '1px solid #333'
              }}
            >
              <option value="Vinilo">Vinilo</option>
              <option value="CD">CD</option>
            </select>
          </Box>

          <Box>
            <Text fontSize="sm" color="#fff" mb="6px">Precio</Text>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              bg="#242424"
              border="1px solid"
              borderColor="#333"
              color="#fff"
              p="10px"
            />
          </Box>

          <Box>
            <Text fontSize="sm" color="#fff" mb="6px">Género (si son varios, separados por coma)</Text>
            <Input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              bg="#242424"
              border="1px solid"
              borderColor="#333"
              color="#fff"
              p="10px"
            />
          </Box>

          {error && <Text color="#ff4d4f" fontSize="sm">{error}</Text>}

          <Button
            type="submit"
            bg="#3b82f6"
            color="#fff"
            mt="12px"
            w="120px"
            loading={guardando}
            _hover={{ opacity: 0.9 }}
          >
            Guardar
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};