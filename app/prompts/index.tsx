import { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, Card } from '@/components/common';
import { colors, spacing, borderRadius, icons } from '@/theme';
import { getAllPromptTemplates, createPromptTemplate, deletePromptTemplate } from '@/services/database';
import type { PromptTemplate } from '@/types';

// Default prompt templates
const DEFAULT_TEMPLATES: Omit<PromptTemplate, 'id' | 'createdAt'>[] = [
  {
    title: '文章を要約',
    description: '長い文章を簡潔にまとめます',
    prompt: '以下の文章を3〜5文で要約してください：\n\n{{content}}',
    model: 'gpt-4',
  },
  {
    title: '文章を改善',
    description: '文法や表現を改善します',
    prompt: '以下の文章の文法や表現を改善し、より読みやすくしてください。元の意味は変えないでください：\n\n{{content}}',
    model: 'gpt-4',
  },
  {
    title: '箇条書きに変換',
    description: '文章を箇条書きリストに変換します',
    prompt: '以下の文章を箇条書きリストに変換してください：\n\n{{content}}',
    model: 'gpt-4',
  },
  {
    title: '英語に翻訳',
    description: '日本語を英語に翻訳します',
    prompt: '以下の日本語を自然な英語に翻訳してください：\n\n{{content}}',
    model: 'gpt-4',
  },
  {
    title: 'アイデアを展開',
    description: 'アイデアを詳しく展開します',
    prompt: '以下のアイデアを詳しく展開し、具体的な実行ステップを提案してください：\n\n{{content}}',
    model: 'gpt-4',
  },
];

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface CreateModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (template: Omit<PromptTemplate, 'id' | 'createdAt'>) => void;
  editingTemplate?: PromptTemplate;
}

