# Shortcuts Trainer API

API REST para un entrenador de atajos de teclado. El cliente captura las teclas que se presionan y las envía al servidor; **la API decide si el atajo estuvo bien**, guarda el intento y calcula las estadísticas.

**Autor:** Luque Jonatan

Proyecto 4 — Integrartec 2026.

## Links

| | |
|---|---|
| Deploy | https://apiproyecto4-production.up.railway.app |
| Documentación interactiva | https://apiproyecto4-production.up.railway.app/docs |
| Repositorio | https://github.com/jluque-venturing/API_proyecto4 |

## Idea heredada del Segundo Proyecto Integrador

En el Proyecto 2 el entrenador vivía entero en el navegador: el catálogo de atajos, la comparación de teclas y el historial se guardaban en el store local (Zustand + localStorage). Todo lo que decidía si acertaste o no corría en el cliente.

```
ANTES (Proyecto 2)                  AHORA (Proyecto 4)
┌──────────────┐                    ┌──────────────┐        ┌──────────────┐
│  Navegador   │                    │  Navegador   │  HTTP  │     API      │
│  ─────────── │                    │  ─────────── │ ─────► │  ─────────── │
│  catálogo    │                    │  captura     │        │  compara     │
│  compara     │                    │  teclas      │ ◄───── │  guarda      │
│  guarda      │                    └──────────────┘  JSON  │  calcula     │
│  localStorage│                                            └──────┬───────┘
└──────────────┘                                                   │
                                                            ┌──────▼───────┐
                                                            │  PostgreSQL  │
                                                            └──────────────┘
```

El cambio de fondo: la corrección se movió al servidor. El cliente ya no puede mentir sobre si acertó, porque no conoce la respuesta esperada hasta que la API se la dice.

## Tecnologías

- **NestJS 11** + **TypeScript**
- **Prisma 6** como ORM
- **PostgreSQL**
- **JWT** (access + refresh) con Passport, y bcrypt para las contraseñas
- **Helmet** y **@nestjs/throttler** para seguridad
- **Scalar** + **@nestjs/swagger** para la documentación en `/docs`
- **pnpm** como gestor de paquetes
- Deploy en **Railway**

## Instalación

Requiere Node 20 y pnpm.

```bash
git clone https://github.com/jluque-venturing/API_proyecto4.git
cd API_proyecto4
pnpm install
```

`pnpm install` dispara `prisma generate` automáticamente mediante el script `postinstall`.

## Variables de entorno

Copiá `.env.example` a `.env` y completá los valores:

```bash
cp .env.example .env
```

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | sí | Cadena de conexión a PostgreSQL |
| `JWT_SECRET` | sí | Secreto para firmar el access token |
| `JWT_REFRESH_SECRET` | sí | Secreto para firmar el refresh token, distinto al anterior |
| `JWT_EXPIRES_IN` | no | Vida del access token, por defecto `15m` |
| `JWT_REFRESH_EXPIRES_IN` | no | Vida del refresh token, por defecto `7d` |
| `PORT` | no | Puerto de escucha, por defecto `3000` |
| `CORS_ORIGIN` | no | Orígenes permitidos separados por coma. Sin valor no se permite ningún origen externo |

El archivo `.env` está en `.gitignore` y nunca se commitea. En producción las variables se cargan en el panel de Railway.

## Base de datos

```bash
pnpm prisma migrate dev     # crea las tablas en desarrollo
pnpm prisma db seed         # carga el catálogo de herramientas y atajos
```

El seed es idempotente: hace `upsert` de las herramientas y no vuelve a insertar atajos si el catálogo ya está cargado.

## Levantar el proyecto

```bash
pnpm start:dev      # desarrollo, con watch
pnpm build          # compila a dist/
pnpm start:prod     # producción, requiere pnpm build previo
```

## Tests

```bash
pnpm test           # unitarios
pnpm test:e2e       # end to end
pnpm test:cov       # cobertura
```

## Autenticación

Los endpoints marcados con 🔒 requieren el header:

```
Authorization: Bearer <access_token>
```

El access token se obtiene en `/auth/register` o `/auth/login`. Cuando vence se renueva con `/auth/refresh`, enviando el **refresh token** en ese mismo header.

## Endpoints

### Auth

| Método | Ruta | Auth | Código | Qué hace |
|---|---|---|---|---|
| `POST` | `/auth/register` | — | 201 | Crea un usuario y devuelve access token y refresh token. Body: `email`, `password` (8 a 72), `name` opcional |
| `POST` | `/auth/login` | — | 200 | Devuelve access token y refresh token |
| `POST` | `/auth/refresh` | 🔒 refresh | 200 | Emite un nuevo access token |
| `POST` | `/auth/logout` | 🔒 | 204 | Invalida el refresh token guardado |
| `GET` | `/auth/me` | 🔒 | 200 | Perfil del usuario autenticado |

