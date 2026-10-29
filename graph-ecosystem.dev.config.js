// PM2 ecosystem for the local development graph stack.
//
// Run with:
//   GRAPH_API_ENVIRONMENT=development pm2 start graph-ecosystem.dev.config.js --update-env
//
// The development stack intentionally uses separate ports so it can run next
// to the main Orkyst frontend (frontend :3001, API :8003).

const path = require("path");

const ROOT = __dirname;
const FRONTEND = path.join(ROOT, "frontend");
const PYTHON = path.join(ROOT, ".venv312", "bin", "python");
const LOGS = path.join(ROOT, "logs");

const ENVIRONMENT = (process.env.GRAPH_API_ENVIRONMENT || "development").toLowerCase();
const FRONTEND_PORT = Number(process.env.DEV_FRONTEND_PORT || 3002);
const GRAPH_API_PORT = Number(process.env.DEV_GRAPH_API_PORT || 8010);
const FRONTEND_URL = process.env.ADMIN_APP_FRONTEND_URL || `http://localhost:${FRONTEND_PORT}`;

module.exports = {
  apps: [
    {
      name: "graph-analytics-admin-dev",
      cwd: FRONTEND,
      script: "npm",
      args: `run dev -- --hostname 127.0.0.1 --port ${FRONTEND_PORT}`,
      interpreter: "none",
      env: {
        NODE_ENV: "development",
        PORT: FRONTEND_PORT,
        NEXT_PUBLIC_FRONTEND_URL: FRONTEND_URL,
        NEXT_PUBLIC_BASE_URL: FRONTEND_URL,
        NEXT_PUBLIC_API_BASE_URL: "/graph-api",
        GRAPH_API_INTERNAL_URL: `http://127.0.0.1:${GRAPH_API_PORT}`,
      },
      error_file: path.join(LOGS, "admin-app-dev-err.log"),
      out_file: path.join(LOGS, "admin-app-dev-out.log"),
      autorestart: true,
    },
    {
      name: "graph-analytics-api-dev",
      cwd: ROOT,
      script: PYTHON,
      args: `-m uvicorn api.server:app --host 127.0.0.1 --port ${GRAPH_API_PORT} --reload`,
      interpreter: "none",
      env: {
        GRAPH_API_ENVIRONMENT: ENVIRONMENT,
        ENVIRONMENT,
        GRAPH_API_CORS_ORIGINS: [
          FRONTEND_URL,
          `http://127.0.0.1:${FRONTEND_PORT}`,
        ].join(","),
      },
      error_file: path.join(LOGS, "graph-api-dev-err.log"),
      out_file: path.join(LOGS, "graph-api-dev-out.log"),
      autorestart: true,
    },
  ],
};
