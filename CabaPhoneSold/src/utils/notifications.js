import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// يبرمج تنبيه ليوم معين (موعد تسديد للمورد مثلا)
export async function scheduleDueDateNotification(supplierName, amount, dueDateISO) {
  const dueDate = new Date(dueDateISO);
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'موعد تسديد قرب 🔔',
      body: `عندك ${amount} دج لازم تخلصهم لـ ${supplierName}`,
    },
    trigger: dueDate,
  });
}

// تنبيه صباحي يومي (ملخص الكريدي)
export async function scheduleDailyMorningSummary() {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'صباح الخير ☀️',
      body: 'شوف دفتر الموردين تعك، كاين مواعيد لازم تتابعها اليوم.',
    },
    trigger: { hour: 8, minute: 0, repeats: true },
  });
}
