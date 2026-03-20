require("dotenv").config();

const fs = require("fs");
const path = require("path");

const { createApp } = require("./app");
const { connectDb } = require("./config/db");

async function main() {
  fs.mkdirSync(path.join(process.cwd(), "uploads"), { recursive: true });

  await connectDb(process.env.MONGODB_URI);
  const app = createApp();

  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
