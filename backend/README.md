# Backend – Disquería

API REST en **Node + TypeScript + Express**. Cada motor maneja sus propios datos:

| Motor | Datos |
|---|---|
| **MongoDB** | Catálogo: `albumes` (artista y géneros embebidos) y `resenas` |
| **MySQL** | Usuarios, productos (formato, precio, stock), favoritos y pedidos |

Los dos se vinculan por `amazon_id`, una referencia lógica que controla el backend
(por ejemplo, antes de guardar un favorito se verifica que el álbum exista en Mongo).

## Cómo levantarlo

Requisitos: Node 20+ y Docker (o MySQL 8 + MongoDB 7 instalados a mano).

```bash
# 1. Generar los datos iniciales de MySQL (una sola vez, desde la raíz del proyecto)
node database/script/generarDatosIniciales.js

# 2. Levantar MySQL y MongoDB ya cargados
docker compose up -d
#    para recargar desde cero: docker compose down -v && docker compose up -d

# 3. Backend
cd backend
cp .env.example .env
npm install
npm run dev          # http://localhost:3000/api
```

Sin Docker: ejecutar `database/modelo_relacional.sql` y luego `database/datos_iniciales.sql`
en MySQL Workbench, y en Mongo:

```bash
mongosh database/scripts_nosql/01_importar.js
mongosh database/scripts_nosql/02_indices.js
```

Verificar que las dos bases responden: `GET http://localhost:3000/api/salud`.
Para probar todos los endpoints: `pruebas.http` con la extensión REST Client de VS Code.

## Endpoints

Base: `http://localhost:3000/api`. Errores: `{ "error": "mensaje" }` con código 400/404/409/503.

### Catálogo

| Método | Ruta | Pantalla del Figma | Descripción |
|---|---|---|---|
| GET | `/recomendados?orden=asc\|desc&limite=24` | Inicio | Recomendaciones por géneros de los favoritos (o al azar si no tiene) |
| GET | `/catalogo?texto=&genero=&orden=asc\|desc&pagina=1&tamanio=24` | Barra de búsqueda | `texto` busca en título **o** género |
| GET | `/albumes/:id` | Álbum individual | Álbum + productos (CD/Vinilo) + reseñas |
| GET | `/albumes/:id/resenias` | | Solo reseñas |
| POST | `/albumes` | Agregar álbum | Ver body abajo |
| PUT | `/albumes/:id` | Modificar álbum | Mismo body; `formato`/`precio` opcionales |
| DELETE | `/albumes/:id` | Badge eliminar | Borra álbum y reseñas, da de baja sus productos, lo quita de favoritos |
| GET | `/generos` | | Lista de géneros |
| GET | `/estadisticas/generos?limite=10` | | Cantidad de álbumes y puntaje promedio por género |

Cada item de `/catalogo` y `/recomendados` es **una card**: un álbum en un formato con su precio.

```json
{
  "idProducto": 1, "albumId": "1458389375", "formato": "CD", "precio": 13500, "stock": 5,
  "album": {
    "id": "1458389375", "titulo": "Comfort Zone", "imgUrl": "http://...jpg",
    "artista": { "nombre": "Liz Ramirez", "mbid": "37986d18-..." },
    "generos": ["Jazz", "Pop"]
  }
}
```

`/catalogo` además devuelve `{ pagina, tamanio, total, items }`.

Body de alta/modificación (los campos del formulario del Figma):

```json
{ "titulo": "Compass", "artista": "Mili", "imgUrl": "https://...", "genero": "Rock",
  "formato": "Vinilo", "precio": 10000, "stock": 10 }
```

`genero` acepta un texto o se puede mandar `"generos": ["Rock", "Pop"]`. `stock` es opcional (10).

### Favoritos (usuario fijo de prueba: 1)

| Método | Ruta | Body |
|---|---|---|
| GET | `/usuarios/1/favoritos` | — |
| POST | `/usuarios/1/favoritos` | `{ "albumId": "1458389375" }` (409 si ya está) |
| DELETE | `/usuarios/1/favoritos/:albumId` | — |
| DELETE | `/usuarios/1/favoritos` | Botón "Borrar favoritos" |

### Pedidos

| Método | Ruta | Body |
|---|---|---|
| GET | `/pedidos` (o `?usuario=1`) | — |
| POST | `/pedidos` | `{ "idProducto": 1, "cantidad": 2, "email": "a@b.com", "telefono": "11-4445-7753", "calle": "Los cerros", "altura": 4426 }` |
| PATCH | `/pedidos/:id/estado` | `{ "estado": "pendiente" \| "entregado" \| "cancelado" }` |

`POST /pedidos` devuelve el pedido creado (`idPedido` para el toast "Se ha realizado el pedido #…").
Si hay errores de validación responde 400 con `errores` por campo, para pintar los inputs en rojo:

```json
{ "error": "Hay datos inválidos en el formulario",
  "errores": { "email": "Email inválido", "altura": "Altura inválida" } }
```

Sin stock suficiente responde 409. Cancelar un pedido devuelve las unidades al stock.

### Otros

`GET /salud`: estado de cada motor y qué datos maneja (sirve para mostrar en el front qué base se usa).
`GET /usuarios/1`: datos del usuario.

## Estructura

```
src/
├── config/env.ts            configuración
├── db/                      conexiones (pool MySQL con helper de transacciones, cliente Mongo)
├── dominio/                 modelos y errores de negocio
├── repositorios/
│   ├── mongo/AlbumRepository.ts     álbumes y reseñas
│   └── mysql/                       productos, favoritos, pedidos, usuarios
├── servicios/               lógica de negocio
├── controladores/           traducen HTTP ↔ servicios
├── middlewares/errores.ts   respuestas de error
└── rutas/index.ts
```
