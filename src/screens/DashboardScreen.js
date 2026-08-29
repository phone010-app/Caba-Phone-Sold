import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDashboardTotals, getUpcomingSchedules } from '../database/queries';

export default function DashboardScreen() {
  const [totals, setTotals] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setTotals(await getDashboardTotals());
    const s = await getUpcomingSchedules();
    setSchedules(s.slice(0, 5));
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.header}>لوحة القيادة</Text>

      <View style={styles.cardsRow}>
        <View style={[styles.card, { backgroundColor: '#B91C1C' }]}>
          <Text style={styles.cardLabel}>عليك للموردين</Text>
          <Text style={styles.cardValue}>{(totals?.totalOwedToSuppliers ?? 0).toLocaleString()} دج</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#15803D' }]}>
          <Text style={styles.cardLabel}>عندك عند الزبائن</Text>
          <Text style={styles.cardValue}>{(totals?.totalOwedByClients ?? 0).toLocaleString()} دج</Text>
        </View>
      </View>

      <View style={styles.cardsRow}>
        <View style={[styles.card, { backgroundColor: '#1D4ED8' }]}>
          <Text style={styles.cardLabel}>المخزون الحالي</Text>
          <Text style={styles.cardValue}>{totals?.stockCount ?? 0} جهاز</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#7C3AED' }]}>
          <Text style={styles.cardLabel}>الربح الكلي</Text>
          <Text style={styles.cardValue}>{(totals?.totalProfit ?? 0).toLocaleString()} دج</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>مواعيد التسديد الجاية</Text>
      {schedules.length === 0 && <Text style={styles.empty}>ماكاش مواعيد مبرمجة</Text>}
      {schedules.map((s) => (
        <View key={s.id} style={styles.scheduleRow}>
          <Text style={styles.scheduleSupplier}>{s.supplier_name}</Text>
          <Text style={styles.scheduleDate}>{new Date(s.due_date).toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.scheduleAmount}>{s.amount.toLocaleString()} دج</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  cardsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: { flex: 1, borderRadius: 16, padding: 16 },
  cardLabel: { color: '#E2E8F0', fontSize: 13, marginBottom: 6 },
  cardValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  empty: { color: '#64748B' },
  scheduleRow: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1E293B',
    padding: 12, borderRadius: 10, marginBottom: 8,
  },
  scheduleSupplier: { color: '#fff', fontWeight: '600' },
  scheduleDate: { color: '#94A3B8' },
  scheduleAmount: { color: '#FCA5A5', fontWeight: 'bold' },
});
