import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { addSupplier, getSuppliers, getSupplierBalance } from '../database/queries';

export default function SuppliersScreen({ navigation }) {
  const [suppliers, setSuppliers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [creditLimit, setCreditLimit] = useState('');

  const load = async () => {
    const res = await getSuppliers();
    const list = res.rows._array;
    const withBalance = await Promise.all(
      list.map(async (s) => ({ ...s, balance: await getSupplierBalance(s.id) }))
    );
    setSuppliers(withBalance);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const save = async () => {
    if (!name.trim()) return Alert.alert('خطأ', 'دخل اسم المورد');
    await addSupplier(name, phone, '', Number(creditLimit) || 0);
    setName('');
    setPhone('');
    setCreditLimit('');
    setModalVisible(false);
    load();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>الموردين</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ مورد جديد</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={suppliers}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('SupplierDetail', { supplier: item })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
              {item.credit_limit > 0 && (
                <Text style={styles.limit}>
                  سقف الكريدي: {item.credit_limit.toLocaleString()} دج
                  {item.balance > item.credit_limit ? '  ⚠️ تجاوزت الحد' : ''}
                </Text>
              )}
            </View>
            <Text style={[styles.balance, item.balance > 0 && styles.balanceOwed]}>
              {item.balance.toLocaleString()} دج
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>مازال ماكاش موردين، زيد واحد</Text>}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>مورد جديد</Text>
            <TextInput style={styles.input} placeholder="الاسم" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput
              style={styles.input}
              placeholder="سقف الكريدي (اختياري)"
              value={creditLimit}
              onChangeText={setCreditLimit}
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancel}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={save}>
                <Text style={styles.saveBtnText}>حفظ</Text>
              </TouchableOpacity>
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
  row: {
    flexDirection: 'row', backgroundColor: '#1E293B', padding: 14, borderRadius: 12, marginBottom: 10,
    alignItems: 'center',
  },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  phone: { color: '#94A3B8', fontSize: 13 },
  limit: { color: '#FBBF24', fontSize: 12, marginTop: 4 },
  balance: { fontSize: 16, fontWeight: 'bold', color: '#94A3B8' },
  balanceOwed: { color: '#F87171' },
  empty: { color: '#64748B', textAlign: 'center', marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1E293B', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: {
    borderWidth: 1, borderColor: '#334155', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 10,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 8 },
  cancel: { color: '#94A3B8', padding: 10 },
  saveBtn: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
});
