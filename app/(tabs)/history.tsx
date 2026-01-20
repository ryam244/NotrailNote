import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Text, Card } from '@/components/common';
import { colors, spacing, borderRadius } from '@/theme';
import { getAllVersionsWithDocuments, type VersionWithDocument } from '@/services/database';

type GroupedVersions = {
  label: string;
  versions: VersionWithDocument[];
};

function formatTimeOnly(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;

  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()} ${formatTimeOnly(timestamp)}`;
}

function groupVersionsByDate(versions: VersionWithDocument[]): GroupedVersions[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const lastWeek = today - 7 * 86400000;

  const groups: Map<string, VersionWithDocument[]> = new Map();

  versions.forEach((version) => {
    let label: string;
    if (version.createdAt >= today) {
      label = '今日';
    } else if (version.createdAt >= yesterday) {
      label = '昨日';
    } else if (version.createdAt >= lastWeek) {
      label = '今週';
    } else {
      const date = new Date(version.createdAt);
      label = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    }

    const existing = groups.get(label) || [];
    existing.push(version);
    groups.set(label, existing);
  });

  return Array.from(groups.entries()).map(([label, versions]) => ({
    label,
    versions,
  }));
}

function getVersionDescription(version: VersionWithDocument): string {
  if (version.label) {
    return version.label;
  }
  if (version.commitMessage) {
    return version.commitMessage;
  }
  if (version.autoSaved) {
    return '自動保存';
  }
  return '手動スナップショット';
}

function SourceIcon({ source, autoSaved }: { source: 'local' | 'github'; autoSaved: boolean }) {
  if (source === 'github') {
    return <Feather name="github" size={14} color={colors.text.muted} />;
  }
  if (autoSaved) {
    return <Feather name="clock" size={14} color={colors.text.muted} />;
  }
  return <Feather name="bookmark" size={14} color={colors.primary} />;
}

export default function HistoryScreen() {
  const [versions, setVersions] = useState<VersionWithDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVersions = useCallback(async () => {
    try {
      const data = await getAllVersionsWithDocuments();
      setVersions(data);
    } catch (err) {
      console.error('Failed to load versions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVersions();
    setRefreshing(false);
  }, [loadVersions]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const groupedVersions = useMemo(() => groupVersionsByDate(versions), [versions]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="h3">編集履歴</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {versions.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <Feather name="clock" size={48} color={colors.gray[300]} />
            <Text variant="body" color="secondary" style={styles.emptyText}>
              まだ編集履歴がありません
            </Text>
            <Text variant="caption" color="muted">
              ドキュメントを編集すると自動で保存されます
            </Text>
          </View>
        ) : (
          groupedVersions.map((group, groupIndex) => (
            <View key={group.label}>
              <Text
                variant="micro"
                color="muted"
                style={[styles.sectionLabel, groupIndex > 0 && styles.sectionTop]}
              >
                {group.label}
              </Text>

              {group.versions.map((version, index) => {
                const isLast = index === group.versions.length - 1;
                const isFirst = groupIndex === 0 && index === 0;

                return (
                  <Link key={version.id} href={`/diff/${version.id}`} asChild>
                    <Pressable>
                      <Card style={styles.historyCard}>
                        <View style={styles.timeline}>
                          <View style={[styles.dot, isFirst && styles.dotActive]} />
                          {!isLast && <View style={styles.line} />}
                        </View>
                        <View style={styles.historyContent}>
                          <View style={styles.historyHeader}>
                            <Text variant="bodyBold" numberOfLines={1} style={styles.historyTitle}>
                              {getVersionDescription(version)}
                            </Text>
                            <SourceIcon source={version.source} autoSaved={version.autoSaved} />
                          </View>
                          <Text variant="caption" color="secondary" numberOfLines={1}>
                            {version.documentTitle}
                          </Text>
                          <Text variant="micro" color="muted" style={styles.time}>
                            {formatRelativeTime(version.createdAt)}
                          </Text>
                        </View>
                      </Card>
                    </Pressable>
                  </Link>
                );
              })}
            </View>
          ))
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    backgroundColor: colors.surface.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
  },
  emptyText: {
    marginTop: spacing[4],
    marginBottom: spacing[1],
  },
  sectionLabel: {
    marginBottom: spacing[3],
    marginLeft: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTop: {
    marginTop: spacing[4],
  },
  historyCard: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  timeline: {
    width: 40,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[300],
    marginTop: spacing[1],
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.gray[200],
    marginTop: spacing[1],
  },
  historyContent: {
    flex: 1,
    paddingRight: spacing[2],
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  historyTitle: {
    flex: 1,
  },
  time: {
    marginTop: spacing[1],
  },
  bottomPadding: {
    height: 40,
  },
});
