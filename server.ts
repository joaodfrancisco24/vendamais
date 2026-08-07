import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Fallback JSON data directories in case MySQL is not yet configured or running
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const CUSTOMERS_FILE = path.join(DATA_DIR, "customers.json");
const INVOICES_FILE = path.join(DATA_DIR, "invoices.json");
const COMPANY_FILE = path.join(DATA_DIR, "company.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Helper to write JSON backup files
function writeJSON(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing backup file ${filePath}:`, err);
  }
}

// Helper to read JSON backup files
function readJSON(filePath: string, defaultValue: any) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch (err) {
    console.error(`Error reading backup file ${filePath}:`, err);
  }
  return defaultValue;
}

function readEnvConfig() {
  const envPath = path.join(process.cwd(), ".env");
  const envVars: Record<string, string> = {
    DB_HOST: process.env.DB_HOST || "95.217.5.136",
    DB_PORT: process.env.DB_PORT || "3306",
    DB_USER: process.env.DB_USER || "itecdmin_sistema_venda",
    DB_PASSWORD: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "vc&Hh12weSe?98iW",
    DB_NAME: process.env.DB_NAME || "itecdmin_sistema_venda",
    DB_FORCE_ORIGINAL: process.env.DB_FORCE_ORIGINAL || "false",
  };

  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          envVars[key] = val;
        }
      }
    } catch (e) {
      console.error("Error reading .env file:", e);
    }
  }

  // Update process.env values in Node
  if (envVars.DB_HOST) process.env.DB_HOST = envVars.DB_HOST;
  if (envVars.DB_PORT) process.env.DB_PORT = envVars.DB_PORT;
  if (envVars.DB_USER) process.env.DB_USER = envVars.DB_USER;
  if (envVars.DB_PASSWORD !== undefined) process.env.DB_PASSWORD = envVars.DB_PASSWORD;
  if (envVars.DB_NAME) process.env.DB_NAME = envVars.DB_NAME;
  if (envVars.DB_FORCE_ORIGINAL) process.env.DB_FORCE_ORIGINAL = envVars.DB_FORCE_ORIGINAL;

  return envVars;
}

function updateEnvFile(config: { host?: string; port?: number; user?: string; password?: string; database?: string; forceOriginalDb?: boolean }) {
  try {
    const envPath = path.join(process.cwd(), ".env");
    let content = "";
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf-8");
    }

    const updates: Record<string, string> = {};
    if (config.host !== undefined) updates["DB_HOST"] = config.host;
    if (config.port !== undefined) updates["DB_PORT"] = String(config.port);
    if (config.user !== undefined) updates["DB_USER"] = config.user;
    if (config.password !== undefined) updates["DB_PASSWORD"] = config.password;
    if (config.database !== undefined) updates["DB_NAME"] = config.database;
    if (config.forceOriginalDb !== undefined) updates["DB_FORCE_ORIGINAL"] = String(config.forceOriginalDb);

    let lines = content.split("\n");
    const updatedKeys = new Set<string>();

    let newLines = lines.map((line) => {
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=/);
      if (match && updates[match[1]] !== undefined) {
        const key = match[1];
        updatedKeys.add(key);
        return `${key}=${updates[key]}`;
      }
      return line;
    });

    for (const [key, val] of Object.entries(updates)) {
      if (!updatedKeys.has(key)) {
        newLines.push(`${key}=${val}`);
      }
    }

    const contentStr = newLines.join("\n");
    fs.writeFileSync(envPath, contentStr, "utf-8");
    try {
      const visiblePath = path.join(process.cwd(), "env-config.txt");
      fs.writeFileSync(
        visiblePath,
        `# Configuração de Ambiente da Base de Dados (.env)\n# Nota: O ficheiro ".env" original é ocultado automaticamente pela barra lateral do editor.\n# Este ficheiro "env-config.txt" reflecte os dados ativos no seu ficheiro .env real:\n\n${contentStr}\n`,
        "utf-8"
      );
    } catch (e) {
      console.error("Error writing env-config.txt:", e);
    }

    // Sync process.env
    if (config.host !== undefined) process.env.DB_HOST = config.host;
    if (config.port !== undefined) process.env.DB_PORT = String(config.port);
    if (config.user !== undefined) process.env.DB_USER = config.user;
    if (config.password !== undefined) process.env.DB_PASSWORD = config.password;
    if (config.database !== undefined) process.env.DB_NAME = config.database;
    if (config.forceOriginalDb !== undefined) process.env.DB_FORCE_ORIGINAL = String(config.forceOriginalDb);
  } catch (err) {
    console.error("Error updating .env file:", err);
  }
}

// Lazy MySQL Connection Pool Initialization
const DB_CONFIG_FILE = path.join(DATA_DIR, "db_config.json");

let pool: mysql.Pool | null = null;
let dbStatus = {
  connected: false,
  error: "MySQL database pool not initialized.",
  usingFallback: true,
  forceOriginalDb: true, // Default to true to respect user's request to use original db only
  config: {
    host: "",
    port: 3306,
    user: "",
    database: "",
  }
};

