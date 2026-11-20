const pool = require("../config/db");

async function list({ search = "", categoryId = null, includeInactive = false } = {}) {
  const conditions = [];
  const values = [];
  if (!includeInactive) conditions.push("p.active = TRUE");
  if (search) {
    conditions.push("(p.name LIKE ? OR p.description LIKE ?)");
    values.push(`%${search}%`, `%${search}%`);
  }
  if (categoryId !== null) {
    conditions.push("p.category_id = ?");
    values.push(categoryId);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await pool.execute(
    `SELECT p.id, p.category_id, c.name AS category_name, p.name, p.description,
            p.price, p.stock, p.image_url, p.kind, p.active, p.created_at
     FROM products p JOIN categories c ON c.id = p.category_id
     ${where} ORDER BY p.created_at DESC`,
    values
  );
  return rows;
}

async function findById(id, includeInactive = false) {
  const [rows] = await pool.execute(
    `SELECT p.id, p.category_id, c.name AS category_name, p.name, p.description,
            p.price, p.stock, p.image_url, p.kind, p.active
     FROM products p JOIN categories c ON c.id = p.category_id
     WHERE p.id = ? ${includeInactive ? "" : "AND p.active = TRUE"} LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function create(item) {
  const [result] = await pool.execute(
    `INSERT INTO products (category_id, name, description, price, stock, image_url, kind, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [item.categoryId, item.name, item.description, item.price, item.stock, item.imageUrl, item.kind, item.active]
  );
  return findById(result.insertId, true);
}

async function update(id, fields) {
  const columns = {
    categoryId: "category_id",
    name: "name",
    description: "description",
    price: "price",
    stock: "stock",
    imageUrl: "image_url",
    kind: "kind",
    active: "active"
  };
  const updates = [];
  const values = [];
  for (const [key, column] of Object.entries(columns)) {
    if (Object.hasOwn(fields, key)) {
      updates.push(`${column} = ?`);
      values.push(fields[key]);
    }
  }
  if (!updates.length) {
    const error = new Error("Debes enviar al menos un campo para actualizar.");
    error.status = 400;
    throw error;
  }
  values.push(id);
  const [result] = await pool.execute(
    `UPDATE products SET ${updates.join(", ")} WHERE id = ?`,
    values
  );
  return result.affectedRows ? findById(id, true) : null;
}

module.exports = { list, findById, create, update };
