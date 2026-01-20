import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text, Input } from '@/components/common';
import { colors, spacing, icons } from '@/theme';

export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="h3">検索</Text>
      </View>

      <View style={styles.content}>
        <Input
          placeholder="ファイル名やキーワードで検索..."
          leftIcon={<Feather name="search" size={icons.size.sm} color={colors.text.muted} />}
        />

        <View style={styles.emptyState}>
          <Feather name="search" size={64} color={colors.gray[300]} />
          <Text variant="body" color="secondary" style={styles.emptyText}>
            キーワードを入力して{'\n'}ドキュメントを検索
          </Text>
        </View>
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
});
