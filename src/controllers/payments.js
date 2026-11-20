const payments = require("../models/payments");

async function methods(req, res) {
  res.json({ data: await payments.listMethods() });
}

module.exports = { methods };
