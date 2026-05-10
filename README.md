# Recetario — Backend (Node.js + Express + MySQL)

API REST que da soporte a la aplicación React de recetario.  
Autenticación basada en **JWT** enviado como cookie `httpOnly` y opcionalmente como cabecera `Authorization: Bearer`.

---

## Requisitos

- Node.js ≥ 18
- MySQL 8 con el esquema `bd.sql` importado

---

## Instalación

```bash
cd recetario-backend
npm install
cp .env.example .env   # rellena las variables
npm run dev
```

---

## Variables de entorno (`.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `DB_HOST` | Host MySQL | `localhost` |
| `DB_PORT` | Puerto MySQL | `3306` |
| `DB_USER` | Usuario MySQL | `root` |
| `DB_PASSWORD` | Contraseña MySQL | `secret` |
| `DB_NAME` | Base de datos | `recetario` |
| `JWT_SECRET` | Secreto JWT (largo y aleatorio) | `…` |
| `JWT_EXPIRES_IN` | Expiración del token | `7d` |
| `COOKIE_SECRET` | Secreto para firmar cookies | `…` |
| `COOKIE_MAX_AGE_MS` | Duración cookie en ms | `604800000` |
| `CLIENT_URL` | Origen del frontend (CORS) | `http://localhost:5173` |
| `UPLOADS_DIR` | Carpeta de imágenes subidas | `uploads` |
| `MAX_FILE_SIZE_MB` | Tamaño máximo de imagen | `5` |

---

## Estructura del proyecto

```
src/
├── config/
│   ├── db.js          # Pool de conexiones MySQL
│   └── multer.js      # Config subida de imágenes
├── controllers/
│   ├── auth.controller.js
│   ├── catalog.controller.js
│   ├── friendship.controller.js
│   └── recipe.controller.js
├── middlewares/
│   ├── auth.middleware.js     # requireAuth — verifica JWT
│   ├── validate.middleware.js # maneja errores de express-validator
│   └── error.middleware.js    # errorHandler global
├── models/
│   ├── catalog.model.js
│   ├── friendship.model.js
│   ├── recipe.model.js
│   └── user.model.js
├── routes/
│   ├── auth.routes.js
│   ├── catalog.routes.js
│   ├── friendship.routes.js
│   └── recipe.routes.js
├── utils/
│   ├── jwt.js         # signToken / verifyToken / sendAuthCookie
│   └── response.js    # helpers ok / created / notFound / …
├── app.js             # Express app (CORS, middlewares, rutas)
└── index.js           # Bootstrap (conecta DB y arranca servidor)
```

---

## Endpoints

> Todas las respuestas tienen la forma `{ ok: true/false, message?, ...datos }`.  
> Las rutas marcadas con 🔒 requieren autenticación.

---

### Auth — `/auth`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/registro` | Registra un nuevo usuario |
| `POST` | `/auth/login` | Inicia sesión, devuelve JWT |
| `POST` | `/auth/logout` | 🔒 Cierra sesión (borra cookie) |
| `GET` | `/auth/me` | 🔒 Devuelve el usuario autenticado |

**POST `/auth/registro`** — body JSON:
```json
{
  "name": "María",
  "email": "maria@example.com",
  "password": "contraseña123",
  "confirm_password": "contraseña123",
  "pais": 65,
  "dieta": "vegetariano",
  "alergenos": [1, 3]
}
```

**POST `/auth/login`** — body JSON:
```json
{
  "email": "maria@example.com",
  "password": "contraseña123"
}
```

---

### Catálogos — `/catalogs` (público)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/catalogs` | Devuelve países, alérgenos, tipos de dieta y tipos de plato |

Respuesta:
```json
{
  "ok": true,
  "countries":  [{ "id": 65, "name": " España" }, ...],
  "allergens":  [{ "id": 1,  "name": "Gluten" }, ...],
  "dietTypes":  [{ "id": "omnivoro", "value": "omnivoro", "label": "Omnívoro" }, ...],
  "dishTypes":  [{ "id": 1, "name": "Entrantes y aperitivos" }, ...]
}
```

---

### Recetas — `/recipes` 🔒

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/recipes` | Lista paginada de recetas |
| `GET` | `/recipes/:id` | Detalle de una receta |
| `POST` | `/recipes` | Crea una receta (`multipart/form-data`) |
| `PUT` | `/recipes/:id` | Actualiza una receta (`multipart/form-data`) |
| `DELETE` | `/recipes/:id` | Elimina una receta |
| `POST` | `/recipes/:id/favorite` | Añade a favoritos |
| `DELETE` | `/recipes/:id/favorite` | Elimina de favoritos |

**GET `/recipes`** — query params:

| Param | Tipo | Descripción |
|-------|------|-------------|
| `page` | number | Página (default: 1) |
| `limit` | number | Resultados por página (default: 6, max: 50) |
| `search` | string | Búsqueda por nombre o descripción |
| `filter` | string | `favoritas` \| `rapidas` (≤30 min) |

**POST / PUT `/recipes`** — `multipart/form-data`:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | string | Nombre de la receta (**obligatorio**) |
| `dishTypeId` | number | ID tipo de plato (**obligatorio**) |
| `description` | string | Descripción |
| `servings` | number | Raciones (default: 1) |
| `countryId` | number | ID país de origen |
| `isVegetarian` | boolean | |
| `isVegan` | boolean | |
| `isPublic` | boolean | Visible para todos |
| `observations` | string | Notas adicionales |
| `prepTimeActive` | number | Minutos de preparación activa |
| `prepTimePassive` | number | Minutos de preparación pasiva (reposo, etc.) |
| `prepTimeTotal` | number | Minutos totales |
| `ingredients` | JSON string | Array de `{ ingredient_text, quantity?, unit? }` |
| `steps` | JSON string | Array de `{ description }` |
| `allergenIds` | JSON string | Array de IDs de alérgenos |
| `photo` | file | Imagen (jpeg/png/webp/gif, max 5 MB) |

---

### Amigos — `/friends` 🔒

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/friends` | Lista de amigos aceptados |
| `GET` | `/friends/pending` | Solicitudes pendientes recibidas |
| `POST` | `/friends/request` | Envía solicitud de amistad |
| `PATCH` | `/friends/:id/accept` | Acepta una solicitud |
| `PATCH` | `/friends/:id/block` | Bloquea un usuario |
| `DELETE` | `/friends/:id` | Elimina amistad o solicitud |

**POST `/friends/request`** — body JSON:
```json
{ "username": "juan" }
```

---

## Códigos de respuesta

| Código | Significado |
|--------|-------------|
| `200` | OK |
| `201` | Creado |
| `204` | Sin contenido (DELETE exitoso) |
| `400` | Datos inválidos |
| `401` | No autenticado |
| `403` | Sin permisos |
| `404` | No encontrado |
| `409` | Conflicto (usuario/email ya existe, etc.) |
| `413` | Archivo demasiado grande |
| `429` | Demasiadas peticiones (rate limit) |
| `500` | Error interno |
