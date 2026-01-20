import { View, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/common';
import { colors, spacing, borderRadius, icons } from '@/theme';

interface SettingsItemProps {
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  title: string;
  value?: string;
  showChevron?: boolean;
  toggle?: boolean;
  onPress?: () => void;
}

function SettingsItem({
  icon,
  iconBg,
  title,
  value,
  showChevron = true,
  toggle,
  onPress,
}: SettingsItemProps) {
  return (
    <Pressable style={styles.settingsItem} onPress={onPress}>
      <View style={[styles.settingsIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={icons.size.sm} color={colors.text.inverse} />
      </View>
      <Text variant="body" style={styles.settingsTitle}>{title}</Text>
      <View style={styles.settingsValue}>
        {value && <Text variant="caption" color="secondary">{value}</Text>}
        {toggle !== undefined && (
          <Switch
            value={toggle}
            trackColor={{ false: colors.gray[200], true: colors.primary }}
            thumbColor={colors.surface.light}
          />
        )}
        {showChevron && !toggle && (
          <Feather name="chevron-right" size={icons.size.sm} color={colors.gray[300]} />
        )}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
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
            value="連携済み"
          />
          <SettingsItem
            icon="mail"
            iconBg={colors.primary}
            title="メールアドレス"
            value="user@example.com"
          />
        </View>

        {/* Plan Section */}
        <Text variant="micro" color="muted" style={styles.sectionLabel}>プラン</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="award"
            iconBg={colors.warning}
            title="現在のプラン"
            value="Free"
          />
        </View>

        {/* Editor Section */}
        <Text variant="micro" color="muted" style={styles.sectionLabel}>エディタ設定</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="type"
            iconBg={colors.success}
            title="フォントサイズ"
            value="中"
          />
          <SettingsItem
            icon="eye"
            iconBg="#8b5cf6"
            title="フォーカスモード"
            toggle={true}
            showChevron={false}
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
            icon="file-text"
            iconBg={colors.gray[400]}
            title="利用規約"
          />
          <SettingsItem
            icon="shield"
            iconBg={colors.gray[400]}
            title="プライバシーポリシー"
          />
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutButton}>
          <Text variant="bodyBold" color="error">ログアウト</Text>
        </Pressable>

        <Text variant="micro" color="muted" style={styles.footer}>
          © 2024 NotrailNote Inc.
        </Text>
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
});
