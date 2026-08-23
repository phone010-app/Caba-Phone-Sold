import db from './db';

// Wrapper générique promise autour de executeSql
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        params,
        (_, result) => resolve(result),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}

// ================= الموردين =================
export const addSupplier = (name, phone, address, creditLimit = 0, currency = 'DZD') =>
  run(
    `INSERT INTO suppliers (name, phone, address, credit_limit, currency) VALUES (?, ?, ?, ?, ?)`,
    [name, phone, address, creditLimit, currency]
  );

export const getSuppliers = () => run(`SELECT * FROM suppliers ORDER BY name ASC`);

export const updateSupplierRating = (id, rating) =>
  run(`UPDATE suppliers SET rating = ? WHERE id = ?`, [rating, id]);

// إجمالي الكريدي (الباقي) لمورد معين = مجموع المشتريات - مجموع الدفعات
export const getSupplierBalance = async (supplierId) => {
  const purchases = await run(
    `SELECT COALESCE(SUM(CASE WHEN type='purchase' THEN total_amount ELSE -total_amount END),0) as total
     FROM purchase_transactions WHERE supplier_id = ?`,
    [supplierId]
  );
  const payments = await run(
    `SELECT COALESCE(SUM(amount),0) as total FROM supplier_payments WHERE supplier_id = ?`,
    [supplierId]
  );
  const totalPurchases = purchases.rows.item(0).total;
  const totalPaid = payments.rows.item(0).total;
  return totalPurchases - totalPaid;
};

