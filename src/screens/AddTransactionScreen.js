import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch,
} from 'react-native';
import { addPurchaseTransaction, addSupplierPayment } from '../database/queries';

export default function AddTransactionScreen({ route, navigation }) {
  const { supplier } = route.params;
  const [items, setItems] = useState([{ productName: '', quantity: '1', unitPrice: '' }]);
  const [note, setNote] = useState('');

  const [useForeignCurrency, setUseForeignCurrency] = useState(false);
  const [originalCurrency, setOriginalCurrency] = useState('EUR');
  const [exchangeRate, setExchangeRate] = useState('');

  const [advancePaid, setAdvancePaid] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');

  const addItemRow = () => setItems([...items, { productName: '', quantity: '1', unitPrice: '' }]);
  const removeItemRow = (idx) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) => {
    const copy = [...items];
    copy[idx][field] = value;
    setItems(copy);
  };

  const total = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const totalDZD = useForeignCurrency && Number(exchangeRate) ? total * Number(exchangeRate) : total;
  const remaining = totalDZD - (advancePaid ? Number(advanceAmount) || 0 : 0);

  const save = async () => {
    const validItems = items.filter((it) => it.productName.trim() && Number(it.unitPrice) > 0);
    if (validItems.length === 0) return Alert.alert('خطأ', 'زيد على الأقل منتوج وحد بسعر صحيح');

    const parsedItems = validItems.map((it) => ({
      productName: it.productName,
      quantity: Number(it.quantity) || 1,
      unitPrice: Number(it.unitPrice),
    }));

    const txId = await addPurchaseTransaction(supplier.id, totalDZD, parsedItems, {
      note,
      originalAmount: useForeignCurrency ? total : null,
      originalCurrency: useForeignCurrency ? originalCurrency : null,
      exchangeRate: useForeignCurrency ? Number(exchangeRate) : null,
    });

    if (advancePaid && Number(advanceAmount) > 0) {
      await addSupplierPayment(supplier.id, Number(advanceAmount), 'cash', 'دفعة مقدمة', txId);
    }

    Alert.alert(
      'تم التسجيل ✅',
      `المجموع: ${totalDZD.toLocaleString()} دج\nالباقي: ${remaining.toLocaleString()} دج`
    );
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>عملية شراء — {supplier.name}</Text>

      {items.map((item, idx) => (
        <View key={idx} style={styles.itemBox}>
          <TextInput
            style={styles.input}
            placeholder="اسم المنتوج (مثلا Samsung A52S)"
            value={item.productName}
            onChangeText={(v) => updateItem(idx, 'productName', v)}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.small]}
              placeholder="الكمية"
              keyboardType="numeric"
              value={item.quantity}
              onChangeText={(v) => updateItem(idx, 'quantity', v)}
            />
            <TextInput
              style={[styles.input, styles.small]}
              placeholder="سعر الوحدة"
              keyboardType="numeric"
              value={item.unitPrice}
              onChangeText={(v) => updateItem(idx, 'unitPrice', v)}
            />
          </View>
          {items.length > 1 && (
            <TouchableOpacity onPress={() => removeItemRow(idx)}>
              <Text style={styles.remove}>✕ حذف هذا المنتوج</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.addItemBtn} onPress={addItemRow}>
        <Text style={styles.addItemText}>+ زيد منتوج آخر</Text>
      </TouchableOpacity>

      <View style={styles.switchRow}>
        <Text style={styles.label}>شريت بعملة أجنبية؟</Text>
        <Switch value={useForeignCurrency} onValueChange={setUseForeignCurrency} />
      </View>
      {useForeignCurrency && (
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.small]} placeholder="العملة (EUR/USD)" value={originalCurrency} onChangeText={setOriginalCurrency} />
          <TextInput style={[styles.input, styles.small]} placeholder="سعر الصرف" keyboardType="numeric" value={exchangeRate} onChangeText={setExchangeRate} />
        </View>
      )}

      <TextInput style={styles.input} placeholder="ملاحظة (اختياري)" value={note} onChangeText={setNote} />

      <View style={styles.switchRow}>
        <Text style={styles.label}>مديت دفعة مقدمة؟</Text>
        <Switch value={advancePaid} onValueChange={setAdvancePaid} />
      </View>
      {advancePaid && (
        <TextInput
          style={styles.input}
          placeholder="مبلغ الدفعة المقدمة"
          keyboardType="numeric"
          value={advanceAmount}
          onChangeText={setAdvanceAmount}
        />
      )}

      <View style={styles.summaryBox}>
        <Text style={styles.summaryLine}>المجموع: {totalDZD.toLocaleString()} دج</Text>
        <Text style={[styles.summaryLine, { color: '#F87171' }]}>الباقي: {remaining.toLocaleString()} دج</Text>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveBtnText}>حفظ العملية</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  header: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 14 },
  itemBox: { backgroundColor: '#1E293B', padding: 12, borderRadius: 10, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#334155', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  small: { flex: 1 },
  remove: { color: '#F87171', marginTop: 2 },
  addItemBtn: { alignItems: 'center', paddingVertical: 10, marginBottom: 16 },
  addItemText: { color: '#60A5FA', fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { color: '#E2E8F0' },
  summaryBox: { backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginVertical: 16 },
  summaryLine: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  saveBtn: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 40 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
