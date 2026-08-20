import { Stack } from 'expo-router';

import { Brand } from '@/constants/theme';

// Without this the group would anchor on `otp`, which sorts before `phone`.
export const unstable_settings = {
  anchor: 'phone',
  initialRouteName: 'phone',
};

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Brand.paper },
      }}>
      <Stack.Screen name="phone" />
      <Stack.Screen name="otp" />
    </Stack>
  );
}
