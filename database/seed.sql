USE lae;

INSERT INTO categories (slug, name, description) VALUES
  ('banos-dulces', 'Baños energéticos dulces', 'Datos ficticios de prueba; reemplazar antes de vender.'),
  ('banos-amargos', 'Baños energéticos amargos', 'Datos ficticios de prueba; reemplazar antes de vender.'),
  ('lociones-esencias', 'Lociones y esencias', 'Datos ficticios de prueba; reemplazar antes de vender.'),
  ('otros', 'Otros productos espirituales', 'Datos ficticios de prueba; reemplazar antes de vender.'),
  ('sesiones', 'Sesiones espirituales', 'Servicio de prueba; disponibilidad demostrativa.')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO payment_methods (slug, name, is_test, active) VALUES
  ('transferencia-prueba', 'Transferencia (solo prueba)', TRUE, TRUE),
  ('pago-simulado', 'Pago simulado (sin cobro)', TRUE, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name), is_test = TRUE, active = TRUE;

INSERT INTO products (category_id, name, description, price, stock, image_url, kind)
SELECT id, 'Baño dulce de prueba', 'Artículo de demostración. Precio e inventario ficticios.', 30.00, 10,
  '/img/banos-lae.png', 'product'
FROM categories WHERE slug = 'banos-dulces'
AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Baño dulce de prueba');

INSERT INTO products (category_id, name, description, price, stock, image_url, kind)
SELECT id, 'Baño amargo de prueba', 'Artículo de demostración. Precio e inventario ficticios.', 28.00, 8,
  '/img/banos-lae.png', 'product'
FROM categories WHERE slug = 'banos-amargos'
AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Baño amargo de prueba');

INSERT INTO products (category_id, name, description, price, stock, image_url, kind)
SELECT id, 'Esencia de prueba', 'Artículo de demostración. Precio e inventario ficticios.', 20.00, 12,
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1000&q=80', 'product'
FROM categories WHERE slug = 'lociones-esencias'
AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Esencia de prueba');

INSERT INTO products (category_id, name, description, price, stock, image_url, kind)
SELECT id, 'Sesión virtual de prueba', 'Servicio de demostración, sin agenda ni cobro real.', 40.00, 20,
  '/img/atencion-cliente.png', 'service'
FROM categories WHERE slug = 'sesiones'
AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Sesión virtual de prueba');

UPDATE products
SET image_url = '/img/banos-lae.png'
WHERE name IN ('Baño dulce de prueba', 'Baño amargo de prueba');

UPDATE products
SET image_url = '/img/atencion-cliente.png'
WHERE name = 'Sesión virtual de prueba';

-- No se crea una cuenta administradora con contraseña fija. Asignar rol admin
-- manualmente a una cuenta registrada en un entorno privado.
