const express = require("express");
const helmet = require("helmet");
const path = require("node:path");
const pool = require("./config/db");
const apiRoutes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errors");

const app = express();
const root = path.resolve(__dirname, "..");
const htmlPages = ["index.html", "productos.html", "carrito.html", "quienes-somos.html", "admin.html"];

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
      upgradeInsecureRequests: null
    }
  }
}));
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ data: { status: "ok", database: "connected" } });
  } catch (error) {
    console.error("MySQL health check failed:", error.message);
    res.status(503).json({ error: { message: "Servidor activo, pero no hay conexión con MySQL." } });
  }
});
app.use("/api", apiRoutes);

app.get("/", (req, res) => res.sendFile(path.join(root, "index.html")));
app.get(htmlPages.map((page) => `/${page}`), (req, res) => res.sendFile(path.join(root, req.path.slice(1))));
app.use("/css", express.static(path.join(root, "css"), { fallthrough: false, dotfiles: "deny" }));
app.use("/js", express.static(path.join(root, "js"), { fallthrough: false, dotfiles: "deny" }));
app.use("/img", express.static(path.join(root, "img"), { fallthrough: false, dotfiles: "deny" }));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
