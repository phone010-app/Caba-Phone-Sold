import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { registerForNotifications, scheduleDailyMorningSummary } from '../utils/notifications';

export default function SettingsScreen() {
  const [notifEnabled, setNotifEnabled] = useState(false);

  const toggleNotif = async (value) => {
    if (value) {
      const granted = await registerForNotifications();
      if (granted) {
        await scheduleDailyMorningSummary();
        setNotifEnabled(true);
      } else {
        Alert.alert('خطأ', 'ماعطيتيش الإذن للتنبيهات');
      }
    } else {
      setNotifEnabled(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>الإعدادات</Text>

      <View style={styles.row}>
        <Text style={styles.label}>تنبيه صباحي يومي</Text>
        <Switch value={notifEnabled} onValueChange={toggleNotif} />
      </View>

      <TouchableOpacity style={styles.dangerBtn} onPress={() => Alert.alert('قريبا', 'نسخة احتياطية (Export CSV) غادي تجي فنسخة جاية')}>
        <Text style={styles.dangerText}>📤 تصدير نسخة احتياطية (Excel/CSV)</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Caba Phone Sold — v0.1.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', padding: 14, borderRadius: 12, marginBottom: 12 },
  label: { color: '#fff' },
  dangerBtn: { backgroundColor: '#1E293B', padding: 14, borderRadius: 12, marginTop: 20 },
  dangerText: { color: '#60A5FA' },
  footer: { color: '#475569', textAlign: 'center', marginTop: 40 },
});
