const fs = require("fs");
const path = require("path");

const targets = [
  path.join(__dirname, "..", "node_modules", "next", "dist", "trace", "report", "to-json.js"),
  path.join(__dirname, "..", "node_modules", "next", "dist", "esm", "trace", "report", "to-json.js")
];

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return { filePath, changed: false, reason: "missing" };

  const src = fs.readFileSync(filePath, "utf8");
  const next = src
    .replace(/join\(distDir,\s*['\"]trace['\"]\)/g, "join(distDir, 'trace.jsonl')")
    .replace(/join\(distDir,\s*\"trace\"\)/g, "join(distDir, 'trace.jsonl')")
    .replace(/join\(distDir,\s*'trace'\)/g, "join(distDir, 'trace.jsonl')");

  if (next === src) return { filePath, changed: false, reason: "no-match" };

  fs.writeFileSync(filePath, next, "utf8");
  return { filePath, changed: true };
}

const results = targets.map(patchFile);
const changed = results.filter((r) => r.changed);

if (changed.length === 0) {
  process.exitCode = 0;
} else {
  process.stdout.write(
    `Patched Next trace output file name in:\n${changed.map((r) => `- ${path.relative(process.cwd(), r.filePath)}`).join("\n")}\n`
  );
}