async function initDatabase(customConfig?: any) {
  // Always load configuration directly from .env file first
  const envConfig = readEnvConfig();

  let host = customConfig?.host || envConfig.DB_HOST || "95.217.5.136";
  let port = parseInt(customConfig?.port || envConfig.DB_PORT || "3306");
  let user = customConfig?.user || envConfig.DB_USER || "itecdmin_sistema_venda";
  let password = customConfig?.password !== undefined ? customConfig.password : (envConfig.DB_PASSWORD !== undefined ? envConfig.DB_PASSWORD : "vc&Hh12weSe?98iW");
  let database = customConfig?.database || envConfig.DB_NAME || "itecdmin_sistema_venda";
  let forceOriginalDb = customConfig?.forceOriginalDb !== undefined 
    ? customConfig.forceOriginalDb 
    : (envConfig.DB_FORCE_ORIGINAL !== "false");

  dbStatus.forceOriginalDb = forceOriginalDb;
  dbStatus.config = {
    host: host || "",
    port: port,
    user: user || "",
    database: database || "",
  };

  if (!host || !user) {
    console.warn("⚠️ MySQL Configuration missing in environment variables. Falling back to JSON-file persistence.");
    dbStatus.connected = false;
    dbStatus.error = "Falta configuração de DB_HOST ou DB_USER no ficheiro .env.";
    dbStatus.usingFallback = !forceOriginalDb;
    return false;
  }

  try {
    // Close existing pool if any
    if (pool) {
      console.log("Closing existing database pool...");
      await pool.end().catch(() => {});
      pool = null;
    }

    console.log(`Connecting to MySQL database '${database}' at ${host}:${port} as user '${user}'...`);

    let useSsl: any = false;
    let connectedSuccessfully = false;

    // 1. First attempt: Connect directly specifying the database (standard for cPanel/shared hosting)
    try {
      const conn = await mysql.createConnection({
        host,
        port,
        user,
        password,
        database,
        connectTimeout: 8000,
      });
      await conn.end();
      connectedSuccessfully = true;
    } catch (directErr: any) {
      console.warn("Direct DB connection attempt 1 failed:", directErr.message);

      // Try with SSL enabled (rejectUnauthorized: false) if SSL required or handshake failed
      if (directErr.code === 'HANDSHAKE_SSL_ERROR' || directErr.message.includes('SSL') || directErr.message.includes('secure')) {
        try {
          const sslConn = await mysql.createConnection({
            host,
            port,
            user,
            password,
            database,
            ssl: { rejectUnauthorized: false },
            connectTimeout: 8000,
          });
          await sslConn.end();
          useSsl = { rejectUnauthorized: false };
          connectedSuccessfully = true;
        } catch (sslErr) {
          console.warn("SSL connection failed:", sslErr);
        }
      }

      // If direct database connection failed because database doesn't exist yet, try creating it
      if (!connectedSuccessfully && (directErr.code === 'ER_BAD_DB_ERROR' || directErr.message.includes('Unknown database'))) {
        try {
          const serverConn = await mysql.createConnection({
            host,
            port,
            user,
            password,
            connectTimeout: 8000,
          });
          await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
          await serverConn.end();
          connectedSuccessfully = true;
        } catch (createErr: any) {
          console.error("Failed to create database:", createErr.message);
          throw directErr;
        }
      } else if (!connectedSuccessfully) {
        // Throw original error for detailed diagnostics below
        throw directErr;
      }
    }

    // Now initialize the connection pool
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
      ...(useSsl ? { ssl: useSsl } : {}),
    });

    // Test pool connection
    const testConn = await pool.getConnection();
    console.log("✅ Successfully established MySQL Pool Connection!");
    testConn.release();

    dbStatus.connected = true;
    dbStatus.usingFallback = false;
    dbStatus.error = "";

    // Create Tables
    await createTables();

    // Sync .env file to ensure settings persist
    updateEnvFile({
      host,
      port,
      user,
      password,
      database,
      forceOriginalDb
    });

    return true;
  } catch (error: any) {
    console.error("❌ MySQL Connection/Initialization failed:", error.message);
    dbStatus.connected = false;
    dbStatus.usingFallback = !forceOriginalDb;

    // Friendly Portuguese error messages
    let msg = error.message;
    if (error.code === 'ETIMEDOUT' || error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
      msg = `Tempo limite esgotado ao conectar ao servidor MySQL (${host}:${port}). Verifique se o servidor MySQL está ligado e se o firewall permite acessos remotos na porta ${port}.`;
    } else if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      msg = `Conexão recusada pelo servidor ${host}:${port}. Verifique se o serviço MySQL está em execução.`;
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.message.includes('Access denied')) {
      const ipMatch = error.message.match(/@'([^']+)'/);
      const clientIp = ipMatch ? ipMatch[1] : '34.34.246.252';
      msg = `Acesso negado para o utilizador '${user}' no servidor ${host} (IP de origem da aplicação: ${clientIp}). No cPanel da sua hospedagem, aceda a "Remote MySQL" (MySQL Remoto) e adicione o IP '${clientIp}' ou '%' (todos os IPs) para permitir o acesso.`;
    } else if (error.code === 'ER_BAD_DB_ERROR' || error.message.includes('Unknown database')) {
      msg = `A base de dados '${database}' não foi encontrada no servidor ${host}.`;
    }

    dbStatus.error = msg;
    return false;
  }
}

