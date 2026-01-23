import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Switch, Alert, Modal, Share, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Text, Card } from '@/components/common';
import { colors, spacing, borderRadius, icons } from '@/theme';
import { useSettingsStore, useAuthStore } from '@/stores';
import { saveSettings } from '@/services/database';
import type { UserSettings } from '@/types';
import { PLAN_LIMITS } from '@/types';

interface SettingsItemProps {
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  title: string;
  value?: string;
  showChevron?: boolean;
  toggle?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  disabled?: boolean;
}

function SettingsItem({
  icon,
  iconBg,
  title,
  value,
  showChevron = true,
  toggle,
  onToggle,
  onPress,
  disabled = false,
}: SettingsItemProps) {
  return (
    <Pressable
      style={[styles.settingsItem, disabled && styles.settingsItemDisabled]}
      onPress={onPress}
      disabled={disabled || toggle !== undefined}
    >
      <View style={[styles.settingsIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={icons.size.sm} color={colors.text.inverse} />
      </View>
      <Text variant="body" style={styles.settingsTitle} color={disabled ? 'muted' : 'primary'}>
        {title}
      </Text>
      <View style={styles.settingsValue}>
        {value && <Text variant="caption" color="secondary">{value}</Text>}
        {toggle !== undefined && (
          <Switch
            value={toggle}
            onValueChange={onToggle}
            trackColor={{ false: colors.gray[200], true: colors.primary }}
            thumbColor={colors.surface.light}
            disabled={disabled}
          />
        )}
        {showChevron && toggle === undefined && (
          <Feather name="chevron-right" size={icons.size.sm} color={colors.gray[300]} />
        )}
      </View>
    </Pressable>
  );
}

const FONT_SIZE_LABELS: Record<UserSettings['fontSize'], string> = {
  small: '小',
  medium: '中',
  large: '大',
};

const THEME_LABELS: Record<UserSettings['theme'], string> = {
  light: 'ライト',
  dark: 'ダーク',
  system: 'システム設定',
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
};

type PickerOption<T> = { label: string; value: T };

function OptionPicker<T extends string>({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: PickerOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text variant="h4" style={styles.modalTitle}>{title}</Text>
          {options.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.modalOption,
                selectedValue === option.value && styles.modalOptionSelected,
              ]}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
            >
              <Text
                variant="body"
                color={selectedValue === option.value ? 'brand' : 'primary'}
              >
                {option.label}
              </Text>
              {selectedValue === option.value && (
                <Feather name="check" size={icons.size.sm} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

export default function SettingsScreen() {
  const { settings, setFontSize, setTheme, toggleFocusMode } = useSettingsStore();
  const { user } = useAuthStore();
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const plan = user?.plan ?? 'free';
  const limits = PLAN_LIMITS[plan];

  const handleFontSizeChange = useCallback(async (fontSize: UserSettings['fontSize']) => {
    setIsSaving(true);
    setFontSize(fontSize);
    try {
      await saveSettings({ ...settings, fontSize });
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  }, [settings, setFontSize]);

  const handleThemeChange = useCallback(async (theme: UserSettings['theme']) => {
    setIsSaving(true);
    setTheme(theme);
    try {
      await saveSettings({ ...settings, theme });
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  }, [settings, setTheme]);

  const handleFocusModeToggle = useCallback(async () => {
    setIsSaving(true);
    const newFocusMode = !settings.focusMode;
    toggleFocusMode();
    try {
      await saveSettings({ ...settings, focusMode: newFocusMode });
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  }, [settings, toggleFocusMode]);

  const handleGitHubConnect = useCallback(() => {
    router.push('/auth/github');
  }, []);

  const handleUpgrade = useCallback(() => {
    router.push('/subscription');
  }, []);

  const handleGitHubDisconnect = useCallback(async () => {
    Alert.alert(
      'GitHub連携を解除',
      '連携を解除すると、GitHubへの同期ができなくなります。ローカルデータは保持されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '解除する',
          style: 'destructive',
          onPress: async () => {
            try {
              const newSettings = { ...settings, github: undefined };
              await saveSettings(newSettings);
              useSettingsStore.getState().setSettings(newSettings);
              Alert.alert('完了', 'GitHub連携を解除しました');
            } catch (err) {
              console.error('Failed to disconnect GitHub:', err);
              Alert.alert('エラー', '連携解除に失敗しました');
            }
          },
        },
      ]
    );
  }, [settings]);

  const handleResetOnboarding = useCallback(async () => {
    Alert.alert(
      'オンボーディングをリセット',
      '次回起動時にオンボーディング画面が表示されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          onPress: async () => {
            await AsyncStorage.removeItem('hasSeenOnboarding');
            Alert.alert('完了', '次回起動時にオンボーディングが表示されます');
          },
        },
      ]
    );
  }, []);

  const handleClearCache = useCallback(async () => {
    Alert.alert(
      'キャッシュをクリア',
      'エクスポート用の一時ファイルを削除します。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'クリア',
          onPress: async () => {
            try {
              if (FileSystem.cacheDirectory) {
                const files = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory);
                for (const file of files) {
                  await FileSystem.deleteAsync(`${FileSystem.cacheDirectory}${file}`, { idempotent: true });
                }
              }
              Alert.alert('完了', 'キャッシュをクリアしました');
            } catch (err) {
              console.error('Failed to clear cache:', err);
              Alert.alert('エラー', 'キャッシュのクリアに失敗しました');
            }
          },
        },
      ]
    );
  }, []);

  const handleShareApp = useCallback(async () => {
    try {
      await Share.share({
        message: 'NotrailNote - AI搭載のMarkdownエディタ。GitHubと連携してノートを安全に管理できます。',
        title: 'NotrailNoteを共有',
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  }, []);

  const handleOpenTerms = useCallback(() => {
    Linking.openURL('https://notrailnote.app/terms');
  }, []);

  const handleOpenPrivacy = useCallback(() => {
    Linking.openURL('https://notrailnote.app/privacy');
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？ローカルデータは保持されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            try {
              const newSettings = { ...settings, github: undefined };
              await saveSettings(newSettings);
              useSettingsStore.getState().setSettings(newSettings);
              Alert.alert('完了', 'ログアウトしました');
            } catch (err) {
              console.error('Logout error:', err);
            }
          },
        },
      ]
    );
  }, [settings]);

  const fontSizeOptions: PickerOption<UserSettings['fontSize']>[] = [
    { label: '小', value: 'small' },
    { label: '中', value: 'medium' },
    { label: '大', value: 'large' },
  ];

  const themeOptions: PickerOption<UserSettings['theme']>[] = [
    { label: 'ライト', value: 'light' },
    { label: 'ダーク', value: 'dark' },
    { label: 'システム設定', value: 'system' },
  ];

  const isGitHubConnected = !!settings.github?.accessToken;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="h3">設定</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <Text variant="micro" color="muted" style={styles.sectionLabel}>アカウント</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="github"
            iconBg="#24292e"
            title="GitHub連携"
            value={isGitHubConnected ? '連携済み' : '未連携'}
            onPress={isGitHubConnected ? undefined : handleGitHubConnect}
            showChevron={!isGitHubConnected}
          />
          {isGitHubConnected && (
            <>
              {settings.github?.username && (
                <View style={styles.githubInfo}>
                  <Feather name="user" size={14} color={colors.text.muted} />
                  <Text variant="caption" color="secondary">
                    {settings.github.username}
                  </Text>
                </View>
              )}
              <SettingsItem
                icon="log-out"
                iconBg={colors.error}
                title="GitHub連携を解除"
                showChevron={false}
                onPress={handleGitHubDisconnect}
              />
            </>
          )}
        </View>

        {/* Plan Section */}
        <Text variant="micro" color="muted" style={styles.sectionLabel}>プラン</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="award"
            iconBg={colors.warning}
            title="現在のプラン"
            value={PLAN_LABELS[plan]}
            onPress={plan === 'free' ? handleUpgrade : undefined}
            showChevron={plan === 'free'}
          />
          <View style={styles.planInfo}>
            <View style={styles.planInfoRow}>
              <Text variant="caption" color="muted">ドキュメント上限</Text>
              <Text variant="caption" color="secondary">
                {limits.maxDocuments === -1 ? '無制限' : `${limits.maxDocuments}件`}
              </Text>
            </View>
            <View style={styles.planInfoRow}>
              <Text variant="caption" color="muted">履歴保存期間</Text>
              <Text variant="caption" color="secondary">
                {limits.historyRetentionDays === -1 ? '無制限' : `${limits.historyRetentionDays}日間`}
              </Text>
            </View>
            <View style={styles.planInfoRow}>
              <Text variant="caption" color="muted">自動保存間隔</Text>
              <Text variant="caption" color="secondary">
                {limits.autoSaveIntervalSec}秒
              </Text>
            </View>
            <View style={styles.planInfoRow}>
              <Text variant="caption" color="muted">手動スナップショット</Text>
              <Text variant="caption" color="secondary">
                {limits.manualSnapshot ? '利用可能' : '利用不可'}
              </Text>
            </View>
          </View>
        </View>

        {/* Editor Section */}
        <Text variant="micro" color="muted" style={styles.sectionLabel}>エディタ設定</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="sun"
            iconBg="#f59e0b"
            title="テーマ"
            value={THEME_LABELS[settings.theme]}
            onPress={() => setShowThemePicker(true)}
          />
          <SettingsItem
            icon="type"
            iconBg={colors.success}
            title="フォントサイズ"
            value={FONT_SIZE_LABELS[settings.fontSize]}
            onPress={() => setShowFontSizePicker(true)}
          />
          <SettingsItem
            icon="eye"
            iconBg="#8b5cf6"
            title="フォーカスモード"
            toggle={settings.focusMode}
            onToggle={handleFocusModeToggle}
            showChevron={false}
          />
        </View>

        {/* Data Management Section */}
        <Text variant="micro" color="muted" style={styles.sectionLabel}>データ管理</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="trash-2"
            iconBg={colors.warning}
            title="キャッシュをクリア"
            onPress={handleClearCache}
          />
          <SettingsItem
            icon="refresh-cw"
            iconBg={colors.info}
            title="オンボーディングを再表示"
            onPress={handleResetOnboarding}
          />
        </View>

        {/* About Section */}
        <Text variant="micro" color="muted" style={styles.sectionLabel}>アプリについて</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="info"
            iconBg={colors.gray[400]}
            title="バージョン"
            value="1.0.0"
            showChevron={false}
          />
          <SettingsItem
            icon="share-2"
            iconBg={colors.primary}
            title="アプリを共有"
            onPress={handleShareApp}
          />
          <SettingsItem
            icon="file-text"
            iconBg={colors.gray[400]}
            title="利用規約"
            onPress={handleOpenTerms}
          />
          <SettingsItem
            icon="shield"
            iconBg={colors.gray[400]}
            title="プライバシーポリシー"
            onPress={handleOpenPrivacy}
          />
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text variant="bodyBold" color="error">ログアウト</Text>
        </Pressable>

        <Text variant="micro" color="muted" style={styles.footer}>
          © 2025 NotrailNote
        </Text>
      </ScrollView>

      <OptionPicker
        visible={showFontSizePicker}
        title="フォントサイズ"
        options={fontSizeOptions}
        selectedValue={settings.fontSize}
        onSelect={handleFontSizeChange}
        onClose={() => setShowFontSizePicker(false)}
      />

      <OptionPicker
        visible={showThemePicker}
        title="テーマ"
        options={themeOptions}
        selectedValue={settings.theme}
        onSelect={handleThemeChange}
        onClose={() => setShowThemePicker(false)}
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
  sectionLabel: {
    marginBottom: spacing[2],
    marginTop: spacing[4],
    marginLeft: spacing[4],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    backgroundColor: colors.surface.light,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingsItemDisabled: {
    opacity: 0.5,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTitle: {
    flex: 1,
    marginLeft: spacing[4],
  },
  settingsValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  planInfo: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  planInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  githubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  logoutButton: {
    backgroundColor: colors.surface.light,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[8],
  },
  footer: {
    textAlign: 'center',
    marginTop: spacing[4],
    marginBottom: spacing[8],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  modalContent: {
    backgroundColor: colors.surface.light,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  modalTitle: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
});
