# ProyectoLae — Luz y Amor Elevado

Aplicación de tienda y servicios espirituales. Conserva las páginas HTML y el CSS existentes y los conecta con módulos JavaScript, una API Express y MySQL. Los productos, precios y existencias del seed son **ficticios y solo sirven para pruebas**.

## Tecnologías

- Frontend: HTML, CSS y JavaScript nativo en módulos ES.
- Backend: Node.js 20+, Express 4, JWT, bcryptjs y Helmet.
- Persistencia: MySQL 8.0.16+ (InnoDB).
- Pago: solo registro simulado de pedidos; no se cobra ni se contacta una pasarela bancaria.

## Arquitectura

`HTML/CSS → módulos js/ → API REST /api → controladores → modelos → MySQL`

Los cambios visuales se limitaron a añadir campos de búsqueda, estado y acciones donde las páginas originales no tenían controles conectables; se conservaron el layout, colores, imágenes y estilos existentes. `admin.html` es la única página nueva, porque no había formulario de administración. La navegación muestra el acceso administrativo solo a una sesión que el backend identifica con rol `admin`.

```text
lae-frontend/
├── admin.html
├── carrito.html
├── index.html
├── productos.html
├── quienes-somos.html
├── css/estilos.css
├── js/                 # API y módulos separados por página
├── database/           # schema.sql y seed.sql
└── src/
    ├── config/         # pool MySQL
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── app.js
    └── server.js
```

## Instalación y configuración

1. Instala Node.js 20 o superior y MySQL 8.0.16 o superior.
2. Desde PowerShell, en esta carpeta, instala dependencias:

   ```sh
   npm install
   ```

3. En MySQL Workbench, abre y ejecuta primero `database/schema.sql` y luego `database/seed.sql`. También puedes importar los archivos desde PowerShell usando `cmd.exe`:

   ```powershell
   cmd /c "mysql -u root -p < database\schema.sql"
   cmd /c "mysql -u root -p lae < database\seed.sql"
   ```

   En una instalación de desarrollo, crea un usuario MySQL con permisos sobre `lae`:

   ```sql
   CREATE USER 'lae_app'@'localhost' IDENTIFIED BY 'usa-una-clave-local-segura';
   GRANT SELECT, INSERT, UPDATE, DELETE ON lae.* TO 'lae_app'@'localhost';
   ```

4. Copia `.env.example` a `.env` con `Copy-Item .env.example .env` y configura el usuario, contraseña, host y puerto de MySQL. Genera un valor secreto aleatorio para `JWT_SECRET` (al menos 32 caracteres). No subas `.env` al repositorio.
5. Inicia el servidor:

   ```sh
   npm start
   ```

6. Abre <http://localhost:3000>. `GET /api/health` informa por separado si la conexión MySQL está disponible. Si el puerto 3000 está ocupado, cambia `PORT` en `.env` (por ejemplo, `3178`). Si se usa la alternativa PowerShell `serve.ps1`, esta solo sirve archivos estáticos y no sustituye al servidor Express.

## Funcionalidades implementadas

- Registro de clientes e inicio/cierre de sesión con JWT de 8 horas; contraseñas hash con bcrypt.
- Restablecimiento con token aleatorio de un solo uso, almacenado como hash y con vencimiento de 30 minutos. En desarrollo el token se devuelve en la respuesta para poder probarlo; **no se envía correo**. En producción requiere integrar un proveedor de correo antes de ofrecer recuperación.
- Listado, búsqueda, filtro por categoría, detalle, precio y disponibilidad.
- Carrito persistente por cliente, validación de cantidades e inventario, subtotales y total.
- Confirmación transaccional del pedido, descuento de existencias y registro de pago `simulated`.
- CRUD administrativo de productos (la eliminación se implementa como desactivación) y consulta de pedidos. El rol se verifica en el backend.
- Limitador de intentos para rutas de autenticación y consultas SQL parametrizadas.

## Crear el primer administrador

No hay credenciales administrativas predeterminadas. Registra una cuenta desde la página de inicio y, usando una conexión MySQL privada de confianza, asigna el rol:

```sql
UPDATE users SET role = 'admin' WHERE email = 'correo-del-administrador@example.com';
```

No expongas credenciales de administrador ni permitas que el cliente determine su propio rol.

## API principal

Las respuestas correctas usan `{ "data": ... }`; los errores usan `{ "error": { "message": ... } }`.

| Método | Ruta | Acceso | Propósito |
|---|---|---|---|
| GET | `/api/health` | Público | Estado del servidor y MySQL |
| POST | `/api/auth/register` | Público | Registro de cliente |
| POST | `/api/auth/login` | Público | Inicio de sesión |
| POST | `/api/auth/logout` | Sesión | Cierre en el navegador (JWT stateless) |
| GET | `/api/auth/me` | Sesión | Perfil de la sesión |
| POST | `/api/auth/forgot-password` | Público | Emisión de token de recuperación |
| POST | `/api/auth/reset-password` | Público | Cambio con token vigente |
| GET | `/api/products?search=&categoryId=` | Público | Catálogo y búsqueda |
| GET | `/api/products/:id` | Público | Detalle |
| GET | `/api/categories` | Público | Categorías activas |
| GET | `/api/payments/methods` | Público | Métodos de prueba disponibles |
| GET | `/api/cart` | Cliente | Consultar carrito |
| POST | `/api/cart/items` | Cliente | Agregar artículo |
| PUT/DELETE | `/api/cart/items/:productId` | Cliente | Actualizar o quitar artículo |
| POST | `/api/orders` | Cliente | Crear pedido de prueba |
| GET | `/api/admin/products` | Administrador | Consultar productos |
| POST/PUT | `/api/admin/products[/:id]` | Administrador | Crear/actualizar producto o desactivarlo |
| GET | `/api/admin/orders` | Administrador | Consultar pedidos recientes |

Las rutas privadas requieren `Authorization: Bearer <token>`.

## Pruebas y limitaciones conocidas

- `npm run check` comprueba la sintaxis de arranque del servidor y la aplicación Express.
- La conexión real, los flujos de autenticación, carrito, compra y CRUD requieren tener MySQL configurado, cargar ambos scripts SQL y arrancar la API.
- Los datos del seed, precios, inventario, imágenes y métodos son demostrativos. No son catálogo o precios comerciales definitivos.
- No se integra pasarela real, envío de correo, agenda de sesiones, dirección de entrega ni interfaz para cambiar estados de pedidos.
- El logout borra el JWT del navegador; como el token es stateless, uno ya copiado permanece válido hasta vencer. Rotación/revocación de tokens requiere una estrategia de sesión adicional.
- El catálogo usa imágenes remotas de demostración y necesita conexión a internet para cargarlas.

## GitHub

`.gitignore` excluye `.env`, dependencias y artefactos locales. Revisa antes de publicar que no se hayan añadido contraseñas, tokens, dumps de producción o información personal.
