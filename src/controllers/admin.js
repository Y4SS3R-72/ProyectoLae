const products = require("../models/products");
const categories = require("../models/categories");
const orders = require("../models/orders");
const { requiredString, integer, price, fail } = require("../middleware/validation");

function validateProduct(body, partial = false) {
  const item = {};
  const has = (key) => Object.hasOwn(body, key);
  if (!partial || has("name")) item.name = requiredString(body.name, "El nombre", 160);
  if (!partial || has("description")) {
    item.description = body.description == null || body.description === ""
      ? null
      : requiredString(body.description, "La descripción", 5000);
  }
  if (!partial || has("categoryId")) item.categoryId = integer(Number(body.categoryId), "La categoría", 1);
  if (!partial || has("price")) item.price = price(body.price);
  if (!partial || has("stock")) item.stock = integer(body.stock, "Las existencias", 0, 1000000);
  if (!partial || has("kind")) {
    if (!["product", "service"].includes(body.kind)) fail("El tipo debe ser product o service.");
    item.kind = body.kind;
  }
  if (!partial || has("imageUrl")) {
    const value = body.imageUrl;
    if (value !== null && value !== undefined && value !== "") {
      try {
        const url = new URL(value);
        if (!["http:", "https:"].includes(url.protocol)) fail("La URL de imagen debe usar HTTP o HTTPS.");
        item.imageUrl = value;
      } catch (error) {
        if (error.status) throw error;
        fail("La URL de imagen no es válida.");
      }
    } else item.imageUrl = null;
  }
  if (!partial || has("active")) {
    if (typeof body.active !== "boolean") fail("El estado activo debe ser verdadero o falso.");
    item.active = body.active;
  }
  return item;
}

async function listProducts(req, res) {
  res.json({ data: await products.list({ includeInactive: true }) });
}

async function createProduct(req, res) {
  res.status(201).json({ data: await products.create(validateProduct(req.body)) });
}

async function updateProduct(req, res) {
  const id = integer(Number(req.params.id), "El identificador", 1);
  const result = await products.update(id, validateProduct(req.body, true));
  if (!result) {
    const error = new Error("Producto no encontrado.");
    error.status = 404;
    throw error;
  }
  res.json({ data: result });
}

async function listOrders(req, res) {
  res.json({ data: await orders.listRecent() });
}

async function listCategories(req, res) {
  res.json({ data: await categories.list() });
}

module.exports = { listProducts, createProduct, updateProduct, listOrders, listCategories };
