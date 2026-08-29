import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getSupplierTransactions, getSupplierPayments, getSupplierBalance,
  addSupplierPayment, addPaymentSchedule, getNotes, addNote, updateSupplierRating,
} from '../database/queries';
import { exportSupplierStatement } from '../utils/pdfExport';
import { scheduleDueDateNotification } from '../utils/notifications';

export default function SupplierDetailScreen({ route, navigation }) {
  const { supplier } = route.params;
  const [transactions, setTransactions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [balance, setBalance] = useState(0);
  const [notes, setNotes] = useState([]);
  const [rating, setRating] = useState(supplier.rating || 3);

  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');

  const [scheduleModal, setScheduleModal] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [dueAmount, setDueAmount] = useState('');

  const [noteModal, setNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');

  const load = async () => {
    const t = await getSupplierTransactions(supplier.id);
    setTransactions(t);
    const p = await getSupplierPayments(supplier.id);
    setPayments(p);
    setBalance(await getSupplierBalance(supplier.id));
    const n = await getNotes('supplier', supplier.id);
    setNotes(n);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const savePayment = async () => {
    const amount = Number(payAmount);
    if (!amount) return Alert.alert('خطأ', 'دخل مبلغ صحيح');
    await addSupplierPayment(supplier.id, amount, payMethod);
    setPayAmount('');
    setPayModal(false);
    load();
  };

  const saveSchedule = async () => {
    if (!dueDate || !Number(dueAmount)) return Alert.alert('خطأ', 'كمل المعلومات (YYYY-MM-DD)');
    await addPaymentSchedule(supplier.id, dueDate, Number(dueAmount));
    try {
      await scheduleDueDateNotification(supplier.name, dueAmount, dueDate);
    } catch (e) { /* التنبيهات اختيارية */ }
    setDueDate('');
    setDueAmount('');
    setScheduleModal(false);
    Alert.alert('تم', 'تسجل الموعد وبرمجنالك تنبيه');
  };

  const saveNote = async () => {
    if (!noteText.trim()) return;
    await addNote('supplier', supplier.id, noteText);
    setNoteText('');
    setNoteModal(false);
    load();
  };

  const changeRating = async (value) => {
    setRating(value);
    await updateSupplierRating(supplier.id, value);
  };

  const exportPdf = async () => {
    await exportSupplierStatement(supplier, transactions, payments, balance);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{supplier.name}</Text>
      <Text style={styles.phone}>{supplier.phone}</Text>

      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => changeRating(n)}>
            <Text style={{ fontSize: 22, color: n <= rating ? '#FBBF24' : '#475569' }}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.balanceBox}>
        <Text style={styles.balanceLabel}>الباقي عليك</Text>
        <Text style={styles.balanceValue}>{balance.toLocaleString()} دج</Text>
        {supplier.credit_limit > 0 && balance > supplier.credit_limit && (
          <Text style={styles.warning}>⚠️ فتّ سقف الكريدي ({supplier.credit_limit.toLocaleString()} دج)</Text>
        )}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddTransaction', { supplier })}>
          <Text style={styles.actionText}>+ عملية شراء</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setPayModal(true)}>
          <Text style={styles.actionText}>+ دفعة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setScheduleModal(true)}>
          <Text style={styles.actionText}>+ موعد تسديد</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.pdfBtn} onPress={exportPdf}>
        <Text style={styles.actionText}>📄 صدّر كشف الحساب PDF</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>التعاملات</Text>
      {transactions.map((t) => (
        <View key={t.id} style={styles.txRow}>
          <Text style={styles.txDate}>{new Date(t.date).toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.txType}>{t.type === 'return' ? 'استرجاع' : 'شراء'}</Text>
          <Text style={styles.txAmount}>{t.total_amount.toLocaleString()} دج</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>الدفعات</Text>
      {payments.map((p) => (
        <View key={p.id} style={styles.txRow}>
          <Text style={styles.txDate}>{new Date(p.date).toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.txType}>{p.method}</Text>
          <Text style={[styles.txAmount, { color: '#4ADE80' }]}>{p.amount.toLocaleString()} دج</Text>
        </View>
      ))}

      <View style={styles.notesHeader}>
        <Text style={styles.sectionTitle}>ملاحظات</Text>
        <TouchableOpacity onPress={() => setNoteModal(true)}><Text style={styles.addNoteLink}>+ إضافة</Text></TouchableOpacity>
      </View>
      {notes.map((n) => (
        <Text key={n.id} style={styles.noteItem}>• {n.content}</Text>
      ))}

      {/* Modal دفعة */}
      <Modal visible={payModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>دفعة جديدة</Text>
            <TextInput style={styles.input} placeholder="المبلغ" keyboardType="numeric" value={payAmount} onChangeText={setPayAmount} />
            <View style={styles.methodRow}>
              {['cash', 'virement', 'cheque'].map((m) => (
                <TouchableOpacity key={m} onPress={() => setPayMethod(m)} style={[styles.methodChip, payMethod === m && styles.methodChipActive]}>
                  <Text style={{ color: '#fff' }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setPayModal(false)}><Text style={styles.cancel}>إلغاء</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={savePayment}><Text style={styles.saveBtnText}>حفظ</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal موعد */}
      <Modal visible={scheduleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>موعد تسديد جديد</Text>
            <TextInput style={styles.input} placeholder="تاريخ (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} />
            <TextInput style={styles.input} placeholder="المبلغ" keyboardType="numeric" value={dueAmount} onChangeText={setDueAmount} />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setScheduleModal(false)}><Text style={styles.cancel}>إلغاء</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveSchedule}><Text style={styles.saveBtnText}>حفظ</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal ملاحظة */}
      <Modal visible={noteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>ملاحظة جديدة</Text>
            <TextInput style={styles.input} placeholder="اكتب الملاحظة..." value={noteText} onChangeText={setNoteText} multiline />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setNoteModal(false)}><Text style={styles.cancel}>إلغاء</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveNote}><Text style={styles.saveBtnText}>حفظ</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  phone: { color: '#94A3B8', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  balanceBox: { backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginBottom: 14 },
  balanceLabel: { color: '#94A3B8' },
  balanceValue: { color: '#F87171', fontSize: 24, fontWeight: 'bold' },
  warning: { color: '#FBBF24', marginTop: 6 },
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  actionBtn: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  pdfBtn: { backgroundColor: '#334155', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  actionText: { color: '#fff', fontWeight: '600' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1E293B', padding: 10, borderRadius: 8, marginBottom: 6 },
  txDate: { color: '#94A3B8' },
  txType: { color: '#CBD5E1' },
  txAmount: { color: '#F87171', fontWeight: 'bold' },
  notesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addNoteLink: { color: '#60A5FA' },
  noteItem: { color: '#CBD5E1', marginBottom: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1E293B', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#334155', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 10 },
  methodRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  methodChip: { borderWidth: 1, borderColor: '#334155', padding: 8, borderRadius: 8 },
  methodChipActive: { backgroundColor: '#2563EB' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  cancel: { color: '#94A3B8', padding: 10 },
  saveBtn: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
});