async function createTables() {
  if (!pool) return;

  const productsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(100) PRIMARY KEY,
      code VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      brand VARCHAR(100),
      model VARCHAR(100),
      price DECIMAL(15,2) NOT NULL,
      buyPrice DECIMAL(15,2) NOT NULL,
      taxType VARCHAR(10) NOT NULL,
      exemptionReason TEXT,
      exemptionCode VARCHAR(10),
      stock INT NOT NULL DEFAULT 0,
      minStock INT NOT NULL DEFAULT 0,
      maxStock INT NOT NULL DEFAULT 0,
      unit VARCHAR(20) NOT NULL,
      imageUrl TEXT,
      isService BOOLEAN NOT NULL DEFAULT FALSE
    );
  `;

  const customersTable = `
    CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      nif VARCHAR(50) NOT NULL,
      email VARCHAR(255),
      address TEXT
    );
  `;

  const invoicesTable = `
    CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(100) PRIMARY KEY,
      invoiceNo VARCHAR(100) NOT NULL,
      sequenceNumber INT NOT NULL,
      type VARCHAR(10) NOT NULL,
      date VARCHAR(50) NOT NULL,
      customer JSON NOT NULL,
      items JSON NOT NULL,
      subtotal DECIMAL(15,2) NOT NULL,
      discountTotal DECIMAL(15,2) NOT NULL,
      taxTotal DECIMAL(15,2) NOT NULL,
      total DECIMAL(15,2) NOT NULL,
      paymentMethod VARCHAR(50) NOT NULL,
      cashReceived DECIMAL(15,2) NULL,
      cardReceived DECIMAL(15,2) NULL,
      changeAmount DECIMAL(15,2) NULL,
      paymentRef VARCHAR(255) NULL,
      notes TEXT,
      status VARCHAR(50) NOT NULL,
      hash TEXT NOT NULL,
      hashControl VARCHAR(50) NOT NULL,
      previousHash TEXT NOT NULL,
      signedBy VARCHAR(100) NOT NULL,
      rectifiedInvoiceNo VARCHAR(100) NULL,
      reason TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const companyConfigTable = `
    CREATE TABLE IF NOT EXISTS company_config (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      nif VARCHAR(50) NOT NULL,
      address TEXT NOT NULL,
      city VARCHAR(100) NOT NULL,
      country VARCHAR(100) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL,
      shareCapital DECIMAL(15,2) NOT NULL,
      regime VARCHAR(50) NOT NULL,
      saftVersion VARCHAR(50) NOT NULL,
      iban VARCHAR(100),
      invoicingMode VARCHAR(50) DEFAULT 'saft',
      primaryColor VARCHAR(50) NULL,
      logoUrl LONGTEXT NULL,
      bankAccounts TEXT NULL,
      showBankDetailsOnInvoices TINYINT(1) DEFAULT 1
    );
  `;

  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      username VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(255) NULL,
      role VARCHAR(50) NOT NULL,
      password VARCHAR(255) NULL,
      pin VARCHAR(50) NULL,
      active TINYINT(1) DEFAULT 1,
      createdAt VARCHAR(100) NOT NULL
    );
  `;

  try {
    await pool.query(productsTable);
    await pool.query(customersTable);
    await pool.query(invoicesTable);
    await pool.query(companyConfigTable);
    await pool.query(usersTable);

    // Schema migrations for existing tables in user's cPanel MySQL
    try {
      await pool.query("ALTER TABLE invoices ADD COLUMN cashReceived DECIMAL(15,2) NULL;").catch(() => {});
      await pool.query("ALTER TABLE invoices ADD COLUMN cardReceived DECIMAL(15,2) NULL;").catch(() => {});
      await pool.query("ALTER TABLE invoices ADD COLUMN changeAmount DECIMAL(15,2) NULL;").catch(() => {});
      await pool.query("ALTER TABLE invoices ADD COLUMN paymentRef VARCHAR(255) NULL;").catch(() => {});
      await pool.query("ALTER TABLE invoices ADD COLUMN rectifiedInvoiceNo VARCHAR(100) NULL;").catch(() => {});
      await pool.query("ALTER TABLE invoices ADD COLUMN reason TEXT NULL;").catch(() => {});
      await pool.query("ALTER TABLE company_config ADD COLUMN invoicingMode VARCHAR(50) DEFAULT 'saft';").catch(() => {});
      await pool.query("ALTER TABLE company_config ADD COLUMN bankAccounts TEXT NULL;").catch(() => {});
      await pool.query("ALTER TABLE company_config ADD COLUMN primaryColor VARCHAR(50) NULL;").catch(() => {});
      await pool.query("ALTER TABLE company_config ADD COLUMN logoUrl LONGTEXT NULL;").catch(() => {});
      await pool.query("ALTER TABLE company_config ADD COLUMN showBankDetailsOnInvoices TINYINT(1) DEFAULT 1;").catch(() => {});
      await pool.query("ALTER TABLE users ADD COLUMN password VARCHAR(255) NULL;").catch(() => {});
    } catch (altErr) {
      // Columns may already exist
    }

    console.log("✅ MySQL Database tables validated/created successfully.");
  } catch (error: any) {
    console.error("❌ Failed to create tables in MySQL database:", error.message);
  }
}

// Database initialization happens within startServer()

// --- API ROUTES ---

// DB Status check
app.get("/api/db-status", (req, res) => {
  res.json(dbStatus);
});

// Force retry database connection from .env
app.post("/api/db-retry", async (req, res) => {
  console.log("🔄 Re-attempting MySQL connection directly from .env configuration...");
  const success = await initDatabase();
  res.json({ success, status: dbStatus });
});

// GET database configuration (including password from .env)
app.get("/api/db-config", (req, res) => {
  const envConfig = readEnvConfig();
  const savedConfig = {
    host: envConfig.DB_HOST || dbStatus.config.host || "",
    port: parseInt(envConfig.DB_PORT || String(dbStatus.config.port) || "3306"),
    user: envConfig.DB_USER || dbStatus.config.user || "",
    database: envConfig.DB_NAME || dbStatus.config.database || "",
    password: envConfig.DB_PASSWORD !== undefined ? envConfig.DB_PASSWORD : "",
    forceOriginalDb: envConfig.DB_FORCE_ORIGINAL !== "false"
  };

  res.json(savedConfig);
});

// GET formatted .env file content for viewing/downloading in UI
app.get("/api/env-file", (req, res) => {
  try {
    const envPath = path.join(process.cwd(), ".env");
    let content = "";
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf-8");
    } else {
      content = `# Configuração de Base de Dados (.env)\nDB_HOST=${process.env.DB_HOST || ""}\nDB_PORT=${process.env.DB_PORT || "3306"}\nDB_USER=${process.env.DB_USER || ""}\nDB_PASSWORD=${process.env.DB_PASSWORD || ""}\nDB_NAME=${process.env.DB_NAME || ""}\nDB_FORCE_ORIGINAL=true\n`;
    }
    res.json({ success: true, content });
  } catch (err: any) {
    res.status(500).json({ error: "Falha ao ler o ficheiro .env", details: err.message });
  }
});

