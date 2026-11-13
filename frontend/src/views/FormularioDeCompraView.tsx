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
  Input,
  Button,
  VStack,
  Spinner
} from '@chakra-ui/react';
import { FiCheckCircle } from 'react-icons/fi';

export const CheckoutView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);

  // Estado para controlar el toast verde flotante
  const [successToast, setSuccessToast] = useState<{ id: number; price: number } | null>(null);

  // Campos del formulario
  const [mail, setMail] = useState('usuario@gmail.com');
  const [telefono, setTelefono] = useState('11-4445-7753');
  const [calle, setCalle] = useState('Los cerros');
  const [altura, setAltura] = useState('4426');

  useEffect(() => {
    if (id) {
      api.getAlbumById(id).then(data => {
        setAlbum(data || null);
        setLoading(false);
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!album) return;

    // Crear pedido
    const newOrder = await api.createOrder({
      albumId: album.id,
      albumTitle: album.title,
      quantity: 1,
      userId: 1,
      address: `${calle} ${altura}`,
      status: 'Pendiente'
    });

    // Activar el toast verde flotante
    setSuccessToast({ id: newOrder.id, price: album.price });

    // Esperar 3 segundos para que se vea el toast antes de redirigir
    setTimeout(() => {
      navigate('/pedidos');
    }, 3000);
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" mt="40px">
        <Spinner color="green.400" size="xl" />
      </Flex>
    );
  }

  if (!album) {
    return <Text color="#b3b3b3" textAlign="center">Álbum no encontrado para compra.</Text>;
  }

  return (
    <Box maxW="700px" mx="auto" position="relative">
      {/* Toast Verde Flotante de Éxito */}
      {successToast && (
        <Box
          position="fixed"
          top="24px"
          right="24px"
          bg="#198754"
          color="#fff"
          p="16px 20px"
          borderRadius="md"
          boxShadow="2xl"
          zIndex="9999"
          border="1px solid #146c43"
        >
          <Flex align="center" gap="12px">
            <FiCheckCircle size="22px" />
            <Box>
              <Text fontWeight="bold" fontSize="sm">Se ha realizado el pedido</Text>
              <Text fontSize="xs">#{successToast.id} - ${successToast.price.toLocaleString()}</Text>
            </Box>
          </Flex>
        </Box>
      )}

      <Heading size="lg" color="#fff" mb="24px">Formulario de compra</Heading>

      {/* Resumen del disco seleccionado */}
      <Box
        bg="#181818"
        p="16px"
        borderRadius="md"
        border="1px solid"
        borderColor="#282828"
        mb="24px"
      >
        <Flex align="center" justify="space-between">
          <Flex align="center" gap="16px">
            <Image
              src={album.coverUrl}
              alt={album.title}
              boxSize="60px"
              borderRadius="sm"
              objectFit="cover"
            />
            <Box>
              <Heading size="sm" color="#fff" mb="2px">{album.title}</Heading>
              <Text fontSize="xs" color="#b3b3b3" mb="2px">{album.artist}</Text>
              <Text fontSize="xs" color="#888">Formato {album.format}</Text>
            </Box>
          </Flex>
          <Box textAlign="right">
            <Text fontSize="xs" color="#888">cant 1 unid.</Text>
            <Text fontSize="md" fontWeight="bold" color="#fff">${album.price.toLocaleString()}</Text>
          </Box>
        </Flex>
      </Box>

      {/* Formulario */}
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
            <Text fontSize="sm" color="#fff" mb="6px">Mail</Text>
            <Input
              type="email"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              bg="#242424"
              border="1px solid"
              borderColor="#333"
              color="#fff"
              p="10px"
            />
          </Box>

          <Box>
            <Text fontSize="sm" color="#fff" mb="6px">Teléfono</Text>
            <Input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              bg="#242424"
              border="1px solid"
              borderColor="#333"
              color="#fff"
              p="10px"
            />
          </Box>

          <Box>
            <Text fontSize="sm" color="#fff" mb="6px">Calle</Text>
            <Input
              type="text"
              value={calle}
              onChange={(e) => setCalle(e.target.value)}
              bg="#242424"
              border="1px solid"
              borderColor="#333"
              color="#fff"
              p="10px"
            />
          </Box>

          <Box>
            <Text fontSize="sm" color="#fff" mb="6px">Altura</Text>
            <Input
              type="text"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
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
            Comprar
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};