import { getDb } from './db';

// ================= الموردين =================
export const addSupplier = async (name, phone, address, creditLimit = 0, currency = 'DZD') => {
  const db = await getDb();
  return db.runAsync(
    `INSERT INTO suppliers (name, phone, address, credit_limit, currency) VALUES (?, ?, ?, ?, ?)`,
    [name, phone, address, creditLimit, currency]
  );
};

export const getSuppliers = async () => {
  const db = await getDb();
  return db.getAllAsync(`SELECT * FROM suppliers ORDER BY name ASC`);
};

export const updateSupplierRating = async (id, rating) => {
  const db = await getDb();
  return db.runAsync(`UPDATE suppliers SET rating = ? WHERE id = ?`, [rating, id]);
};

export const getSupplierBalance = async (supplierId) => {
  const db = await getDb();
  const purchases = await db.getFirstAsync(
    `SELECT COALESCE(SUM(CASE WHEN type='purchase' THEN total_amount ELSE -total_amount END),0) as total
     FROM purchase_transactions WHERE supplier_id = ?`,
    [supplierId]
  );
  const payments = await db.getFirstAsync(
    `SELECT COALESCE(SUM(amount),0) as total FROM supplier_payments WHERE supplier_id = ?`,
    [supplierId]
  );
  return (purchases?.total || 0) - (payments?.total || 0);
};

// ================= عمليات الشراء =================
export const addPurchaseTransaction = async (
  supplierId,
  totalAmount,
  items,
  { type = 'purchase', note = '', originalAmount = null, originalCurrency = null, exchangeRate = null } = {}
) => {
  const db = await getDb();
  let transactionId;

  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO purchase_transactions
        (supplier_id, total_amount, type, note, original_amount, original_currency, exchange_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [supplierId, totalAmount, type, note, originalAmount, originalCurrency, exchangeRate]
    );
    transactionId = result.lastInsertRowId;

    if (type === 'purchase') {
      for (const item of items) {
        const itemResult = await db.runAsync(
          `INSERT INTO purchase_items (transaction_id, product_name, quantity, unit_price, warranty_months)
           VALUES (?, ?, ?, ?, ?)`,
          [transactionId, item.productName, item.quantity, item.unitPrice, item.warrantyMonths || 0]
        );
        const purchaseItemId = itemResult.lastInsertRowId;
        const warrantyEndDate = item.warrantyMonths
          ? new Date(Date.now() + item.warrantyMonths * 30 * 24 * 3600 * 1000).toISOString()
          : null;
        // كل وحدة (جهاز) تتزاد كسطر واحد فالمخزون، باش تولي متتبعة بالـ IMEI فرد فرد
        for (let i = 0; i < item.quantity; i++) {
          await db.runAsync(
            `INSERT INTO inventory (purchase_item_id, product_name, purchase_price, warranty_end_date)
             VALUES (?, ?, ?, ?)`,
            [purchaseItemId, item.productName, item.unitPrice, warrantyEndDate]
          );
        }
      }
    }
  });

  return transactionId;
};

export const getSupplierTransactions = async (supplierId) => {
  const db = await getDb();
  return db.getAllAsync(`SELECT * FROM purchase_transactions WHERE supplier_id = ? ORDER BY date DESC`, [supplierId]);
};

export const getTransactionItems = async (transactionId) => {
  const db = await getDb();
  return db.getAllAsync(`SELECT * FROM purchase_items WHERE transaction_id = ?`, [transactionId]);
};

// ================= الدفعات (الموردين) =================
export const addSupplierPayment = async (supplierId, amount, method = 'cash', note = '', transactionId = null) => {
  const db = await getDb();
  return db.runAsync(
    `INSERT INTO supplier_payments (supplier_id, transaction_id, amount, method, note) VALUES (?, ?, ?, ?, ?)`,
    [supplierId, transactionId, amount, method, note]
  );
};

export const getSupplierPayments = async (supplierId) => {
  const db = await getDb();
  return db.getAllAsync(`SELECT * FROM supplier_payments WHERE supplier_id = ? ORDER BY date DESC`, [supplierId]);
};

// ================= جدول التسديد (échéancier) =================
export const addPaymentSchedule = async (supplierId, dueDate, amount, note = '') => {
  const db = await getDb();
  return db.runAsync(
    `INSERT INTO payment_schedule (supplier_id, due_date, amount, note) VALUES (?, ?, ?, ?)`,
    [supplierId, dueDate, amount, note]
  );
};