// ================= عمليات الشراء =================
export const addPurchaseTransaction = (
  supplierId,
  totalAmount,
  items,
  { type = 'purchase', note = '', originalAmount = null, originalCurrency = null, exchangeRate = null } = {}
) =>
  new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `INSERT INTO purchase_transactions
            (supplier_id, total_amount, type, note, original_amount, original_currency, exchange_rate)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [supplierId, totalAmount, type, note, originalAmount, originalCurrency, exchangeRate],
          (_, result) => {
            const transactionId = result.insertId;
            if (type === 'purchase') {
              items.forEach((item) => {
                tx.executeSql(
                  `INSERT INTO purchase_items (transaction_id, product_name, quantity, unit_price, warranty_months)
                   VALUES (?, ?, ?, ?, ?)`,
                  [transactionId, item.productName, item.quantity, item.unitPrice, item.warrantyMonths || 0],
                  (_, itemResult) => {
                    const purchaseItemId = itemResult.insertId;
                    const warrantyEndDate = item.warrantyMonths
                      ? new Date(Date.now() + item.warrantyMonths * 30 * 24 * 3600 * 1000).toISOString()
                      : null;
                    // كل وحدة (جهاز) تتزاد كسطر واحد فالمخزون، باش تولي متتبعة بالـ IMEI فرد فرد
                    for (let i = 0; i < item.quantity; i++) {
                      tx.executeSql(
                        `INSERT INTO inventory (purchase_item_id, product_name, purchase_price, warranty_end_date)
                         VALUES (?, ?, ?, ?)`,
                        [purchaseItemId, item.productName, item.unitPrice, warrantyEndDate]
                      );
                    }
                  }
                );
              });
            }
            resolve(transactionId);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      }
    );
  });

export const getSupplierTransactions = (supplierId) =>
  run(`SELECT * FROM purchase_transactions WHERE supplier_id = ? ORDER BY date DESC`, [supplierId]);

export const getTransactionItems = (transactionId) =>
  run(`SELECT * FROM purchase_items WHERE transaction_id = ?`, [transactionId]);

// ================= الدفعات (الموردين) =================
export const addSupplierPayment = (supplierId, amount, method = 'cash', note = '', transactionId = null) =>
  run(
    `INSERT INTO supplier_payments (supplier_id, transaction_id, amount, method, note) VALUES (?, ?, ?, ?, ?)`,
    [supplierId, transactionId, amount, method, note]
  );

export const getSupplierPayments = (supplierId) =>
  run(`SELECT * FROM supplier_payments WHERE supplier_id = ? ORDER BY date DESC`, [supplierId]);

// ================= جدول التسديد (échéancier) =================
export const addPaymentSchedule = (supplierId, dueDate, amount, note = '') =>
  run(
    `INSERT INTO payment_schedule (supplier_id, due_date, amount, note) VALUES (?, ?, ?, ?)`,
    [supplierId, dueDate, amount, note]
  );

export const getUpcomingSchedules = () =>
  run(`SELECT ps.*, s.name as supplier_name FROM payment_schedule ps
       JOIN suppliers s ON s.id = ps.supplier_id
       WHERE ps.status = 'pending' ORDER BY ps.due_date ASC`);

export const markScheduleAsPaid = (id) =>
  run(`UPDATE payment_schedule SET status='paid' WHERE id = ?`, [id]);

// ================= المخزون =================
export const addInventoryItem = (purchaseItemId, productName, purchasePrice, imei = null, warrantyEndDate = null) =>
  run(
    `INSERT INTO inventory (purchase_item_id, product_name, purchase_price, imei, warranty_end_date)
     VALUES (?, ?, ?, ?, ?)`,
    [purchaseItemId, productName, purchasePrice, imei, warrantyEndDate]
  );

export const getInventory = (status = null) =>
  status
    ? run(`SELECT * FROM inventory WHERE status = ? ORDER BY created_at DESC`, [status])
    : run(`SELECT * FROM inventory ORDER BY created_at DESC`);

export const searchInventoryByImei = (imei) =>
  run(`SELECT * FROM inventory WHERE imei LIKE ?`, [`%${imei}%`]);

export const sellInventoryItem = (id, salePrice, clientId = null) =>
  run(
    `UPDATE inventory SET status='sold', sale_price=?, client_id=?, sold_date=datetime('now') WHERE id=?`,
    [salePrice, clientId, id]
  );

export const returnInventoryItem = (id) =>
  run(`UPDATE inventory SET status='returned' WHERE id=?`, [id]);

// ================= الزبائن =================
export const addClient = (name, phone, creditLimit = 0) =>
  run(`INSERT INTO clients (name, phone, credit_limit) VALUES (?, ?, ?)`, [name, phone, creditLimit]);

export const getClients = () => run(`SELECT * FROM clients ORDER BY name ASC`);

export const getClientBalance = async (clientId) => {
  const sales = await run(
    `SELECT COALESCE(SUM(total_amount),0) as total FROM client_transactions WHERE client_id = ?`,
    [clientId]
  );
  const payments = await run(
    `SELECT COALESCE(SUM(amount),0) as total FROM client_payments WHERE client_id = ?`,
    [clientId]
  );
  return sales.rows.item(0).total - payments.rows.item(0).total;
};

export const addClientPayment = (clientId, amount, method = 'cash') =>
  run(`INSERT INTO client_payments (client_id, amount, method) VALUES (?, ?, ?)`, [clientId, amount, method]);

// ================= الربح =================
export const getProfitSummary = () =>
  run(`SELECT
        COALESCE(SUM(sale_price - purchase_price),0) as total_profit,
        COUNT(*) as items_sold
       FROM inventory WHERE status='sold'`);

// ================= لوحة القيادة (Dashboard) =================
export const getDashboardTotals = async () => {
  const suppliers = await run(`SELECT id FROM suppliers`);
  let totalOwedToSuppliers = 0;
  for (let i = 0; i < suppliers.rows.length; i++) {
    totalOwedToSuppliers += await getSupplierBalance(suppliers.rows.item(i).id);
  }
  const clients = await run(`SELECT id FROM clients`);
  let totalOwedByClients = 0;
  for (let i = 0; i < clients.rows.length; i++) {
    totalOwedByClients += await getClientBalance(clients.rows.item(i).id);
  }
  const stock = await run(`SELECT COUNT(*) as c FROM inventory WHERE status='in_stock'`);
  const profit = await getProfitSummary();
  return {
    totalOwedToSuppliers,
    totalOwedByClients,
    stockCount: stock.rows.item(0).c,
    totalProfit: profit.rows.item(0).total_profit,
  };
};

// ================= البحث السريع =================
export const globalSearch = async (term) => {
  const like = `%${term}%`;
  const suppliers = await run(`SELECT * FROM suppliers WHERE name LIKE ?`, [like]);
  const clients = await run(`SELECT * FROM clients WHERE name LIKE ?`, [like]);
  const inventory = await run(
    `SELECT * FROM inventory WHERE product_name LIKE ? OR imei LIKE ?`,
    [like, like]
  );
  return {
    suppliers: suppliers.rows._array,
    clients: clients.rows._array,
    inventory: inventory.rows._array,
  };
};

// ================= ملاحظات =================
export const addNote = (relatedType, relatedId, content) =>
  run(`INSERT INTO notes (related_type, related_id, content) VALUES (?, ?, ?)`, [
    relatedType,
    relatedId,
    content,
  ]);

export const getNotes = (relatedType, relatedId) =>
  run(`SELECT * FROM notes WHERE related_type=? AND related_id=? ORDER BY created_at DESC`, [
    relatedType,
    relatedId,
  ]);
