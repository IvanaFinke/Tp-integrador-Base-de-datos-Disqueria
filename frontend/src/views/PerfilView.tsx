import { useState } from 'react';
import { Box, Flex, Heading, Text, VStack, HStack, Image, Button } from '@chakra-ui/react';
import { FiHeart } from 'react-icons/fi';

interface FavoriteItem {
  id: string;
  title: string;
  artist: string;
  format: 'Vinilo' | 'CD';
  price: number;
  coverUrl: string;
}

export const ProfileView = () => {
  // Mock de favoritos basado en el diseño
  const [favorites, setFavorites] = useState<FavoriteItem[]>([
    {
      id: '1',
      title: 'Compass: A new Mili symphony',
      artist: 'Mili',
      format: 'Vinilo',
      price: 10000,
      coverUrl: 'https://i.imgur.com/34X4h0n.jpg'
    },
    {
      id: '2',
      title: 'Compass: A new Mili symphony',
      artist: 'Mili',
      format: 'CD',
      price: 10000,
      coverUrl: 'https://i.imgur.com/34X4h0n.jpg'
    },
    {
      id: '3',
      title: 'Compass: A new Mili symphony',
      artist: 'Mili',
      format: 'CD',
      price: 10000,
      coverUrl: 'https://i.imgur.com/34X4h0n.jpg'
    },
    {
      id: '4',
      title: 'Compass: A new Mili symphony',
      artist: 'Mili',
      format: 'CD',
      price: 10000,
      coverUrl: 'https://i.imgur.com/34X4h0n.jpg'
    }
  ]);

  const handleClearFavorites = () => {
    setFavorites([]);
  };

  return (
    <Box maxW="900px" mx="auto">
      <Flex justify="space-between" align="center" mb="24px">
        <Heading size="lg" color="#fff">Mis favoritos</Heading>
        {favorites.length > 0 && (
          <Button
            onClick={handleClearFavorites}
            bg="#dc3545"
            color="#fff"
            size="sm"
            px="16px"
            borderRadius="md"
            fontSize="xs"
            fontWeight="bold"
            _hover={{ opacity: 0.9 }}
          >
            Borrar favoritos
          </Button>
        )}
      </Flex>

      {favorites.length === 0 ? (
        <Box bg="#181818" p="32px" borderRadius="md" textAlign="center" border="1px solid" borderColor="#282828">
          <Text color="#b3b3b3">No tenés álbumes guardados en favoritos.</Text>
        </Box>
      ) : (
        <VStack gap="16px" align="stretch">
          {favorites.map((item, index) => (
            <Flex
              key={index}
              bg="#181818"
              p="16px"
              borderRadius="md"
              border="1px solid"
              borderColor="#282828"
              align="center"
              justify="space-between"
            >
              <HStack gap="16px" align="center">
                <Image
                  src={item.coverUrl}
                  alt={item.title}
                  boxSize="80px"
                  borderRadius="md"
                  objectFit="cover"
                />
                <Box>
                  <Heading size="sm" color="#fff" mb="2px">{item.title}</Heading>
                  <Text fontSize="sm" color="#b3b3b3" mb="6px">{item.artist}</Text>
                  <Text fontSize="xs" color="#888" mb="2px">Formato</Text>
                  <Box
                    as="span"
                    bg="#242424"
                    color="#fff"
                    px="12px"
                    py="2px"
                    borderRadius="full"
                    fontSize="xs"
                    display="inline-block"
                    border="1px solid"
                    borderColor="#333"
                  >
                    {item.format} ↓
                  </Box>
                </Box>
              </HStack>

              <Flex direction="column" align="flex-end" justify="space-between" h="80px">
                <FiHeart color="#fff" fill="#fff" size="18px" />
                <Text fontSize="lg" fontWeight="bold" color="#fff">
                  ${item.price.toLocaleString()}
                </Text>
              </Flex>
            </Flex>
          ))}
        </VStack>
      )}
    </Box>
  );
};