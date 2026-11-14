import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { User } from '../services/api';
import type { Pedido } from '../types';
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner
} from '@chakra-ui/react';

export const PedidosView = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrdersData = async () => {
      const user = await api.getCurrentUser();
      setCurrentUser(user);

      const data = await api.getOrders();
      setPedidos(data);
      setLoading(false);
    };

    loadOrdersData();
  }, []);

  const handleStatusChange = async (id: number, newStatus: Pedido['status']) => {
    await api.updateOrderStatus(id, newStatus);
    setPedidos(prev => 
      prev.map(p => p.id === id ? { ...p, status: newStatus } : p)
    );
  };

  // Función para obtener los colores de fondo y texto según el estado
  const getStatusStyle = (status: Pedido['status']) => {
    switch (status) {
      case 'Entregado':
        return { bg: '#198754', color: '#fff' };
      case 'Pendiente':
        return { bg: '#ffc107', color: '#000' };
      case 'En camino':
        return { bg: '#0dcaf0', color: '#000' };
      case 'Cancelado':
        return { bg: '#dc3545', color: '#fff' };
      default:
        return { bg: '#242424', color: '#fff' };
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" mt="40px">
        <Spinner color="green.400" size="xl" />
      </Flex>
    );
  }

  return (
    <Box maxW="1100px" mx="auto">
      <Heading size="lg" color="#fff" mb="24px">Mis Pedidos</Heading>

      {!currentUser ? (
        <Text color="#b3b3b3" textAlign="center" mt="40px">
          Debes iniciar sesión para ver tus pedidos.
        </Text>
      ) : pedidos.length === 0 ? (
        <Text color="#b3b3b3" textAlign="center" mt="40px">
          No tienes pedidos registrados en tu cuenta.
        </Text>
      ) : (
        <Box
          bg="#181818"
          borderRadius="md"
          border="1px solid"
          borderColor="#282828"
          overflow="hidden"
        >
          <Box as="table" w="full" style={{ borderCollapse: 'collapse', textAlign: 'left' }}>
            <Box as="thead" bg="#222222" borderBottom="1px solid" borderColor="#333">
              <Box as="tr">
                <Box as="th" p="16px" fontSize="sm" color="#b3b3b3" fontWeight="bold">Id pedido</Box>
                <Box as="th" p="16px" fontSize="sm" color="#b3b3b3" fontWeight="bold">Álbum</Box>
                <Box as="th" p="16px" fontSize="sm" color="#b3b3b3" fontWeight="bold">Cantidad</Box>
                <Box as="th" p="16px" fontSize="sm" color="#b3b3b3" fontWeight="bold">Usuario</Box>
                <Box as="th" p="16px" fontSize="sm" color="#b3b3b3" fontWeight="bold">Domicilio</Box>
                <Box as="th" p="16px" fontSize="sm" color="#b3b3b3" fontWeight="bold">Estado</Box>
              </Box>
            </Box>

            <Box as="tbody">
              {pedidos.map((pedido) => {
                const statusStyle = getStatusStyle(pedido.status);
                return (
                  <Box
                    as="tr"
                    key={pedido.id}
                    borderBottom="1px solid"
                    borderColor="#282828"
                    _hover={{ bg: '#202020' }}
                  >
                    <Box as="td" p="16px" fontSize="sm" fontWeight="bold" color="#fff">
                      {pedido.id}
                    </Box>
                    <Box as="td" p="16px" fontSize="sm" color="#fff">
                      {pedido.albumTitle || pedido.albumId}
                    </Box>
                    <Box as="td" p="16px" fontSize="sm" fontWeight="bold" color="#fff">
                      {pedido.quantity}
                    </Box>
                    <Box as="td" p="16px" fontSize="sm" color="#fff">
                      {currentUser.name}
                    </Box>
                    <Box as="td" p="16px" fontSize="sm" color="#b3b3b3">
                      {pedido.address}
                    </Box>
                    <Box as="td" p="16px">
                      <select
                        value={pedido.status}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                          handleStatusChange(pedido.id, e.target.value as Pedido['status'])
                        }
                        style={{
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          border: '1px solid #333',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Pendiente" style={{ background: '#ffc107', color: '#000' }}>Pendiente</option>
                        <option value="Entregado" style={{ background: '#198754', color: '#fff' }}>Entregado</option>
                        <option value="En camino" style={{ background: '#0dcaf0', color: '#000' }}>En camino</option>
                        <option value="Cancelado" style={{ background: '#dc3545', color: '#fff' }}>Cancelado</option>
                      </select>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};