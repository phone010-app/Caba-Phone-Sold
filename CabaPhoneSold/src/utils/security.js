import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const PIN_KEY = 'caba_pin_code';

export async function setPin(pin) {
  await AsyncStorage.setItem(PIN_KEY, pin);
}

export async function hasPin() {
  const pin = await AsyncStorage.getItem(PIN_KEY);
  return !!pin;
}

export async function checkPin(pin) {
  const saved = await AsyncStorage.getItem(PIN_KEY);
  return saved === pin;
}

export async function tryBiometric() {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!compatible || !enrolled) return false;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'أدخل بصمتك باش تدخل لـ Caba Phone Sold',
  });
  return result.success;
}
