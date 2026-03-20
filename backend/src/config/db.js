const mongoose = require("mongoose");

// Production Upgrade: cache Mongo connection for serverless runtimes (Vercel)
// Prevents exhausting connection limits by reusing a single connection per lambda instance.
const globalCache = globalThis;

if (!globalCache.__shMarketplaceMongo) {
  globalCache.__shMarketplaceMongo = { conn: null, promise: null };
}

async function connectDb(mongoUri) {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required");
  }

  const cache = globalCache.__shMarketplaceMongo;
  if (cache.conn && mongoose.connection.readyState === 1) return cache.conn;

  mongoose.set("strictQuery", true);

  if (!cache.promise) {
    cache.promise = mongoose.connect(mongoUri).then((m) => m.connection);
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

module.exports = { connectDb };