const orders = require("../models/orders");
const { integer } = require("../middleware/validation");

async function create(req, res) {
  const paymentMethodId = integer(Number(req.body.paymentMethodId), "El método de pago", 1);
  res.status(201).json({ data: await orders.createFromCart(req.user.sub, paymentMethodId) });
}

module.exports = { create };
