import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, TextInput, Pressable, Keyboard, ScrollView, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Text, IconButton, Card } from '@/components/common';
import { colors, spacing, borderRadius, icons, typography } from '@/theme';
import { useDocuments, useVersions } from '@/hooks';
import { useSettingsStore } from '@/stores';
import { syncDocument } from '@/services/githubSync';
import { listRepositories, type GitHubRepo } from '@/services/github';
import { exportDocument, type ExportOptions } from '@/services/export';

// Simple Markdown renderer
function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <ScrollView style={previewStyles.container} showsVerticalScrollIndicator={false}>
      {lines.map((line, index) => {
        // Heading 1
        if (line.startsWith('# ')) {
          return (
            <Text key={index} style={previewStyles.h1}>
              {line.slice(2)}
            </Text>
          );
        }
        // Heading 2
        if (line.startsWith('## ')) {
          return (
            <Text key={index} style={previewStyles.h2}>
              {line.slice(3)}
            </Text>
          );
        }
        // Heading 3
        if (line.startsWith('### ')) {
          return (
            <Text key={index} style={previewStyles.h3}>
              {line.slice(4)}
            </Text>
          );
        }
        // Bullet list
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <View key={index} style={previewStyles.listItem}>
              <Text style={previewStyles.bullet}>•</Text>
              <Text style={previewStyles.listText}>{renderInlineMarkdown(line.slice(2))}</Text>
            </View>
          );
        }
        // Numbered list
        if (/^\d+\.\s/.test(line)) {
          const match = line.match(/^(\d+)\.\s(.*)$/);
          if (match) {
            return (
              <View key={index} style={previewStyles.listItem}>
                <Text style={previewStyles.number}>{match[1]}.</Text>
                <Text style={previewStyles.listText}>{renderInlineMarkdown(match[2])}</Text>
              </View>
            );
          }
        }
        // Code block
        if (line.startsWith('```')) {
          return null; // Skip code fence markers
        }
        // Blockquote
        if (line.startsWith('> ')) {
          return (
            <View key={index} style={previewStyles.blockquote}>
              <Text style={previewStyles.blockquoteText}>{line.slice(2)}</Text>
            </View>
          );
        }
        // Horizontal rule
        if (line === '---' || line === '***') {
          return <View key={index} style={previewStyles.hr} />;
        }
        // Empty line
        if (line.trim() === '') {
          return <View key={index} style={previewStyles.emptyLine} />;
        }
        // Regular paragraph
        return (
          <Text key={index} style={previewStyles.paragraph}>
            {renderInlineMarkdown(line)}
          </Text>
        );
      })}
      <View style={previewStyles.bottomPadding} />
    </ScrollView>
  );
}

// Render inline markdown (bold, italic, code, links)
function renderInlineMarkdown(text: string): React.ReactNode {
  // For simplicity, just return text with basic styling hints
  // A full implementation would parse and render inline elements
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Bold **text**
  const boldRegex = /\*\*(.+?)\*\*/g;
  // Italic _text_ or *text*
  const italicRegex = /[_*](.+?)[_*]/g;
  // Code `text`
  const codeRegex = /`(.+?)`/g;

  // Simple approach: just render as text for now
  // Complex parsing would require a proper tokenizer
  let match;

  // Replace code
  remaining = remaining.replace(codeRegex, (_, p1) => `⟨${p1}⟩`);
  // Replace bold (must come before italic to handle ***text***)
  remaining = remaining.replace(boldRegex, (_, p1) => `【${p1}】`);
  // Replace italic
  remaining = remaining.replace(italicRegex, (_, p1) => `《${p1}》`);

  // Now render with styling
  const segments = remaining.split(/(【.+?】|《.+?》|⟨.+?⟩)/);

  return segments.map((segment, i) => {
    if (segment.startsWith('【') && segment.endsWith('】')) {
      return (
        <Text key={i} style={previewStyles.bold}>
          {segment.slice(1, -1)}
        </Text>
      );
    }
    if (segment.startsWith('《') && segment.endsWith('》')) {
      return (
        <Text key={i} style={previewStyles.italic}>
          {segment.slice(1, -1)}
        </Text>
      );
    }
    if (segment.startsWith('⟨') && segment.endsWith('⟩')) {
      return (
        <Text key={i} style={previewStyles.inlineCode}>
          {segment.slice(1, -1)}
        </Text>
      );
    }
    return segment;
  });
}

