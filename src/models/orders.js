const crypto = require("node:crypto");
const pool = require("../config/db");
const cartModel = require("./cart");

async function createFromCart(userId, paymentMethodId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [methods] = await connection.execute(
      "SELECT id, is_test FROM payment_methods WHERE id = ? AND active = TRUE FOR UPDATE",
      [paymentMethodId]
    );
    if (!methods.length || !methods[0].is_test) {
      const error = new Error("El método de pago no está disponible para pruebas.");
      error.status = 400;
      throw error;
    }

    const cartId = await cartModel.ensureCart(userId, connection);
    await connection.execute("SELECT id FROM carts WHERE id = ? FOR UPDATE", [cartId]);
    const [items] = await connection.execute(
      `SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock, p.active
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = ? FOR UPDATE`,
      [cartId]
    );
    if (!items.length) {
      const error = new Error("No puedes confirmar un carrito vacío.");
      error.status = 400;
      throw error;
    }
    for (const item of items) {
      if (!item.active || item.quantity > item.stock) {
        const error = new Error(`Existencias insuficientes para "${item.name}". Actualiza tu carrito.`);
        error.status = 409;
        throw error;
      }
    }
    const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const [order] = await connection.execute(
      "INSERT INTO orders (user_id, payment_method_id, total, status) VALUES (?, ?, ?, 'confirmed_test')",
      [userId, paymentMethodId, total]
    );
    for (const item of items) {
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [order.insertId, item.product_id, item.name, item.price, item.quantity]
      );
      await connection.execute(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        [item.quantity, item.product_id]
      );
    }
    await connection.execute("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
    await connection.execute(
      `INSERT INTO payments (order_id, payment_method_id, amount, status, reference)
       VALUES (?, ?, ?, 'simulated', ?)`,
      [order.insertId, paymentMethodId, total, `TEST-${crypto.randomUUID()}`]
    );
    await connection.commit();
    return {
      id: order.insertId,
      total,
      status: "confirmed_test",
      paymentStatus: "simulated",
      isTest: true
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listRecent(limit = 100) {
  const [rows] = await pool.execute(
    `SELECT o.id, o.total, o.status, o.created_at, u.name AS customer_name,
            u.email AS customer_email, pm.name AS payment_method
     FROM orders o JOIN users u ON u.id = o.user_id
     JOIN payment_methods pm ON pm.id = o.payment_method_id
     ORDER BY o.created_at DESC LIMIT ?`,
    [limit]
  );
  return rows;
}

module.exports = { createFromCart, listRecent };
