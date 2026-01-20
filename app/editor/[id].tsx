import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, TextInput, Pressable, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Text, IconButton } from '@/components/common';
import { colors, spacing, borderRadius, icons } from '@/theme';
import { useDocuments, useVersions } from '@/hooks';

export default function EditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentDocument, getDocument, updateDocument } = useDocuments();
  const { createAutoSaveVersion, autoSaveIntervalSec, canCreateManualSnapshot, createManualSnapshot } =
    useVersions(id ?? null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [charCount, setCharCount] = useState(0);

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

  const insertMarkdown = (syntax: string, wrap = false) => {
    if (wrap) {
      setContent((prev) => `${syntax}${prev}${syntax}`);
    } else {
      setContent((prev) => `${prev}${syntax}`);
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
            />
            <View style={styles.branchInfo}>
              <Feather name="hard-drive" size={12} color={colors.text.muted} />
              <Text variant="micro" color="muted">ローカル保存</Text>
            </View>
          </View>
        </View>
        <Pressable style={styles.aiButton}>
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
        <Text variant="micro" color="muted">{charCount.toLocaleString()} 文字</Text>
      </View>

      {/* Editor */}
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

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
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
        </View>
        <Pressable style={styles.previewButton}>
          <Feather name="eye" size={icons.size.sm} color={colors.text.inverse} />
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
});
