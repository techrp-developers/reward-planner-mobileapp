const db = require("./database");

async function columnExists(tableName, columnName) {
  const [rows] = await db.execute(
    `SELECT 1
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName],
  );

  return rows.length > 0;
}

async function ensureColumn(tableName, columnName, definition) {
  if (await columnExists(tableName, columnName)) return;

  await db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

async function setupCustomerAuthDB() {
  try {
    console.log("[CustomerAuthSetup] Ensuring customer auth schema exists...");

    await db.execute(`
      CREATE TABLE IF NOT EXISTS customer_auth_sessions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash CHAR(64) NOT NULL,
        family_id CHAR(36) NOT NULL,
        device_name VARCHAR(255) DEFAULT NULL,
        user_agent VARCHAR(255) DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        expires_at DATETIME NOT NULL,
        revoked_at DATETIME DEFAULT NULL,
        replaced_by_hash CHAR(64) DEFAULT NULL,
        last_used_at DATETIME DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_customer_auth_sessions_token_hash (token_hash),
        KEY idx_customer_auth_sessions_user_id (user_id),
        KEY idx_customer_auth_sessions_family_id (family_id),
        KEY idx_customer_auth_sessions_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS device_change_requests (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash CHAR(64) NOT NULL,
        new_device_id VARCHAR(255) NOT NULL,
        new_device_name VARCHAR(255) DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        user_agent VARCHAR(255) DEFAULT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        expires_at DATETIME NOT NULL,
        decided_at DATETIME DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_device_change_requests_token_hash (token_hash),
        KEY idx_device_change_requests_user_device_status (user_id, new_device_id, status),
        KEY idx_device_change_requests_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await ensureColumn("customer_auth_sessions", "user_id", "INT NOT NULL");
    await ensureColumn("customer_auth_sessions", "token_hash", "CHAR(64) NOT NULL");
    await ensureColumn("customer_auth_sessions", "family_id", "CHAR(36) NOT NULL");
    await ensureColumn("customer_auth_sessions", "device_name", "VARCHAR(255) DEFAULT NULL");
    await ensureColumn("customer_auth_sessions", "user_agent", "VARCHAR(255) DEFAULT NULL");
    await ensureColumn("customer_auth_sessions", "ip_address", "VARCHAR(45) DEFAULT NULL");
    await ensureColumn("customer_auth_sessions", "expires_at", "DATETIME NOT NULL");
    await ensureColumn("customer_auth_sessions", "revoked_at", "DATETIME DEFAULT NULL");
    await ensureColumn("customer_auth_sessions", "replaced_by_hash", "CHAR(64) DEFAULT NULL");
    await ensureColumn("customer_auth_sessions", "last_used_at", "DATETIME DEFAULT NULL");
    await ensureColumn(
      "customer_auth_sessions",
      "created_at",
      "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
    );

    await ensureColumn("device_change_requests", "user_id", "INT NOT NULL");
    await ensureColumn("device_change_requests", "token_hash", "CHAR(64) NOT NULL");
    await ensureColumn("device_change_requests", "new_device_id", "VARCHAR(255) NOT NULL");
    await ensureColumn("device_change_requests", "new_device_name", "VARCHAR(255) DEFAULT NULL");
    await ensureColumn("device_change_requests", "ip_address", "VARCHAR(45) DEFAULT NULL");
    await ensureColumn("device_change_requests", "user_agent", "VARCHAR(255) DEFAULT NULL");
    await ensureColumn("device_change_requests", "status", "VARCHAR(20) NOT NULL DEFAULT 'pending'");
    await ensureColumn("device_change_requests", "expires_at", "DATETIME NOT NULL");
    await ensureColumn("device_change_requests", "decided_at", "DATETIME DEFAULT NULL");
    await ensureColumn(
      "device_change_requests",
      "created_at",
      "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
    );

    await ensureColumn("customer", "device_id", "VARCHAR(255) DEFAULT NULL");
    await ensureColumn("customer", "device_name", "VARCHAR(255) DEFAULT NULL");
    await ensureColumn("customer", "deleted_at", "DATETIME DEFAULT NULL");
    await ensureColumn("customer", "last_login_ip", "VARCHAR(45) DEFAULT NULL");
    await ensureColumn("email_otps", "attempt_count", "INT NOT NULL DEFAULT 0");
    await ensureColumn("email_otps", "is_verified", "TINYINT(1) NOT NULL DEFAULT 0");

    console.log("[CustomerAuthSetup] Customer auth schema setup complete.");
  } catch (error) {
    console.error("[CustomerAuthSetup] Failed to setup customer auth schema:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    throw error;
  }
}

module.exports = setupCustomerAuthDB;
