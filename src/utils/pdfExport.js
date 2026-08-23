import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// يبني كشف حساب PDF لمورد معين (كل التعاملات + الدفعات + الباقي)
export async function exportSupplierStatement(supplier, transactions, payments, balance) {
  const rowsTransactions = transactions
    .map(
      (t) => `<tr>
        <td>${new Date(t.date).toLocaleDateString('fr-FR')}</td>
        <td>${t.type === 'return' ? 'استرجاع' : 'شراء'}</td>
        <td>${t.total_amount.toLocaleString()} دج</td>
        <td>${t.note || ''}</td>
      </tr>`
    )
    .join('');

  const rowsPayments = payments
    .map(
      (p) => `<tr>
        <td>${new Date(p.date).toLocaleDateString('fr-FR')}</td>
        <td>${p.method}</td>
        <td>${p.amount.toLocaleString()} دج</td>
      </tr>`
    )
    .join('');

  const html = `
    <html dir="rtl">
      <head><meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; }
        h1 { color: #0F172A; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        td, th { border: 1px solid #ccc; padding: 8px; text-align: right; }
        .balance { font-size: 20px; font-weight: bold; color: #B91C1C; margin-top: 20px; }
      </style>
      </head>
      <body>
        <h1>كشف حساب — ${supplier.name}</h1>
        <p>الهاتف: ${supplier.phone || '-'}</p>
        <h3>المشتريات</h3>
        <table><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>ملاحظة</th></tr>${rowsTransactions}</table>
        <h3>الدفعات</h3>
        <table><tr><th>التاريخ</th><th>الطريقة</th><th>المبلغ</th></tr>${rowsPayments}</table>
        <div class="balance">الباقي: ${balance.toLocaleString()} دج</div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
  return uri;
}
