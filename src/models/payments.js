const pool = require("../config/db");

async function listMethods() {
  const [rows] = await pool.execute(
    "SELECT id, slug, name, is_test FROM payment_methods WHERE active = TRUE ORDER BY id"
  );
  return rows;
}

module.exports = { listMethods };
