"use strict";

const fs = require("node:fs");
const path = require("node:path");

function validateCount(value, label = "count") {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative safe integer.`);
  }
  return value;
}

function validateState(value) {
  if (!value || typeof value !== "object") {
    throw new Error("Counter data must be a JSON object.");
  }

  const count = validateCount(value.count);
  const lastRequestAt = value.lastRequestAt ?? null;

  if (lastRequestAt !== null && Number.isNaN(Date.parse(lastRequestAt))) {
    throw new Error("lastRequestAt must be null or a valid ISO timestamp.");
  }

  return { count, lastRequestAt };
}

function createMemoryCounterStore(initialCount = 0) {
  let state = { count: validateCount(initialCount, "initialCount"), lastRequestAt: null };

  return {
    getSnapshot() {
      return { ...state };
    },
    increment(now = new Date()) {
      state = {
        count: state.count + 1,
        lastRequestAt: now.toISOString(),
      };
      return { ...state };
    },
  };
}

function createFileCounterStore(filePath, initialCount = 0) {
  if (!filePath) {
    throw new Error("A counter file path is required.");
  }

  const absolutePath = path.resolve(filePath);
  const directory = path.dirname(absolutePath);
  fs.mkdirSync(directory, { recursive: true });

  let state;

  function persist() {
    const temporaryPath = `${absolutePath}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(state)}\n`, { mode: 0o600 });
    fs.renameSync(temporaryPath, absolutePath);
  }

  if (fs.existsSync(absolutePath)) {
    state = validateState(JSON.parse(fs.readFileSync(absolutePath, "utf8")));
  } else {
    state = {
      count: validateCount(initialCount, "initialCount"),
      lastRequestAt: null,
    };
    persist();
  }

  return {
    filePath: absolutePath,
    getSnapshot() {
      return { ...state };
    },
    increment(now = new Date()) {
      state = {
        count: state.count + 1,
        lastRequestAt: now.toISOString(),
      };
      persist();
      return { ...state };
    },
  };
}

module.exports = { createFileCounterStore, createMemoryCounterStore };
