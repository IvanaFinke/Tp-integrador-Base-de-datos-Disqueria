import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Album } from '../types';
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
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      api.getAlbumById(id).then(data => {
        setAlbum(data || null);
        setLoading(false);
      });
    }
  }, [id]);

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
        <Text color="#b3b3b3">Álbum no encontrado.</Text>
      </Box>
    );
  }

  return (
    <Box maxW="1000px" mx="auto">
      {/* Contenedor Superior: Portada y Datos */}
      <Flex direction={{ base: 'column', md: 'row' }} gap="40px" mb="40px" align="start">
        <Image
          src={album.coverUrl}
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
              <Text fontSize="lg" color="#b3b3b3" mb="24px">{album.artist}</Text>
            </Box>
            <Box cursor="pointer" onClick={() => setIsFavorite(!isFavorite)}>
              <FiHeart size="24px" color="#fff" fill={isFavorite ? '#fff' : 'none'} />
            </Box>
          </Flex>

          <Text fontSize="xs" color="#888" mb="6px">Formato</Text>
          <HStack mb="24px">
            <Box
              bg="#242424"
              color="#fff"
              px="14px"
              py="6px"
              borderRadius="full"
              fontSize="sm"
              border="1px solid"
              borderColor="#333"
            >
              {album.format} ↓
            </Box>
          </HStack>

          <Text fontSize="2xl" fontWeight="bold" color="#fff" mb="24px">
            ${album.price.toLocaleString()}
          </Text>

          <Button
            onClick={() => navigate(`/comprar/${album.id}`)}
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