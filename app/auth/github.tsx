import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text } from '@/components/common';
import { colors, spacing, borderRadius, icons } from '@/theme';
import { useSettingsStore } from '@/stores';
import { saveSettings } from '@/services/database';
import {
  useGitHubAuthRequest,
  exchangeCodeForToken,
  getAuthenticatedUser,
  type GitHubUser,
} from '@/services/github';

export default function GitHubAuthScreen() {
  const { settings, updateSettings } = useSettingsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const { request, response, promptAsync, redirectUri } = useGitHubAuthRequest();

  const isConnected = !!settings.github?.accessToken;

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      handleAuthCode(code);
    } else if (response?.type === 'error') {
      Alert.alert('認証エラー', response.error?.message || '認証に失敗しました');
    }
  }, [response]);

  // Load user info if already connected
  useEffect(() => {
    if (settings.github?.accessToken) {
      loadUser(settings.github.accessToken);
    }
  }, [settings.github?.accessToken]);

  const loadUser = async (token: string) => {
    const userData = await getAuthenticatedUser(token);
    if (userData) {
      setUser(userData);
    }
  };

  const handleAuthCode = async (code: string) => {
    setIsLoading(true);
    try {
      const accessToken = await exchangeCodeForToken(code);
      if (!accessToken) {
        Alert.alert('エラー', 'アクセストークンの取得に失敗しました');
        return;
      }

      const userData = await getAuthenticatedUser(accessToken);
      if (!userData) {
        Alert.alert('エラー', 'ユーザー情報の取得に失敗しました');
        return;
      }

      // Save to settings
      const newSettings = {
        ...settings,
        github: {
          accessToken,
          username: userData.login,
        },
      };

      updateSettings({ github: newSettings.github });
      await saveSettings(newSettings);
      setUser(userData);

      Alert.alert('完了', 'GitHubと連携しました', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('エラー', '認証処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = useCallback(async () => {
    if (!request) {
      Alert.alert('エラー', '認証の準備ができていません');
      return;
    }
    await promptAsync();
  }, [request, promptAsync]);

  const handleDisconnect = useCallback(async () => {
    Alert.alert(
      '連携解除',
      'GitHub連携を解除しますか？ローカルのドキュメントは保持されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '解除',
          style: 'destructive',
          onPress: async () => {
            const newSettings = { ...settings, github: undefined };
            updateSettings({ github: undefined });
            await saveSettings(newSettings);
            setUser(null);
          },
        },
      ]
    );
  }, [settings, updateSettings]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="x" size={icons.size.md} color={colors.text.primary} />
        </Pressable>
        <Text variant="h4">GitHub連携</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {isConnected && user ? (
          // Connected state
          <>
            <View style={styles.userCard}>
              <View style={styles.avatarPlaceholder}>
                <Feather name="user" size={32} color={colors.text.muted} />
              </View>
              <View style={styles.userInfo}>
                <Text variant="bodyBold">{user.name || user.login}</Text>
                <Text variant="caption" color="secondary">@{user.login}</Text>
              </View>
              <Feather name="check-circle" size={24} color={colors.success} />
            </View>

            <View style={styles.statusCard}>
              <Feather name="check" size={20} color={colors.success} />
              <Text variant="body" style={styles.statusText}>
                GitHubと連携済み
              </Text>
            </View>

            <Text variant="caption" color="muted" style={styles.description}>
              ドキュメントをGitHubリポジトリに同期できます。
              設定画面からリポジトリを選択してください。
            </Text>

            <Pressable style={styles.disconnectButton} onPress={handleDisconnect}>
              <Text variant="body" color="error">連携を解除</Text>
            </Pressable>
          </>
        ) : (
          // Not connected state
          <>
            <View style={styles.iconContainer}>
              <Feather name="github" size={64} color={colors.text.primary} />
            </View>

            <Text variant="h3" style={styles.title}>
              GitHubと連携する
            </Text>

            <Text variant="body" color="secondary" style={styles.description}>
              GitHubアカウントと連携すると、ドキュメントをリポジトリに同期できます。
              バージョン管理やチーム共有が簡単になります。
            </Text>

            <View style={styles.features}>
              <View style={styles.featureItem}>
                <Feather name="check-circle" size={20} color={colors.success} />
                <Text variant="body" style={styles.featureText}>
                  ドキュメントの自動同期
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="check-circle" size={20} color={colors.success} />
                <Text variant="body" style={styles.featureText}>
                  コミット履歴の確認
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="check-circle" size={20} color={colors.success} />
                <Text variant="body" style={styles.featureText}>
                  複数デバイス間での共有
                </Text>
              </View>
            </View>

            <Pressable
              style={[styles.connectButton, !request && styles.connectButtonDisabled]}
              onPress={handleConnect}
              disabled={isLoading || !request}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <>
                  <Feather name="github" size={20} color={colors.text.inverse} />
                  <Text variant="bodyBold" color="inverse" style={styles.buttonText}>
                    GitHubでサインイン
                  </Text>
                </>
              )}
            </Pressable>

            <Text variant="caption" color="muted" style={styles.notice}>
              連携時にリポジトリへの読み書きアクセス権限を要求します
            </Text>

            {__DEV__ && (
              <Text variant="micro" color="muted" style={styles.debugInfo}>
                Redirect URI: {redirectUri}
              </Text>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing[2],
    borderRadius: borderRadius.full,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: spacing[6],
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[8],
    marginBottom: spacing[6],
  },
  title: {
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: spacing[6],
    paddingHorizontal: spacing[4],
  },
  features: {
    alignSelf: 'stretch',
    gap: spacing[3],
    marginBottom: spacing[8],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
  },
  featureText: {
    flex: 1,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    alignSelf: 'stretch',
    backgroundColor: '#24292e',
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
  },
  connectButtonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    marginLeft: spacing[1],
  },
  notice: {
    marginTop: spacing[4],
    textAlign: 'center',
  },
  debugInfo: {
    marginTop: spacing[4],
    textAlign: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.surface.light,
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    marginTop: spacing[4],
    gap: spacing[4],
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    gap: spacing[0.5],
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.successLight,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginTop: spacing[4],
    gap: spacing[3],
  },
  statusText: {
    flex: 1,
  },
  disconnectButton: {
    marginTop: spacing[8],
    padding: spacing[4],
  },
});
