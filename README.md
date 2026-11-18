git # Tp-integrador-Base-de-datos-Disqueria
Disquería: catálogos de álbumes, lista de favoritos del usuario y compra.

link a documentacion: https://docs.google.com/document/d/1uHZjJD3Udt9dtYm92ojBpsg78fzEv9_YPbbJnkKIL9Y/edit?usp=sharing 

Dentro de la carpeta database > data > procesada:
-albumes.json = archivo con los albumes con genero y artista ordenados y limpiados
-reviews.json = archivo con las reseñas de los albumes, mongo le asigna id automatico,
referencia con amazon_id al album. Con el fin de acortar tamaño del archivo reviews.json
se redujo la cantidad de reseñas a maximo 2 por album.
Ojo que hay albumes que ya venian
con 1 unica reseña.

## Estructura

| Carpeta | Contenido |
|---|---|
| `database/` | `modelo_relacional.sql` (estructura MySQL), `datos_iniciales.sql` (usuarios, productos, favoritos y pedidos), `scripts_nosql/` (carga, índices y consultas de MongoDB), `data/procesada/` (JSON limpios) y los scripts de limpieza en Python |
| `backend/` | API REST en Node + TypeScript + Express. Endpoints en `backend/README.md` |
| `frontend/` | Aplicación React + TypeScript + Chakra UI |

## Cómo levantar el proyecto

Requisitos: [Docker Desktop](https://www.docker.com/products/docker-desktop/) (abierto) y [Node.js 22 LTS](https://nodejs.org/).

**1. Bases de datos.** Desde la raíz del repositorio:

```bash
docker compose up -d
```

Levanta MySQL (puerto 3306) y MongoDB (puerto 27017) y los carga automáticamente la primera vez (tarda uno o dos minutos). Para recargar los datos desde cero: `docker compose down -v` y de nuevo `docker compose up -d`.

**2. Backend.** En otra terminal:

```bash
cd backend
cp .env.example .env      # en Windows (cmd/PowerShell): copy .env.example .env
npm install
npm run dev
```

Queda en `http://localhost:3000/api`. Para verificar que las dos bases responden: `http://localhost:3000/api/salud`.

**3. Frontend.** En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Queda en `http://localhost:5173`.

## Cómo probarlo

- Desde el frontend, recorriendo las pantallas. Para favoritos, compras y pedidos hay que iniciar sesión con un usuario de prueba: `demo@disqueria.com`, `meel@disqueria.com` o `luz@disqueria.com`, todos con la contraseña `demo1234`.
- Con `backend/pruebas.http` (extensión REST Client de VS Code), que tiene un request de prueba para cada endpoint.

## Sin Docker

**Opción rápida en Windows:** con MySQL 8, MongoDB (como servicio), mongosh y Node instalados, hacé doble clic en `levantar.bat`. Pide la contraseña de root de MySQL, carga las dos bases, configura el backend, instala las dependencias, levanta backend y frontend y abre la página.

**Paso a paso:**

Con MySQL 8 y MongoDB 7 instalados localmente:

1. Ejecutar `database/modelo_relacional.sql` y luego `database/datos_iniciales.sql` (por ejemplo, en MySQL Workbench).
2. Desde la raíz del repositorio: `mongosh database/scripts_nosql/01_importar.js` y luego `mongosh database/scripts_nosql/02_indices.js`.
3. Levantar backend y frontend como se indica arriba.

`datos_iniciales.sql` se genera a partir de `database/data/procesada/albumes.json` con `node database/script/generarDatosIniciales.js`; solo hace falta volver a correrlo si cambian los JSON.
