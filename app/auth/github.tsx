import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, Button } from '@/components/common';
import { colors, spacing, borderRadius, icons } from '@/theme';

export default function GitHubAuthScreen() {
  const handleConnect = () => {
    // TODO: Implement GitHub OAuth
  };

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

        <Button
          variant="primary"
          onPress={handleConnect}
          style={styles.connectButton}
        >
          <Feather name="github" size={20} color={colors.text.inverse} />
          <Text variant="bodyBold" color="inverse" style={styles.buttonText}>
            GitHubでサインイン
          </Text>
        </Button>

        <Text variant="caption" color="muted" style={styles.notice}>
          連携時にリポジトリへの読み書きアクセス権限を要求します
        </Text>
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
    gap: spacing[2],
    alignSelf: 'stretch',
  },
  buttonText: {
    marginLeft: spacing[1],
  },
  notice: {
    marginTop: spacing[4],
    textAlign: 'center',
  },
});
