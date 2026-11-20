function fail(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function requiredString(value, label, maxLength) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
    fail(`${label} es obligatorio y no debe superar ${maxLength} caracteres.`);
  }
  return value.trim();
}

function email(value) {
  const normalized = requiredString(value, "El correo", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) fail("El correo no es válido.");
  return normalized;
}

function integer(value, label, min = 0, max = 2147483647) {
  if (!Number.isInteger(value) || value < min || value > max) {
    fail(`${label} debe ser un número entero entre ${min} y ${max}.`);
  }
  return value;
}

function price(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 9999999999.99) {
    fail("El precio debe ser un número válido no negativo.");
  }
  return value;
}

module.exports = { fail, requiredString, email, integer, price };
