"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");

const { createRequestCounterServer } = require("../app");
const { createFileCounterStore } = require("../counter-store");

let baseUrl;
let server;

before(async () => {
  server = createRequestCounterServer({ startedAt: new Date("2026-01-01T00:00:00.000Z") });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test("healthcheck does not increment the counter", async () => {
  const healthResponse = await fetch(`${baseUrl}/health`);
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), { status: "ok" });

  const countResponse = await fetch(`${baseUrl}/api/count`);
  assert.equal((await countResponse.json()).count, 0);
});

test("dashboard and explicit request increment the counter", async () => {
  const dashboardResponse = await fetch(`${baseUrl}/`);
  assert.equal(dashboardResponse.status, 200);
  assert.match(await dashboardResponse.text(), /Request Counter/);
  assert.equal(dashboardResponse.headers.get("x-request-count"), "1");

  const requestResponse = await fetch(`${baseUrl}/api/request`, { method: "POST" });
  assert.equal(requestResponse.status, 200);
  assert.deepEqual(await requestResponse.json(), { count: 2 });

  const countResponse = await fetch(`${baseUrl}/api/count`);
  assert.equal((await countResponse.json()).count, 2);
});

test("unknown routes are counted and return 404", async () => {
  const response = await fetch(`${baseUrl}/missing`);
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("x-request-count"), "3");
});

test("file store preserves the counter when it is opened again", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "request-counter-"));
  const filePath = path.join(directory, "count.json");

  try {
    const firstStore = createFileCounterStore(filePath, 14);
    assert.deepEqual(firstStore.getSnapshot(), { count: 14, lastRequestAt: null });

    firstStore.increment(new Date("2026-07-20T13:00:00.000Z"));

    const reopenedStore = createFileCounterStore(filePath, 0);
    assert.deepEqual(reopenedStore.getSnapshot(), {
      count: 15,
      lastRequestAt: "2026-07-20T13:00:00.000Z",
    });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
