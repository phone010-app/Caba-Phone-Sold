import { openDatabaseAsync } from 'expo-sqlite';

// ============================================================
// Caba Phone Sold — قاعدة البيانات (SQLite, تخدم بلا انترنت)
// مبنية بـ API الجديد تع expo-sqlite (openDatabaseAsync)
// ============================================================

let dbPromise = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync('caba_phone_sold.db');
  }
  return dbPromise;
}

export async function initDatabase() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      rating INTEGER DEFAULT 3,
      credit_limit REAL DEFAULT 0,
      currency TEXT DEFAULT 'DZD',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS purchase_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      date TEXT DEFAULT (datetime('now')),
      type TEXT DEFAULT 'purchase',
      total_amount REAL NOT NULL,
      original_amount REAL,
      original_currency TEXT,
      exchange_rate REAL,
      note TEXT,
      FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      warranty_months INTEGER DEFAULT 0,
      FOREIGN KEY (transaction_id) REFERENCES purchase_transactions (id)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_item_id INTEGER,
      product_name TEXT NOT NULL,
      imei TEXT,
      barcode TEXT,
      purchase_price REAL,
      sale_price REAL,
      status TEXT DEFAULT 'in_stock',
      warranty_end_date TEXT,
      sold_date TEXT,
      client_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (purchase_item_id) REFERENCES purchase_items (id)
    );

    CREATE TABLE IF NOT EXISTS supplier_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      transaction_id INTEGER,
      amount REAL NOT NULL,
      method TEXT DEFAULT 'cash',
      date TEXT DEFAULT (datetime('now')),
      note TEXT,
      FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
    );

    CREATE TABLE IF NOT EXISTS payment_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      due_date TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      note TEXT,
      FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      credit_limit REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS client_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      inventory_id INTEGER,
      date TEXT DEFAULT (datetime('now')),
      total_amount REAL NOT NULL,
      note TEXT,
      FOREIGN KEY (client_id) REFERENCES clients (id)
    );

    CREATE TABLE IF NOT EXISTS client_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      method TEXT DEFAULT 'cash',
      date TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients (id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      related_type TEXT NOT NULL,
      related_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  console.log('✅ قاعدة البيانات جاهزة');
}
