import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { api, ApiError, onErrorPortada } from '../services/api';
import type { AlbumDetalle } from '../types';
import {
  Box,
  Flex,
  Heading,
  Text,
  Image,
  Input,
  Button,
  VStack,
  HStack,
  Spinner
} from '@chakra-ui/react';
import { FiCheckCircle } from 'react-icons/fi';

type Campo = 'email' | 'telefono' | 'calle' | 'altura';

export const CheckoutView = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<AlbumDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({});

  // Estado para controlar el toast verde flotante
  const [successToast, setSuccessToast] = useState<{ id: number; price: number } | null>(null);

  // Campos del formulario
  const [cantidad, setCantidad] = useState(1);
  const [mail, setMail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [calle, setCalle] = useState('');
  const [altura, setAltura] = useState('');

  useEffect(() => {
    const cargar = async () => {
      const user = await api.getCurrentUser();
      if (!user) {
        navigate(`/login?volver=${encodeURIComponent(location.pathname + location.search)}`);
        return;
      }
      setMail(user.email);
      if (!id) return;
      try {
        setAlbum((await api.getAlbumById(id)) || null);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No se pudo cargar el álbum.');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id, navigate, location.pathname, location.search]);

  const idProducto = Number(searchParams.get('producto'));
  const producto = album?.productos.find(p => p.idProducto === idProducto) ?? album?.productos[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!album || !producto) return;
    setEnviando(true);
    setError('');
    setErrores({});
    try {
      const newOrder = await api.createOrder({
        idProducto: producto.idProducto,
        cantidad,
        email: mail,
        telefono,
        calle,
        altura
      });

      // Activar el toast verde flotante
      setSuccessToast({ id: newOrder.id, price: newOrder.total });

      // Esperar 3 segundos para que se vea el toast antes de redirigir
      setTimeout(() => {
        navigate('/pedidos');
      }, 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setErrores(err.errores ?? {});
      } else {
        setError('No se pudo realizar el pedido.');
      }
      setEnviando(false);
    }
  };

  const estiloInput = (campo: Campo) => ({
    bg: '#242424',
    border: '1px solid',
    borderColor: errores[campo] ? '#ff4d4f' : '#333',
    color: '#fff',
    p: '10px'
  });

  const mensajeCampo = (campo: Campo) =>
    errores[campo] ? <Text fontSize="xs" color="#ff4d4f" mt="4px">{errores[campo]}</Text> : null;

  if (loading) {
    return (
      <Flex justify="center" align="center" mt="40px">
        <Spinner color="green.400" size="xl" />
      </Flex>
    );
  }

  if (!album || !producto) {
    return <Text color="#b3b3b3" textAlign="center">{error || 'Álbum no encontrado para compra.'}</Text>;
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
              <Text fontSize="xs">#{successToast.id} - ${successToast.price.toLocaleString('es-AR')}</Text>
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
        <Flex align="center" justify="space-between" gap="16px">
          <Flex align="center" gap="16px">
            <Image
              src={album.coverUrl}
              onError={onErrorPortada}
              alt={album.title}
              boxSize="60px"
              borderRadius="sm"
              objectFit="cover"
            />
            <Box>
              <Heading size="sm" color="#fff" mb="2px">{album.title}</Heading>
              <Text fontSize="xs" color="#b3b3b3" mb="2px">{album.artist}</Text>
              <Text fontSize="xs" color="#888">Formato {producto.format}</Text>
            </Box>
          </Flex>
          <Box textAlign="right">
            <HStack justify="flex-end" gap="6px" mb="4px">
              <Button
                size="xs"
                bg="#242424"
                color="#fff"
                onClick={() => setCantidad(c => Math.max(1, c - 1))}
                disabled={cantidad <= 1}
              >
                −
              </Button>
              <Text fontSize="xs" color="#888" minW="70px" textAlign="center">cant {cantidad} unid.</Text>
              <Button
                size="xs"
                bg="#242424"
                color="#fff"
                onClick={() => setCantidad(c => Math.min(producto.stock, c + 1))}
                disabled={cantidad >= producto.stock}
              >
                +
              </Button>
            </HStack>
            <Text fontSize="md" fontWeight="bold" color="#fff">
              ${(producto.price * cantidad).toLocaleString('es-AR')}
            </Text>
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
            <Input type="email" value={mail} onChange={(e) => setMail(e.target.value)} {...estiloInput('email')} />
            {mensajeCampo('email')}
          </Box>

          <Box>
            <Text fontSize="sm" color="#fff" mb="6px">Teléfono</Text>
            <Input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="11-4445-7753"
              {...estiloInput('telefono')}
            />
            {mensajeCampo('telefono')}
          </Box>

          <Box>
            <Text fontSize="sm" color="#fff" mb="6px">Calle</Text>
            <Input
              type="text"
              value={calle}
              onChange={(e) => setCalle(e.target.value)}
              placeholder="Los cerros"
              {...estiloInput('calle')}
            />
            {mensajeCampo('calle')}
          </Box>

          <Box>
            <Text fontSize="sm" color="#fff" mb="6px">Altura</Text>
            <Input
              type="text"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              placeholder="4426"
              {...estiloInput('altura')}
            />
            {mensajeCampo('altura')}
          </Box>

          {error && <Text color="#ff4d4f" fontSize="sm">{error}</Text>}

          <Button
            type="submit"
            bg="#3b82f6"
            color="#fff"
            mt="12px"
            w="120px"
            loading={enviando}
            disabled={producto.stock === 0 || !!successToast}
            _hover={{ opacity: 0.9 }}
          >
            Comprar
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};
