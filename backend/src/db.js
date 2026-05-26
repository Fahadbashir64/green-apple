import mysql from "mysql2/promise";
import { config } from "./config.js";

function parseDatabaseUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
  };
}

function convertPlaceholders(sql) {
  return sql.replace(/\$(\d+)/g, "?");
}

function normalizeRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.map((row) => {
    if (row?.items != null && typeof row.items === "string") {
      try {
        row.items = JSON.parse(row.items);
      } catch {
        row.items = [];
      }
    }
    if (row?.isActive != null) {
      row.isActive = Boolean(row.isActive);
    }
    return row;
  });
}

function wrapResult(rows, fields) {
  if (Array.isArray(rows)) {
    const normalized = normalizeRows(rows);
    return {
      rows: normalized,
      rowCount: normalized.length,
    };
  }
  const header = rows;
  return {
    rows: [],
    rowCount: header?.affectedRows ?? 0,
    insertId: header?.insertId,
  };
}

async function runQuery(executor, sql, params = []) {
  const converted = convertPlaceholders(sql);
  const [rows, fields] =
    params.length > 0
      ? await executor.execute(converted, params)
      : await executor.query(converted);
  return wrapResult(rows, fields);
}

const mysqlPool = mysql.createPool({
  ...parseDatabaseUrl(config.databaseUrl),
  waitForConnections: true,
  connectionLimit: 10,
  multipleStatements: true,
});

const pool = {
  async query(sql, params) {
    return runQuery(mysqlPool, sql, params);
  },
  async connect() {
    const connection = await mysqlPool.getConnection();
    return {
      async query(sql, params) {
        return runQuery(connection, sql, params);
      },
      release() {
        connection.release();
      },
    };
  },
  async end() {
    await mysqlPool.end();
  },
};

export { pool };
