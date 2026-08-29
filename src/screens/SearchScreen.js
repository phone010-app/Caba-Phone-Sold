import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { globalSearch } from '../database/queries';

// TODO: هذي الشاشة فالتاب لواحدها، باش تخدم فيها navigation.navigate('SupplierDetail')
// خاصك تزيدها داخل SuppliersStackNavigator أو تستعمل navigation.navigate('Suppliers', { screen: 'SupplierDetail', params: { supplier } })
export default function SearchScreen({ navigation }) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState({ suppliers: [], clients: [], inventory: [] });

  const onChange = async (text) => {
    setTerm(text);
    if (text.length < 2) return setResults({ suppliers: [], clients: [], inventory: [] });
    setResults(await globalSearch(text));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>البحث</Text>
      <TextInput
        style={styles.input}
        placeholder="ابحث على مورد، زبون، منتوج أو IMEI..."
        value={term}
        onChangeText={onChange}
      />
      <ScrollView>
        {results.suppliers.length > 0 && (
          <>
            <Text style={styles.section}>موردين</Text>
            {results.suppliers.map((s) => (
              <Text
                key={s.id}
                style={styles.item}
                onPress={() => navigation.navigate('Suppliers', { screen: 'SupplierDetail', params: { supplier: s } })}
              >
                🏢 {s.name}
              </Text>
            ))}
          </>
        )}
        {results.clients.length > 0 && (
          <>
            <Text style={styles.section}>زبائن</Text>
            {results.clients.map((c) => <Text key={c.id} style={styles.item}>👤 {c.name}</Text>)}
          </>
        )}
        {results.inventory.length > 0 && (
          <>
            <Text style={styles.section}>مخزون</Text>
            {results.inventory.map((i) => (
              <Text key={i.id} style={styles.item}>📱 {i.product_name} — IMEI: {i.imei || '—'}</Text>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#334155', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 16 },
  section: { color: '#60A5FA', fontWeight: 'bold', marginTop: 10, marginBottom: 6 },
  item: { color: '#fff', backgroundColor: '#1E293B', padding: 10, borderRadius: 8, marginBottom: 6 },
});
