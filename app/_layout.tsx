import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colors } from '@/theme';
import { initDatabase, getSettings } from '@/services/database';
import { useSettingsStore, useAuthStore } from '@/stores';

const queryClient = new QueryClient();

function AppInitializer({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const { setSettings, setLoading: setSettingsLoading } = useSettingsStore();
  const { setUser, setLoading: setAuthLoading } = useAuthStore();

  useEffect(() => {
    async function initialize() {
      try {
        // データベース初期化
        await initDatabase();

        // 設定読み込み
        const settings = await getSettings();
        setSettings(settings);
        setSettingsLoading(false);

        // 仮のユーザー（後でFirebase Authに置き換え）
        setUser({
          id: 'local-user',
          plan: 'free',
        });
        setAuthLoading(false);

        setIsReady(true);
      } catch (error) {
        console.error('Initialization error:', error);
        setIsReady(true); // エラーでも続行
      }
    }

    initialize();
  }, [setSettings, setSettingsLoading, setUser, setAuthLoading]);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInitializer>
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
      </AppInitializer>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.light,
  },
});