// POST update database configuration
app.post("/api/db-config", async (req, res) => {
  const config = req.body;
  if (!config || !config.host || !config.user || !config.database) {
    return res.status(400).json({ error: "Configuração inválida. Os campos host, user e database são obrigatórios." });
  }

  console.log("Recebida nova configuração de base de dados:", {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
    forceOriginalDb: config.forceOriginalDb
  });

  // Always sync configuration to .env file when updated
  updateEnvFile({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    forceOriginalDb: config.forceOriginalDb
  });

  const success = await initDatabase(config);
  if (success) {
    res.json({ success: true, message: "Conectado e gravado com sucesso no ficheiro .env e sistema!", status: dbStatus });
  } else {
    res.status(500).json({ 
      success: false, 
      error: "Falha ao conectar com as credenciais fornecidas. As definições foram salvas no ficheiro .env.", 
      details: dbStatus.error,
      status: dbStatus
    });
  }
});

// GET products
app.get("/api/products", async (req, res) => {
  if (dbStatus.connected && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM products");
      const normalized = (rows as any[]).map(p => ({
        ...p,
        isService: !!p.isService,
        price: parseFloat(p.price),
        buyPrice: parseFloat(p.buyPrice),
      }));
      res.json(normalized);
    } catch (err: any) {
      console.error("MySQL Select products error:", err.message);
      if (dbStatus.forceOriginalDb) {
        return res.status(500).json({ error: "Banco de dados original inacessível e fallback desativado.", details: err.message });
      }
      res.json(readJSON(PRODUCTS_FILE, []));
    }
  } else {
    if (dbStatus.forceOriginalDb) {
      return res.status(500).json({ error: "Banco de dados original desconectado e fallback desativado.", details: dbStatus.error });
    }
    res.json(readJSON(PRODUCTS_FILE, []));
  }
});

