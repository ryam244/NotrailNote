import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Text, Card } from '@/components/common';
import { colors, spacing, borderRadius, icons, fontFamily } from '@/theme';
import { getVersionById, getPreviousVersion, getDocumentById } from '@/services/database';
import type { Version, Document } from '@/types';

type DiffLine = {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number | null;
  oldLineNumber: number | null;
};

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: DiffLine[] = [];

  // Simple line-by-line diff
  const maxLen = Math.max(oldLines.length, newLines.length);
  let oldIdx = 0;
  let newIdx = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldLine = oldLines[oldIdx];
    const newLine = newLines[newIdx];

    if (oldIdx >= oldLines.length) {
      // All remaining lines are added
      result.push({
        type: 'added',
        content: newLine,
        lineNumber: newIdx + 1,
        oldLineNumber: null,
      });
      newIdx++;
    } else if (newIdx >= newLines.length) {
      // All remaining lines are removed
      result.push({
        type: 'removed',
        content: oldLine,
        lineNumber: null,
        oldLineNumber: oldIdx + 1,
      });
      oldIdx++;
    } else if (oldLine === newLine) {
      // Lines match
      result.push({
        type: 'unchanged',
        content: newLine,
        lineNumber: newIdx + 1,
        oldLineNumber: oldIdx + 1,
      });
      oldIdx++;
      newIdx++;
    } else {
      // Check if old line exists later in new text
      const foundInNew = newLines.slice(newIdx + 1).indexOf(oldLine);
      const foundInOld = oldLines.slice(oldIdx + 1).indexOf(newLine);

      if (foundInNew !== -1 && (foundInOld === -1 || foundInNew <= foundInOld)) {
        // New line was added
        result.push({
          type: 'added',
          content: newLine,
          lineNumber: newIdx + 1,
          oldLineNumber: null,
        });
        newIdx++;
      } else if (foundInOld !== -1) {
        // Old line was removed
        result.push({
          type: 'removed',
          content: oldLine,
          lineNumber: null,
          oldLineNumber: oldIdx + 1,
        });
        oldIdx++;
      } else {
        // Line changed - show as remove then add
        result.push({
          type: 'removed',
          content: oldLine,
          lineNumber: null,
          oldLineNumber: oldIdx + 1,
        });
        result.push({
          type: 'added',
          content: newLine,
          lineNumber: newIdx + 1,
          oldLineNumber: null,
        });
        oldIdx++;
        newIdx++;
      }
    }
  }

  return result;
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function DiffLineView({ line }: { line: DiffLine }) {
  const bgColor =
    line.type === 'added'
      ? colors.successLight
      : line.type === 'removed'
      ? colors.errorLight
      : colors.surface.light;

  const textColor =
    line.type === 'added'
      ? colors.success
      : line.type === 'removed'
      ? colors.error
      : colors.text.primary;

  const prefix = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ';

  return (
    <View style={[styles.diffLine, { backgroundColor: bgColor }]}>
      <View style={styles.lineNumbers}>
        <Text variant="micro" color="muted" style={styles.lineNumber}>
          {line.oldLineNumber ?? ''}
        </Text>
        <Text variant="micro" color="muted" style={styles.lineNumber}>
          {line.lineNumber ?? ''}
        </Text>
      </View>
      <Text variant="micro" style={[styles.diffPrefix, { color: textColor }]}>
        {prefix}
      </Text>
      <Text variant="micro" style={[styles.diffLineContent, { color: textColor }]} numberOfLines={1}>
        {line.content || ' '}
      </Text>
    </View>
  );
}

