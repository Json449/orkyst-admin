// PM2 ecosystem for the graph-based analytics project only.
//
// Local usage:
//   pm2 start ecosystem.config.js --update-env
//   pm2 logs graph-analytics-admin
//   pm2 status
//
// Production domain usage can override:
//   ADMIN_APP_FRONTEND_URL=https://admin-app.orkyst.com \
//   GRAPH_API_ENVIRONMENT=production \
//   pm2 start ecosystem.config.js --update-env

const path = require("path");

const ROOT = __dirname;
const FRONTEND = path.join(ROOT, "frontend");
const PYTHON = path.join(ROOT, ".venv312", "bin", "python");
const STREAMLIT = path.join(ROOT, ".venv312", "bin", "streamlit");
const LOGS = path.join(ROOT, "logs");

const FRONTEND_URL = process.env.ADMIN_APP_FRONTEND_URL || "http://localhost:3002";
const GRAPH_API_INTERNAL_URL =
  process.env.GRAPH_API_INTERNAL_URL || "http://127.0.0.1:8003";

module.exports = {
  apps: [
    {
      name: "graph-analytics-admin",
      cwd: FRONTEND,
      script: "sh",
      args: "-c 'npm run build && npm run start'",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
        NEXT_PUBLIC_FRONTEND_URL: FRONTEND_URL,
        NEXT_PUBLIC_BASE_URL: FRONTEND_URL,
        NEXT_PUBLIC_API_BASE_URL: process.env.ADMIN_APP_API_BASE_URL || "/graph-api",
        GRAPH_API_INTERNAL_URL,
      },
      error_file: path.join(LOGS, "admin-app-err.log"),
      out_file: path.join(LOGS, "admin-app-out.log"),
      max_memory_restart: "1G",
    },

    {
      name: "graph-analytics-api",
      cwd: ROOT,
      script: PYTHON,
      args: "-m uvicorn api.server:app --host 127.0.0.1 --port 8003",
      interpreter: "none",
      env: {
        ENVIRONMENT: process.env.GRAPH_API_ENVIRONMENT || "development",
        GRAPH_API_CORS_ORIGINS: [
          "https://admin-app.orkyst.com",
          "http://localhost:3002",
          "http://127.0.0.1:3002",
        ].join(","),
      },
      error_file: path.join(LOGS, "graph-api-err.log"),
      out_file: path.join(LOGS, "graph-api-out.log"),
      max_memory_restart: "1G",
    },

    {
      name: "graph-analytics-dashboard",
      cwd: ROOT,
      script: STREAMLIT,
      args:
        "run dashboard/app.py --server.address 127.0.0.1 --server.port 8501 --server.headless true",
      interpreter: "none",
      env: {
        ENVIRONMENT: process.env.GRAPH_API_ENVIRONMENT || "development",
      },
      error_file: path.join(LOGS, "graph-dashboard-err.log"),
      out_file: path.join(LOGS, "graph-dashboard-out.log"),
      max_memory_restart: "1G",
    },
  ],
};
