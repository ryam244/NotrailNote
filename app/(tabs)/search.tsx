import { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Text, Input, Card } from '@/components/common';
import { colors, spacing, borderRadius, icons } from '@/theme';
import { searchDocuments } from '@/services/database';
import type { Document } from '@/types';

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

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <Text key={index} style={styles.highlight}>
        {part}
      </Text>
    ) : (
      part
    )
  );
}

function getPreviewWithContext(content: string, query: string): string {
  if (!query.trim()) return content.slice(0, 80);

  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerContent.indexOf(lowerQuery);

  if (index === -1) return content.slice(0, 80);

  const start = Math.max(0, index - 20);
  const end = Math.min(content.length, index + query.length + 60);
  let preview = content.slice(start, end);

  if (start > 0) preview = '...' + preview;
  if (end < content.length) preview = preview + '...';

  return preview;
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Document[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    try {
      const docs = await searchDocuments(searchQuery);
      setResults(docs);
      setHasSearched(true);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="h3">検索</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Input
            placeholder="ファイル名やキーワードで検索..."
            value={query}
            onChangeText={setQuery}
            leftIcon={<Feather name="search" size={icons.size.sm} color={colors.text.muted} />}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable style={styles.clearButton} onPress={handleClear}>
              <Feather name="x" size={icons.size.sm} color={colors.text.muted} />
            </Pressable>
          )}
        </View>

        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {!isSearching && hasSearched && results.length === 0 && (
          <View style={styles.noResults}>
            <Feather name="file-minus" size={48} color={colors.gray[300]} />
            <Text variant="body" color="secondary" style={styles.noResultsText}>
              「{query}」に一致する結果がありません
            </Text>
          </View>
        )}

        {!isSearching && results.length > 0 && (
          <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
            <Text variant="micro" color="muted" style={styles.resultsCount}>
              {results.length}件の結果
            </Text>

            {results.map((doc) => (
              <Link key={doc.id} href={`/editor/${doc.id}`} asChild>
                <Pressable>
                  <Card style={styles.resultCard}>
                    <View style={styles.resultIcon}>
                      <Feather name="file-text" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.resultContent}>
                      <Text variant="bodyBold" numberOfLines={1}>
                        {highlightText(doc.title, query)}
                      </Text>
                      <Text variant="caption" color="secondary" numberOfLines={2}>
                        {highlightText(getPreviewWithContext(doc.content, query), query)}
                      </Text>
                      <Text variant="micro" color="muted" style={styles.resultTime}>
                        {formatRelativeTime(doc.updatedAt)}
                      </Text>
                    </View>
                  </Card>
                </Pressable>
              </Link>
            ))}

            <View style={styles.bottomPadding} />
          </ScrollView>
        )}

        {!hasSearched && !isSearching && (
          <View style={styles.emptyState}>
            <Feather name="search" size={64} color={colors.gray[300]} />
            <Text variant="body" color="secondary" style={styles.emptyText}>
              キーワードを入力して{'\n'}ドキュメントを検索
            </Text>
          </View>
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
  searchContainer: {
    position: 'relative',
  },
  clearButton: {
    position: 'absolute',
    right: spacing[3],
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: spacing[2],
  },
  loadingContainer: {
    paddingVertical: spacing[8],
    alignItems: 'center',
  },
  results: {
    flex: 1,
    marginTop: spacing[4],
  },
  resultsCount: {
    marginBottom: spacing[3],
    marginLeft: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
    gap: spacing[0.5],
  },
  resultTime: {
    marginTop: spacing[1],
  },
  highlight: {
    backgroundColor: colors.primaryLight,
    color: colors.primary,
  },
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing[12],
  },
  noResultsText: {
    marginTop: spacing[4],
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing[12],
  },
  emptyText: {
    marginTop: spacing[4],
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});
