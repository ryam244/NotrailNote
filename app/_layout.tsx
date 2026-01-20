import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colors } from '@/theme';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.light },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="editor/[id]"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="diff/[id]" />
        <Stack.Screen name="prompts/index" />
        <Stack.Screen name="auth/github" />
      </Stack>
    </QueryClientProvider>
  );
}