export const getUpcomingSchedules = async () => {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT ps.*, s.name as supplier_name FROM payment_schedule ps
     JOIN suppliers s ON s.id = ps.supplier_id
     WHERE ps.status = 'pending' ORDER BY ps.due_date ASC`
  );
};

export const markScheduleAsPaid = async (id) => {
  const db = await getDb();
  return db.runAsync(`UPDATE payment_schedule SET status='paid' WHERE id = ?`, [id]);
};

// ================= المخزون =================
export const addInventoryItem = async (purchaseItemId, productName, purchasePrice, imei = null, warrantyEndDate = null) => {
  const db = await getDb();
  return db.runAsync(
    `INSERT INTO inventory (purchase_item_id, product_name, purchase_price, imei, warranty_end_date)
     VALUES (?, ?, ?, ?, ?)`,
    [purchaseItemId, productName, purchasePrice, imei, warrantyEndDate]
  );
};

export const getInventory = async (status = null) => {
  const db = await getDb();
  return status
    ? db.getAllAsync(`SELECT * FROM inventory WHERE status = ? ORDER BY created_at DESC`, [status])
    : db.getAllAsync(`SELECT * FROM inventory ORDER BY created_at DESC`);
};

export const searchInventoryByImei = async (imei) => {
  const db = await getDb();
  return db.getAllAsync(`SELECT * FROM inventory WHERE imei LIKE ? OR product_name LIKE ?`, [`%${imei}%`, `%${imei}%`]);
};

export const sellInventoryItem = async (id, salePrice, clientId = null) => {
  const db = await getDb();
  return db.runAsync(
    `UPDATE inventory SET status='sold', sale_price=?, client_id=?, sold_date=datetime('now') WHERE id=?`,
    [salePrice, clientId, id]
  );
};

export const returnInventoryItem = async (id) => {
  const db = await getDb();
  return db.runAsync(`UPDATE inventory SET status='returned' WHERE id=?`, [id]);
};

// ================= الزبائن =================
export const addClient = async (name, phone, creditLimit = 0) => {
  const db = await getDb();
  return db.runAsync(`INSERT INTO clients (name, phone, credit_limit) VALUES (?, ?, ?)`, [name, phone, creditLimit]);
};

export const getClients = async () => {
  const db = await getDb();
  return db.getAllAsync(`SELECT * FROM clients ORDER BY name ASC`);
};

export const getClientBalance = async (clientId) => {
  const db = await getDb();
  const sales = await db.getFirstAsync(
    `SELECT COALESCE(SUM(total_amount),0) as total FROM client_transactions WHERE client_id = ?`,
    [clientId]
  );
  const payments = await db.getFirstAsync(
    `SELECT COALESCE(SUM(amount),0) as total FROM client_payments WHERE client_id = ?`,
    [clientId]
  );
  return (sales?.total || 0) - (payments?.total || 0);
};

export const addClientPayment = async (clientId, amount, method = 'cash') => {
  const db = await getDb();
  return db.runAsync(`INSERT INTO client_payments (client_id, amount, method) VALUES (?, ?, ?)`, [clientId, amount, method]);
};

// كي تبيع جهاز من المخزون لزبون معين بالكريدي، هذي تسجل الدين عليه
export const sellToClient = async (clientId, inventoryId, totalAmount, note = '') => {
  const db = await getDb();
  return db.runAsync(
    `INSERT INTO client_transactions (client_id, inventory_id, total_amount, note) VALUES (?, ?, ?, ?)`,
    [clientId, inventoryId, totalAmount, note]
  );
};

// ================= الربح =================
export const getProfitSummary = async () => {
  const db = await getDb();
  const row = await db.getFirstAsync(
    `SELECT COALESCE(SUM(sale_price - purchase_price),0) as total_profit, COUNT(*) as items_sold
     FROM inventory WHERE status='sold'`
  );
  return row || { total_profit: 0, items_sold: 0 };
};

// ================= لوحة القيادة (Dashboard) =================
export const getDashboardTotals = async () => {
  const suppliers = await getSuppliers();
  let totalOwedToSuppliers = 0;
  for (const s of suppliers) {
    totalOwedToSuppliers += await getSupplierBalance(s.id);
  }
  const clients = await getClients();
  let totalOwedByClients = 0;
  for (const c of clients) {
    totalOwedByClients += await getClientBalance(c.id);
  }
  const db = await getDb();
  const stock = await db.getFirstAsync(`SELECT COUNT(*) as c FROM inventory WHERE status='in_stock'`);
  const profit = await getProfitSummary();
  return {
    totalOwedToSuppliers,
    totalOwedByClients,
    stockCount: stock?.c || 0,
    totalProfit: profit.total_profit || 0,
  };
};

// ================= البحث السريع =================
export const globalSearch = async (term) => {
  const db = await getDb();
  const like = `%${term}%`;
  const suppliers = await db.getAllAsync(`SELECT * FROM suppliers WHERE name LIKE ?`, [like]);
  const clients = await db.getAllAsync(`SELECT * FROM clients WHERE name LIKE ?`, [like]);
  const inventory = await db.getAllAsync(`SELECT * FROM inventory WHERE product_name LIKE ? OR imei LIKE ?`, [like, like]);
  return { suppliers, clients, inventory };
};

// ================= ملاحظات =================
export const addNote = async (relatedType, relatedId, content) => {
  const db = await getDb();
  return db.runAsync(`INSERT INTO notes (related_type, related_id, content) VALUES (?, ?, ?)`, [
    relatedType,
    relatedId,
    content,
  ]);
};

export const getNotes = async (relatedType, relatedId) => {
  const db = await getDb();
  return db.getAllAsync(`SELECT * FROM notes WHERE related_type=? AND related_id=? ORDER BY created_at DESC`, [
    relatedType,
    relatedId,
  ]);
};
