const pool = require("../config/db");

async function list() {
  const [rows] = await pool.execute(
    "SELECT id, slug, name, description FROM categories WHERE active = TRUE ORDER BY name"
  );
  return rows;
}

module.exports = { list };
