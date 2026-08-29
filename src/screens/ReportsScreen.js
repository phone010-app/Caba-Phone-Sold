import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';
import { getSuppliers, getSupplierBalance, getProfitSummary } from '../database/queries';

const screenWidth = Dimensions.get('window').width - 32;

export default function ReportsScreen() {
  const [labels, setLabels] = useState([]);
  const [data, setData] = useState([]);
  const [profit, setProfit] = useState(0);

  const load = async () => {
    const res = await getSuppliers();
    const suppliers = res;
    const balances = await Promise.all(suppliers.map((s) => getSupplierBalance(s.id)));
    setLabels(suppliers.map((s) => s.name.slice(0, 8)));
    setData(balances);
    const p = await getProfitSummary();
    setProfit(p.total_profit || 0);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>التقارير</Text>

      <View style={styles.profitBox}>
        <Text style={styles.profitLabel}>الربح الإجمالي</Text>
        <Text style={styles.profitValue}>{profit.toLocaleString()} دج</Text>
      </View>

      <Text style={styles.sectionTitle}>الكريدي حسب المورد</Text>
      {labels.length > 0 ? (
        <BarChart
          data={{ labels, datasets: [{ data }] }}
          width={screenWidth}
          height={240}
          yAxisLabel=""
          yAxisSuffix=" دج"
          fromZero
          chartConfig={{
            backgroundColor: '#1E293B',
            backgroundGradientFrom: '#1E293B',
            backgroundGradientTo: '#1E293B',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(96, 165, 250, ${opacity})`,
            labelColor: () => '#CBD5E1',
          }}
          style={{ borderRadius: 12 }}
        />
      ) : (
        <Text style={styles.empty}>ماكاش بيانات باش تتعرض</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  profitBox: { backgroundColor: '#7C3AED', padding: 16, borderRadius: 14, marginBottom: 20 },
  profitLabel: { color: '#EDE9FE' },
  profitValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  empty: { color: '#64748B' },
});
