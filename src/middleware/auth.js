const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: { message: "Debes iniciar sesión." } });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    next();
  } catch {
    res.status(401).json({ error: { message: "La sesión expiró o no es válida." } });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: { message: "No tienes permisos para esta operación." } });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
