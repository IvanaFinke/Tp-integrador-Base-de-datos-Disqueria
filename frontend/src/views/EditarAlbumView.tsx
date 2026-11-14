import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
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

  useEffect(() => {
    if (id) {
      api.getAlbumById(id).then(album => {
        if (album) {
          setTitle(album.title);
          setArtist(album.artist);
          setCoverUrl(album.coverUrl);
          setFormat(album.format);
          setPrice(String(album.price));
          setGenre(album.genre);
        }
        setLoading(false);
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const albums = await api.getAlbums();
    const index = albums.findIndex(a => a.id === id);
    if (index !== -1) {
      albums[index] = {
        ...albums[index],
        title,
        artist,
        coverUrl,
        format,
        price: Number(price),
        genre
      };
    }
    navigate('/');
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" mt="40px">
        <Spinner color="green.400" size="xl" />
      </Flex>
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
              onChange={(e) => setFormat(e.target.value as 'Vinilo' | 'CD')}
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
            <Text fontSize="sm" color="#fff" mb="6px">Género</Text>
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

          <Button
            type="submit"
            bg="#3b82f6"
            color="#fff"
            mt="12px"
            w="120px"
            _hover={{ opacity: 0.9 }}
          >
            Guardar
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};