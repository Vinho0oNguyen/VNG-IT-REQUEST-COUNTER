"use strict";

const { createRequestCounterServer } = require("./app");

const port = Number.parseInt(process.env["PORT"] || "3000", 10);
const host = "0.0.0.0";

const server = createRequestCounterServer();

server.listen(port, host, () => {
  console.log(`Request Counter listening on http://${host}:${port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down.`);
  server.close((error) => {
    process.exit(error ? 1 : 0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
