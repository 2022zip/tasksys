require("dotenv").config();

function must(name, val) {
  if (val === undefined || val === null || String(val).trim() === "") {
    throw new Error(`Missing env var: ${name}`);
  }
  return val;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 3000),

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

  // Static directory
  PUBLIC_DIR: process.env.PUBLIC_DIR || "public",

  // SMTP
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT || 465),
  SMTP_SECURE: (process.env.SMTP_SECURE || "true") === "true",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || "任务追踪系统",
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || "",
  SMTP_CC: process.env.SMTP_CC || "",

  // Import
  IMPORT_MAX_MB: Number(process.env.IMPORT_MAX_MB || 5),
};

function validateForSmtp() {
  must("SMTP_HOST", env.SMTP_HOST);
  must("SMTP_USER", env.SMTP_USER);
  must("SMTP_PASS", env.SMTP_PASS);
  must("SMTP_FROM_EMAIL", env.SMTP_FROM_EMAIL);
}

module.exports = {
  env,
  must,
  validateForSmtp,
};
