import { View, StyleSheet, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Text, IconButton } from '@/components/common';
import { colors, spacing, borderRadius, icons } from '@/theme';

export default function EditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton name="arrow-left" variant="ghost" onPress={() => router.back()} />
          <View style={styles.headerTitle}>
            <Text variant="bodyBold" numberOfLines={1}>新規ドキュメント</Text>
            <View style={styles.branchInfo}>
              <Feather name="git-branch" size={12} color={colors.primary} />
              <Text variant="micro" color="secondary">main</Text>
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
        <Feather name="refresh-cw" size={14} color={colors.text.muted} />
        <Text variant="caption" color="secondary">保存中...</Text>
      </View>

      {/* Editor */}
      <View style={styles.editorContainer}>
        <TextInput
          style={styles.editor}
          multiline
          placeholder="ここに内容を入力..."
          placeholderTextColor={colors.text.muted}
          textAlignVertical="top"
        />
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <IconButton name="bold" size="sm" />
          <IconButton name="italic" size="sm" />
          <IconButton name="hash" size="sm" />
          <IconButton name="list" size="sm" />
          <IconButton name="link" size="sm" />
          <IconButton name="code" size="sm" />
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
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.surface.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
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
