import { Flex, Button, Text } from '@chakra-ui/react';

interface Props {
  pagina: number;
  totalPaginas: number;
  onCambiar: (pagina: number) => void;
}

// Números a mostrar: primera, última y las cercanas a la actual; null = "…"
const numeros = (actual: number, total: number): (number | null)[] => {
  const visibles = new Set([1, total, actual - 2, actual - 1, actual, actual + 1, actual + 2]);
  const lista = [...visibles].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
  const resultado: (number | null)[] = [];
  lista.forEach((n, i) => {
    if (i > 0 && n - lista[i - 1] > 1) resultado.push(null);
    resultado.push(n);
  });
  return resultado;
};

export const Paginacion = ({ pagina, totalPaginas, onCambiar }: Props) => {
  if (totalPaginas <= 1) return null;

  const estilo = (activa: boolean) => ({
    size: 'sm' as const,
    minW: '36px',
    bg: activa ? '#5e35b1' : '#242424',
    color: '#fff',
    border: '1px solid',
    borderColor: activa ? '#5e35b1' : '#333',
    _hover: { bg: activa ? '#5e35b1' : '#2a2a2a' }
  });

  return (
    <Flex justify="center" align="center" gap="6px" mt="32px" mb="16px" wrap="wrap">
      <Button {...estilo(false)} onClick={() => onCambiar(pagina - 1)} disabled={pagina <= 1} aria-label="Página anterior">
        ‹
      </Button>
      {numeros(pagina, totalPaginas).map((n, i) =>
        n === null ? (
          <Text key={`hueco-${i}`} color="#888" px="4px">…</Text>
        ) : (
          <Button
            key={n}
            {...estilo(n === pagina)}
            onClick={() => onCambiar(n)}
            aria-current={n === pagina ? 'page' : undefined}
          >
            {n}
          </Button>
        )
      )}
      <Button {...estilo(false)} onClick={() => onCambiar(pagina + 1)} disabled={pagina >= totalPaginas} aria-label="Página siguiente">
        ›
      </Button>
    </Flex>
  );
};