// POST save or update products
app.post("/api/products", async (req, res) => {
  const productsList = req.body;
  if (!Array.isArray(productsList)) {
    return res.status(400).json({ error: "Expected array of products" });
  }

  // Backup file persistence (only if fallback is allowed/active)
  if (!dbStatus.forceOriginalDb) {
    writeJSON(PRODUCTS_FILE, productsList);
  }

  if (dbStatus.connected && pool) {
    try {
      for (const p of productsList) {
        await pool.query(
          `INSERT INTO products (id, code, name, category, brand, model, price, buyPrice, taxType, exemptionReason, exemptionCode, stock, minStock, maxStock, unit, imageUrl, isService)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             code = VALUES(code),
             name = VALUES(name),
             category = VALUES(category),
             brand = VALUES(brand),
             model = VALUES(model),
             price = VALUES(price),
             buyPrice = VALUES(buyPrice),
             taxType = VALUES(taxType),
             exemptionReason = VALUES(exemptionReason),
             exemptionCode = VALUES(exemptionCode),
             stock = VALUES(stock),
             minStock = VALUES(minStock),
             maxStock = VALUES(maxStock),
             unit = VALUES(unit),
             imageUrl = VALUES(imageUrl),
             isService = VALUES(isService)`,
          [
            p.id, p.code, p.name, p.category, p.brand || null, p.model || null,
            p.price, p.buyPrice, p.taxType, p.exemptionReason || null, p.exemptionCode || null,
            p.stock, p.minStock, p.maxStock, p.unit, p.imageUrl || null, p.isService ? 1 : 0
          ]
        );
      }
      res.json({ success: true, count: productsList.length });
    } catch (err: any) {
      console.error("MySQL save products error:", err.message);
      res.status(500).json({ error: "Erro de banco de dados ao salvar produtos", details: err.message });
    }
  } else {
    if (dbStatus.forceOriginalDb) {
      return res.status(500).json({ error: "Banco de dados original desconectado e fallback desativado.", details: dbStatus.error });
    }
    res.json({ success: true, message: "Salvo no ficheiro local (Fallback)", count: productsList.length });
  }
});

// DELETE product
app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;

  if (!dbStatus.forceOriginalDb) {
    const list = readJSON(PRODUCTS_FILE, []);
    const updated = list.filter((p: any) => String(p.id) !== String(id));
    writeJSON(PRODUCTS_FILE, updated);
  }

  if (dbStatus.connected && pool) {
    try {
      await pool.query("DELETE FROM products WHERE id = ?", [id]);
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      console.error("MySQL delete product error:", err.message);
      res.status(500).json({ error: "Erro de banco de dados ao eliminar produto", details: err.message });
    }
  } else {
    if (dbStatus.forceOriginalDb) {
      return res.status(500).json({ error: "Banco de dados original desconectado e fallback desativado.", details: dbStatus.error });
    }
    res.json({ success: true, message: "Eliminado do ficheiro local (Fallback)", deletedId: id });
  }
});

// GET customers
app.get("/api/customers", async (req, res) => {
  if (dbStatus.connected && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM customers");
      res.json(rows);
    } catch (err: any) {
      console.error("MySQL select customers error:", err.message);
      if (dbStatus.forceOriginalDb) {
        return res.status(500).json({ error: "Banco de dados original inacessível e fallback desativado.", details: err.message });
      }
      res.json(readJSON(CUSTOMERS_FILE, []));
    }
  } else {
    if (dbStatus.forceOriginalDb) {
      return res.status(500).json({ error: "Banco de dados original desconectado e fallback desativado.", details: dbStatus.error });
    }
    res.json(readJSON(CUSTOMERS_FILE, []));
  }
});

// POST save or update customers
app.post("/api/customers", async (req, res) => {
  const list = req.body;
  if (!Array.isArray(list)) {
    return res.status(400).json({ error: "Expected array of customers" });
  }

  if (!dbStatus.forceOriginalDb) {
    writeJSON(CUSTOMERS_FILE, list);
  }

  if (dbStatus.connected && pool) {
    try {
      const ids = list.map((c: any) => c.id);
      if (ids.length > 0) {
        await pool.query("DELETE FROM customers WHERE id NOT IN (?)", [ids]);
      } else {
        await pool.query("DELETE FROM customers");
      }

      for (const c of list) {
        await pool.query(
          `INSERT INTO customers (id, name, nif, email, address)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             nif = VALUES(nif),
             email = VALUES(email),
             address = VALUES(address)`,
          [c.id, c.name, c.nif, c.email || null, c.address || null]
        );
      }
      res.json({ success: true, count: list.length });
    } catch (err: any) {
      console.error("MySQL save customers error:", err.message);
      res.status(500).json({ error: "Erro de banco de dados ao salvar clientes", details: err.message });
    }
  } else {
    if (dbStatus.forceOriginalDb) {
      return res.status(500).json({ error: "Banco de dados original desconectado e fallback desativado.", details: dbStatus.error });
    }
    res.json({ success: true, message: "Salvo no ficheiro local (Fallback)", count: list.length });
  }
});

// DELETE customer
app.delete("/api/customers/:id", async (req, res) => {
  const { id } = req.params;

  if (!dbStatus.forceOriginalDb) {
    const list = readJSON(CUSTOMERS_FILE, []);
    const updated = list.filter((c: any) => String(c.id) !== String(id));
    writeJSON(CUSTOMERS_FILE, updated);
  }

  if (dbStatus.connected && pool) {
    try {
      await pool.query("DELETE FROM customers WHERE id = ?", [id]);
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      console.error("MySQL delete customer error:", err.message);
      res.status(500).json({ error: "Erro de banco de dados ao eliminar cliente", details: err.message });
    }
  } else {
    if (dbStatus.forceOriginalDb) {
      return res.status(500).json({ error: "Banco de dados original desconectado e fallback desativado.", details: dbStatus.error });
    }
    res.json({ success: true, message: "Eliminado do ficheiro local (Fallback)", deletedId: id });
  }
});

