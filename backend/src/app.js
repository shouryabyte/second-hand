const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const meRoutes = require("./routes/me");
const listingsRoutes = require("./routes/listings");

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
      credentials: true
    })
  );

  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/me", meRoutes);
  app.use("/api/listings", listingsRoutes);

  app.use((req, res) => res.status(404).json({ error: "Not found" }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    return res.status(500).json({ error: "Server error" });
  });

  return app;
}

module.exports = { createApp };
