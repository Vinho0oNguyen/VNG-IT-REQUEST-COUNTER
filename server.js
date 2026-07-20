"use strict";

const { createRequestCounterServer } = require("./app");
const { createFileCounterStore } = require("./counter-store");

const port = Number.parseInt(process.env["PORT"] || "3000", 10);
const host = "0.0.0.0";
const counterFile = process.env["REQUEST_COUNT_FILE"] || "./data/request-count.json";
const initialCount = Number.parseInt(process.env["REQUEST_COUNT_INITIAL"] || "0", 10);

const counter = createFileCounterStore(counterFile, initialCount);
const server = createRequestCounterServer({ counter });

server.listen(port, host, () => {
  console.log(`Request Counter listening on http://${host}:${port}`);
  console.log(`Persistent counter file: ${counter.filePath}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down.`);
  server.close((error) => {
    process.exit(error ? 1 : 0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
