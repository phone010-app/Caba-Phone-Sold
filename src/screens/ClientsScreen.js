import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { addClient, getClients, getClientBalance, addClientPayment } from '../database/queries';

export default function ClientsScreen() {
  const [clients, setClients] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [payModal, setPayModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [amount, setAmount] = useState('');

  const load = async () => {
    const res = await getClients();
    const list = res;
    const withBalance = await Promise.all(
      list.map(async (c) => ({ ...c, balance: await getClientBalance(c.id) }))
    );
    setClients(withBalance);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const save = async () => {
    if (!name.trim()) return Alert.alert('خطأ', 'دخل اسم الزبون');
    await addClient(name, phone);
    setName(''); setPhone(''); setAddModal(false);
    load();
  };

  const openPay = (client) => { setSelectedClient(client); setPayModal(true); };
  const savePayment = async () => {
    if (!Number(amount)) return;
    await addClientPayment(selectedClient.id, Number(amount));
    setAmount(''); setPayModal(false);
    load();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>الزبائن</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal(true)}>
          <Text style={styles.addBtnText}>+ زبون جديد</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={clients}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
            </View>
            <Text style={[styles.balance, item.balance > 0 && styles.balanceOwed]}>{item.balance.toLocaleString()} دج</Text>
            {item.balance > 0 && (
              <TouchableOpacity style={styles.payBtn} onPress={() => openPay(item)}>
                <Text style={styles.payBtnText}>تسديد</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>مازال ماكاش زبائن</Text>}
      />

      <Modal visible={addModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>زبون جديد</Text>
            <TextInput style={styles.input} placeholder="الاسم" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setAddModal(false)}><Text style={styles.cancel}>إلغاء</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={save}><Text style={styles.saveBtnText}>حفظ</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={payModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>تسديد من {selectedClient?.name}</Text>
            <TextInput style={styles.input} placeholder="المبلغ" keyboardType="numeric" value={amount} onChangeText={setAmount} />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setPayModal(false)}><Text style={styles.cancel}>إلغاء</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={savePayment}><Text style={styles.saveBtnText}>حفظ</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  addBtn: { backgroundColor: '#2563EB', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 14, borderRadius: 12, marginBottom: 10 },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  phone: { color: '#94A3B8', fontSize: 13 },
  balance: { fontSize: 15, fontWeight: 'bold', color: '#94A3B8', marginEnd: 8 },
  balanceOwed: { color: '#4ADE80' },
  payBtn: { backgroundColor: '#15803D', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  payBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { color: '#64748B', textAlign: 'center', marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1E293B', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#334155', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  cancel: { color: '#94A3B8', padding: 10 },
  saveBtn: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
});
