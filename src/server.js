require("dotenv").config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET debe configurarse con al menos 32 caracteres.");
}

const app = require("./app");
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => {
  console.log(`LAE disponible en http://localhost:${port}`);
  console.log("La conexión a MySQL se verifica en /api/health.");
});

async function shutdown() {
  server.close(async () => {
    const pool = require("./config/db");
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