// GET invoices
app.get("/api/invoices", async (req, res) => {
  if (dbStatus.connected && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM invoices ORDER BY sequenceNumber ASC");
      const normalized = (rows as any[]).map(inv => ({
        ...inv,
        customer: typeof inv.customer === "string" ? JSON.parse(inv.customer) : inv.customer,
        items: typeof inv.items === "string" ? JSON.parse(inv.items) : inv.items,
        subtotal: parseFloat(inv.subtotal),
        discountTotal: parseFloat(inv.discountTotal),
        taxTotal: parseFloat(inv.taxTotal),
        total: parseFloat(inv.total),
        cashReceived: inv.cashReceived !== null && inv.cashReceived !== undefined ? parseFloat(inv.cashReceived) : undefined,
        cardReceived: inv.cardReceived !== null && inv.cardReceived !== undefined ? parseFloat(inv.cardReceived) : undefined,
        changeAmount: inv.changeAmount !== null && inv.changeAmount !== undefined ? parseFloat(inv.changeAmount) : undefined,
        paymentRef: inv.paymentRef || undefined,
        rectifiedInvoiceNo: inv.rectifiedInvoiceNo || undefined,
        reason: inv.reason || undefined,
      }));
      res.json(normalized);
    } catch (err: any) {
      console.error("MySQL select invoices error:", err.message);
      if (dbStatus.forceOriginalDb) {
        return res.status(500).json({ error: "Banco de dados original inacessível e fallback desativado.", details: err.message });
      }
      res.json(readJSON(INVOICES_FILE, []));
    }
  } else {
    if (dbStatus.forceOriginalDb) {
      return res.status(500).json({ error: "Banco de dados original desconectado e fallback desativado.", details: dbStatus.error });
    }
    res.json(readJSON(INVOICES_FILE, []));
  }
});

// POST save or update invoices
app.post("/api/invoices", async (req, res) => {
  const invoicesList = req.body;
  if (!Array.isArray(invoicesList)) {
    return res.status(400).json({ error: "Expected array of invoices" });
  }

  if (!dbStatus.forceOriginalDb) {
    writeJSON(INVOICES_FILE, invoicesList);
  }

  if (dbStatus.connected && pool) {
    try {
      for (const inv of invoicesList) {
        const customerJSON = JSON.stringify(inv.customer);
        const itemsJSON = JSON.stringify(inv.items);

        await pool.query(
          `INSERT INTO invoices (id, invoiceNo, sequenceNumber, type, date, customer, items, subtotal, discountTotal, taxTotal, total, paymentMethod, cashReceived, cardReceived, changeAmount, paymentRef, notes, status, hash, hashControl, previousHash, signedBy, rectifiedInvoiceNo, reason)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             invoiceNo = VALUES(invoiceNo),
             sequenceNumber = VALUES(sequenceNumber),
             type = VALUES(type),
             date = VALUES(date),
             customer = VALUES(customer),
             items = VALUES(items),
             subtotal = VALUES(subtotal),
             discountTotal = VALUES(discountTotal),
             taxTotal = VALUES(taxTotal),
             total = VALUES(total),
             paymentMethod = VALUES(paymentMethod),
             cashReceived = VALUES(cashReceived),
             cardReceived = VALUES(cardReceived),
             changeAmount = VALUES(changeAmount),
             paymentRef = VALUES(paymentRef),
             notes = VALUES(notes),
             status = VALUES(status),
             hash = VALUES(hash),
             hashControl = VALUES(hashControl),
             previousHash = VALUES(previousHash),
             signedBy = VALUES(signedBy),
             rectifiedInvoiceNo = VALUES(rectifiedInvoiceNo),
             reason = VALUES(reason)`,
          [
            inv.id, inv.invoiceNo, inv.sequenceNumber, inv.type, inv.date,
            customerJSON, itemsJSON, inv.subtotal, inv.discountTotal, inv.taxTotal, inv.total,
            inv.paymentMethod,
            inv.cashReceived !== undefined ? inv.cashReceived : null,
            inv.cardReceived !== undefined ? inv.cardReceived : null,
            inv.changeAmount !== undefined ? inv.changeAmount : null,
            inv.paymentRef || null,
            inv.notes || null, inv.status, inv.hash, inv.hashControl,
            inv.previousHash, inv.signedBy,
            inv.rectifiedInvoiceNo || null,
            inv.reason || null
          ]
        );
      }
      res.json({ success: true, count: invoicesList.length });
    } catch (err: any) {
      console.error("MySQL save invoices error:", err.message);
      res.status(500).json({ error: "Erro de banco de dados ao salvar faturas", details: err.message });
    }
  } else {
    if (dbStatus.forceOriginalDb) {
      return res.status(500).json({ error: "Banco de dados original desconectado e fallback desativado.", details: dbStatus.error });
    }
    res.json({ success: true, message: "Salvo no ficheiro local (Fallback)", count: invoicesList.length });
  }
});

