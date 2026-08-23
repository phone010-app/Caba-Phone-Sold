import * as SQLite from 'expo-sqlite';

// ============================================================
// Caba Phone Sold — قاعدة البيانات (SQLite, تخدم بلا انترنت)
// ============================================================

const db = SQLite.openDatabase('caba_phone_sold.db');

export function initDatabase() {
  db.transaction((tx) => {
    // ---------- الموردين ----------
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        rating INTEGER DEFAULT 3,            -- تقييم المورد من 1 إلى 5
        credit_limit REAL DEFAULT 0,         -- سقف الكريدي المسموح (0 = بلا حد)
        currency TEXT DEFAULT 'DZD',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // ---------- عمليات الشراء من المورد ----------
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS purchase_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_id INTEGER NOT NULL,
        date TEXT DEFAULT (datetime('now')),
        type TEXT DEFAULT 'purchase',        -- purchase | return
        total_amount REAL NOT NULL,          -- المجموع الكلي بالدينار
        original_amount REAL,                -- المبلغ الأصلي (قبل التحويل)
        original_currency TEXT,              -- العملة الأصلية إذا شرا بعملة أخرى
        exchange_rate REAL,                  -- سعر الصرف المستعمل
        note TEXT,
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
      );
    `);

    // ---------- تفاصيل كل عملية شراء (المنتوجات) ----------
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS purchase_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,          -- مثلا Samsung A52S
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        warranty_months INTEGER DEFAULT 0,
        FOREIGN KEY (transaction_id) REFERENCES purchase_transactions (id)
      );
    `);

    // ---------- المخزون (كل جهاز/وحدة على حدة، مع IMEI) ----------
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_item_id INTEGER,
        product_name TEXT NOT NULL,
        imei TEXT,
        barcode TEXT,
        purchase_price REAL,
        sale_price REAL,
        status TEXT DEFAULT 'in_stock',      -- in_stock | sold | returned
        warranty_end_date TEXT,
        sold_date TEXT,
        client_id INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (purchase_item_id) REFERENCES purchase_items (id)
      );
    `);

    // ---------- دفعات (خلاص) للموردين ----------
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS supplier_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_id INTEGER NOT NULL,
        transaction_id INTEGER,              -- إذا الدفعة مرتبطة بعملية معينة
        amount REAL NOT NULL,
        method TEXT DEFAULT 'cash',          -- cash | virement | cheque
        date TEXT DEFAULT (datetime('now')),
        note TEXT,
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
      );
    `);

    // ---------- جدول التسديد (échéancier) ----------
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS payment_schedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_id INTEGER NOT NULL,
        due_date TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',       -- pending | paid | late
        note TEXT,
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
      );
    `);

    // ---------- الزبائن ----------
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        credit_limit REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // ---------- عمليات البيع للزبون (بالكريدي أو كاش) ----------
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS client_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        inventory_id INTEGER,
        date TEXT DEFAULT (datetime('now')),
        total_amount REAL NOT NULL,
        note TEXT,
        FOREIGN KEY (client_id) REFERENCES clients (id)
      );
    `);

    // ---------- دفعات الزبائن ----------
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS client_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        method TEXT DEFAULT 'cash',
        date TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (client_id) REFERENCES clients (id)
      );
    `);

    // ---------- ملاحظات (نصية) على عملية أو مورد ----------
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        related_type TEXT NOT NULL,          -- supplier | transaction | client
        related_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  },
  (error) => console.error('DB init error:', error),
  () => console.log('✅ قاعدة البيانات جاهزة'));
}

export default db;