export default function DiffScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null);
  const [previousVersion, setPreviousVersion] = useState<Version | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const version = await getVersionById(id);
      if (!version) {
        setError('バージョンが見つかりません');
        return;
      }
      setCurrentVersion(version);

      const doc = await getDocumentById(version.documentId);
      setDocument(doc);

      const prev = await getPreviousVersion(version.documentId, version.createdAt);
      setPreviousVersion(prev);
    } catch (err) {
      console.error('Failed to load diff data:', err);
      setError('データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const diffLines = currentVersion
    ? computeDiff(previousVersion?.content ?? '', currentVersion.content)
    : [];

  const addedCount = diffLines.filter((l) => l.type === 'added').length;
  const removedCount = diffLines.filter((l) => l.type === 'removed').length;

  const handleRestore = useCallback(() => {
    // TODO: Implement restore functionality
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={icons.size.md} color={colors.text.primary} />
          </Pressable>
          <Text variant="h4" numberOfLines={1} style={styles.headerTitle}>
            エラー
          </Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={colors.error} />
          <Text variant="body" color="error" style={styles.errorText}>
            {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={icons.size.md} color={colors.text.primary} />
        </Pressable>
        <Text variant="h4" numberOfLines={1} style={styles.headerTitle}>
          {document?.title ?? '差分表示'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.versionInfo}>
        <Card style={styles.versionCard}>
          <View style={styles.versionRow}>
            <View style={styles.versionDot} />
            <View style={styles.versionDetails}>
              <Text variant="bodyBold">
                {currentVersion?.label ||
                  currentVersion?.commitMessage ||
                  (currentVersion?.autoSaved ? '自動保存' : '手動スナップショット')}
              </Text>
              <Text variant="caption" color="muted">
                {currentVersion && formatDateTime(currentVersion.createdAt)}
              </Text>
            </View>
            {currentVersion?.source === 'github' && (
              <Feather name="github" size={16} color={colors.text.muted} />
            )}
          </View>
        </Card>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Feather name="plus" size={14} color={colors.success} />
            <Text variant="caption" color="secondary">
              {addedCount} 行追加
            </Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="minus" size={14} color={colors.error} />
            <Text variant="caption" color="secondary">
              {removedCount} 行削除
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.diffContainer} showsVerticalScrollIndicator={false}>
        {previousVersion === null && (
          <View style={styles.noPreviousNotice}>
            <Feather name="info" size={16} color={colors.primary} />
            <Text variant="caption" color="secondary" style={styles.noPreviousText}>
              最初のバージョンのため、前のバージョンがありません
            </Text>
          </View>
        )}

        <View style={styles.diffBlock}>
          {diffLines.map((line, index) => (
            <DiffLineView key={index} line={line} />
          ))}
        </View>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  errorText: {
    marginTop: spacing[4],
    textAlign: 'center',
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
  headerTitle: {
    flex: 1,
    marginHorizontal: spacing[2],
  },
  headerRight: {
    width: 40,
  },
  versionInfo: {
    padding: spacing[4],
    backgroundColor: colors.surface.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  versionCard: {
    marginBottom: spacing[3],
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  versionDot: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  versionDetails: {
    flex: 1,
    gap: spacing[0.5],
  },
  stats: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  diffContainer: {
    flex: 1,
  },
  noPreviousNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[4],
    backgroundColor: colors.primaryLight,
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    borderRadius: borderRadius.lg,
  },
  noPreviousText: {
    flex: 1,
  },
  diffBlock: {
    margin: spacing[4],
    backgroundColor: colors.surface.light,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  diffLine: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 24,
  },
  lineNumbers: {
    flexDirection: 'row',
    width: 64,
    borderRightWidth: 1,
    borderRightColor: colors.border.light,
  },
  lineNumber: {
    width: 32,
    textAlign: 'center',
    paddingVertical: spacing[1],
    backgroundColor: colors.background.light,
  },
  diffPrefix: {
    width: 20,
    textAlign: 'center',
    paddingVertical: spacing[1],
    fontFamily: fontFamily.mono,
  },
  diffLineContent: {
    flex: 1,
    paddingVertical: spacing[1],
    paddingRight: spacing[2],
    fontFamily: fontFamily.mono,
  },
  bottomPadding: {
    height: spacing[8],
  },
});
