const express = require("express");
const { rateLimit } = require("express-rate-limit");
const asyncHandler = require("../middleware/async-handler");
const { authenticate, requireRole } = require("../middleware/auth");
const auth = require("../controllers/auth");
const products = require("../controllers/products");
const cart = require("../controllers/cart");
const orders = require("../controllers/orders");
const payments = require("../controllers/payments");
const admin = require("../controllers/admin");

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { message: "Demasiados intentos. Espera unos minutos." } }
});

router.post("/auth/register", authLimiter, asyncHandler(auth.register));
router.post("/auth/login", authLimiter, asyncHandler(auth.login));
router.post("/auth/forgot-password", authLimiter, asyncHandler(auth.forgotPassword));
router.post("/auth/reset-password", authLimiter, asyncHandler(auth.resetPassword));
router.get("/auth/me", authenticate, asyncHandler(auth.me));
router.post("/auth/logout", authenticate, asyncHandler(auth.logout));

router.get("/products", asyncHandler(products.list));
router.get("/products/:id", asyncHandler(products.detail));
router.get("/categories", asyncHandler(products.listCategories));
router.get("/payments/methods", asyncHandler(payments.methods));

router.get("/cart", authenticate, asyncHandler(cart.get));
router.post("/cart/items", authenticate, asyncHandler(cart.add));
router.put("/cart/items/:productId", authenticate, asyncHandler(cart.update));
router.delete("/cart/items/:productId", authenticate, asyncHandler(cart.remove));
router.post("/orders", authenticate, asyncHandler(orders.create));

router.get("/admin/products", authenticate, requireRole("admin"), asyncHandler(admin.listProducts));
router.post("/admin/products", authenticate, requireRole("admin"), asyncHandler(admin.createProduct));
router.put("/admin/products/:id", authenticate, requireRole("admin"), asyncHandler(admin.updateProduct));
router.get("/admin/categories", authenticate, requireRole("admin"), asyncHandler(admin.listCategories));
router.get("/admin/orders", authenticate, requireRole("admin"), asyncHandler(admin.listOrders));

module.exports = router;
