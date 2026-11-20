const cart = require("../models/cart");
const { integer } = require("../middleware/validation");

async function get(req, res) {
  res.json({ data: await cart.get(req.user.sub) });
}

async function add(req, res) {
  const productId = integer(Number(req.body.productId), "El producto", 1);
  const quantity = integer(req.body.quantity, "La cantidad", 1, 1000);
  res.status(201).json({ data: await cart.add(req.user.sub, productId, quantity) });
}

async function update(req, res) {
  const productId = integer(Number(req.params.productId), "El producto", 1);
  const quantity = integer(req.body.quantity, "La cantidad", 1, 1000);
  res.json({ data: await cart.updateQuantity(req.user.sub, productId, quantity) });
}

async function remove(req, res) {
  const productId = integer(Number(req.params.productId), "El producto", 1);
  res.json({ data: await cart.remove(req.user.sub, productId) });
}

module.exports = { get, add, update, remove };