`register` y `login` están limitados a 5 peticiones por minuto.

### Tools

| Método | Ruta | Auth | Código | Qué hace |
|---|---|---|---|---|
| `GET` | `/tools` | 🔒 | 200 | Lista las herramientas del catálogo |
| `GET` | `/tools/:key` | 🔒 | 200 | Una herramienta por su `key` |

### Shortcuts

| Método | Ruta | Auth | Código | Qué hace |
|---|---|---|---|---|
| `GET` | `/shortcuts` | 🔒 | 200 | Catálogo filtrado. Query: `tool`, `level` (1 a 4) |
| `GET` | `/shortcuts/random` | 🔒 | 200 | Uno al azar para practicar. Query: `tool`, `level`, `exclude` |
| `GET` | `/shortcuts/:id` | 🔒 | 200 | Un atajo por id |
| `POST` | `/shortcuts` | 🔒 | 201 | Crea un atajo propio |
| `PATCH` | `/shortcuts/:id` | 🔒 dueño | 200 | Edita un atajo propio |
| `DELETE` | `/shortcuts/:id` | 🔒 dueño | 204 | Borra un atajo propio |

Los atajos del catálogo (`ownerId: null`) son de solo lectura: nadie puede editarlos ni borrarlos.

### Attempts

| Método | Ruta | Auth | Código | Qué hace |
|---|---|---|---|---|
| `POST` | `/attempts` | 🔒 | 201 | Envía las teclas presionadas y responde si acertó. Body: `shortcutId` (uuid), `pressed` (1 a 5 teclas), `responseTimeMs`, `mode` opcional |
| `GET` | `/attempts` | 🔒 | 200 | Historial propio. Query: `tool`, `limit` (1 a 100) |
| `DELETE` | `/attempts` | 🔒 | 204 | Borra el historial y resetea las estadísticas |

### Stats

| Método | Ruta | Auth | Código | Qué hace |
|---|---|---|---|---|
| `GET` | `/stats/me` | 🔒 | 200 | Precisión global y atajos dominados |
| `GET` | `/stats/me/tools/:key` | 🔒 | 200 | Precisión, racha y tiempo por herramienta |

### Health

| Método | Ruta | Auth | Código | Qué hace |
|---|---|---|---|---|
| `GET` | `/` | — | 200 | Comprobación de que el servicio está vivo |

## El endpoint principal

`POST /attempts` es donde vive la regla de negocio del proyecto:

```
POST /attempts
{
  "shortcutId": "6de93ce3-3e77-4ef2-bd4f-a57bd433ff18",
  "pressed": ["Control", "x"],
  "responseTimeMs": 1200,
  "mode": "GUESS"
}
                    │
                    ▼
      normalizar teclas (alias: Cmd→Meta, " "→Space)
                    │
                    ▼
      comparar contra el combo esperado
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   isCorrect: true         isCorrect: false
        │                       │
        └───────────┬───────────┘
                    ▼
            guardar el intento en la base
                    │
                    ▼
{
  "id": "9c044f4f-7259-4e04-9c48-886adfed7800",
  "isCorrect": true,
  "pressed": ["Control", "x"],
  "expected": ["Control", "x"],
  "description": "Cortar línea",
  "responseTimeMs": 1200,
  "currentStreak": 1,
  "createdAt": "2026-09-01T00:35:56.611Z"
}
```

`mode` acepta `LEARN`, `GUESS`, `CHOICE` o `TIMEATTACK`. `pressed` admite entre 1 y 5 teclas.

El cliente manda las teclas crudas y no recibe la respuesta esperada hasta después de haber respondido.

## Seguridad

- Contraseñas hasheadas con **bcrypt**; nunca se devuelven en ninguna respuesta.
- **Access token de vida corta** y refresh token almacenado hasheado, invalidable con `/auth/logout`.
- **Helmet** con cabeceras de seguridad, y una política de CSP relajada únicamente en `/docs` porque Scalar carga su bundle desde un CDN.
- **ValidationPipe global** con `whitelist` y `forbidNonWhitelisted`: cualquier campo no declarado en el DTO hace fallar la petición.
- **Rate limiting** en los endpoints de autenticación.
- Los errores no exponen stack traces ni detalles internos.

## Deploy

Desplegado en Railway con PostgreSQL gestionado por el proveedor. La configuración vive en `railway.json`:

- `preDeployCommand` corre `prisma migrate deploy` antes de que la nueva versión reciba tráfico.
- `startCommand` es `node dist/main`, para servir el build compilado y no el modo desarrollo.
- Las variables de entorno se cargan en el panel de Railway y nunca se commitean.
