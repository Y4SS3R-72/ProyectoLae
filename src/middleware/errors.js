function notFound(req, res, next) {
  const error = new Error("No se encontró el recurso solicitado.");
  error.status = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ error: { message: "El correo ya está registrado." } });
  }
  if (error.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({ error: { message: "La categoría o método indicado no existe." } });
  }
  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error(error);
  res.status(status).json({
    error: { message: status >= 500 ? "Ocurrió un error interno." : error.message }
  });
}

module.exports = { notFound, errorHandler };
