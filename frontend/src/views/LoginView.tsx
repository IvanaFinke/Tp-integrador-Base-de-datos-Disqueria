import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  Button,
  VStack
} from '@chakra-ui/react';

export const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [ingresando, setIngresando] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIngresando(true);
    setError('');
    try {
      // Valida el usuario contra la tabla usuario de MySQL
      await api.login(email, password);
      const volver = searchParams.get('volver');
      navigate(volver && volver.startsWith('/') ? volver : '/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.');
      setIngresando(false);
    }
  };

  return (
    <Flex justify="center" align="center" minH="70vh">
      <Box
        bg="#181818"
        p="40px"
        borderRadius="md"
        border="1px solid"
        borderColor="#282828"
        w="full"
        maxW="400px"
      >
        <Heading size="lg" color="#fff" mb="8px" textAlign="center">
          Minimalist Record Store
        </Heading>
        <Text fontSize="sm" color="#b3b3b3" mb="24px" textAlign="center">
          Iniciá sesión para ver tus recomendaciones y pedidos
        </Text>

        <Box as="form" onSubmit={handleLogin}>
          <VStack gap="16px" align="stretch">
            <Box>
              <Text fontSize="sm" color="#b3b3b3" mb="6px">Email</Text>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                bg="#242424"
                border="1px solid"
                borderColor="#333"
                color="#fff"
                _placeholder={{ color: '#666' }}
                required
              />
            </Box>

            <Box>
              <Text fontSize="sm" color="#b3b3b3" mb="6px">Contraseña</Text>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                bg="#242424"
                border="1px solid"
                borderColor="#333"
                color="#fff"
                _placeholder={{ color: '#666' }}
                required
              />
            </Box>

            {error && <Text fontSize="sm" color="#ff4d4f">{error}</Text>}

            <Button
              type="submit"
              bg="#6f42c1"
              color="#fff"
              size="md"
              w="full"
              mt="8px"
              fontWeight="bold"
              loading={ingresando}
              _hover={{ bg: '#5a329d' }}
            >
              INICIAR SESIÓN
            </Button>

            <Text fontSize="xs" color="#888" textAlign="center">
              Usuario de prueba: demo@disqueria.com · contraseña demo1234
            </Text>
          </VStack>
        </Box>
      </Box>
    </Flex>
  );
};