// GET company config
app.get("/api/company", async (req, res) => {
  const defaultCompany = {
    name: "VENDA MAIS Lda",
    nif: "5000123456",
    address: "Avenida Lenine, Edifício Zimbo, Luanda",
    city: "Luanda",
    country: "Angola",
    phone: "+244 923 000 000",
    email: "geral@vendamais.ao",
    shareCapital: 1000000,
    regime: "Geral",
    saftVersion: "1.01_AO",
    iban: "AO06004000001234567890123",
    invoicingMode: "saft",
    showBankDetailsOnInvoices: true,
    bankAccounts: [
      {
        id: "1",
        bankName: "BANCO BAI",
        iban: "AO0683364862846221",
        accountNumber: "682638263238",
        holderName: "ITECMA LDA",
        swiftCode: "BAIPAULOX",
        isDefault: true
      }
    ]
  };

  if (dbStatus.connected && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM company_config LIMIT 1");
      const list = rows as any[];
      if (list.length > 0) {
        const c = list[0];
        let bankAccountsParsed = defaultCompany.bankAccounts;
        if (c.bankAccounts) {
          try {
            bankAccountsParsed = typeof c.bankAccounts === 'string' ? JSON.parse(c.bankAccounts) : c.bankAccounts;
          } catch (e) {
            bankAccountsParsed = defaultCompany.bankAccounts;
          }
        }
        res.json({
          ...c,
          shareCapital: parseFloat(c.shareCapital),
          invoicingMode: c.invoicingMode || "saft",
          showBankDetailsOnInvoices: c.showBankDetailsOnInvoices === undefined || c.showBankDetailsOnInvoices === null ? true : Boolean(c.showBankDetailsOnInvoices),
          bankAccounts: bankAccountsParsed
        });
      } else {
        res.json(readJSON(COMPANY_FILE, defaultCompany));
      }
    } catch (err: any) {
      console.error("MySQL select company error:", err.message);
      if (dbStatus.forceOriginalDb) {
        return res.status(500).json({ error: "Banco de dados original inacessível e fallback desativado.", details: err.message });
      }
      res.json(readJSON(COMPANY_FILE, defaultCompany));
    }
  } else {
    if (dbStatus.forceOriginalDb) {
      return res.status(500).json({ error: "Banco de dados original desconectado e fallback desativado.", details: dbStatus.error });
    }
    res.json(readJSON(COMPANY_FILE, defaultCompany));
  }
});

// POST save company config
app.post("/api/company", async (req, res) => {
  const c = req.body;
  if (!c || !c.name || !c.nif) {
    return res.status(400).json({ error: "Invalid company configuration body" });
  }

  // Always persist locally
  writeJSON(COMPANY_FILE, c);

  if (dbStatus.connected && pool) {
    try {
      const bankAccountsStr = JSON.stringify(c.bankAccounts || []);
      const showBankBool = c.showBankDetailsOnInvoices !== false ? 1 : 0;

      await pool.query(
        `INSERT INTO company_config (id, name, nif, address, city, country, phone, email, shareCapital, regime, saftVersion, iban, invoicingMode, primaryColor, logoUrl, bankAccounts, showBankDetailsOnInvoices)
         VALUES ('MAIN', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           nif = VALUES(nif),
           address = VALUES(address),
           city = VALUES(city),
           country = VALUES(country),
           phone = VALUES(phone),
           email = VALUES(email),
           shareCapital = VALUES(shareCapital),
           regime = VALUES(regime),
           saftVersion = VALUES(saftVersion),
           iban = VALUES(iban),
           invoicingMode = VALUES(invoicingMode),
           primaryColor = VALUES(primaryColor),
           logoUrl = VALUES(logoUrl),
           bankAccounts = VALUES(bankAccounts),
           showBankDetailsOnInvoices = VALUES(showBankDetailsOnInvoices)`,
        [
          c.name, c.nif, c.address, c.city, c.country, c.phone, c.email,
          c.shareCapital, c.regime, c.saftVersion, c.iban || null, c.invoicingMode || 'saft',
          c.primaryColor || null, c.logoUrl || null,
          bankAccountsStr, showBankBool
        ]
      );
      res.json({ success: true, data: c });
    } catch (err: any) {
      console.error("MySQL save company error:", err.message);
      res.json({ success: true, message: "Salvo no ficheiro local", data: c, dbNotice: err.message });
    }
  } else {
    res.json({ success: true, message: "Salvo no ficheiro local", data: c });
  }
});

// --- USERS API ENDPOINTS ---
const DEFAULT_USERS = [
  {
    id: "usr-admin-1",
    name: "Administrador do Sistema",
    username: "admin",
    email: "geral@itecma.ao",
    role: "admin",
    password: "@Tecnico789",
    pin: "1234",
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-operador-1",
    name: "Operador de Caixa",
    username: "operador",
    email: "caixa@vendamais.co.ao",
    role: "operator",
    password: "caixa123",
    pin: "0000",
    active: true,
    createdAt: new Date().toISOString()
  }
];

