import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getInventory, searchInventoryByImei, sellInventoryItem, returnInventoryItem } from '../database/queries';

export default function InventoryScreen() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanLock, setScanLock] = useState(false);

  const [sellModal, setSellModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [salePrice, setSalePrice] = useState('');

  const load = async () => {
    const res = await getInventory();
    setItems(res);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const runSearch = async (text) => {
    setSearch(text);
    if (!text) return load();
    const res = await searchInventoryByImei(text);
    setItems(res);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return Alert.alert('خطأ', 'خاصنا الإذن باش نستعملو الكاميرا');
    }
    setScanLock(false);
    setScannerVisible(true);
  };

  const onScanned = ({ data }) => {
    if (scanLock) return;
    setScanLock(true);
    setScannerVisible(false);
    runSearch(data);
  };

  const openSell = (item) => { setSelected(item); setSellModal(true); };
  const confirmSell = async () => {
    if (!Number(salePrice)) return Alert.alert('خطأ', 'دخل سعر البيع');
    await sellInventoryItem(selected.id, Number(salePrice));
    setSalePrice(''); setSellModal(false);
    load();
  };

  const doReturn = async (item) => {
    Alert.alert('استرجاع', `تأكد باش ترجع ${item.product_name} للمورد؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'أكد', onPress: async () => { await returnInventoryItem(item.id); load(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>المخزون</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="بحث بالاسم أو IMEI..."
          value={search}
          onChangeText={runSearch}
        />
        <TouchableOpacity style={styles.scanBtn} onPress={openScanner}>
          <Text style={styles.scanBtnText}>📷</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.product_name}</Text>
              <Text style={styles.imei}>IMEI: {item.imei || '—'}</Text>
              <Text style={styles.status}>
                {item.status === 'in_stock' ? '🟢 في المخزون' : item.status === 'sold' ? '🔵 مباع' : '🔴 مرجع'}
              </Text>
            </View>
            {item.status === 'in_stock' && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.sellBtn} onPress={() => openSell(item)}>
                  <Text style={styles.sellBtnText}>بيع</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => doReturn(item)}>
                  <Text style={styles.returnLink}>إرجاع للمورد</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>المخزون فارغ</Text>}
      />

      <Modal visible={scannerVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={onScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'code128', 'code39'] }}
          />
          <TouchableOpacity style={styles.closeScanner} onPress={() => setScannerVisible(false)}>
            <Text style={{ color: '#fff' }}>إغلاق ✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={sellModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>بيع {selected?.product_name}</Text>
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>
              سعر الشراء: {selected?.purchase_price?.toLocaleString()} دج
            </Text>
            <TextInput style={styles.input} placeholder="سعر البيع" keyboardType="numeric" value={salePrice} onChangeText={setSalePrice} />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setSellModal(false)}><Text style={styles.cancel}>إلغاء</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={confirmSell}><Text style={styles.saveBtnText}>تأكيد البيع</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#334155', color: '#fff', padding: 12, borderRadius: 10 },
  scanBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
  scanBtnText: { fontSize: 18 },
  row: { flexDirection: 'row', backgroundColor: '#1E293B', padding: 14, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  imei: { color: '#94A3B8', fontSize: 12 },
  status: { color: '#CBD5E1', fontSize: 12, marginTop: 2 },
  actions: { alignItems: 'flex-end', gap: 6 },
  sellBtn: { backgroundColor: '#15803D', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  sellBtnText: { color: '#fff', fontWeight: '600' },
  returnLink: { color: '#F87171', fontSize: 12 },
  empty: { color: '#64748B', textAlign: 'center', marginTop: 40 },
  closeScanner: { position: 'absolute', top: 40, right: 20, backgroundColor: '#00000099', padding: 10, borderRadius: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1E293B', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#334155', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  cancel: { color: '#94A3B8', padding: 10 },
  saveBtn: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
});
