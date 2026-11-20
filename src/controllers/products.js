const products = require("../models/products");
const categories = require("../models/categories");
const { integer } = require("../middleware/validation");

async function list(req, res) {
  const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
  const categoryId = req.query.categoryId === undefined
    ? null
    : integer(Number(req.query.categoryId), "La categoría", 1);
  res.json({ data: await products.list({ search, categoryId }) });
}

async function detail(req, res) {
  const id = integer(Number(req.params.id), "El identificador", 1);
  const product = await products.findById(id);
  if (!product) {
    const error = new Error("Producto no encontrado.");
    error.status = 404;
    throw error;
  }
  res.json({ data: product });
}

async function listCategories(req, res) {
  res.json({ data: await categories.list() });
}

module.exports = { list, detail, listCategories };
