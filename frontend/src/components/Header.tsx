import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Box, Flex, Input, Text, Image } from '@chakra-ui/react';
import { FiHome, FiBox, FiSearch } from 'react-icons/fi';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  // Sincronizar el input si la URL cambia (ej. al volver a inicio)
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (location.pathname !== '/') {
      navigate(value ? `/?q=${encodeURIComponent(value)}` : '/');
    } else {
      if (value.trim()) {
        setSearchParams({ q: value });
      } else {
        setSearchParams({});
      }
    }
  };

  const handleGoHome = () => {
    setQuery('');
    navigate('/');
  };

  return (
    <Box bg="#121212" px="24px" py="16px" borderBottom="1px solid" borderColor="#282828">
      <Flex maxW="1200px" mx="auto" align="center" justify="space-between" gap="16px">
        {/* Botón volver a inicio */}
        <Box
          as="button"
          onClick={handleGoHome}
          color="#fff"
          cursor="pointer"
          _hover={{ opacity: 0.8 }}
          title="Inicio"
        >
          <FiHome size="24px" />
        </Box>

        {/* Barra de búsqueda centrada */}
        <Box position="relative" w="100%" maxW="420px">
          <Box
            position="absolute"
            left="14px"
            top="50%"
            transform="translateY(-50%)"
            color="#555"
            zIndex="2"
            pointerEvents="none"
          >
            <FiSearch size="16px" />
          </Box>
          <Input
            value={query}
            onChange={handleSearchChange}
            placeholder="Álbum o género"
            bg="#fff"
            color="#121212"
            borderRadius="full"
            pl="38px"
            pr="16px"
            h="36px"
            fontSize="sm"
            border="none"
            _placeholder={{ color: '#777' }}
            _focus={{ boxShadow: '0 0 0 2px #1db954' }}
          />
        </Box>

        {/* Sección de ver pedidos y sección del usuario */}
        <Flex align="center" gap="18px">
          <Box
            as="button"
            onClick={() => navigate('/pedidos')}
            color="#fff"
            cursor="pointer"
            _hover={{ opacity: 0.8 }}
            title="Mis pedidos"
          >
            <FiBox size="24px" />
          </Box>

          <Flex
            as="button"
            onClick={() => navigate('/perfil')}
            align="center"
            gap="10px"
            cursor="pointer"
            _hover={{ opacity: 0.8 }}
          >
            {/* <Image
              src="https://i.pravatar.cc/150?img=11"
              alt="Usuario"
              boxSize="32px"
              borderRadius="full"
              objectFit="cover"
            /> */}
            <Text fontSize="sm" fontWeight="semibold" color="#fff">
              Usuario
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
};