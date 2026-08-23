import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { hasPin, setPin, checkPin, tryBiometric } from '../utils/security';

export default function LoginScreen({ onSuccess }) {
  const [pinExists, setPinExists] = useState(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    hasPin().then(setPinExists);
  }, []);

  const submit = async () => {
    if (input.length < 4) return Alert.alert('خطأ', 'الكود لازم يكون 4 أرقام أقل تقدير');
    if (!pinExists) {
      await setPin(input);
      Alert.alert('تم', 'تسجل الكود تعك بنجاح');
      onSuccess();
    } else {
      const ok = await checkPin(input);
      if (ok) onSuccess();
      else Alert.alert('خطأ', 'الكود ماشي صحيح');
    }
  };

  const biometric = async () => {
    const ok = await tryBiometric();
    if (ok) onSuccess();
  };

  if (pinExists === null) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📱 Caba Phone Sold</Text>
      <Text style={styles.subtitle}>
        {pinExists ? 'دخل الكود تعك' : 'حدد كود دخول جديد (4 أرقام)'}
      </Text>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        placeholder="••••"
        textAlign="center"
      />
      <TouchableOpacity style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>{pinExists ? 'دخول' : 'تسجيل'}</Text>
      </TouchableOpacity>
      {pinExists && (
        <TouchableOpacity onPress={biometric}>
          <Text style={styles.link}>ولا دخل بالبصمة 👆</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { color: '#94A3B8', marginBottom: 24 },
  input: {
    borderWidth: 1, borderColor: '#334155', backgroundColor: '#1E293B', color: '#fff',
    fontSize: 24, width: 160, padding: 12, borderRadius: 12, marginBottom: 20, letterSpacing: 8,
  },
  button: { backgroundColor: '#2563EB', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { color: '#60A5FA', marginTop: 16 },
});
