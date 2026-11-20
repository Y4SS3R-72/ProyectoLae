const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const users = require("../models/users");
const { email, requiredString, fail } = require("../middleware/validation");

function issueToken(user) {
  return jwt.sign(
    { sub: String(user.id), role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: "8h" }
  );
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function register(req, res) {
  const name = requiredString(req.body.name, "El nombre", 120);
  const normalizedEmail = email(req.body.email);
  if (typeof req.body.password !== "string" || req.body.password.length < 8 || req.body.password.length > 72) {
    fail("La contraseña debe tener entre 8 y 72 caracteres.");
  }
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = await users.create({ name, email: normalizedEmail, passwordHash });
  res.status(201).json({ data: { user: publicUser(user), token: issueToken(user) } });
}

async function login(req, res) {
  const normalizedEmail = email(req.body.email);
  if (typeof req.body.password !== "string" || !req.body.password) fail("La contraseña es obligatoria.");
  const user = await users.findByEmail(normalizedEmail);
  const valid = user && await bcrypt.compare(req.body.password, user.password_hash);
  if (!valid) {
    const error = new Error("Correo o contraseña incorrectos.");
    error.status = 401;
    throw error;
  }
  res.json({ data: { user: publicUser(user), token: issueToken(user) } });
}

async function me(req, res) {
  const user = await users.findById(req.user.sub);
  if (!user) {
    const error = new Error("La cuenta ya no existe.");
    error.status = 401;
    throw error;
  }
  res.json({ data: publicUser(user) });
}

async function logout(req, res) {
  res.json({ data: { message: "Sesión cerrada en este dispositivo." } });
}

async function forgotPassword(req, res) {
  const normalizedEmail = email(req.body.email);
  const user = await users.findByEmail(normalizedEmail);
  const response = { message: "Si la cuenta existe, se generó una solicitud de recuperación." };
  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    await users.saveResetToken(normalizedEmail, tokenHash, new Date(Date.now() + 30 * 60 * 1000));
    if (process.env.NODE_ENV !== "production") response.resetToken = resetToken;
  }
  res.json({ data: response });
}

async function resetPassword(req, res) {
  const normalizedEmail = email(req.body.email);
  const token = requiredString(req.body.token, "El token", 128);
  if (typeof req.body.password !== "string" || req.body.password.length < 8 || req.body.password.length > 72) {
    fail("La contraseña debe tener entre 8 y 72 caracteres.");
  }
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const updated = await users.resetPassword(normalizedEmail, tokenHash, passwordHash);
  if (!updated) {
    const error = new Error("El token es inválido o expiró.");
    error.status = 400;
    throw error;
  }
  res.json({ data: { message: "Contraseña actualizada." } });
}

module.exports = { register, login, me, logout, forgotPassword, resetPassword };