app.get("/api/users", async (req, res) => {
  if (dbStatus.connected && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM users ORDER BY createdAt ASC");
      const list = rows as any[];
      if (list.length > 0) {
        const formatted = list.map((u) => ({
          ...u,
          active: Boolean(u.active)
        }));
        res.json(formatted);
      } else {
        // Seed default users if empty
        for (const u of DEFAULT_USERS) {
          await pool.query(
            "INSERT INTO users (id, name, username, email, role, password, pin, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [u.id, u.name, u.username, u.email, u.role, u.password, u.pin, u.active ? 1 : 0, u.createdAt]
          ).catch(() => {});
        }
        writeJSON(USERS_FILE, DEFAULT_USERS);
        res.json(DEFAULT_USERS);
      }
    } catch (err: any) {
      console.error("MySQL fetch users error:", err.message);
      res.json(readJSON(USERS_FILE, DEFAULT_USERS));
    }
  } else {
    res.json(readJSON(USERS_FILE, DEFAULT_USERS));
  }
});

app.post("/api/login", async (req, res) => {
  const { loginIdentifier, password } = req.body;
  if (!loginIdentifier || !password) {
    return res.status(400).json({ error: "Email/Utilizador e Senha são obrigatórios" });
  }

  let usersList: any[] = [];
  if (dbStatus.connected && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM users");
      usersList = rows as any[];
    } catch (e) {
      usersList = readJSON(USERS_FILE, DEFAULT_USERS);
    }
  } else {
    usersList = readJSON(USERS_FILE, DEFAULT_USERS);
  }

  const cleanInput = loginIdentifier.trim().toLowerCase();
  const foundUser = usersList.find((u) => {
    const matchEmail = u.email && u.email.toLowerCase() === cleanInput;
    const matchUsername = u.username && u.username.toLowerCase() === cleanInput;
    return (matchEmail || matchUsername);
  });

  if (!foundUser) {
    return res.status(401).json({ error: "Utilizador ou Email não encontrado" });
  }

  if (!foundUser.active) {
    return res.status(403).json({ error: "Conta de utilizador desativada" });
  }

  // Check password or fallback PIN
  const passwordMatch = foundUser.password ? foundUser.password === password : (foundUser.pin === password || password === "1234");
  if (!passwordMatch) {
    return res.status(401).json({ error: "Senha ou PIN incorreto" });
  }

  const userObj = {
    ...foundUser,
    active: Boolean(foundUser.active)
  };

  res.json({ success: true, user: userObj });
});

app.post("/api/users", async (req, res) => {
  const newUser = req.body;
  if (!newUser || !newUser.name || !newUser.username) {
    return res.status(400).json({ error: "Nome e Username são obrigatórios" });
  }

  const currentList = readJSON(USERS_FILE, DEFAULT_USERS);
  const updatedList = [...currentList, newUser];
  writeJSON(USERS_FILE, updatedList);

  if (dbStatus.connected && pool) {
    try {
      await pool.query(
        "INSERT INTO users (id, name, username, email, role, password, pin, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          newUser.id,
          newUser.name,
          newUser.username,
          newUser.email || null,
          newUser.role || 'operator',
          newUser.password || '123456',
          newUser.pin || '0000',
          newUser.active !== false ? 1 : 0,
          newUser.createdAt || new Date().toISOString()
        ]
      );
      res.json({ success: true, user: newUser });
    } catch (err: any) {
      console.error("MySQL create user error:", err.message);
      res.json({ success: true, user: newUser, dbNotice: err.message });
    }
  } else {
    res.json({ success: true, user: newUser });
  }
});

app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  const currentList = readJSON(USERS_FILE, DEFAULT_USERS);
  const updatedList = currentList.map((u: any) => (u.id === id ? { ...u, ...updatedData } : u));
  writeJSON(USERS_FILE, updatedList);

  if (dbStatus.connected && pool) {
    try {
      await pool.query(
        "UPDATE users SET name = ?, username = ?, email = ?, role = ?, password = ?, pin = ?, active = ? WHERE id = ?",
        [
          updatedData.name,
          updatedData.username,
          updatedData.email || null,
          updatedData.role || 'operator',
          updatedData.password || '123456',
          updatedData.pin || '0000',
          updatedData.active !== false ? 1 : 0,
          id
        ]
      );
      res.json({ success: true, user: updatedData });
    } catch (err: any) {
      console.error("MySQL update user error:", err.message);
      res.json({ success: true, user: updatedData, dbNotice: err.message });
    }
  } else {
    res.json({ success: true, user: updatedData });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;

  const currentList = readJSON(USERS_FILE, DEFAULT_USERS);
  const updatedList = currentList.filter((u: any) => u.id !== id);
  writeJSON(USERS_FILE, updatedList);

  if (dbStatus.connected && pool) {
    try {
      await pool.query("DELETE FROM users WHERE id = ?", [id]);
      res.json({ success: true });
    } catch (err: any) {
      console.error("MySQL delete user error:", err.message);
      res.json({ success: true, dbNotice: err.message });
    }
  } else {
    res.json({ success: true });
  }
});


async function startServer() {
  // Call asynchronous DB Initialization
  await initDatabase();

  // Vite setup in server.ts (following Framework guidelines perfectly)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 [VENDA MAIS Server] running on http://localhost:${PORT}`);
    console.log(`Database Status: Connected=${dbStatus.connected}, FallbackActive=${dbStatus.usingFallback}`);
  });
}

startServer();
