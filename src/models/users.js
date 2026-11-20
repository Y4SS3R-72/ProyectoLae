const pool = require("../config/db");

async function create({ name, email, passwordHash }) {
  const [result] = await pool.execute(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    [name, email, passwordHash]
  );
  return findById(result.insertId);
}

async function findByEmail(email) {
  const [rows] = await pool.execute(
    "SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    "SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

async function saveResetToken(email, tokenHash, expiresAt) {
  await pool.execute(
    "UPDATE users SET reset_token_hash = ?, reset_expires_at = ? WHERE email = ?",
    [tokenHash, expiresAt, email]
  );
}

async function resetPassword(email, tokenHash, passwordHash) {
  const [result] = await pool.execute(
    `UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_expires_at = NULL
     WHERE email = ? AND reset_token_hash = ? AND reset_expires_at > NOW()`,
    [passwordHash, email, tokenHash]
  );
  return result.affectedRows === 1;
}

module.exports = { create, findByEmail, findById, saveResetToken, resetPassword };
