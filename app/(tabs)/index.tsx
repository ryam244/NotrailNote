import { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, Card } from '@/components/common';
import { colors, spacing, borderRadius, shadows, icons } from '@/theme';
import { useDocuments } from '@/hooks';
import { searchDocuments } from '@/services/database';
import type { Document } from '@/types';

type FilterTab = 'all' | 'synced' | 'local';

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  if (days < 7) return `${days}日前`;

  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function getSyncStatus(doc: Document): 'synced' | 'pending' | 'local' {
  if (!doc.githubSync?.enabled) return 'local';
  return doc.githubSync.syncStatus === 'synced' ? 'synced' : 'pending';
}

function SyncIcon({ status }: { status: 'synced' | 'pending' | 'local' }) {
  switch (status) {
    case 'synced':
      return <Feather name="cloud" size={16} color={colors.sync.synced} />;
    case 'pending':
      return <Feather name="refresh-cw" size={16} color={colors.sync.pending} />;
    case 'local':
      return <Feather name="cloud-off" size={16} color={colors.sync.local} />;
  }
}

export default function DashboardScreen() {
  const { documents, isLoading, error, loadDocuments, createDocument, deleteDocument, limits } = useDocuments();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Search handler
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchDocuments(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const closeSearch = useCallback(() => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  }, [loadDocuments]);

  const handleCreateDocument = useCallback(async () => {
    const newDoc = await createDocument('新規ドキュメント');
    if (newDoc) {
      router.push(`/editor/${newDoc.id}`);
    }
  }, [createDocument]);

  const handleDeleteDocument = useCallback((doc: Document) => {
    Alert.alert(
      '削除確認',
      `「${doc.title}」を削除しますか？\nこの操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            await deleteDocument(doc.id);
          },
        },
      ]
    );
  }, [deleteDocument]);

  const filteredDocuments = documents.filter((doc) => {
    if (activeTab === 'all') return true;
    const status = getSyncStatus(doc);
    if (activeTab === 'synced') return status === 'synced';
    if (activeTab === 'local') return status === 'local';
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="folder" size={28} color={colors.primary} />
        </View>
        <Text variant="h3">ファイル一覧</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.headerButton} onPress={() => setShowSearch(true)}>
            <Feather name="search" size={icons.size.md} color={colors.text.secondary} />
          </Pressable>
          <Pressable style={styles.headerButton}>
            <Feather name="more-horizontal" size={icons.size.md} color={colors.text.secondary} />
          </Pressable>
        </View>
      </View>

      {/* Search Modal */}
      <Modal visible={showSearch} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.searchContainer}>
          <View style={styles.searchHeader}>
            <View style={styles.searchInputContainer}>
              <Feather name="search" size={20} color={colors.text.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="ドキュメントを検索..."
                placeholderTextColor={colors.text.muted}
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => handleSearch('')}>
                  <Feather name="x" size={20} color={colors.text.muted} />
                </Pressable>
              )}
            </View>
            <Pressable onPress={closeSearch} style={styles.searchCancel}>
              <Text variant="body" color="brand">キャンセル</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.searchResults}>
            {searchQuery.length === 0 ? (
              <View style={styles.searchHint}>
                <Feather name="search" size={48} color={colors.gray[300]} />
                <Text variant="body" color="secondary" style={{ marginTop: spacing[3] }}>
                  タイトルや内容で検索
                </Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.searchHint}>
                <Feather name="file-minus" size={48} color={colors.gray[300]} />
                <Text variant="body" color="secondary" style={{ marginTop: spacing[3] }}>
                  「{searchQuery}」に一致するドキュメントがありません
                </Text>
              </View>
            ) : (
              searchResults.map((doc) => {
                const syncStatus = getSyncStatus(doc);
                return (
                  <Pressable
                    key={doc.id}
                    onPress={() => {
                      closeSearch();
                      router.push(`/editor/${doc.id}`);
                    }}
                  >
                    <Card style={styles.fileCard}>
                      <View style={[styles.fileIcon, { backgroundColor: colors.gray[100] }]}>
                        <Feather name="file-text" size={20} color={colors.text.muted} />
                      </View>
                      <View style={styles.fileInfo}>
                        <Text variant="bodyBold" numberOfLines={1}>{doc.title}</Text>
                        <Text variant="caption" color="secondary" numberOfLines={1}>
                          {doc.content.slice(0, 50) || '(空のドキュメント)'}
                        </Text>
                      </View>
                      <SyncIcon status={syncStatus} />
                    </Card>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <Pressable
          style={[styles.filterTab, activeTab === 'all' && styles.filterTabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text variant="caption" color={activeTab === 'all' ? 'brand' : 'secondary'}>
            すべて
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterTab, activeTab === 'synced' && styles.filterTabActive]}
          onPress={() => setActiveTab('synced')}
        >
          <Text variant="caption" color={activeTab === 'synced' ? 'brand' : 'secondary'}>
            同期済み
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterTab, activeTab === 'local' && styles.filterTabActive]}
          onPress={() => setActiveTab('local')}
        >
          <Text variant="caption" color={activeTab === 'local' ? 'brand' : 'secondary'}>
            ローカル
          </Text>
        </Pressable>
      </View>

      {/* File List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {error && (
          <View style={styles.errorBanner}>
            <Text variant="caption" color="error">{error}</Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text variant="micro" color="muted" style={styles.sectionLabel}>
            最近のドキュメント
          </Text>
          <Text variant="micro" color="muted">
            {documents.length} / {limits.maxDocuments === -1 ? '∞' : limits.maxDocuments}
          </Text>
        </View>

        {filteredDocuments.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <Feather name="file-text" size={48} color={colors.gray[300]} />
            <Text variant="body" color="secondary" style={styles.emptyText}>
              ドキュメントがありません
            </Text>
            <Text variant="caption" color="muted">
              右下の + ボタンで作成できます
            </Text>
          </View>
        ) : (
          filteredDocuments.map((doc) => {
            const syncStatus = getSyncStatus(doc);
            return (
              <Pressable
                key={doc.id}
                onPress={() => router.push(`/editor/${doc.id}`)}
                onLongPress={() => handleDeleteDocument(doc)}
                delayLongPress={500}
              >
                <Card style={styles.fileCard}>
                  <View
                    style={[
                      styles.fileIcon,
                      {
                        backgroundColor:
                          syncStatus === 'synced'
                            ? colors.primaryLight
                            : syncStatus === 'pending'
                            ? colors.warningLight
                            : colors.gray[100],
                      },
                    ]}
                  >
                    <Feather
                      name="file-text"
                      size={20}
                      color={
                        syncStatus === 'synced'
                          ? colors.primary
                          : syncStatus === 'pending'
                          ? colors.warning
                          : colors.text.muted
                      }
                    />
                  </View>
                  <View style={styles.fileInfo}>
                    <Text variant="bodyBold" numberOfLines={1}>
                      {doc.title}
                    </Text>
                    <Text variant="caption" color="secondary" numberOfLines={1}>
                      {doc.content.slice(0, 50) || '(空のドキュメント)'}
                    </Text>
                  </View>
                  <View style={styles.fileMeta}>
                    <SyncIcon status={syncStatus} />
                    <Text variant="micro" color="muted" style={styles.fileTime}>
                      {formatRelativeTime(doc.updatedAt)}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab} onPress={handleCreateDocument}>
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
  errorBanner: {
    backgroundColor: colors.errorLight,
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
    paddingHorizontal: spacing[1],
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  searchContainer: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing[3],
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: colors.text.primary,
  },
  searchCancel: {
    paddingVertical: spacing[2],
  },
  searchResults: {
    flex: 1,
    padding: spacing[4],
  },
  searchHint: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
  },
});
