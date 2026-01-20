import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, TextInput, Pressable, Keyboard, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Text, IconButton } from '@/components/common';
import { colors, spacing, borderRadius, icons, typography } from '@/theme';
import { useDocuments, useVersions } from '@/hooks';

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

export default function EditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentDocument, getDocument, updateDocument } = useDocuments();
  const { createAutoSaveVersion, autoSaveIntervalSec, canCreateManualSnapshot, createManualSnapshot } =
    useVersions(id ?? null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>('');

  // ドキュメント読み込み
  useEffect(() => {
    if (id && id !== 'new') {
      getDocument(id).then((doc) => {
        if (doc) {
          setTitle(doc.title);
          setContent(doc.content);
          setCharCount(doc.content.length);
          lastSavedContentRef.current = doc.content;
        }
      });
    }
  }, [id, getDocument]);

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
              <Feather name="hard-drive" size={12} color={colors.text.muted} />
              <Text variant="micro" color="muted">ローカル保存</Text>
            </View>
          </View>
        </View>
        <Pressable style={styles.aiButton} onPress={handleOpenPrompts}>
          <Feather name="zap" size={icons.size.sm} color={colors.primary} />
          <Text variant="caption" color="brand">AI</Text>
        </Pressable>
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
