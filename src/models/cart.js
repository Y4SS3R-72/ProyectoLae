const pool = require("../config/db");

async function ensureCart(userId, executor = pool) {
  const [result] = await executor.execute(
    "INSERT INTO carts (user_id) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
    [userId]
  );
  return result.insertId;
}

async function get(userId) {
  const cartId = await ensureCart(userId);
  const [items] = await pool.execute(
    `SELECT ci.product_id, ci.quantity, p.name, p.price AS unit_price, p.stock,
            p.image_url, (ci.quantity * p.price) AS subtotal
     FROM cart_items ci JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = ? ORDER BY p.name`,
    [cartId]
  );
  return {
    items,
    total: items.reduce((sum, item) => sum + Number(item.subtotal), 0)
  };
}

async function add(userId, productId, quantity) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const cartId = await ensureCart(userId, connection);
    await connection.execute("SELECT id FROM carts WHERE id = ? FOR UPDATE", [cartId]);
    const [products] = await connection.execute(
      "SELECT stock, active FROM products WHERE id = ? FOR UPDATE",
      [productId]
    );
    if (!products.length || !products[0].active) {
      const error = new Error("El producto no está disponible.");
      error.status = 404;
      throw error;
    }
    const [current] = await connection.execute(
      "SELECT quantity FROM cart_items WHERE cart_id = ? AND product_id = ? FOR UPDATE",
      [cartId, productId]
    );
    const newQuantity = quantity + (current[0]?.quantity || 0);
    if (newQuantity > products[0].stock) {
      const error = new Error("La cantidad solicitada supera las existencias disponibles.");
      error.status = 409;
      throw error;
    }
    await connection.execute(
      `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
      [cartId, productId, newQuantity]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return get(userId);
}

async function updateQuantity(userId, productId, quantity) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [carts] = await connection.execute(
      "SELECT id FROM carts WHERE user_id = ? FOR UPDATE",
      [userId]
    );
    if (!carts.length) {
      const error = new Error("El artículo no está en el carrito.");
      error.status = 404;
      throw error;
    }
    const [products] = await connection.execute(
      "SELECT stock, active FROM products WHERE id = ? FOR UPDATE",
      [productId]
    );
    if (!products.length || !products[0].active) {
      const error = new Error("El producto ya no está disponible.");
      error.status = 409;
      throw error;
    }
    if (quantity > products[0].stock) {
      const error = new Error("La cantidad solicitada supera las existencias disponibles.");
      error.status = 409;
      throw error;
    }
    const [result] = await connection.execute(
      "UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?",
      [quantity, carts[0].id, productId]
    );
    if (!result.affectedRows) {
      const error = new Error("El artículo no está en el carrito.");
      error.status = 404;
      throw error;
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return get(userId);
}

async function remove(userId, productId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [carts] = await connection.execute(
      "SELECT id FROM carts WHERE user_id = ? FOR UPDATE",
      [userId]
    );
    const [result] = carts.length
      ? await connection.execute(
        "DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?",
        [carts[0].id, productId]
      )
      : [{ affectedRows: 0 }];
    if (!result.affectedRows) {
      const error = new Error("El artículo no está en el carrito.");
      error.status = 404;
      throw error;
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return get(userId);
}

module.exports = { ensureCart, get, add, updateQuantity, remove };
