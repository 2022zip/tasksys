const path = require("path");
const cors = require("cors");
const express = require("express");
const { env } = require("./env");

const applyAppMiddlewares = (app) => {
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Static files
  // Use absolute path for safety
  const publicDir = path.join(__dirname, '..', env.PUBLIC_DIR || 'public');
  app.use(express.static(publicDir));
  console.log('Serving static files from:', publicDir);
};

module.exports = { applyAppMiddlewares };
