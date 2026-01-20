import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Text, Card } from '@/components/common';
import { colors, spacing, borderRadius, shadows, icons } from '@/theme';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="folder" size={28} color={colors.primary} />
        </View>
        <Text variant="h3">ファイル一覧</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.headerButton}>
            <Feather name="search" size={icons.size.md} color={colors.text.secondary} />
          </Pressable>
          <Pressable style={styles.headerButton}>
            <Feather name="more-horizontal" size={icons.size.md} color={colors.text.secondary} />
          </Pressable>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <Pressable style={[styles.filterTab, styles.filterTabActive]}>
          <Text variant="caption" color="brand">すべて</Text>
        </Pressable>
        <Pressable style={styles.filterTab}>
          <Text variant="caption" color="secondary">同期済み</Text>
        </Pressable>
        <Pressable style={styles.filterTab}>
          <Text variant="caption" color="secondary">ローカル</Text>
        </Pressable>
      </View>

      {/* File List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="micro" color="muted" style={styles.sectionLabel}>
          最近のドキュメント
        </Text>

        {/* Sample File Items */}
        <Link href="/editor/1" asChild>
          <Pressable>
            <Card style={styles.fileCard}>
              <View style={[styles.fileIcon, { backgroundColor: colors.primaryLight }]}>
                <Feather name="file-text" size={20} color={colors.primary} />
              </View>
              <View style={styles.fileInfo}>
                <Text variant="bodyBold" numberOfLines={1}>プロジェクトα ロードマップ</Text>
                <Text variant="caption" color="secondary" numberOfLines={1}>
                  フェーズ1の納品物と統合マイルストーンの詳細について...
                </Text>
              </View>
              <View style={styles.fileMeta}>
                <Feather name="cloud" size={16} color={colors.sync.synced} />
                <Text variant="micro" color="muted" style={styles.fileTime}>2分前</Text>
              </View>
            </Card>
          </Pressable>
        </Link>

        <Link href="/editor/2" asChild>
          <Pressable>
            <Card style={styles.fileCard}>
              <View style={[styles.fileIcon, { backgroundColor: colors.warningLight }]}>
                <Feather name="file" size={20} color={colors.warning} />
              </View>
              <View style={styles.fileInfo}>
                <Text variant="bodyBold" numberOfLines={1}>マーケティング戦略</Text>
                <Text variant="caption" color="secondary" numberOfLines={1}>
                  第3四半期キャンペーンに向けた主要な成長施策...
                </Text>
              </View>
              <View style={styles.fileMeta}>
                <Feather name="refresh-cw" size={16} color={colors.sync.pending} />
                <Text variant="micro" color="muted" style={styles.fileTime}>1時間前</Text>
              </View>
            </Card>
          </Pressable>
        </Link>

        <Link href="/editor/3" asChild>
          <Pressable>
            <Card style={styles.fileCard}>
              <View style={[styles.fileIcon, { backgroundColor: colors.gray[100] }]}>
                <Feather name="edit-3" size={20} color={colors.text.muted} />
              </View>
              <View style={styles.fileInfo}>
                <Text variant="bodyBold" numberOfLines={1}>週刊ニュースレター</Text>
                <Text variant="caption" color="secondary" numberOfLines={1}>
                  クリエイター向けアップデートの最新版へようこそ...
                </Text>
              </View>
              <View style={styles.fileMeta}>
                <Feather name="cloud-off" size={16} color={colors.sync.local} />
                <Text variant="micro" color="muted" style={styles.fileTime}>4時間前</Text>
              </View>
            </Card>
          </Pressable>
        </Link>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab}>
        <Feather name="plus" size={28} color={colors.text.inverse} />
      </Pressable>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerLeft: {
    width: 40,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  headerButton: {
    padding: spacing[2],
    borderRadius: borderRadius.full,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    gap: spacing[6],
    backgroundColor: colors.surface.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  filterTab: {
    paddingVertical: spacing[3],
    borderBottomWidth: 2,
    borderBottomColor: colors.transparent,
  },
  filterTabActive: {
    borderBottomColor: colors.primary,
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  sectionLabel: {
    marginBottom: spacing[3],
    marginLeft: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginBottom: spacing[2],
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
    gap: spacing[0.5],
  },
  fileMeta: {
    alignItems: 'flex-end',
    gap: spacing[1],
  },
  fileTime: {
    marginTop: spacing[1],
  },
  bottomPadding: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    bottom: spacing[8],
    right: spacing[6],
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.primary,
  },
});