function CreatePromptModal({ visible, onClose, onSave, editingTemplate }: CreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (editingTemplate) {
      setTitle(editingTemplate.title);
      setDescription(editingTemplate.description);
      setPrompt(editingTemplate.prompt);
    } else {
      setTitle('');
      setDescription('');
      setPrompt('');
    }
  }, [editingTemplate, visible]);

  const handleSave = () => {
    if (!title.trim() || !prompt.trim()) {
      Alert.alert('エラー', 'タイトルとプロンプトは必須です');
      return;
    }
    onSave({ title, description, prompt, model: 'gpt-4' });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={modalStyles.container}>
        <View style={modalStyles.header}>
          <Pressable onPress={onClose}>
            <Text variant="body" color="secondary">キャンセル</Text>
          </Pressable>
          <Text variant="h4">{editingTemplate ? '編集' : '新規作成'}</Text>
          <Pressable onPress={handleSave}>
            <Text variant="bodyBold" color="brand">保存</Text>
          </Pressable>
        </View>

        <ScrollView style={modalStyles.content}>
          <Text variant="caption" color="muted" style={modalStyles.label}>タイトル</Text>
          <TextInput
            style={modalStyles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="例: 文章を要約"
            placeholderTextColor={colors.text.muted}
          />

          <Text variant="caption" color="muted" style={modalStyles.label}>説明（オプション）</Text>
          <TextInput
            style={modalStyles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="このプロンプトの説明"
            placeholderTextColor={colors.text.muted}
          />

          <Text variant="caption" color="muted" style={modalStyles.label}>プロンプト</Text>
          <TextInput
            style={[modalStyles.input, modalStyles.textArea]}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="{{content}} で選択テキストを挿入"
            placeholderTextColor={colors.text.muted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <View style={modalStyles.hint}>
            <Feather name="info" size={14} color={colors.text.muted} />
            <Text variant="caption" color="muted" style={modalStyles.hintText}>
              {'{{content}}'} を使用すると、選択したテキストがその位置に挿入されます
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function PromptsScreen() {
  const params = useLocalSearchParams<{ select?: string; documentId?: string }>();
  const isSelectMode = params.select === 'true';

  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | undefined>();

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllPromptTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCreateTemplate = useCallback(async (data: Omit<PromptTemplate, 'id' | 'createdAt'>) => {
    const template: PromptTemplate = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
    };
    try {
      await createPromptTemplate(template);
      setTemplates((prev) => [template, ...prev]);
    } catch (err) {
      console.error('Failed to create template:', err);
      Alert.alert('エラー', 'テンプレートの作成に失敗しました');
    }
  }, []);

  const handleDeleteTemplate = useCallback((template: PromptTemplate) => {
    Alert.alert(
      '削除確認',
      `「${template.title}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePromptTemplate(template.id);
              setTemplates((prev) => prev.filter((t) => t.id !== template.id));
            } catch (err) {
              console.error('Failed to delete template:', err);
            }
          },
        },
      ]
    );
  }, []);

  const handleSelectTemplate = useCallback((template: PromptTemplate) => {
    if (isSelectMode && params.documentId) {
      // Return to editor with selected template
      router.back();
      // TODO: Pass template back to editor
    }
  }, [isSelectMode, params.documentId]);

  const handleAddDefaults = useCallback(async () => {
    for (const data of DEFAULT_TEMPLATES) {
      const template: PromptTemplate = {
        ...data,
        id: generateId(),
        createdAt: Date.now(),
      };
      try {
        await createPromptTemplate(template);
      } catch (err) {
        console.error('Failed to create default template:', err);
      }
    }
    await loadTemplates();
  }, [loadTemplates]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={icons.size.md} color={colors.text.primary} />
        </Pressable>
        <Text variant="h4">プロンプト</Text>
        <Pressable style={styles.addButton} onPress={() => setShowCreateModal(true)}>
          <Feather name="plus" size={icons.size.md} color={colors.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : templates.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="zap" size={64} color={colors.gray[300]} />
          <Text variant="body" color="secondary" style={styles.emptyText}>
            プロンプトテンプレートがありません
          </Text>
          <Pressable style={styles.addDefaultsButton} onPress={handleAddDefaults}>
            <Text variant="bodyBold" color="brand">デフォルトを追加</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text variant="micro" color="muted" style={styles.sectionLabel}>
            {templates.length}件のテンプレート
          </Text>

          {templates.map((template) => (
            <Pressable
              key={template.id}
              onPress={() => isSelectMode ? handleSelectTemplate(template) : setEditingTemplate(template)}
              onLongPress={() => handleDeleteTemplate(template)}
            >
              <Card style={styles.templateCard}>
                <View style={styles.templateIcon}>
                  <Feather name="zap" size={20} color={colors.primary} />
                </View>
                <View style={styles.templateContent}>
                  <Text variant="bodyBold" numberOfLines={1}>{template.title}</Text>
                  <Text variant="caption" color="secondary" numberOfLines={2}>
                    {template.description || template.prompt.slice(0, 50)}
                  </Text>
                </View>
                <Feather
                  name={isSelectMode ? 'chevron-right' : 'edit-2'}
                  size={16}
                  color={colors.text.muted}
                />
              </Card>
            </Pressable>
          ))}

          <Pressable style={styles.addDefaultsLink} onPress={handleAddDefaults}>
            <Feather name="plus-circle" size={16} color={colors.primary} />
            <Text variant="caption" color="brand">デフォルトテンプレートを追加</Text>
          </Pressable>

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      <CreatePromptModal
        visible={showCreateModal || !!editingTemplate}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTemplate(undefined);
        }}
        onSave={handleCreateTemplate}
        editingTemplate={editingTemplate}
      />
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
    paddingVertical: spacing[3],
    backgroundColor: colors.surface.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing[2],
    borderRadius: borderRadius.full,
  },
  addButton: {
    padding: spacing[2],
    borderRadius: borderRadius.full,
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  emptyText: {
    marginTop: spacing[4],
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  addDefaultsButton: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
  },
  sectionLabel: {
    marginBottom: spacing[3],
    marginLeft: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  templateIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateContent: {
    flex: 1,
    gap: spacing[0.5],
  },
  addDefaultsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    marginTop: spacing[2],
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
  label: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.surface.light,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  textArea: {
    minHeight: 150,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginTop: spacing[3],
    padding: spacing[3],
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
  },
  hintText: {
    flex: 1,
  },
});
