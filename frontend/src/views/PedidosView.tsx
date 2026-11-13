import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Pedido } from '../types';
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  Badge
} from '@chakra-ui/react';
import { FiPackage } from 'react-icons/fi';

export const PedidosView = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOrders().then(data => {
      setPedidos(data);
      setLoading(false);
    });
  }, []);

  const getBadgeColor = (status: Pedido['status']) => {
    switch (status) {
      case 'Entregado':
        return { bg: '#198754', color: '#fff' };
      case 'Pendiente':
        return { bg: '#ffc107', color: '#000' };
      case 'En camino':
        return { bg: '#0dcaf0', color: '#000' };
      case 'Cancelado':
        return { bg: '#dc3545', color: '#fff' };
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
      <Heading size="lg" color="#fff" mb="24px">Pedidos</Heading>

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
              const badgeStyle = getBadgeColor(pedido.status);
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
                    {pedido.albumId}
                  </Box>
                  <Box as="td" p="16px" fontSize="sm" fontWeight="bold" color="#fff">
                    {pedido.quantity}
                  </Box>
                  <Box as="td" p="16px" fontSize="sm" color="#fff">
                    {pedido.userId}
                  </Box>
                  <Box as="td" p="16px" fontSize="sm" color="#b3b3b3">
                    {pedido.address}
                  </Box>
                  <Box as="td" p="16px">
                    <Badge
                      bg={badgeStyle.bg}
                      color={badgeStyle.color}
                      px="12px"
                      py="4px"
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="bold"
                      textAlign="center"
                    >
                      {pedido.status}
                    </Badge>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};