// Repository picker modal
function RepoPicker({
  visible,
  onClose,
  onSelect,
  accessToken,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (repo: GitHubRepo) => void;
  accessToken: string;
}) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && accessToken) {
      setIsLoading(true);
      listRepositories(accessToken)
        .then(setRepos)
        .finally(() => setIsLoading(false));
    }
  }, [visible, accessToken]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={modalStyles.container}>
        <View style={modalStyles.header}>
          <Pressable onPress={onClose}>
            <Text variant="body" color="secondary">キャンセル</Text>
          </Pressable>
          <Text variant="h4">リポジトリを選択</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView style={modalStyles.content}>
          {isLoading ? (
            <View style={modalStyles.loading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text variant="body" color="secondary" style={{ marginTop: spacing[3] }}>
                読み込み中...
              </Text>
            </View>
          ) : repos.length === 0 ? (
            <View style={modalStyles.empty}>
              <Feather name="inbox" size={48} color={colors.gray[300]} />
              <Text variant="body" color="secondary" style={{ marginTop: spacing[3] }}>
                リポジトリがありません
              </Text>
            </View>
          ) : (
            repos.map((repo) => (
              <Pressable key={repo.id} onPress={() => onSelect(repo)}>
                <Card style={modalStyles.repoCard}>
                  <View style={modalStyles.repoIcon}>
                    <Feather
                      name={repo.private ? 'lock' : 'book-open'}
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={modalStyles.repoInfo}>
                    <Text variant="bodyBold">{repo.name}</Text>
                    <Text variant="caption" color="secondary">{repo.full_name}</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.text.muted} />
                </Card>
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function EditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentDocument, getDocument, updateDocument } = useDocuments();
  const { createAutoSaveVersion, autoSaveIntervalSec, canCreateManualSnapshot, createManualSnapshot } =
    useVersions(id ?? null);
  const { settings } = useSettingsStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'local'>('local');
  const [tags, setTags] = useState<string[]>([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>('');

  const isGitHubConnected = !!settings.github?.accessToken;

  // ドキュメント読み込み
  useEffect(() => {
    if (id && id !== 'new') {
      getDocument(id).then((doc) => {
        if (doc) {
          setTitle(doc.title);
          setContent(doc.content);
          setCharCount(doc.content.length);
          lastSavedContentRef.current = doc.content;
          setSyncStatus(doc.githubSync?.syncStatus ?? 'local');
          setTags(doc.tags ?? []);
        }
      });
    }
  }, [id, getDocument]);

  // タグ追加
  const handleAddTag = useCallback(() => {
    if (!newTag.trim() || tags.includes(newTag.trim())) {
      setNewTag('');
      setShowTagInput(false);
      return;
    }
    const updatedTags = [...tags, newTag.trim()];
    setTags(updatedTags);
    setNewTag('');
    setShowTagInput(false);
    if (id) {
      updateDocument(id, { tags: updatedTags });
    }
  }, [newTag, tags, id, updateDocument]);

  // タグ削除
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove);
    setTags(updatedTags);
    if (id) {
      updateDocument(id, { tags: updatedTags });
    }
  }, [tags, id, updateDocument]);

  // エクスポート
  const handleExport = useCallback(async (format: 'markdown' | 'html' | 'text') => {
    if (!id) return;
    const doc = await getDocument(id);
    if (!doc) return;

    setShowMoreMenu(false);
    const result = await exportDocument(
      { ...doc, title, content, tags },
      { format, includeTitle: true, includeMetadata: true }
    );

    if (!result.success && result.error) {
      Alert.alert('エクスポートエラー', result.error);
    }
  }, [id, title, content, tags, getDocument]);

  // GitHub同期ハンドラー
  const handleSync = useCallback(async (selectedRepo?: GitHubRepo) => {
    if (!id || !settings.github?.accessToken) {
      Alert.alert('エラー', 'GitHubと連携してください');
      router.push('/auth/github');
      return;
    }

    // Save current changes first
    if (content !== lastSavedContentRef.current) {
      await updateDocument(id, { title, content });
      lastSavedContentRef.current = content;
    }

    // Get current document with sync info
    const doc = await getDocument(id);
    if (!doc) return;

    // If no repo configured and none selected, show picker
    const repoToUse = selectedRepo?.full_name || doc.githubSync?.repoPath?.split('/').slice(0, 2).join('/') || settings.github.defaultRepo;
    if (!repoToUse) {
      setShowRepoPicker(true);
      return;
    }

    setIsSyncing(true);
    setSyncStatus('pending');

    try {
      const [owner, repo] = repoToUse.split('/');
      const result = await syncDocument(
        { ...doc, title, content },
        settings.github.accessToken,
        owner,
        repo,
        doc.githubSync?.branch || 'main'
      );

      if (result.success) {
        setSyncStatus('synced');
        Alert.alert('同期完了', result.message);
        // Reload to get updated sync info
        getDocument(id);
      } else {
        setSyncStatus('pending');
        Alert.alert('同期エラー', result.message);
      }
    } catch (error) {
      setSyncStatus('pending');
      Alert.alert('エラー', '同期中にエラーが発生しました');
    } finally {
      setIsSyncing(false);
    }
  }, [id, settings.github, content, title, updateDocument, getDocument]);

  const handleRepoSelect = useCallback((repo: GitHubRepo) => {
    setShowRepoPicker(false);
    handleSync(repo);
  }, [handleSync]);

  // 自動保存
  const triggerAutoSave = useCallback(async () => {
    if (!id || content === lastSavedContentRef.current) return;

    setIsSaving(true);
    try {
      await updateDocument(id, { title, content });
      await createAutoSaveVersion(content);
      lastSavedContentRef.current = content;
    } finally {
      setIsSaving(false);
    }
  }, [id, title, content, updateDocument, createAutoSaveVersion]);

  // コンテンツ変更時の自動保存タイマー
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      triggerAutoSave();
    }, autoSaveIntervalSec * 1000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content, autoSaveIntervalSec, triggerAutoSave]);

  // 画面離脱時に保存
  useEffect(() => {
    return () => {
      if (content !== lastSavedContentRef.current && id) {
        updateDocument(id, { title, content });
      }
    };
  }, [id, title, content, updateDocument]);

  const handleContentChange = (text: string) => {
    setContent(text);
    setCharCount(text.length);
  };

  const handleBack = async () => {
    Keyboard.dismiss();
    if (content !== lastSavedContentRef.current && id) {
      await updateDocument(id, { title, content });
    }
    router.back();
  };

  const handleManualSnapshot = async () => {
    if (!canCreateManualSnapshot) return;
    await createManualSnapshot(content);
  };

  const handleOpenPrompts = () => {
    router.push(`/prompts?select=true&documentId=${id}`);
  };

  const insertMarkdown = (syntax: string, wrap = false) => {
    if (wrap) {
      setContent((prev) => `${syntax}${prev}${syntax}`);
    } else {
      setContent((prev) => `${prev}${syntax}`);
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
    if (!showPreview) {
      Keyboard.dismiss();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton name="arrow-left" variant="ghost" onPress={handleBack} />
          <View style={styles.headerTitle}>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="タイトルを入力"
              placeholderTextColor={colors.text.muted}
              editable={!showPreview}
            />
            <View style={styles.branchInfo}>
              <Feather
                name={syncStatus === 'synced' ? 'cloud' : syncStatus === 'pending' ? 'refresh-cw' : 'hard-drive'}
                size={12}
                color={syncStatus === 'synced' ? colors.success : syncStatus === 'pending' ? colors.warning : colors.text.muted}
              />
              <Text variant="micro" color={syncStatus === 'synced' ? 'brand' : 'muted'}>
                {syncStatus === 'synced' ? 'GitHub同期済' : syncStatus === 'pending' ? '同期待ち' : 'ローカル保存'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerButtons}>
          <Pressable
            style={[styles.syncButton, isSyncing && styles.syncButtonActive]}
            onPress={() => handleSync()}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Feather
                name={isGitHubConnected ? 'upload-cloud' : 'github'}
                size={icons.size.sm}
                color={isGitHubConnected ? colors.primary : colors.text.muted}
              />
            )}
          </Pressable>
          <Pressable style={styles.aiButton} onPress={handleOpenPrompts}>
            <Feather name="zap" size={icons.size.sm} color={colors.primary} />
            <Text variant="caption" color="brand">AI</Text>
          </Pressable>
          <Pressable style={styles.moreButton} onPress={() => setShowMoreMenu(true)}>
            <Feather name="more-vertical" size={icons.size.sm} color={colors.text.secondary} />
          </Pressable>
        </View>
      </View>

      {/* Sync Status */}
      <View style={styles.syncBar}>
        <View style={styles.syncLeft}>
          {isSaving ? (
            <>
              <Feather name="refresh-cw" size={14} color={colors.text.muted} />
              <Text variant="caption" color="secondary">保存中...</Text>
            </>
          ) : (
            <>
              <Feather name="check" size={14} color={colors.success} />
              <Text variant="caption" color="secondary">保存済み</Text>
            </>
          )}
        </View>
        <View style={styles.syncRight}>
          {showPreview && (
            <View style={styles.previewBadge}>
              <Text variant="micro" color="brand">プレビュー</Text>
            </View>
          )}
          <Text variant="micro" color="muted">{charCount.toLocaleString()} 文字</Text>
        </View>
      </View>

      {/* Tags */}
      <View style={styles.tagsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
          {tags.map((tag) => (
            <Pressable
              key={tag}
              style={styles.tag}
              onPress={() => handleRemoveTag(tag)}
            >
              <Text variant="micro" color="brand">{tag}</Text>
              <Feather name="x" size={12} color={colors.primary} />
            </Pressable>
          ))}
          {showTagInput ? (
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                value={newTag}
                onChangeText={setNewTag}
                placeholder="タグ名"
                placeholderTextColor={colors.text.muted}
                autoFocus
                onSubmitEditing={handleAddTag}
                onBlur={handleAddTag}
              />
            </View>
          ) : (
            <Pressable style={styles.addTagButton} onPress={() => setShowTagInput(true)}>
              <Feather name="plus" size={14} color={colors.text.muted} />
              <Text variant="micro" color="muted">タグ追加</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>

      {/* Editor or Preview */}
      {showPreview ? (
        <MarkdownPreview content={content} />
      ) : (
        <View style={styles.editorContainer}>
          <TextInput
            style={styles.editor}
            multiline
            value={content}
            onChangeText={handleContentChange}
            placeholder="ここに内容を入力..."
            placeholderTextColor={colors.text.muted}
            textAlignVertical="top"
          />
        </View>
      )}

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          {!showPreview && (
            <>
              <IconButton name="bold" size="sm" onPress={() => insertMarkdown('**', true)} />
              <IconButton name="italic" size="sm" onPress={() => insertMarkdown('_', true)} />
              <IconButton name="hash" size="sm" onPress={() => insertMarkdown('# ')} />
              <IconButton name="list" size="sm" onPress={() => insertMarkdown('- ')} />
              <IconButton name="link" size="sm" onPress={() => insertMarkdown('[](url)')} />
              <IconButton name="code" size="sm" onPress={() => insertMarkdown('`', true)} />
              {canCreateManualSnapshot && (
                <IconButton
                  name="save"
                  size="sm"
                  color={colors.primary}
                  onPress={handleManualSnapshot}
                />
              )}
            </>
          )}
        </View>
        <Pressable
          style={[styles.previewButton, showPreview && styles.previewButtonActive]}
          onPress={togglePreview}
        >
          <Feather
            name={showPreview ? 'edit-2' : 'eye'}
            size={icons.size.sm}
            color={showPreview ? colors.primary : colors.text.inverse}
          />
        </Pressable>
      </View>

      {/* Repo Picker Modal */}
      {isGitHubConnected && (
        <RepoPicker
          visible={showRepoPicker}
          onClose={() => setShowRepoPicker(false)}
          onSelect={handleRepoSelect}
          accessToken={settings.github!.accessToken}
        />
      )}

      {/* More Menu Modal */}
      <Modal visible={showMoreMenu} animationType="fade" transparent>
        <Pressable style={styles.menuOverlay} onPress={() => setShowMoreMenu(false)}>
          <View style={styles.menuContainer}>
            <Text variant="caption" color="muted" style={styles.menuTitle}>エクスポート</Text>
            <Pressable style={styles.menuItem} onPress={() => handleExport('markdown')}>
              <Feather name="file-text" size={20} color={colors.text.primary} />
              <Text variant="body">Markdownファイル (.md)</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => handleExport('html')}>
              <Feather name="code" size={20} color={colors.text.primary} />
              <Text variant="body">HTMLファイル (.html)</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => handleExport('text')}>
              <Feather name="align-left" size={20} color={colors.text.primary} />
              <Text variant="body">テキストファイル (.txt)</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable style={styles.menuItem} onPress={() => setShowMoreMenu(false)}>
              <Feather name="x" size={20} color={colors.text.muted} />
              <Text variant="body" color="secondary">キャンセル</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    backgroundColor: colors.surface.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    marginLeft: spacing[2],
    flex: 1,
  },
  titleInput: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    padding: 0,
  },
  branchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[0.5],
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  syncButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonActive: {
    backgroundColor: colors.primaryLight,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.surface.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  syncRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  previewBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.sm,
  },
  tagsContainer: {
    backgroundColor: colors.surface.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingVertical: spacing[2],
  },
  tagsScroll: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  tagInputContainer: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
  },
  tagInput: {
    height: 28,
    fontSize: 12,
    color: colors.text.primary,
    minWidth: 60,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  menuContainer: {
    backgroundColor: colors.surface.light,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    width: '100%',
    maxWidth: 320,
  },
  menuTitle: {
    marginBottom: spacing[2],
    paddingHorizontal: spacing[2],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing[2],
  },
  editorContainer: {
    flex: 1,
    padding: spacing[4],
  },
  editor: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.primary,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface.light,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  toolbarLeft: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  previewButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewButtonActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
});

const previewStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing[4],
  },
  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing[4],
    marginTop: spacing[2],
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing[3],
    marginTop: spacing[4],
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing[2],
    marginTop: spacing[3],
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  bullet: {
    fontSize: 16,
    color: colors.text.muted,
    width: 20,
  },
  number: {
    fontSize: 16,
    color: colors.text.muted,
    width: 24,
  },
  listText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.primary,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: spacing[4],
    marginVertical: spacing[3],
  },
  blockquoteText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  hr: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing[4],
  },
  emptyLine: {
    height: spacing[3],
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  inlineCode: {
    backgroundColor: colors.gray[100],
    fontFamily: typography.fontFamily.mono,
    fontSize: 14,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  bottomPadding: {
    height: spacing[8],
  },
});

const modalStyles = StyleSheet.create({
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
  content: {
    flex: 1,
    padding: spacing[4],
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[12],
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[12],
  },
  repoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  repoIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repoInfo: {
    flex: 1,
    gap: spacing[0.5],
  },
});
